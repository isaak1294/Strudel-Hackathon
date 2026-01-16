// src/server.ts
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import type { Database } from "sqlite";
import { openDb } from "./db";
import cors from "cors";
import { pool, query } from "./hack-db";
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Storage } from '@google-cloud/storage';
import dotenv from "dotenv";
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
let db: Database;

app.use(express.json());

// CORS
app.use(
    cors({
        origin: [
            "http://localhost:3000",
            "https://strudel.jimmer.dev",
            "https://uvichacks.com",
            "https://www.uvichacks.com",
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

const memoryStorage = multer.memoryStorage();

// 2. Update your upload middleware to use it
const upload = multer({
    storage: memoryStorage, // Changed from diskStorage to memoryStorage
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, unique + ext);
    },
});
const googleStorage = new Storage({
    keyFilename: './gcs-key.json',
});
const bucket = googleStorage.bucket('uvic-hacks-resume');

async function generateV4ReadSignedUrl(filePath: string) {
    const options = {
        version: 'v4' as const,
        action: 'read' as const,
        expires: Date.now() + 15 * 60 * 1000, // Link lasts 15 minutes
    };

    // Get a signed URL from GCS
    const [url] = await bucket
        .file(filePath)
        .getSignedUrl(options);

    return url;
}

// serve images
app.use("/uploads", express.static(uploadDir));

// --- ROUTES -----------------------------------------------------------

// Account Registration
app.post("/api/account-reg", upload.single('resume'), async (req: any, res) => {
    const client = await pool.connect();
    try {
        const { name, email, vnumber, password, bio } = req.body;
        const JWT_SECRET = process.env.JWT_SECRET || 'hackathon-super-secret';
        let resumePath = null;
        let resumeUrl = null;

        // 1. Upload to GCS
        if (req.file) {
            resumePath = `resumes/${Date.now()}-${req.file.originalname.replace(/\s+/g, '_')}`;
            await bucket.file(resumePath).save(req.file.buffer, {
                contentType: req.file.mimetype,
                resumable: false
            });

            // Generate a signed URL so the user sees it immediately
            const [url] = await bucket.file(resumePath).getSignedUrl({
                version: 'v4',
                action: 'read',
                expires: Date.now() + 24 * 60 * 60 * 1000,
            });
            resumeUrl = url;
        }

        await client.query('BEGIN');

        // 2. Insert User (MAKE SURE resume_path IS IN THE VALUES LIST)
        const userResult = await client.query(
            `INSERT INTO users (name, email, vnumber, password_hash, bio, resume_path)
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING id, name, email, vnumber, bio, resume_path`,
            [name, email, vnumber.trim() || null, crypto.createHash("sha256").update(password).digest("hex"), bio, resumePath]
        );
        const newUser = userResult.rows[0];

        await client.query('COMMIT');

        const token = jwt.sign({ userId: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '24h' });

        res.status(201).json({
            success: true,
            token,
            user: {
                ...newUser,
                resume_url: resumeUrl,
                registeredEventIds: []
            }
        });
    } catch (e: any) {
        await client.query('ROLLBACK');
        console.error("REGISTRATION ERROR:", e);
        res.status(500).json({ error: e.message });
    } finally {
        client.release();
    }
});

// Admin access/ student account viewing
app.get("/api/admin/registrations", async (req, res) => {
    try {
        // Simple API Key check for admins
        if (req.headers['x-api-key'] !== process.env.API_KEY) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const { rows: users } = await query(
            `SELECT id, name, email, vnumber, resume_path, createdat 
             FROM users ORDER BY createdat DESC`
        );

        // Map over users and add a temporary signed link if they have a resume
        const usersWithLinks = await Promise.all(users.map(async (user) => {
            if (user.resume_path) {
                try {
                    user.resume_url = await generateV4ReadSignedUrl(user.resume_path);
                } catch (err) {
                    console.error(`Error signing URL for ${user.resume_path}`, err);
                    user.resume_url = null;
                }
            }
            return user;
        }));

        res.json(usersWithLinks);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to fetch registrations" });
    }
});

app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const JWT_SECRET = process.env.JWT_SECRET || 'hackathon-super-secret';

        const { rows } = await query("SELECT * FROM users WHERE email = $1", [email]);
        const user = rows[0];

        if (!user || crypto.createHash("sha256").update(password).digest("hex") !== user.password_hash) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        // --- NEW: Fetch Registered Event IDs ---
        const { rows: registrationRows } = await query(
            "SELECT event_id FROM event_registrations WHERE user_id = $1",
            [user.id]
        );
        // Turn the array of objects [{event_id: 1}] into an array of numbers [1]
        const registeredEventIds = registrationRows.map(r => r.event_id);

        let resumeUrl = null;
        if (user.resume_path) {
            try {
                const [url] = await bucket.file(user.resume_path).getSignedUrl({
                    version: 'v4',
                    action: 'read',
                    expires: Date.now() + 24 * 60 * 60 * 1000,
                });
                resumeUrl = url;
            } catch (err) { console.error(err); }
        }

        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                vnumber: user.vnumber,
                bio: user.bio,
                resume_path: user.resume_path,
                resume_url: resumeUrl,
                registeredEventIds
            }
        });
    } catch (e) {
        res.status(500).json({ error: "Server error" });
    }
});

