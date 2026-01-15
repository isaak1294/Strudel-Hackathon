import { query } from "./hack-db";
import dotenv from "dotenv";

dotenv.config();

const init = async () => {
    // We split the SQL into an array to ensure the 'pg' library 
    // executes each block correctly.
    const statements = [
        // 1. Users Table
        `CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255),
            email VARCHAR(255) UNIQUE NOT NULL,
            vnumber VARCHAR(20) UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            resume_path TEXT,
            bio TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );`,

        // 2. Events Table
        `CREATE TABLE IF NOT EXISTS events (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            event_date TIMESTAMP WITH TIME ZONE,
            is_active BOOLEAN DEFAULT true
        );`,

        // 3. Junction Table (Many-to-Many)
        `CREATE TABLE IF NOT EXISTS event_registrations (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
            status VARCHAR(50) DEFAULT 'registered', -- Useful for waitlists!
            registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, event_id) 
        );`,

        // 4. Seed Data (So you have an event to test with immediately)
        `INSERT INTO events (id, title, description) 
         VALUES (1, 'UVic Hacks 2026', 'The main hackathon event.')
         ON CONFLICT (id) DO NOTHING;`
    ];

    try {
        console.log("Starting migration...");

        for (const sql of statements) {
            await query(sql);
        }

        console.log("Database schema updated and seed data inserted.");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed!");
        console.error(err);
        process.exit(1);
    }
};

init();