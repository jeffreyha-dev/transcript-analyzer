-- Transcript Analyzer Database Schema
-- Generated: 2025-11-30T13:34:54.872Z
-- SQLite version: 3.46.1

PRAGMA foreign_keys = ON;

CREATE TABLE ai_analysis_results (
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
          analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP, custom_data TEXT, churn_risk_level TEXT, churn_risk_factors TEXT,
          
          FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id) ON DELETE CASCADE
        );

CREATE TABLE ai_cost_tracking (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date DATE NOT NULL,
          provider TEXT NOT NULL,
          conversations_analyzed INTEGER DEFAULT 0,
          total_tokens INTEGER DEFAULT 0,
          total_cost REAL DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

CREATE TABLE ai_prompts (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT NOT NULL,
              description TEXT,
              template TEXT NOT NULL,
              is_active BOOLEAN DEFAULT 0,
              is_default BOOLEAN DEFAULT 0,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

CREATE TABLE ai_settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          setting_key TEXT UNIQUE NOT NULL,
          setting_value TEXT NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

CREATE TABLE analysis_config (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    config_key TEXT UNIQUE NOT NULL,
                    config_value TEXT NOT NULL,
                    config_type TEXT NOT NULL,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                  );

CREATE TABLE "analysis_results" (
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
            );

CREATE TABLE conversations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          conversation_id TEXT UNIQUE NOT NULL,
          transcript_details TEXT NOT NULL,
          conversation_date TEXT,
          uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          message_count INTEGER DEFAULT 0,
          duration_minutes REAL DEFAULT 0
        , raw_lp_response TEXT, external_id TEXT, source TEXT DEFAULT 'upload', lp_account_id TEXT, fetched_at DATETIME);

CREATE TABLE liveperson_accounts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          account_name TEXT NOT NULL UNIQUE,
          consumer_key TEXT NOT NULL,
          consumer_secret TEXT NOT NULL,
          token TEXT NOT NULL,
          token_secret TEXT NOT NULL,
          account_id TEXT NOT NULL,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        , service_name TEXT DEFAULT 'msgHist', api_version TEXT DEFAULT '1.0', api_endpoint_path TEXT DEFAULT '/messaging_history/api/account/{accountId}/conversations/search');

CREATE TABLE metric_configs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    metric_name TEXT UNIQUE NOT NULL,
                    min_value REAL NOT NULL,
                    max_value REAL NOT NULL,
                    reverse_scale BOOLEAN DEFAULT 0,
                    color_thresholds TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                  );

CREATE TABLE metrics (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          metric_name TEXT NOT NULL,
          metric_value REAL,
          metric_data TEXT,
          calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

CREATE TABLE sentiment_trends (
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
        );

CREATE INDEX idx_sentiment_trends_account ON sentiment_trends(account_id);

CREATE INDEX idx_sentiment_trends_date ON sentiment_trends(date);

CREATE TABLE sqlite_sequence(name,seq);