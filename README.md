# Transcript Analyzer

A comprehensive web application for analyzing consumer-agent conversation transcripts with AI-powered insights including sentiment analysis, intent classification, predictive analytics, and automated recommendations.

![Transcript Analyzer](https://img.shields.io/badge/Node.js-18+-green) ![React](https://img.shields.io/badge/React-18+-blue) ![SQLite](https://img.shields.io/badge/SQLite-3-lightgrey)

## Features

### 📊 Comprehensive Analysis

**Traditional Analysis:**
- **Sentiment Analysis**: Overall and per-message sentiment scoring (0-100 scale)
- **Topic Extraction**: Automatic identification of key topics using TF-IDF
- **Keyword Extraction**: Most frequent and relevant terms
- **Performance Metrics**: Message counts, response times, conversation duration
- **Agent Performance Scoring**: Professionalism and effectiveness metrics
- **Customer Satisfaction Estimation**: Based on language patterns and indicators

**AI-Powered Analysis:**
- **Summarization**: 2-3 sentence summaries with key points and action items
- **Advanced Sentiment**: Emotion detection, sentiment trajectory, turning points, empathy scoring
- **Intent Classification**: Primary and secondary intents with complexity levels
- **Agent Performance**: Communication quality, problem-solving, compliance, personalization
- **QA Insights**: Policy violations, script adherence, risk flags, best practices
- **Customer Journey**: Churn risk prediction, personality profiling, LTV indicators

### 🔮 Predictive Insights

- **Sentiment Trend Analysis**: Historical trends with forecasting and anomaly detection
- **Churn Risk Prediction**: ML-based customer churn risk scoring with risk factors
- **Intent Impact Matrix**: Volume vs Sentiment visualization with complexity mapping
- **AI-Powered Recommendations**: Automated priority-based action recommendations

### 🔗 LivePerson Integration

- **Multi-Account Support**: Manage multiple LivePerson accounts
- **OAuth 1.0 Authentication**: Secure API integration
- **Conversation Fetching**: Bulk import with date range and skill filtering
- **Real-time Progress**: Live fetch status with conversation counts

### 🎨 Premium Web Interface

- **Interactive Dashboard**: Real-time statistics and visualizations
- **Interactive Explorer**: 4 visualization panels (Intent Impact, Empathy, Churn Risk, Resolution)
- **AI Insights Panel**: Automated recommendations with priority badges
- **Multi-Account Filtering**: Filter all views by LivePerson account
- **Drag & Drop Upload**: Easy file upload with progress tracking
- **Advanced Filtering**: Filter results by sentiment, intent, complexity, date
- **Export Functionality**: Download results in CSV or JSON format
- **Responsive Design**: Works beautifully on all devices

### 🚀 Technology Stack

- **Backend**: Node.js, Express, SQLite
- **Frontend**: React 18, Vite, Framer Motion
- **Analysis**: Natural (NLP), Sentiment Analysis
- **AI**: OpenAI GPT-4, Google Gemini (configurable)
- **Visualization**: Recharts, Chart.js
- **Design**: Modern glassmorphism with vibrant gradients

## Installation

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- OpenAI API key or Google Gemini API key (for AI analysis)

### Setup

1. **Clone or navigate to the project directory**
```bash
cd transcript-analyzer
```

2. **Install backend dependencies**
```bash
npm install
```

3. **Install frontend dependencies**
```bash
cd client
npm install
cd ..
```

4. **Configure AI Settings** (Optional)
Create a `.env` file in the root directory:
```env
OPENAI_API_KEY=your_openai_api_key
# OR
GOOGLE_API_KEY=your_gemini_api_key
```

5. **Run Database Migrations** (if upgrading from older version)
```bash
node scripts/run-migrations.js
```

## Running the Application

### Start the Backend Server
```bash
npm run dev
```
The API server will start on `http://localhost:3000`

### Start the Frontend (in a new terminal)
```bash
cd client
npm run dev
```
The web app will be available at `http://localhost:5173`

## Usage

### 1. Import Conversations

**Option A: Upload Files**
Navigate to the **Import** tab → **Upload** section and upload conversation transcripts in JSON or text format.

**Option B: LivePerson Integration**
1. Go to **Import** tab → **LivePerson** section
2. Add your LivePerson account credentials (OAuth 1.0)
3. Select date range and optional skills filter
4. Click "Fetch Conversations" to import

**JSON Format:**
```json
[
  {
    "conversation_id": "conv_001",
    "conversation_date": "2025-11-26",
    "transcript_details": "Agent: Hello, how can I help you today?\nCustomer: I have a question about my order..."
  }
]
```

### 2. Run Analysis

Go to the **Analysis** tab:
- **Traditional Analysis**: Click "Run Traditional Analysis" for fast rule-based analysis
- **AI Analysis**: Click "Run AI Analysis" for deep AI-powered insights
- View results in the combined table with all metrics

### 3. View Dashboard

The **Dashboard** provides an overview with:
- Total conversations and analysis counts
- Average sentiment, CSAT, and agent scores
- Sentiment distribution charts
- Recent conversations table
- **Sentiment Trend Chart**: Historical trends with forecast and anomalies
- **Churn Risk Panel**: High-risk conversation identification

### 4. Explore Insights

The **Explore** tab features:
- **AI-Powered Insights Panel**: Top 3 automated recommendations
- **Intent Impact Analysis**: Volume vs Sentiment bubble chart
- **Empathy Distribution**: Agent empathy score distribution
- **Churn Risk Visuals**: Risk level breakdown
- **Resolution Status**: Resolved vs unresolved issues

### 5. Export Results

Use the **Export** button in Analysis tabs to download results in:
- **JSON**: Structured data for programmatic access
- **CSV**: Spreadsheet-compatible for Excel/Google Sheets

## API Documentation

### Conversations Endpoints

- `POST /api/conversations/upload` - Upload file with conversations
- `POST /api/conversations/bulk` - Bulk upload via JSON
- `GET /api/conversations` - List all conversations (paginated)
- `GET /api/conversations/:id` - Get specific conversation
- `DELETE /api/conversations/:id` - Delete conversation

### LivePerson Endpoints

- `GET /api/liveperson/accounts` - List all LivePerson accounts
- `POST /api/liveperson/accounts` - Create new account
- `PUT /api/liveperson/accounts/:id` - Update account
- `DELETE /api/liveperson/accounts/:id` - Delete account
- `POST /api/liveperson/fetch` - Fetch conversations from LivePerson
- `GET /api/liveperson/export-csv` - Export conversations to CSV

### Analysis Endpoints

- `POST /api/analysis/run` - Run traditional analysis
- `GET /api/analysis/results` - Get analysis results (with filters)
- `GET /api/analysis/dashboard` - Get dashboard metrics
- `GET /api/analysis/export?format=json|csv` - Export results

### AI Analysis Endpoints

- `POST /api/ai-analysis/run` - Run AI analysis on conversations
- `GET /api/ai-analysis/results` - Get AI analysis results (paginated, with filters)
- `GET /api/ai-analysis/summary/:id` - Get detailed AI analysis for a conversation
- `GET /api/ai-analysis/insights` - Get aggregated AI insights
- `GET /api/ai-analysis/costs` - Get cost tracking data
- `GET /api/ai-analysis/stats` - Get dashboard statistics
- `GET /api/ai-analysis/trends` - Get sentiment trends and forecast
- `GET /api/ai-analysis/churn-risks` - Get churn risk conversations
- `POST /api/ai-analysis/calculate-churn` - Calculate churn risk scores
- `GET /api/ai-analysis/intents` - Get aggregated intent statistics
- `GET /api/ai-analysis/intent-insights` - Get AI-powered intent recommendations

### Configuration Endpoints

- `GET /api/analysis-config` - Get all analysis configurations
- `PUT /api/analysis-config` - Update analysis configuration
- `GET /api/metric-configs` - Get all metric configurations
- `POST /api/metric-configs` - Create or update metric config
- `GET /api/prompts` - Get all AI prompts
- `POST /api/prompts` - Create new prompt
- `GET /api/settings` - Get AI settings
- `PUT /api/settings` - Update AI settings

## Architecture

```
transcript-analyzer/
├── server.js                    # Express server
├── database.js                  # SQLite database setup
├── analyzer.js                  # Traditional analysis engine
├── aiAnalyzer.js               # AI analysis engine
├── llmService.js               # LLM provider abstraction
├── routes/
│   ├── conversations.js        # Conversation endpoints
│   ├── analysis.js             # Traditional analysis endpoints
│   ├── aiAnalysis.js           # AI analysis endpoints
│   ├── liveperson.js           # LivePerson integration
│   └── ...                     # Config endpoints
├── services/
│   ├── livepersonService.js    # LivePerson API client
│   ├── trendAnalysis.js        # Sentiment trend forecasting
│   ├── churnPrediction.js      # Churn risk ML model
│   └── intentInsights.js       # AI-powered recommendations
├── migrations/
│   └── add_predictive_insights.js
├── scripts/
│   ├── run-migrations.js       # Migration runner
│   ├── backfill_trends.js      # Trend data backfill
│   └── README.md               # Scripts documentation
├── client/
│   ├── src/
│   │   ├── App.jsx             # Main app component
│   │   ├── components/         # React components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── InteractiveExplorer.jsx
│   │   │   ├── LivePersonFetch.jsx
│   │   │   └── visualizations/
│   │   │       ├── IntentAnalysisChart.jsx
│   │   │       ├── IntentInsightsPanel.jsx
│   │   │       ├── SentimentTrendChart.jsx
│   │   │       └── ChurnRiskPanel.jsx
│   │   ├── context/
│   │   │   └── AccountContext.jsx
│   │   ├── utils/
│   │   │   └── api.js          # API client
│   │   └── index.css           # Design system
│   └── index.html
├── DATABASE.md                  # Database schema documentation
└── package.json
```

## Performance

- Handles **unlimited conversations** with server-side aggregation
- Traditional analysis: ~100 conversations/second
- AI analysis: ~5-10 conversations/minute (depends on LLM provider)
- Efficient SQLite database with indexes for fast queries
- Optimized frontend with lazy loading and code splitting

## Database

The application uses SQLite with 11 tables:
- `conversations` - Conversation transcripts
- `liveperson_accounts` - LivePerson account credentials
- `analysis_results` - Traditional analysis results
- `ai_analysis_results` - AI analysis results with 30+ metrics
- `sentiment_trends` - Daily aggregated sentiment trends
- `ai_cost_tracking` - AI usage cost tracking
- `ai_settings` - AI configuration
- `ai_prompts` - Custom AI prompt templates
- `metrics` - General metrics storage
- `metric_configs` - Custom metric configurations
- `analysis_config` - Analysis algorithm configuration

See [DATABASE.md](./DATABASE.md) for complete schema documentation.

## Troubleshooting

**Backend won't start:**
- Ensure port 3000 is available
- Check Node.js version (18+)
- Verify all dependencies are installed
- Check for database migration errors

**Frontend can't connect to backend:**
- Ensure backend is running on port 3000
- Check CORS settings in `server.js`
- Verify API_BASE_URL in `client/src/utils/api.js`

**AI Analysis not working:**
- Verify API key is set in Settings tab or `.env` file
- Check AI provider selection (OpenAI vs Gemini)
- Monitor cost tracking to ensure budget limits aren't exceeded
- View browser console for error messages

**LivePerson fetch failing:**
- Verify OAuth credentials are correct
- Check account ID matches your LivePerson account
- Ensure date range is valid
- Check network connectivity to LivePerson API

## License

MIT

## Support

For issues or questions:
1. Check browser console for error messages
2. Review server logs for backend errors
3. Verify database schema with `sqlite3 transcripts.db .schema`
4. Check [DATABASE.md](./DATABASE.md) for schema documentation
5. Review [scripts/README.md](./scripts/README.md) for migration help
