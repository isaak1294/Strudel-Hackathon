// src/db.ts
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : { rejectUnauthorized: false },
});

export async function query(text: string, params?: any[]) {
    return pool.query(text, params);
}
