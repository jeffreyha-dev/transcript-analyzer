# Transcript Analyzer

A comprehensive web application for analyzing consumer-agent conversation transcripts with AI-powered insights including sentiment analysis, topic extraction, performance metrics, and more.

![Transcript Analyzer](https://img.shields.io/badge/Node.js-18+-green) ![React](https://img.shields.io/badge/React-18+-blue) ![SQLite](https://img.shields.io/badge/SQLite-3-lightgrey)

## Features

### 📊 Comprehensive Analysis
- **Sentiment Analysis**: Overall and per-message sentiment scoring
- **Topic Extraction**: Automatic identification of key topics using TF-IDF
- **Keyword Extraction**: Most frequent and relevant terms
- **Performance Metrics**: Message counts, response times, conversation duration
- **Agent Performance Scoring**: Professionalism and effectiveness metrics
- **Customer Satisfaction Estimation**: Based on language patterns and indicators

### 🎨 Premium Web Interface
- **Interactive Dashboard**: Real-time statistics and visualizations
- **Drag & Drop Upload**: Easy file upload with progress tracking
- **Advanced Filtering**: Filter results by sentiment, date, and more
- **Export Functionality**: Download results in CSV or JSON format
- **Responsive Design**: Works beautifully on all devices

### 🚀 Technology Stack
- **Backend**: Node.js, Express, SQLite
- **Frontend**: React, Vite
- **Analysis**: Natural (NLP), Sentiment Analysis
- **Design**: Modern glassmorphism with vibrant gradients

## Installation

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

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

## Running the Application

### Start the Backend Server
```bash
npm start
```
The API server will start on `http://localhost:3000`

### Start the Frontend (in a new terminal)
```bash
cd client
npm run dev
```
The web app will be available at `http://localhost:5173`

## Usage

### 1. Upload Conversations

Navigate to the **Upload** tab and upload your conversation transcripts in one of these formats:

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

**Text Format:**
```
conversation_id: conv_001
date: 2025-11-26
Agent: Hello, how can I help you today?
Customer: I have a question about my order...

conversation_id: conv_002
date: 2025-11-26
Agent: Good morning!
Customer: Hi, I need assistance...
```

### 2. Run Analysis

Go to the **Analysis** tab and click "Run Analysis" to process all uploaded conversations. The system will:
- Analyze sentiment (positive, negative, neutral)
- Extract key topics and keywords
- Calculate performance metrics
- Score agent performance
- Estimate customer satisfaction

### 3. View Dashboard

The **Dashboard** provides an overview with:
- Total conversations and analysis count
- Average sentiment scores
- Sentiment distribution charts
- Top topics cloud
- Recent conversations table

### 4. Export Results

Use the **Export** tab to download analysis results in:
- **JSON**: Structured data for programmatic access
- **CSV**: Spreadsheet-compatible for Excel/Google Sheets

## API Documentation

### Conversations Endpoints

- `POST /api/conversations/upload` - Upload file with conversations
- `POST /api/conversations/bulk` - Bulk upload via JSON
- `GET /api/conversations` - List all conversations (paginated)
- `GET /api/conversations/:id` - Get specific conversation
- `DELETE /api/conversations/:id` - Delete conversation

### Analysis Endpoints

- `POST /api/analysis/run` - Run analysis on conversations
- `GET /api/analysis/results` - Get analysis results (with filters)
- `GET /api/analysis/dashboard` - Get dashboard metrics
- `GET /api/analysis/export?format=json|csv` - Export results

## Sample Data

Create a file `sample_conversations.json`:

```json
[
  {
    "conversation_id": "conv_001",
    "conversation_date": "2025-11-26",
    "transcript_details": "Agent: Hello! How can I assist you today?\nCustomer: Hi, I'm having trouble with my recent order.\nAgent: I apologize for the inconvenience. Let me help you with that.\nCustomer: Thank you, I appreciate your help."
  },
  {
    "conversation_id": "conv_002",
    "conversation_date": "2025-11-26",
    "transcript_details": "Agent: Good morning! What can I do for you?\nCustomer: I need to return an item.\nAgent: Certainly! I can help you process that return.\nCustomer: Great, thanks!"
  }
]
```

Upload this file through the web interface to test the system.

## Architecture

```
transcript-analyzer/
├── server.js              # Express server
├── database.js            # SQLite database setup
├── analyzer.js            # Analysis engine
├── routes/
│   ├── conversations.js   # Conversation endpoints
│   └── analysis.js        # Analysis endpoints
├── client/
│   ├── src/
│   │   ├── App.jsx        # Main app component
│   │   ├── components/    # React components
│   │   ├── utils/         # API client
│   │   └── index.css      # Design system
│   └── index.html
└── package.json
```

## Performance

- Handles **500+ conversations per analysis run**
- Real-time analysis with NLP processing
- Efficient SQLite database for fast queries
- Optimized frontend with lazy loading

## Troubleshooting

**Backend won't start:**
- Ensure port 3000 is available
- Check Node.js version (18+)
- Verify all dependencies are installed

**Frontend can't connect to backend:**
- Ensure backend is running on port 3000
- Check CORS settings in `server.js`
- Verify API_BASE_URL in `client/src/utils/api.js`

**Analysis not working:**
- Ensure conversations are uploaded first
- Check transcript format matches expected structure
- View browser console for error messages

## License

MIT

## Support

For issues or questions, please check the console logs for detailed error messages.
