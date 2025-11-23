// src/db.ts
import { Pool } from "pg";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Render internal URLs require SSL; pg will handle it,
    // but this makes local dev easier too.
    ssl: process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : undefined,
});

export async function query(text: string, params?: any[]) {
    return pool.query(text, params);
}
