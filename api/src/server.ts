import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import cors from "cors"


const app = express();
let db: any;

app.use(
    cors({
        origin: "http://localhost:3000",
    })
);

console.log("Starting server file...");

(async () => {
    try {
        console.log("Opening DB...");
        db = await open({
            filename: "./data.sqlite",
            driver: sqlite3.Database,
        });

        await db.exec(`
      CREATE TABLE IF NOT EXISTS submissions (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        projectName TEXT NOT NULL,
        userName    TEXT NOT NULL,
        projectUrl  TEXT NOT NULL,
        imageUrl    TEXT NOT NULL,
        createdAt   DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

        console.log("DB ready.");
    } catch (err) {
        console.error("DB init failed:", err);
    }
})();

// --- FILE UPLOAD SETUP -------------------------------------------------
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, unique + ext);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

// serve images
app.use("/uploads", express.static(uploadDir));

// health check
app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
});

// create submission
app.post("/api/submissions", upload.single("image"), async (req, res) => {
    try {
        const { projectName, userName, projectUrl } = req.body;
        const file = req.file;

        if (!projectName || !userName || !projectUrl || !file) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const imageUrl = `/uploads/${file.filename}`;

        await db.run(
            `INSERT INTO submissions (projectName, userName, projectUrl, imageUrl)
       VALUES (?, ?, ?, ?)`,
            projectName,
            userName,
            projectUrl,
            imageUrl
        );

        res.status(201).json({ success: true, imageUrl });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Server error" });
    }
});

// list submissions
app.get("/api/submissions", async (_req, res) => {
    const rows = await db.all(
        `SELECT * FROM submissions ORDER BY createdAt DESC`
    );
    res.json(rows);
});

// Get a single submission by ID
app.get("/api/submissions/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
        return res.status(400).json({ error: "Invalid id" });
    }

    try {
        const row = await db.get(
            `SELECT * FROM submissions WHERE id = ?`,
            id
        );

        if (!row) {
            return res.status(404).json({ error: "Submission not found" });
        }

        res.json(row);
    } catch (err: any) {
        console.error("Error fetching submission by id:", err);
        res.status(500).json({ error: "Server error" });
    }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`Express listening on http://localhost:${PORT}`);
});

// catch anything unhandled so you actually SEE it
process.on("uncaughtException", (err) => {
    console.error("Uncaught exception:", err);
});

process.on("unhandledRejection", (reason) => {
    console.error("Unhandled rejection:", reason);
});