// Get event info from ids
app.get("/api/events/:id", async (req, res) => {
    try {
        const eventId = req.params.id;
        const { rows } = await query("SELECT * FROM events WHERE id = $1", [eventId]);

        if (rows.length === 0) {
            return res.status(404).json({ error: "Event not found" });
        }

        res.json(rows[0]);
    } catch (e) {
        console.error("Error fetching event:", e);
        res.status(500).json({ error: "Server error" });
    }
});

// Middleware to protect routes
const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hackathon-super-secret');
        req.user = decoded;
        next();
    } catch (e) {
        res.status(401).json({ error: "Invalid token" });
    }
};

app.post("/api/events/register", authenticate, async (req: any, res) => {
    const { userId, eventId } = req.body;

    // Safety: Ensure the user is only registering themselves
    if (req.user.userId !== parseInt(userId)) {
        return res.status(403).json({ error: "Unauthorized registration attempt." });
    }

    try {
        // 1. Insert the new registration
        await query(
            `INSERT INTO event_registrations (user_id, event_id) 
             VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [userId, eventId]
        );

        // 2. Fetch the updated list of all event IDs for this user
        const { rows } = await query(
            "SELECT event_id FROM event_registrations WHERE user_id = $1",
            [userId]
        );

        const updatedEventIds = rows.map(r => r.event_id);

        // 3. Return the updated array to the frontend
        res.status(201).json({
            success: true,
            message: "Registered successfully!",
            registeredEventIds: updatedEventIds
        });
    } catch (e: any) {
        console.error("Event Registration Error:", e);
        res.status(500).json({ error: "Server error" });
    }
});

app.put("/api/profile", authenticate, upload.single('resume'), async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { name, bio } = req.body;
        let resumePath = null;

        // 1. Debugging: Check what multer actually caught
        console.log("File received:", req.file ? req.file.originalname : "No file");

        if (req.file) {
            // CRITICAL CHECK: If buffer is missing, Multer is likely misconfigured
            if (!req.file.buffer) {
                console.error("Multer Error: File found but buffer is undefined. Check storage config.");
                return res.status(500).json({ error: "Server failed to process file buffer." });
            }

            const fileName = `resumes/${userId}-${Date.now()}.pdf`;
            const blob = bucket.file(fileName);

            // Use the .save() method with a specific timeout and error handling
            await blob.save(req.file.buffer, {
                contentType: req.file.mimetype,
                resumable: false,
                validation: false // Sometimes helpful for small buffers
            });

            resumePath = fileName;
        }

        // 2. Database Update
        await query(
            `UPDATE users 
             SET name = COALESCE($1, name), 
                 bio = COALESCE($2, bio),
                 resume_path = COALESCE($3, resume_path)
             WHERE id = $4`,
            [name || null, bio || null, resumePath, userId]
        );

        const { rows } = await query("SELECT * FROM users WHERE id = $1", [userId]);
        const updatedUser = rows[0];

        let resumeUrl = null;
        if (updatedUser.resume_path) {
            resumeUrl = await generateV4ReadSignedUrl(updatedUser.resume_path);
        }

        // 4. Send back the FULL updated user object
        res.json({
            success: true,
            message: "Profile updated",
            user: {
                ...updatedUser,
                resume_url: resumeUrl
            }
        });

    } catch (e: any) {
        console.error("DETAILED ERROR LOG:", e);
        res.status(500).json({ error: "Update failed", details: e.message });
    }
});

app.get("/api/admin/event-registrants/:eventId", async (req, res) => {
    try {
        // 1. Admin Security Check
        const incomingKey = req.headers['x-api-key'];
        if (incomingKey !== process.env.API_KEY) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const eventId = req.params.eventId;

        // 2. Join Users with Registrations
        const { rows: registrants } = await query(
            `SELECT 
                u.id, 
                u.name, 
                u.email, 
                u.vnumber, 
                u.resume_path, 
                u.bio,
                er.registered_at
             FROM users u
             JOIN event_registrations er ON u.id = er.user_id
             WHERE er.event_id = $1
             ORDER BY er.registered_at DESC`,
            [eventId]
        );

        // 3. Generate Resume Links for the Admin
        const registrantsWithLinks = await Promise.all(registrants.map(async (user) => {
            let resumeUrl = null;
            if (user.resume_path) {
                try {
                    const [url] = await bucket.file(user.resume_path).getSignedUrl({
                        version: 'v4',
                        action: 'read',
                        expires: Date.now() + 60 * 60 * 1000, // 1 hour
                    });
                    resumeUrl = url;
                } catch (err) {
                    console.error("Error signing URL:", err);
                }
            }
            return { ...user, resume_url: resumeUrl };
        }));

        res.json({
            count: registrantsWithLinks.length,
            registrants: registrantsWithLinks
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to fetch event registrants" });
    }
});

app.get("/api/events/:eventId/count", async (req, res) => {
    try {
        const { eventId } = req.params;

        // We only return the count, no personal user data
        const { rows } = await query(
            `SELECT COUNT(*)::int as count 
             FROM event_registrations 
             WHERE event_id = $1`,
            [eventId]
        );

        res.json({
            success: true,
            count: rows[0]?.count ?? 0
        });
    } catch (e) {
        console.error("Error fetching registration count:", e);
        res.status(500).json({ error: "Failed to fetch count" });
    }
});

// register UVic Hacks member for counting
app.post("/api/registrations", async (req, res) => {
    try {
        const { name, email, vnumber } = req.body || {};

        if (!name || !email || !vnumber) {
            return res
                .status(400)
                .json({ error: "Missing name, email, or vnumber" });
        }

        await query(
            `INSERT INTO registrations (name, email, vnumber)
       VALUES ($1, $2, $3)`,
            [name, email, vnumber]
        );

        res.status(201).json({ success: true });
    } catch (e) {
        console.error("Error creating registration:", e);
        res.status(500).json({ error: "Server error" });
    }
});

// list registrations (Postgres)
app.get(`/api/registrations`, async (req, res) => {
    try {
        // 1. Get the key provided in the request header
        // Note: Express converts all headers to lowercase
        const incomingKey = req.headers['x-api-key'];

        // 2. Check if the server has an API key set (Safety check)
        const secretKey = process.env.API_KEY;
        if (!secretKey) {
            console.error("CRITICAL: API_KEY is not set in environment variables.");
            return res.status(500).json({ error: "Server configuration error" });
        }

        // 3. Compare the keys
        if (incomingKey !== secretKey) {
            return res.status(401).json({ error: "Unauthorized access" });
        }

        // --- Original Logic Below ---
        const { rows } = await query(
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

// registrations count (Postgres)
app.get("/api/registrations/count", async (_req, res) => {
    try {
        const { rows } = await query(
            `SELECT COUNT(DISTINCT email)::int as count FROM registrations`
        );
        res.json({ count: rows[0]?.count ?? 0 });
    } catch (e) {
        console.error("Error counting registrations:", e);
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

        await query(`
        CREATE TABLE IF NOT EXISTS registrations (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            vnumber TEXT NOT NULL,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
