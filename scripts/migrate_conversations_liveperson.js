import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, '..', 'transcripts.db');

const db = new sqlite3.Database(dbPath);

console.log('Migrating conversations table for LivePerson support...');

db.serialize(() => {
    // Check if columns exist
    db.all("PRAGMA table_info(conversations)", (err, columns) => {
        if (err) {
            console.error('Error checking table schema:', err);
            db.close();
            return;
        }

        const hasSource = columns.some(col => col.name === 'source');
        const hasExternalId = columns.some(col => col.name === 'external_id');
        const hasFetchedAt = columns.some(col => col.name === 'fetched_at');
        const hasLpAccountId = columns.some(col => col.name === 'lp_account_id');
        const hasRawLpResponse = columns.some(col => col.name === 'raw_lp_response');

        if (hasSource && hasExternalId && hasFetchedAt && hasLpAccountId && hasRawLpResponse) {
            console.log('Schema already up to date. No migration needed.');
            db.close();
            return;
        }

        console.log('Adding missing columns...');

        const migrations = [];

        if (!hasSource) {
            migrations.push(
                new Promise((resolve, reject) => {
                    db.run("ALTER TABLE conversations ADD COLUMN source TEXT DEFAULT 'upload'", (err) => {
                        if (err) reject(err);
                        else {
                            console.log('✓ Added source column');
                            resolve();
                        }
                    });
                })
            );
        }

        if (!hasExternalId) {
            migrations.push(
                new Promise((resolve, reject) => {
                    db.run("ALTER TABLE conversations ADD COLUMN external_id TEXT", (err) => {
                        if (err) reject(err);
                        else {
                            console.log('✓ Added external_id column');
                            resolve();
                        }
                    });
                })
            );
        }

        if (!hasFetchedAt) {
            migrations.push(
                new Promise((resolve, reject) => {
                    db.run("ALTER TABLE conversations ADD COLUMN fetched_at DATETIME", (err) => {
                        if (err) reject(err);
                        else {
                            console.log('✓ Added fetched_at column');
                            resolve();
                        }
                    });
                })
            );
        }

        if (!hasLpAccountId) {
            migrations.push(
                new Promise((resolve, reject) => {
                    db.run("ALTER TABLE conversations ADD COLUMN lp_account_id TEXT", (err) => {
                        if (err) reject(err);
                        else {
                            console.log('✓ Added lp_account_id column');
                            resolve();
                        }
                    });
                })
            );
        }

        if (!hasRawLpResponse) {
            migrations.push(
                new Promise((resolve, reject) => {
                    db.run("ALTER TABLE conversations ADD COLUMN raw_lp_response TEXT", (err) => {
                        if (err) reject(err);
                        else {
                            console.log('✓ Added raw_lp_response column');
                            resolve();
                        }
                    });
                })
            );
        }

        Promise.all(migrations)
            .then(() => {
                console.log('✓ Migration completed successfully');
                db.close();
            })
            .catch((err) => {
                console.error('Migration error:', err);
                db.close();
            });
    });
});
