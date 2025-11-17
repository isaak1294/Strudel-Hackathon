import fs from "fs";
import path from "path";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

type SubmissionJson = {
    id: number;
    projectName: string;
    userName: string;
    projectUrl: string;
    imageUrl: string;
    createdAt?: string;
};

async function main() {
    const rootDir = path.resolve(__dirname, "..");

    const jsonPath = path.join(rootDir, "submissions.json");

    const DATA_DIR =
        process.env.DATA_DIR || path.join(rootDir, "data");
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const dbPath = path.join(DATA_DIR, "data.sqlite");

    console.log("Reading JSON from", jsonPath);
    const raw = fs.readFileSync(jsonPath, "utf8");
    const submissions = JSON.parse(raw) as SubmissionJson[];

    console.log("Opening DB at", dbPath);
    const db = await open({ filename: dbPath, driver: sqlite3.Database });

    await db.exec(`
    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY,
      projectName TEXT NOT NULL,
      userName TEXT NOT NULL,
      projectUrl TEXT NOT NULL,
      imageUrl TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

    console.log("Clearing existing submissions...");
    await db.exec(`DELETE FROM submissions;`);

    console.log("Inserting rows...");
    await db.exec("BEGIN TRANSACTION;");
    const stmt = await db.prepare(`
    INSERT INTO submissions (id, projectName, userName, projectUrl, imageUrl, createdAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

    for (const s of submissions) {
        await stmt.run(
            s.id,
            s.projectName,
            s.userName,
            s.projectUrl,
            s.imageUrl,
            s.createdAt ?? new Date().toISOString()
        );
    }

    await stmt.finalize();
    await db.exec("COMMIT;");
    await db.close();

    console.log("Done. Inserted", submissions.length, "rows.");
}

main().catch((err) => {
    console.error("Seed script failed:", err);
    process.exit(1);
});
