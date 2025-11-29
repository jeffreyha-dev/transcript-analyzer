import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, '..', 'transcripts.db');

const db = new sqlite3.Database(dbPath);

console.log('Migrating database...');

db.serialize(() => {
    // Check if custom_data column exists in ai_analysis_results
    db.all("PRAGMA table_info(ai_analysis_results)", (err, rows) => {
        if (err) {
            console.error('Error checking table info:', err);
            return;
        }

        const hasCustomData = rows.some(row => row.name === 'custom_data');
        if (!hasCustomData) {
            console.log('Adding custom_data column to ai_analysis_results...');
            db.run("ALTER TABLE ai_analysis_results ADD COLUMN custom_data TEXT", (err) => {
                if (err) {
                    console.error('Error adding column:', err);
                } else {
                    console.log('Successfully added custom_data column.');
                }
            });
        } else {
            console.log('custom_data column already exists.');
        }
    });
});

db.close();
