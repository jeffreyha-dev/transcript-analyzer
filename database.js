import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { prompts } from './prompts.js';

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
function initDatabase() {
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
          custom_data TEXT,
          
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
          // Initialize AI Prompts table
          db.run(`
            CREATE TABLE IF NOT EXISTS ai_prompts (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT NOT NULL,
              description TEXT,
              template TEXT NOT NULL,
              is_active BOOLEAN DEFAULT 0,
              is_default BOOLEAN DEFAULT 0,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `, async (err) => {
            if (err) {
              console.error('Error creating ai_prompts table:', err);
              reject(err);
            } else {
              // Seed default prompt if table is empty
              try {
                const count = await getOne('SELECT COUNT(*) as count FROM ai_prompts');
                if (count.count === 0) {
                  console.log('Seeding default prompts...');
                  await runQuery(
                    `INSERT INTO ai_prompts (name, description, template, is_active, is_default)
                     VALUES (?, ?, ?, 1, 1)`,
                    ['Default Analysis', 'Standard comprehensive analysis prompt', prompts.combinedAnalysis('{{TRANSCRIPT}}')]
                  );
                }

                // Create metric_configs table
                db.run(`
                  CREATE TABLE IF NOT EXISTS metric_configs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    metric_name TEXT UNIQUE NOT NULL,
                    min_value REAL NOT NULL,
                    max_value REAL NOT NULL,
                    reverse_scale BOOLEAN DEFAULT 0,
                    color_thresholds TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                  )
                `, async (err) => {
                  if (err) {
                    console.error('Error creating metric_configs table:', err);
                  } else {
                    // Seed default metric configs
                    try {
                      const configCount = await getOne('SELECT COUNT(*) as count FROM metric_configs');
                      if (configCount.count === 0) {
                        console.log('Seeding default metric configs...');
                        const defaultConfigs = [
                          {
                            name: 'CES',
                            min: 1,
                            max: 5,
                            reverse: 0,
                            thresholds: JSON.stringify([{ max: 2, color: '#ef4444' }, { max: 4, color: '#f59e0b' }, { max: 5, color: '#10b981' }])
                          },
                          {
                            name: 'NPS',
                            min: -100,
                            max: 100,
                            reverse: 0,
                            thresholds: JSON.stringify([{ max: 0, color: '#ef4444' }, { max: 50, color: '#f59e0b' }, { max: 100, color: '#10b981' }])
                          },
                          {
                            name: 'CSAT',
                            min: 1,
                            max: 5,
                            reverse: 0,
                            thresholds: JSON.stringify([{ max: 2, color: '#ef4444' }, { max: 4, color: '#f59e0b' }, { max: 5, color: '#10b981' }])
                          },
                          {
                            name: 'churnRiskScore',
                            min: 0,
                            max: 100,
                            reverse: 1,
                            thresholds: JSON.stringify([{ max: 30, color: '#10b981' }, { max: 70, color: '#f59e0b' }, { max: 100, color: '#ef4444' }])
                          }
                        ];

                        for (const config of defaultConfigs) {
                          await runQuery(
                            `INSERT INTO metric_configs (metric_name, min_value, max_value, reverse_scale, color_thresholds)
                             VALUES (?, ?, ?, ?, ?)`,
                            [config.name, config.min, config.max, config.reverse, config.thresholds]
                          );
                        }
                      }
                    } catch (seedErr) {
                      console.error('Error seeding metric configs:', seedErr);
                    }
                  }
                });

                // Create analysis_config table
                db.run(`
                  CREATE TABLE IF NOT EXISTS analysis_config (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    config_key TEXT UNIQUE NOT NULL,
                    config_value TEXT NOT NULL,
                    config_type TEXT NOT NULL,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                  )
                `, async (err) => {
                  if (err) {
                    console.error('Error creating analysis_config table:', err);
                  } else {
                    // Seed default analysis configs
                    try {
                      const configCount = await getOne('SELECT COUNT(*) as count FROM analysis_config');
                      if (configCount.count === 0) {
                        console.log('Seeding default analysis configs...');
                        const defaultConfigs = [
                          {
                            key: 'sentiment_keywords',
                            value: JSON.stringify({
                              positive: ['great', 'excellent', 'satisfied', 'resolved', 'helpful', 'thank', 'appreciate', 'happy', 'perfect', 'amazing'],
                              negative: ['frustrated', 'angry', 'disappointed', 'unresolved', 'terrible', 'worst', 'awful', 'poor', 'bad', 'unhappy'],
                              neutral: ['okay', 'fine', 'alright', 'acceptable']
                            }),
                            type: 'sentiment'
                          },
                          {
                            key: 'topic_patterns',
                            value: JSON.stringify({
                              billing: ['refund', 'charge', 'payment', 'invoice', 'bill', 'cost', 'price'],
                              technical: ['error', 'bug', 'crash', 'not working', 'broken', 'issue', 'problem'],
                              shipping: ['delivery', 'shipping', 'tracking', 'package', 'order'],
                              account: ['login', 'password', 'account', 'access', 'username']
                            }),
                            type: 'topic'
                          },
                          {
                            key: 'topic_stop_words',
                            value: JSON.stringify({
                              stopWords: [
                                'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'as', 'are', 'was', 'were', 'been', 'be',
                                'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
                                'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what',
                                'who', 'when', 'where', 'why', 'how', 'for', 'with', 'from', 'to', 'of', 'in', 'out', 'up', 'down',
                                'but', 'or', 'not', 'no', 'yes', 'if', 'then', 'than', 'so', 'just', 'now', 'very', 'too', 'also',
                                'only', 'some', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'such', 'own', 'same',
                                'here', 'there', 'about', 'after', 'before', 'between', 'into', 'through', 'during', 'above', 'below',
                                'agent', 'customer', 'support', 'user', 'hello', 'hi', 'hey', 'thanks', 'thank', 'please', 'help',
                                'assist', 'assistance', 'service', 'today', 'call', 'contact', 'speak', 'speaking', 'talk', 'talking',
                                'understand', 'see', 'know', 'need', 'want', 'get', 'got', 'like', 'well', 'okay', 'ok', 'sure',
                                'right', 'good', 'great', 'sorry', 'apologize', 'appreciate', 'welcome', 'bye', 'goodbye', 'anything',
                                'something', 'everything', 'nothing', 'someone', 'everyone', 'anyone', 'time', 'day', 'week', 'month',
                                'year', 'minute', 'hour', 'moment', 'let', 'make', 'made', 'give', 'take', 'come', 'go', 'going',
                                'really', 'actually', 'definitely', 'certainly', 'probably', 'maybe', 'perhaps'
                              ],
                              minTermLength: 3,
                              maxTopics: 10
                            }),
                            type: 'topic'
                          },
                          {
                            key: 'performance_thresholds',
                            value: JSON.stringify({
                              goodAgentScore: 80,
                              avgResponseTimeTarget: 300,
                              minMessageLength: 20,
                              maxMessageLength: 500
                            }),
                            type: 'performance'
                          },
                          {
                            key: 'keyword_extraction',
                            value: JSON.stringify({
                              minFrequency: 2,
                              stopWords: ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'],
                              alwaysInclude: []
                            }),
                            type: 'keywords'
                          }
                        ];

                        for (const config of defaultConfigs) {
                          await runQuery(
                            `INSERT INTO analysis_config (config_key, config_value, config_type)
                             VALUES (?, ?, ?)`,
                            [config.key, config.value, config.type]
                          );
                        }
                      }
                    } catch (seedErr) {
                      console.error('Error seeding analysis configs:', seedErr);
                    }
                  }
                });

                console.log('Database schema initialized successfully');
                resolve();
              } catch (seedErr) {
                console.error('Error seeding prompts:', seedErr);
                resolve(); // Resolve anyway to not block startup
              }
            }
          });
        }
      });
    });
  });
}

