import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, '..', 'transcripts.db');

const db = new sqlite3.Database(dbPath);

console.log('Migrating LivePerson schema...');

db.serialize(() => {
    // Check if columns exist
    db.all("PRAGMA table_info(liveperson_accounts)", (err, columns) => {
        if (err) {
            console.error('Error checking table schema:', err);
            db.close();
            return;
        }

        const hasServiceName = columns.some(col => col.name === 'service_name');
        const hasApiVersion = columns.some(col => col.name === 'api_version');
        const hasApiEndpointPath = columns.some(col => col.name === 'api_endpoint_path');

        if (hasServiceName && hasApiVersion && hasApiEndpointPath) {
            console.log('Schema already up to date. No migration needed.');
            db.close();
            return;
        }

        console.log('Adding missing columns...');

        const migrations = [];

        if (!hasServiceName) {
            migrations.push(
                new Promise((resolve, reject) => {
                    db.run("ALTER TABLE liveperson_accounts ADD COLUMN service_name TEXT DEFAULT 'msgHist'", (err) => {
                        if (err) reject(err);
                        else {
                            console.log('✓ Added service_name column');
                            resolve();
                        }
                    });
                })
            );
        }

        if (!hasApiVersion) {
            migrations.push(
                new Promise((resolve, reject) => {
                    db.run("ALTER TABLE liveperson_accounts ADD COLUMN api_version TEXT DEFAULT '1.0'", (err) => {
                        if (err) reject(err);
                        else {
                            console.log('✓ Added api_version column');
                            resolve();
                        }
                    });
                })
            );
        }

        if (!hasApiEndpointPath) {
            migrations.push(
                new Promise((resolve, reject) => {
                    db.run("ALTER TABLE liveperson_accounts ADD COLUMN api_endpoint_path TEXT DEFAULT '/messaging_history/api/account/{accountId}/conversations/search'", (err) => {
                        if (err) reject(err);
                        else {
                            console.log('✓ Added api_endpoint_path column');
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
