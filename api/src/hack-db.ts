import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // If the URL doesn't contain 'localhost' or '127.0.0.1', use SSL.
    ssl: process.env.DATABASE_URL?.includes("localhost") || process.env.DATABASE_URL?.includes("127.0.0.1")
        ? false
        : { rejectUnauthorized: false },
});

export async function query(text: string, params?: any[]) {
    return pool.query(text, params);
}