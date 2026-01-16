import { pool } from "./hack-db";
import { Storage } from '@google-cloud/storage';
import dotenv from "dotenv";

dotenv.config();

const googleStorage = new Storage({
    keyFilename: './gcs-key.json',
});
const bucket = googleStorage.bucket('uvic-hacks-resume');

async function resetEverything() {
    console.log("⚠️  WARNING: This will wipe all users, event registrations, and resumes.");

    try {
        // 1. Clear Database Tables
        console.log("--- Wiping Database ---");

        // Removed 'submissions' and 'registrations' to match your actual schema
        await pool.query(`
            TRUNCATE TABLE 
                users, 
                event_registrations
            RESTART IDENTITY CASCADE;
        `);
        console.log("✅ Users and Event Registrations truncated.");

        // 2. Clear Google Cloud Storage Bucket
        console.log("--- Wiping Cloud Storage ---");
        const [files] = await bucket.getFiles({ prefix: 'resumes/' });

        if (files.length === 0) {
            console.log("ℹ️ No resumes found in bucket to delete.");
        } else {
            await Promise.all(files.map(file => {
                console.log(`Deleting: ${file.name}`);
                return file.delete();
            }));
            console.log(`✅ Deleted ${files.length} files from GCS.`);
        }

        console.log("\n✨ System reset complete.");
        console.log("👉 Next step: Run your seed script to put the events back!");
        process.exit(0);

    } catch (err) {
        console.error("❌ Reset failed:", err);
        process.exit(1);
    }
}

resetEverything();