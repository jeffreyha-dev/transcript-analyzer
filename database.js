import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'transcripts.db');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Initialize database schema
export function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Conversations table
      db.run(`
        CREATE TABLE IF NOT EXISTS conversations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          conversation_id TEXT UNIQUE NOT NULL,
          transcript_details TEXT NOT NULL,
          conversation_date TEXT,
          uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          message_count INTEGER DEFAULT 0,
          duration_minutes REAL DEFAULT 0
        )
      `, (err) => {
        if (err) console.error('Error creating conversations table:', err);
      });

      // Analysis results table
      db.run(`
        CREATE TABLE IF NOT EXISTS analysis_results (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          conversation_id TEXT NOT NULL,
          overall_sentiment REAL,
          sentiment_label TEXT,
          positive_count INTEGER DEFAULT 0,
          negative_count INTEGER DEFAULT 0,
          neutral_count INTEGER DEFAULT 0,
          topics TEXT,
          keywords TEXT,
          avg_message_length REAL,
          avg_response_time REAL,
          agent_performance_score REAL,
          customer_satisfaction_score REAL,
          analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) console.error('Error creating analysis_results table:', err);
      });

      // Metrics table for dashboard aggregations
      db.run(`
        CREATE TABLE IF NOT EXISTS metrics (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          metric_name TEXT NOT NULL,
          metric_value REAL,
          metric_data TEXT,
          calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) console.error('Error creating metrics table:', err);
      });

      // AI Analysis Results table
      db.run(`
        CREATE TABLE IF NOT EXISTS ai_analysis_results (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          conversation_id TEXT UNIQUE NOT NULL,
          
          -- Feature 1: Summarization
          summary TEXT,
          key_points TEXT,
          resolved BOOLEAN,
          action_items TEXT,
          
          -- Feature 2: Advanced Sentiment
          emotions TEXT,
          sentiment_trajectory TEXT,
          emotional_turning_points TEXT,
          empathy_score REAL,
          
          -- Feature 3: Intent Classification
          primary_intent TEXT,
          secondary_intents TEXT,
          category TEXT,
          subcategory TEXT,
          complexity TEXT,
          
          -- Feature 4: Agent Performance
          communication_quality REAL,
          problem_solving_score REAL,
          compliance_score REAL,
          personalization_score REAL,
          agent_strengths TEXT,
          agent_improvements TEXT,
          
          -- Feature 5: QA
          policy_violations TEXT,
          script_adherence_score REAL,
          risk_flags TEXT,
          best_practice_suggestions TEXT,
          
          -- Feature 6: Customer Journey
          churn_risk_score REAL,
          customer_personality TEXT,
          lifetime_value_indicator TEXT,
          intervention_suggestions TEXT,
          
          -- Metadata
          provider_used TEXT,
          tokens_used INTEGER,
          cost REAL,
          processing_time_ms INTEGER,
          analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          
          FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) console.error('Error creating ai_analysis_results table:', err);
      });

      // AI Cost Tracking table
      db.run(`
        CREATE TABLE IF NOT EXISTS ai_cost_tracking (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date DATE NOT NULL,
          provider TEXT NOT NULL,
          conversations_analyzed INTEGER DEFAULT 0,
          total_tokens INTEGER DEFAULT 0,
          total_cost REAL DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) console.error('Error creating ai_cost_tracking table:', err);
      });

      // AI Settings table
      db.run(`
        CREATE TABLE IF NOT EXISTS ai_settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          setting_key TEXT UNIQUE NOT NULL,
          setting_value TEXT NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating ai_settings table:', err);
          reject(err);
        } else {
          console.log('Database schema initialized successfully');
          resolve();
        }
      });
    });
  });
}

// Helper function to run queries with promises
export function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

// Helper function to get single row
export function getOne(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Helper function to get all rows
export function getAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Export database instance
export default db;
