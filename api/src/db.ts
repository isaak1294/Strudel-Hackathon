// src/db.ts (or inline in server.ts)
import fs from "fs";
import path from "path";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const DATA_DIR =
    process.env.DATA_DIR || path.join(process.cwd(), "data"); // local fallback

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, "data.sqlite");

export async function openDb() {
    return open({
        filename: DB_PATH,
        driver: sqlite3.Database,
    });
}
