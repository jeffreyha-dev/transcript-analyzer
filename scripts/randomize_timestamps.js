import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, '..', 'transcripts.db');

const db = new sqlite3.Database(dbPath);

console.log('Randomizing timestamps...');

db.serialize(() => {
    db.all("SELECT id FROM analysis_results", (err, rows) => {
        if (err) {
            console.error('Error fetching rows:', err);
            return;
        }

        console.log(`Found ${rows.length} rows to update.`);

        const stmt = db.prepare("UPDATE analysis_results SET analyzed_at = ? WHERE id = ?");

        rows.forEach(row => {
            // Randomize date within last 30 days
            const daysAgo = Math.floor(Math.random() * 30);
            const hour = Math.floor(Math.random() * 24);
            const minute = Math.floor(Math.random() * 60);
            const second = Math.floor(Math.random() * 60);

            const date = new Date();
            date.setDate(date.getDate() - daysAgo);
            date.setHours(hour, minute, second);

            // Format as YYYY-MM-DD HH:MM:SS
            const timestamp = date.toISOString().replace('T', ' ').slice(0, 19);

            stmt.run(timestamp, row.id);
        });

        stmt.finalize(() => {
            console.log('Timestamps randomized successfully.');
            db.close();
        });
    });
});