// Helper function to run queries with promises
function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

// Helper function to get single row
function getOne(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Helper function to get all rows
function getAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Export database instance
export default db;

// Analytics Queries
async function getHeatmapData(dateRange = 'all', sentimentFilter = 'all') {
  let dateFilter = '1=1';
  if (dateRange !== 'all') {
    const days = parseInt(dateRange.replace('d', ''));
    dateFilter = `analyzed_at >= datetime('now', '-${days} days')`;
  }

  let sentimentCondition = '1=1';
  if (sentimentFilter !== 'all') {
    if (sentimentFilter === 'positive') sentimentCondition = "sentiment_label = 'Positive' OR sentiment_label = 'Very Positive'";
    else if (sentimentFilter === 'negative') sentimentCondition = "sentiment_label = 'Negative' OR sentiment_label = 'Very Negative'";
    else sentimentCondition = "sentiment_label = 'Neutral'";
  }

  const sql = `
    SELECT 
      strftime('%w', analyzed_at) as day_of_week,
      strftime('%H', analyzed_at) as hour_of_day,
      AVG(overall_sentiment) as avg_sentiment,
      COUNT(*) as count
    FROM analysis_results
    WHERE ${dateFilter} AND ${sentimentCondition}
    GROUP BY day_of_week, hour_of_day
  `;

  return getAll(sql);
}

async function getTopicClusters(dateRange, sentimentFilter) {
  let query = `
        SELECT 
            conversation_id,
            overall_sentiment,
            customer_satisfaction_score,
            sentiment_label,
            topics,
            analyzed_at
        FROM ai_analysis_results
        WHERE 1=1
    `;
  const params = [];

  if (dateRange && dateRange.start && dateRange.end) {
    query += ' AND analyzed_at BETWEEN ? AND ?';
    params.push(dateRange.start, dateRange.end);
  }

  if (sentimentFilter) {
    query += ' AND sentiment_label = ?';
    params.push(sentimentFilter);
  }

  query += ' ORDER BY analyzed_at DESC LIMIT 500';

  return getAll(query, params);
}

export { initDatabase, runQuery, getOne, getAll, getHeatmapData, getTopicClusters };
