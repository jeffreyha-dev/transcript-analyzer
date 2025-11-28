/**
 * Database Migration Script - Phase 6
 * Adds service_name and api_version to liveperson_accounts table
 */

import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'transcripts.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
        process.exit(1);
    } else {
        console.log('Connected to database for migration');
    }
});

function runMigration() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            console.log('Starting migration (Phase 6)...');

            // Check if columns already exist
            db.all("PRAGMA table_info(liveperson_accounts)", (err, columns) => {
                if (err) {
                    console.error('Error checking table info:', err);
                    reject(err);
                    return;
                }

                const columnNames = columns.map(col => col.name);
                const columnsToAdd = [];

                if (!columnNames.includes('service_name')) {
                    columnsToAdd.push("ALTER TABLE liveperson_accounts ADD COLUMN service_name TEXT DEFAULT 'msgHist'");
                }
                if (!columnNames.includes('api_version')) {
                    columnsToAdd.push("ALTER TABLE liveperson_accounts ADD COLUMN api_version TEXT DEFAULT '1.0'");
                }

                if (columnsToAdd.length === 0) {
                    console.log('✅ All columns already exist. No migration needed.');
                    resolve();
                    return;
                }

                console.log(`Adding ${columnsToAdd.length} missing columns...`);

                let completed = 0;
                columnsToAdd.forEach((sql, index) => {
                    db.run(sql, (err) => {
                        if (err) {
                            console.error(`Error adding column ${index + 1}:`, err);
                            reject(err);
                        } else {
                            completed++;
                            console.log(`✅ Added column ${completed}/${columnsToAdd.length}`);

                            if (completed === columnsToAdd.length) {
                                console.log('✅ Migration completed successfully!');
                                resolve();
                            }
                        }
                    });
                });
            });
        });
    });
}

// Run migration
runMigration()
    .then(() => {
        console.log('\n✅ Database migration complete!');
        db.close();
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Migration failed:', error);
        db.close();
        process.exit(1);
    });
