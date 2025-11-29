import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '..', 'transcripts.db');

console.log('Starting predictive insights migration...');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
        process.exit(1);
    }
});

db.serialize(() => {
    // Create sentiment_trends table
    db.run(`
        CREATE TABLE IF NOT EXISTS sentiment_trends (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date DATE NOT NULL,
            avg_sentiment REAL,
            conversation_count INTEGER,
            positive_count INTEGER,
            negative_count INTEGER,
            neutral_count INTEGER,
            account_id INTEGER,
            calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(date, account_id)
        )
    `, (err) => {
        if (err) {
            console.error('Error creating sentiment_trends table:', err);
        } else {
            console.log('✓ Created sentiment_trends table');
        }
    });

    // Create indexes
    db.run(`CREATE INDEX IF NOT EXISTS idx_sentiment_trends_date ON sentiment_trends(date)`, (err) => {
        if (err) console.error('Error creating date index:', err);
        else console.log('✓ Created date index');
    });

    db.run(`CREATE INDEX IF NOT EXISTS idx_sentiment_trends_account ON sentiment_trends(account_id)`, (err) => {
        if (err) console.error('Error creating account index:', err);
        else console.log('✓ Created account index');
    });

    // Check if churn risk columns exist
    db.all(`PRAGMA table_info(ai_analysis_results)`, (err, columns) => {
        if (err) {
            console.error('Error checking table schema:', err);
            return;
        }

        const columnNames = columns.map(col => col.name);

        // Add churn_risk_score column
        if (!columnNames.includes('churn_risk_score')) {
            db.run(`ALTER TABLE ai_analysis_results ADD COLUMN churn_risk_score REAL`, (err) => {
                if (err) console.error('Error adding churn_risk_score:', err);
                else console.log('✓ Added churn_risk_score column');
            });
        } else {
            console.log('✓ churn_risk_score column already exists');
        }

        // Add churn_risk_factors column
        if (!columnNames.includes('churn_risk_factors')) {
            db.run(`ALTER TABLE ai_analysis_results ADD COLUMN churn_risk_factors TEXT`, (err) => {
                if (err) console.error('Error adding churn_risk_factors:', err);
                else console.log('✓ Added churn_risk_factors column');
            });
        } else {
            console.log('✓ churn_risk_factors column already exists');
        }

        // Add churn_risk_level column
        if (!columnNames.includes('churn_risk_level')) {
            db.run(`ALTER TABLE ai_analysis_results ADD COLUMN churn_risk_level TEXT`, (err) => {
                if (err) console.error('Error adding churn_risk_level:', err);
                else console.log('✓ Added churn_risk_level column');
            });
        } else {
            console.log('✓ churn_risk_level column already exists');
        }

        // Populate initial sentiment trends from existing data
        setTimeout(() => {
            console.log('\nPopulating initial sentiment trends...');
            db.run(`
                INSERT OR IGNORE INTO sentiment_trends (date, avg_sentiment, conversation_count, positive_count, negative_count, neutral_count, account_id)
                SELECT 
                    DATE(c.conversation_date) as date,
                    AVG(a.overall_sentiment) as avg_sentiment,
                    COUNT(*) as conversation_count,
                    SUM(CASE WHEN a.sentiment_label LIKE '%positive%' THEN 1 ELSE 0 END) as positive_count,
                    SUM(CASE WHEN a.sentiment_label LIKE '%negative%' THEN 1 ELSE 0 END) as negative_count,
                    SUM(CASE WHEN a.sentiment_label LIKE '%neutral%' THEN 1 ELSE 0 END) as neutral_count,
                    c.lp_account_id as account_id
                FROM analysis_results a
                JOIN conversations c ON a.conversation_id = c.conversation_id
                WHERE c.conversation_date IS NOT NULL
                GROUP BY DATE(c.conversation_date), c.lp_account_id
            `, (err) => {
                if (err) {
                    console.error('Error populating sentiment trends:', err);
                } else {
                    console.log('✓ Populated initial sentiment trends');
                }

                db.close((err) => {
                    if (err) {
                        console.error('Error closing database:', err);
                    } else {
                        console.log('\n✓ Migration completed successfully!');
                    }
                });
            });
        }, 1000); // Wait for column additions to complete
    });
});
