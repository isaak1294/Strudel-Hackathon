// src/server.ts
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import type { Database } from "sqlite";
import { openDb } from "./db";
import cors from "cors";

const app = express();
let db: Database;

app.use(express.json());

// CORS
app.use(
    cors({
        origin: [
            "http://localhost:3000",
            "https://strudel.jimmer.dev",
        ],
    })
);

// --- DATA DIR / UPLOADS -----------------------------------------------

const DATA_DIR =
    process.env.DATA_DIR || path.join(process.cwd(), "data");

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

const uploadDir = path.join(DATA_DIR, "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
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

// --- ROUTES -----------------------------------------------------------

// register UVic Hacks member
app.post("/api/registrations", async (req, res) => {
    try {
        const { name, email, vnumber } = req.body || {};

        if (!name || !email || !vnumber) {
            return res.status(400).json({ error: "Missing name, email, or vnumber" });
        }

        await db.run(
            `INSERT INTO registrations (name, email, vnumber)
             VALUES (?, ?, ?)`,
            name,
            email,
            vnumber
        );

        res.status(201).json({ success: true });
    } catch (e) {
        console.error("Error creating registration:", e);
        res.status(500).json({ error: "Server error" });
    }
});

// list registrations (optional)
app.get("/api/registrations", async (_req, res) => {
    try {
        const rows = await db.all(
            `SELECT id, name, email, vnumber, createdAt
             FROM registrations
             ORDER BY createdAt DESC`
        );
        res.json(rows);
    } catch (e) {
        console.error("Error listing registrations:", e);
        res.status(500).json({ error: "Server error" });
    }
});


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
        console.error("Error creating submission:", e);
        res.status(500).json({ error: "Server error" });
    }
});

// list submissions
app.get("/api/submissions", async (_req, res) => {
    try {
        const rows = await db.all(
            `SELECT * FROM submissions ORDER BY createdAt DESC`
        );
        res.json(rows);
    } catch (e) {
        console.error("Error listing submissions:", e);
        res.status(500).json({ error: "Server error" });
    }
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

// --- STARTUP ----------------------------------------------------------

const PORT = process.env.PORT || 3002;

async function start() {
    try {
        console.log("Opening DB...");
        db = await openDb();

        await db.exec(`
            CREATE TABLE IF NOT EXISTS submissions (
                id INTEGER PRIMARY KEY,
                projectName TEXT NOT NULL,
                userName TEXT NOT NULL,
                projectUrl TEXT NOT NULL,
                imageUrl TEXT NOT NULL,
                createdAt TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS registrations (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                vnumber TEXT NOT NULL,
                createdAt TEXT DEFAULT CURRENT_TIMESTAMP
            );
        `);


        app.listen(PORT, () => {
            console.log(`Express listening on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error("Failed to start server:", err);
        process.exit(1);
    }
}

start();

// catch anything unhandled so you actually SEE it
process.on("uncaughtException", (err) => {
    console.error("Uncaught exception:", err);
});

process.on("unhandledRejection", (reason) => {
    console.error("Unhandled rejection:", reason);
});
