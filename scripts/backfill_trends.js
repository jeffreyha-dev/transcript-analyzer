import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '..', 'transcripts.db');

console.log('Starting sentiment trends backfill...');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
        process.exit(1);
    }
});

function getRandomSentiment(base, variance) {
    return Math.max(0, Math.min(1, base + (Math.random() * variance * 2 - variance)));
}

function getRandomCount(base, variance) {
    return Math.max(0, Math.round(base + (Math.random() * variance * 2 - variance)));
}

db.serialize(() => {
    // Clear existing trends
    db.run('DELETE FROM sentiment_trends');

    const today = new Date();
    const accountId = 1; // Default account

    // Generate 30 days of data
    for (let i = 30; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        // Simulate a slight downward trend then recovery
        let baseSentiment = 0.65;
        if (i < 10) baseSentiment = 0.70; // Recent recovery
        else if (i < 20) baseSentiment = 0.55; // Dip

        const avgSentiment = getRandomSentiment(baseSentiment, 0.1);
        const count = getRandomCount(50, 15);

        const positiveCount = Math.round(count * (avgSentiment + 0.1));
        const negativeCount = Math.round(count * (0.3 - (avgSentiment * 0.2)));
        const neutralCount = Math.max(0, count - positiveCount - negativeCount);

        db.run(`
            INSERT INTO sentiment_trends 
            (date, avg_sentiment, conversation_count, positive_count, negative_count, neutral_count, account_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            dateStr,
            avgSentiment,
            count,
            positiveCount,
            negativeCount,
            neutralCount,
            accountId
        ], (err) => {
            if (err) console.error(`Error inserting for ${dateStr}:`, err);
            else console.log(`Generated data for ${dateStr}`);
        });
    }

    // Wait for all insertions
    setTimeout(() => {
        db.close(() => {
            console.log('Backfill completed!');
        });
    }, 1000);
});
