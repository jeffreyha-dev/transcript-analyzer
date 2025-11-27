import express from 'express';
import { getHeatmapData, getTopicClusters } from '../database.js';

const router = express.Router();

// GET /api/analytics/heatmap
router.get('/heatmap', async (req, res) => {
    try {
        const { dateRange, sentimentFilter } = req.query;
        const data = await getHeatmapData(dateRange, sentimentFilter);
        res.json(data);
    } catch (error) {
        console.error('Error fetching heatmap data:', error);
        res.status(500).json({ error: 'Failed to fetch heatmap data' });
    }
});

// GET /api/analytics/topics
router.get('/topics', async (req, res) => {
    try {
        const { dateRange, sentimentFilter } = req.query;
        const data = await getTopicClusters(dateRange, sentimentFilter);
        res.json(data);
    } catch (error) {
        console.error('Error fetching topic clusters:', error);
        res.status(500).json({ error: 'Failed to fetch topic clusters' });
    }
});

export default router;
