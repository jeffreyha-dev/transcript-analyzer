# API Documentation

Complete API reference for the Transcript Analyzer application.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Currently, the API does not require authentication. All endpoints are publicly accessible on localhost.

---

## Conversations API

### Upload Conversations (File)

Upload a file containing conversations.

**Endpoint:** `POST /conversations/upload`

**Content-Type:** `multipart/form-data`

**Request Body:**
- `file`: File (JSON or TXT format)

**Response:**
```json
{
  "message": "File uploaded and processed successfully",
  "count": 10,
  "conversations": [...]
}
```

### Bulk Upload Conversations (JSON)

Upload conversations directly as JSON.

**Endpoint:** `POST /conversations/bulk`

**Request Body:**
```json
[
  {
    "conversation_id": "conv_001",
    "conversation_date": "2025-11-30",
    "transcript_details": "Agent: Hello...\nCustomer: Hi..."
  }
]
```

**Response:**
```json
{
  "message": "10 conversations uploaded successfully",
  "count": 10
}
```

### List Conversations

Get paginated list of conversations.

**Endpoint:** `GET /conversations`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)
- `account_id` (optional): Filter by LivePerson account ID

**Response:**
```json
{
  "conversations": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

### Get Conversation

Get a specific conversation by ID.

**Endpoint:** `GET /conversations/:id`

**Response:**
```json
{
  "conversation_id": "conv_001",
  "transcript_details": "...",
  "conversation_date": "2025-11-30",
  "uploaded_at": "2025-11-30T12:00:00Z",
  "message_count": 15,
  "duration_minutes": 5.2
}
```

### Delete Conversation

Delete a conversation and all associated analysis results.

**Endpoint:** `DELETE /conversations/:id`

**Response:**
```json
{
  "message": "Conversation deleted successfully"
}
```

---

## LivePerson API

### List Accounts

Get all LivePerson accounts.

**Endpoint:** `GET /liveperson/accounts`

**Response:**
```json
[
  {
    "id": 1,
    "account_name": "Production Account",
    "account_id": "12345678",
    "is_active": true,
    "created_at": "2025-11-30T12:00:00Z"
  }
]
```

### Create Account

Add a new LivePerson account.

**Endpoint:** `POST /liveperson/accounts`

**Request Body:**
```json
{
  "account_name": "Production Account",
  "consumer_key": "your_consumer_key",
  "consumer_secret": "your_consumer_secret",
  "token": "your_token",
  "token_secret": "your_token_secret",
  "account_id": "12345678"
}
```

### Update Account

Update an existing LivePerson account.

**Endpoint:** `PUT /liveperson/accounts/:id`

**Request Body:** Same as Create Account

### Delete Account

Delete a LivePerson account.

**Endpoint:** `DELETE /liveperson/accounts/:id`

### Fetch Conversations

Fetch conversations from LivePerson API.

**Endpoint:** `POST /liveperson/fetch`

**Request Body:**
```json
{
  "accountId": 1,
  "startDate": "2025-11-01",
  "endDate": "2025-11-30",
  "skills": ["Sales", "Support"]
}
```

**Response:**
```json
{
  "message": "Successfully fetched 150 conversations",
  "count": 150,
  "accountId": 1
}
```

---

## Traditional Analysis API

### Run Analysis

Run traditional analysis on all conversations without analysis results.

**Endpoint:** `POST /analysis/run`

**Query Parameters:**
- `account_id` (optional): Analyze only conversations from specific account

**Response:**
```json
{
  "message": "Analysis completed successfully",
  "analyzed": 50,
  "skipped": 10,
  "errors": 0
}
```

### Get Analysis Results

Get paginated analysis results with filtering.

**Endpoint:** `GET /analysis/results`

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `sentiment` (optional): Filter by sentiment (positive/negative/neutral)
- `min_satisfaction` (optional): Minimum CSAT score
- `account_id` (optional): Filter by account

**Response:**
```json
{
  "results": [...],
  "pagination": {...}
}
```

### Get Dashboard Metrics

Get aggregated metrics for dashboard.

**Endpoint:** `GET /analysis/dashboard`

**Query Parameters:**
- `account_id` (optional): Filter by account

**Response:**
```json
{
  "totalConversations": 150,
  "analyzedCount": 140,
  "avgSentiment": 65.5,
  "avgAgentScore": 78.2,
  "avgSatisfaction": 4.2,
  "sentimentDistribution": {
    "positive": 80,
    "negative": 30,
    "neutral": 30
  },
  "topTopics": [...],
  "recentConversations": [...]
}
```

### Export Results

Export analysis results in JSON or CSV format.

**Endpoint:** `GET /analysis/export`

**Query Parameters:**
- `format`: `json` or `csv`
- `account_id` (optional): Filter by account

**Response:** File download

---

## AI Analysis API

### Run AI Analysis

Run AI-powered analysis on conversations.

**Endpoint:** `POST /ai-analysis/run`

**Query Parameters:**
- `account_id` (optional): Analyze only conversations from specific account
- `limit` (optional): Maximum conversations to analyze

**Response:**
```json
{
  "message": "AI analysis completed",
  "analyzed": 25,
  "skipped": 5,
  "errors": 0,
  "totalCost": 0.45,
  "totalTokens": 15000
}
```

### Get AI Analysis Results

Get paginated AI analysis results with filtering.

**Endpoint:** `GET /ai-analysis/results`

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `intent` (optional): Filter by primary intent
- `complexity` (optional): Filter by complexity (low/medium/high)
- `min_churn_risk` (optional): Minimum churn risk score
- `account_id` (optional): Filter by account

**Response:**
```json
{
  "results": [...],
  "pagination": {...}
}
```

### Get AI Summary

Get detailed AI analysis for a specific conversation.

**Endpoint:** `GET /ai-analysis/summary/:conversationId`

**Response:**
```json
{
  "conversation_id": "conv_001",
  "summary": "Customer contacted support regarding...",
  "key_points": [...],
  "emotions": {...},
  "primary_intent": "Billing Issue",
  "churn_risk_score": 65,
  "agent_performance": {...},
  ...
}
```

### Get AI Insights

Get aggregated AI insights.

**Endpoint:** `GET /ai-analysis/insights`

**Query Parameters:**
- `account_id` (optional): Filter by account

**Response:**
```json
{
  "totalAnalyzed": 100,
  "avgEmpathyScore": 72.5,
  "topIntents": [...],
  "complexityDistribution": {...},
  "avgChurnRisk": 45.2
}
```

### Get Cost Tracking

Get AI usage cost data.

**Endpoint:** `GET /ai-analysis/costs`

**Query Parameters:**
- `days` (optional): Number of days to retrieve (default: 30)

**Response:**
```json
{
  "costs": [
    {
      "date": "2025-11-30",
      "provider": "openai",
      "conversations_analyzed": 50,
      "total_tokens": 25000,
      "total_cost": 0.75
    }
  ],
  "summary": {
    "totalCost": 15.50,
    "totalTokens": 500000,
    "totalConversations": 1000
  }
}
```

### Get Sentiment Trends

Get historical sentiment trends with forecast.

**Endpoint:** `GET /ai-analysis/trends`

**Query Parameters:**
- `days` (optional): Number of days (default: 30)
- `account_id` (optional): Filter by account

**Response:**
```json
{
  "trends": [...],
  "forecast": [...],
  "anomalies": [...]
}
```

### Get Churn Risks

Get conversations with high churn risk.

**Endpoint:** `GET /ai-analysis/churn-risks`

**Query Parameters:**
- `min_risk` (optional): Minimum risk score (default: 70)
- `account_id` (optional): Filter by account

**Response:**
```json
{
  "highRisk": [...],
  "summary": {
    "total": 15,
    "avgRisk": 82.5
  }
}
```

### Calculate Churn Risk

Recalculate churn risk scores for all conversations.

**Endpoint:** `POST /ai-analysis/calculate-churn`

**Response:**
```json
{
  "message": "Churn risk calculation completed",
  "updated": 100
}
```

### Get Intent Statistics

Get aggregated statistics by intent.

**Endpoint:** `GET /ai-analysis/intents`

**Query Parameters:**
- `account_id` (optional): Filter by account

**Response:**
```json
[
  {
    "intent": "Billing Issue",
    "count": 45,
    "avg_sentiment": 42.5,
    "avg_complexity": 2.3
  },
  ...
]
```

### Get Intent Insights

Get AI-powered recommendations based on intent analysis.

**Endpoint:** `GET /ai-analysis/intent-insights`

**Query Parameters:**
- `account_id` (optional): Filter by account

**Response:**
```json
{
  "recommendations": [
    {
      "priority": "critical",
      "title": "Address 'Billing Issue' immediately",
      "description": "45 conversations (15.2%) with negative sentiment (42.5/100)...",
      "intent": "Billing Issue",
      "impact": "High - affects significant portion of customers"
    }
  ],
  "metadata": {
    "totalConversations": 296,
    "totalIntents": 31,
    "criticalCount": 2
  }
}
```

---

## Configuration API

### Get AI Settings

Get current AI configuration.

**Endpoint:** `GET /settings`

**Response:**
```json
{
  "provider": "openai",
  "model": "gpt-4",
  "temperature": 0.3,
  "maxTokens": 2000,
  "apiKey": "sk-***"
}
```

### Update AI Settings

Update AI configuration.

**Endpoint:** `PUT /settings`

**Request Body:**
```json
{
  "provider": "gemini",
  "model": "gemini-pro",
  "temperature": 0.5
}
```

### Get AI Prompts

Get all AI prompt templates.

**Endpoint:** `GET /prompts`

**Response:**
```json
[
  {
    "id": 1,
    "name": "Default Analysis",
    "description": "Comprehensive analysis prompt",
    "is_active": true,
    "is_default": true
  }
]
```

### Create AI Prompt

Create a new prompt template.

**Endpoint:** `POST /prompts`

**Request Body:**
```json
{
  "name": "Custom Prompt",
  "description": "My custom analysis",
  "template": "Analyze this conversation: {{TRANSCRIPT}}"
}
```

### Activate Prompt

Set a prompt as active.

**Endpoint:** `POST /prompts/:id/activate`

### Get Analysis Config

Get analysis algorithm configuration.

**Endpoint:** `GET /analysis-config`

**Response:**
```json
{
  "sentiment_keywords": {...},
  "topic_patterns": {...},
  "performance_thresholds": {...}
}
```

### Update Analysis Config

Update analysis configuration.

**Endpoint:** `PUT /analysis-config`

**Request Body:**
```json
{
  "config_key": "sentiment_keywords",
  "config_value": {...},
  "config_type": "sentiment"
}
```

### Get Metric Configs

Get all metric configurations.

**Endpoint:** `GET /metric-configs`

**Response:**
```json
[
  {
    "metric_name": "CES",
    "min_value": 1,
    "max_value": 5,
    "reverse_scale": false,
    "color_thresholds": [...]
  }
]
```

---

## Error Responses

All endpoints return standard error responses:

**400 Bad Request:**
```json
{
  "error": "Invalid request parameters"
}
```

**404 Not Found:**
```json
{
  "error": "Resource not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error",
  "details": "Error message"
}
```

---

## Rate Limiting

Currently, there are no rate limits on the API. However, AI analysis endpoints may be slower due to LLM processing time.

## CORS

CORS is enabled for `http://localhost:5173` (frontend development server).
