# Transcript Analyzer - Database Schema

This document describes the complete database schema for the Transcript Analyzer application.

## Database: SQLite (`transcripts.db`)

### Tables

#### 1. `conversations`
Stores uploaded conversation transcripts.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-increment ID |
| conversation_id | TEXT UNIQUE NOT NULL | Unique conversation identifier |
| transcript_details | TEXT NOT NULL | Full transcript text |
| conversation_date | TEXT | Date of conversation |
| uploaded_at | DATETIME | Upload timestamp |
| message_count | INTEGER | Number of messages |
| duration_minutes | REAL | Conversation duration |

#### 2. `analysis_results`
Basic sentiment and keyword analysis results.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-increment ID |
| conversation_id | TEXT NOT NULL | Foreign key to conversations |
| overall_sentiment | REAL | Overall sentiment score |
| sentiment_label | TEXT | Sentiment label (positive/negative/neutral) |
| positive_count | INTEGER | Count of positive messages |
| negative_count | INTEGER | Count of negative messages |
| neutral_count | INTEGER | Count of neutral messages |
| topics | TEXT | JSON array of topics |
| keywords | TEXT | JSON array of keywords |
| avg_message_length | REAL | Average message length |
| avg_response_time | REAL | Average response time |
| agent_performance_score | REAL | Agent performance score |
| customer_satisfaction_score | REAL | Customer satisfaction score |
| analyzed_at | DATETIME | Analysis timestamp |

#### 3. `ai_analysis_results`
Comprehensive AI-powered analysis results.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-increment ID |
| conversation_id | TEXT UNIQUE NOT NULL | Foreign key to conversations |
| **Summarization** | | |
| summary | TEXT | 2-3 sentence summary |
| key_points | TEXT | JSON array of key points |
| resolved | BOOLEAN | Issue resolution status |
| action_items | TEXT | JSON array of action items |
| **Sentiment** | | |
| emotions | TEXT | JSON object of emotions |
| sentiment_trajectory | TEXT | JSON array of sentiment over time |
| emotional_turning_points | TEXT | JSON array of turning points |
| empathy_score | REAL | Agent empathy score (0-100) |
| **Intent** | | |
| primary_intent | TEXT | Primary conversation intent |
| secondary_intents | TEXT | JSON array of secondary intents |
| category | TEXT | Main category |
| subcategory | TEXT | Subcategory |
| complexity | TEXT | Complexity level (low/medium/high) |
| **Agent Performance** | | |
| communication_quality | REAL | Communication quality (0-100) |
| problem_solving_score | REAL | Problem solving score (0-100) |
| compliance_score | REAL | Compliance score (0-100) |
| personalization_score | REAL | Personalization score (0-100) |
| agent_strengths | TEXT | JSON array of strengths |
| agent_improvements | TEXT | JSON array of improvements |
| **QA** | | |
| policy_violations | TEXT | JSON array of violations |
| script_adherence_score | REAL | Script adherence (0-100) |
| risk_flags | TEXT | JSON array of risk flags |
| best_practice_suggestions | TEXT | JSON array of suggestions |
| **Customer Journey** | | |
| churn_risk_score | REAL | Churn risk (0-100) |
| customer_personality | TEXT | Personality type |
| lifetime_value_indicator | TEXT | LTV indicator (high/medium/low) |
| intervention_suggestions | TEXT | JSON array of interventions |
| **Metadata** | | |
| provider_used | TEXT | LLM provider used |
| tokens_used | INTEGER | Tokens consumed |
| cost | REAL | Analysis cost |
| processing_time_ms | INTEGER | Processing time in ms |
| analyzed_at | DATETIME | Analysis timestamp |
| custom_data | TEXT | JSON of full analysis (for custom prompts) |

#### 4. `ai_cost_tracking`
Tracks AI usage costs.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-increment ID |
| date | DATE | Date of usage |
| provider | TEXT | LLM provider |
| conversations_analyzed | INTEGER | Number analyzed |
| total_tokens | INTEGER | Total tokens used |
| total_cost | REAL | Total cost |
| created_at | DATETIME | Record timestamp |

#### 5. `ai_settings`
Stores AI configuration settings.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-increment ID |
| setting_key | TEXT UNIQUE NOT NULL | Setting key |
| setting_value | TEXT NOT NULL | Setting value |
| updated_at | DATETIME | Last update timestamp |

#### 6. `ai_prompts`
Manages AI prompt templates.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-increment ID |
| name | TEXT NOT NULL | Prompt name |
| description | TEXT | Prompt description |
| template | TEXT NOT NULL | Prompt template (with {{TRANSCRIPT}} placeholder) |
| is_active | BOOLEAN | Currently active flag |
| is_default | BOOLEAN | Default prompt flag |
| created_at | DATETIME | Creation timestamp |
| updated_at | DATETIME | Last update timestamp |

#### 7. `metric_configs`
Configures custom metric scoring and colors.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-increment ID |
| metric_name | TEXT UNIQUE NOT NULL | Metric name (e.g., CES, NPS) |
| min_value | REAL NOT NULL | Minimum value |
| max_value | REAL NOT NULL | Maximum value |
| reverse_scale | BOOLEAN | True if lower is better |
| color_thresholds | TEXT | JSON array of color thresholds |
| created_at | DATETIME | Creation timestamp |

**Default Metric Configs:**
- **CES**: 1-5, thresholds: [≤2: red, ≤4: yellow, ≤5: green]
- **NPS**: -100 to 100, thresholds: [≤0: red, ≤50: yellow, ≤100: green]
- **CSAT**: 1-5, thresholds: [≤2: red, ≤4: yellow, ≤5: green]
- **churnRiskScore**: 0-100 (reverse), thresholds: [≤30: green, ≤70: yellow, ≤100: red]

#### 8. `metrics`
General metrics storage.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-increment ID |
| metric_name | TEXT NOT NULL | Metric name |
| metric_value | REAL | Metric value |
| metric_data | TEXT | Additional data (JSON) |
| calculated_at | DATETIME | Calculation timestamp |

## Recreating the Database

To recreate the database from scratch:

1. Delete the existing database:
   ```bash
   rm transcripts.db
   ```

2. Start the server:
   ```bash
   npm run dev
   ```

3. The database will be automatically created with all tables and seeded with:
   - Default AI prompt (comprehensive analysis)
   - Default metric configurations (CES, NPS, CSAT, churnRiskScore)

Alternatively, you can use the schema file:
```bash
sqlite3 transcripts.db < DATABASE_SCHEMA.sql
```

Note: This will create the tables but won't seed the default data. You'll need to run the server once to seed defaults.
