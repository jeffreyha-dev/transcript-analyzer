import express from 'express';
import { getAll, getOne, runQuery } from '../database.js';

const router = express.Router();

// Get all metric configs
router.get('/', async (req, res) => {
    try {
        const configs = await getAll('SELECT * FROM metric_configs ORDER BY metric_name');

        // Parse color_thresholds JSON
        const parsed = configs.map(config => ({
            ...config,
            color_thresholds: JSON.parse(config.color_thresholds || '[]')
        }));

        res.json(parsed);
    } catch (error) {
        console.error('Error fetching metric configs:', error);
        res.status(500).json({ error: 'Failed to fetch metric configs' });
    }
});

// Get specific metric config
router.get('/:name', async (req, res) => {
    try {
        const { name } = req.params;
        const config = await getOne('SELECT * FROM metric_configs WHERE metric_name = ?', [name]);

        if (!config) {
            return res.status(404).json({ error: 'Metric config not found' });
        }

        res.json({
            ...config,
            color_thresholds: JSON.parse(config.color_thresholds || '[]')
        });
    } catch (error) {
        console.error('Error fetching metric config:', error);
        res.status(500).json({ error: 'Failed to fetch metric config' });
    }
});

// Create or update metric config
router.post('/', async (req, res) => {
    try {
        const { metric_name, min_value, max_value, reverse_scale, color_thresholds } = req.body;

        if (!metric_name || min_value === undefined || max_value === undefined) {
            return res.status(400).json({ error: 'metric_name, min_value, and max_value are required' });
        }

        const thresholdsJson = JSON.stringify(color_thresholds || []);

        await runQuery(
            `INSERT INTO metric_configs (metric_name, min_value, max_value, reverse_scale, color_thresholds)
             VALUES (?, ?, ?, ?, ?)
             ON CONFLICT(metric_name) DO UPDATE SET
             min_value = excluded.min_value,
             max_value = excluded.max_value,
             reverse_scale = excluded.reverse_scale,
             color_thresholds = excluded.color_thresholds`,
            [metric_name, min_value, max_value, reverse_scale ? 1 : 0, thresholdsJson]
        );

        res.json({ message: 'Metric config saved successfully' });
    } catch (error) {
        console.error('Error saving metric config:', error);
        res.status(500).json({ error: 'Failed to save metric config' });
    }
});

// Delete metric config
router.delete('/:name', async (req, res) => {
    try {
        const { name } = req.params;
        await runQuery('DELETE FROM metric_configs WHERE metric_name = ?', [name]);
        res.json({ message: 'Metric config deleted successfully' });
    } catch (error) {
        console.error('Error deleting metric config:', error);
        res.status(500).json({ error: 'Failed to delete metric config' });
    }
});

export default router;
