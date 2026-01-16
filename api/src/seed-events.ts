import { query } from "./hack-db"; // Ensure this path matches your db file
import dotenv from "dotenv";

dotenv.config();

const events = [
    {
        id: 1,
        title: "Inspire Hackathon",
        description: "A two-day build sprint dedicated to software solutions for social impact. Team up to create tools that make a difference.",
        event_date: "2026-01-30T09:00:00Z", // Starts Jan 30
        is_active: true
    },
    {
        id: 2,
        title: "Portfolio Sprint",
        description: "Stop procrastinating on your personal site. Build, deploy, and get expert recruiter feedback in one intensive 6-hour session.",
        event_date: "2026-02-07T10:00:00Z", // Feb 7, 2026
        is_active: true
    }
];

const seed = async () => {
    console.log("🌱 Starting event seeding...");

    try {
        for (const event of events) {
            await query(
                `INSERT INTO events (id, title, description, event_date, is_active)
                 VALUES ($1, $2, $3, $4, $5)
                 ON CONFLICT (id) DO UPDATE 
                 SET title = EXCLUDED.title, 
                     description = EXCLUDED.description, 
                     event_date = EXCLUDED.event_date,
                     is_active = EXCLUDED.is_active`,
                [event.id, event.title, event.description, event.event_date, event.is_active]
            );
            console.log(`✅ Seeded/Updated: ${event.title}`);
        }
        console.log("\n🚀 All events successfully synchronized.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Seeding failed:", err);
        process.exit(1);
    }
};

seed();