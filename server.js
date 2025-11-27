import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './database.js';
import conversationsRouter from './routes/conversations.js';
import analysisRouter from './routes/analysis.js';
import aiAnalysisRouter from './routes/aiAnalysis.js';
import settingsRouter from './routes/settings.js';
import promptsRouter from './routes/prompts.js';
import metricConfigsRouter from './routes/metricConfigs.js';
import analysisConfigRouter from './routes/analysisConfig.js';
import analyticsRouter from './routes/analytics.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API Routes
app.use('/api/conversations', conversationsRouter);
app.use('/api/analysis', analysisRouter);
app.use('/api/ai-analysis', aiAnalysisRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/prompts', promptsRouter);
app.use('/api/metric-configs', metricConfigsRouter);
app.use('/api/analysis-config', analysisConfigRouter);
app.use('/api/analytics', analyticsRouter);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'Transcript Analyzer API',
        version: '1.0.0',
        endpoints: {
            conversations: '/api/conversations',
            analysis: '/api/analysis',
            aiAnalysis: '/api/ai-analysis',
            health: '/api/health'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

// Initialize database and start server
async function startServer() {
    try {
        await initializeDatabase();

        // Initialize AI Config
        const { default: llmService } = await import('./llmService.js');
        await llmService.reloadConfig();

        app.listen(PORT, () => {
            console.log(`\n🚀 Transcript Analyzer Server running on http://localhost:${PORT}`);
            console.log(`📊 API Documentation: http://localhost:${PORT}/`);
            console.log(`💚 Health Check: http://localhost:${PORT}/api/health\n`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
