import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, '..', 'transcripts.db');

const db = new sqlite3.Database(dbPath);

console.log('Removing topics column from analysis_results table...');

db.serialize(() => {
    // Check if topics column exists
    db.all("PRAGMA table_info(analysis_results)", (err, columns) => {
        if (err) {
            console.error('Error checking table schema:', err);
            db.close();
            return;
        }

        const hasTopicsColumn = columns.some(col => col.name === 'topics');

        if (!hasTopicsColumn) {
            console.log('Topics column does not exist. Nothing to do.');
            db.close();
            return;
        }

        console.log('Topics column found. Creating new table without topics column...');

        // Create new table without topics column
        db.run(`
            CREATE TABLE analysis_results_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conversation_id TEXT NOT NULL UNIQUE,
                overall_sentiment REAL,
                sentiment_label TEXT,
                positive_count INTEGER,
                negative_count INTEGER,
                neutral_count INTEGER,
                keywords TEXT,
                avg_message_length REAL,
                avg_response_time REAL,
                agent_performance_score REAL,
                customer_satisfaction_score REAL,
                analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id) ON DELETE CASCADE
            )
        `, (err) => {
            if (err) {
                console.error('Error creating new table:', err);
                db.close();
                return;
            }

            console.log('Copying data to new table...');

            // Copy data from old table to new table (excluding topics)
            db.run(`
                INSERT INTO analysis_results_new 
                SELECT 
                    id, conversation_id, overall_sentiment, sentiment_label,
                    positive_count, negative_count, neutral_count,
                    keywords, avg_message_length, avg_response_time,
                    agent_performance_score, customer_satisfaction_score, analyzed_at
                FROM analysis_results
            `, (err) => {
                if (err) {
                    console.error('Error copying data:', err);
                    db.close();
                    return;
                }

                console.log('Dropping old table...');

                // Drop old table
                db.run('DROP TABLE analysis_results', (err) => {
                    if (err) {
                        console.error('Error dropping old table:', err);
                        db.close();
                        return;
                    }

                    console.log('Renaming new table...');

                    // Rename new table to original name
                    db.run('ALTER TABLE analysis_results_new RENAME TO analysis_results', (err) => {
                        if (err) {
                            console.error('Error renaming table:', err);
                        } else {
                            console.log('✓ Successfully removed topics column from analysis_results table');
                        }
                        db.close();
                    });
                });
            });
        });
    });
});
