import express from 'express';
import { getAll, getOne, runQuery } from '../database.js';

const router = express.Router();

// Get all analysis configs
router.get('/', async (req, res) => {
    try {
        const configs = await getAll('SELECT * FROM analysis_config');

        // Parse config values and group by type
        const parsed = {};
        configs.forEach(config => {
            parsed[config.config_key] = JSON.parse(config.config_value);
        });

        res.json(parsed);
    } catch (error) {
        console.error('Error fetching analysis configs:', error);
        res.status(500).json({ error: 'Failed to fetch analysis configs' });
    }
});

// Get config by type
router.get('/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const configs = await getAll('SELECT * FROM analysis_config WHERE config_type = ?', [type]);

        const parsed = {};
        configs.forEach(config => {
            parsed[config.config_key] = JSON.parse(config.config_value);
        });

        res.json(parsed);
    } catch (error) {
        console.error('Error fetching analysis config:', error);
        res.status(500).json({ error: 'Failed to fetch analysis config' });
    }
});

// Update config
router.put('/', async (req, res) => {
    try {
        const updates = req.body; // { config_key: value, ... }

        for (const [key, value] of Object.entries(updates)) {
            const valueJson = JSON.stringify(value);
            await runQuery(
                `UPDATE analysis_config SET config_value = ?, updated_at = CURRENT_TIMESTAMP WHERE config_key = ?`,
                [valueJson, key]
            );
        }

        res.json({ message: 'Analysis config updated successfully' });
    } catch (error) {
        console.error('Error updating analysis config:', error);
        res.status(500).json({ error: 'Failed to update analysis config' });
    }
});

// Reset to defaults
router.post('/reset', async (req, res) => {
    try {
        // Delete all configs
        await runQuery('DELETE FROM analysis_config');

        // Re-seed defaults
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
                `INSERT INTO analysis_config (config_key, config_value, config_type) VALUES (?, ?, ?)`,
                [config.key, config.value, config.type]
            );
        }

        res.json({ message: 'Analysis config reset to defaults' });
    } catch (error) {
        console.error('Error resetting analysis config:', error);
        res.status(500).json({ error: 'Failed to reset analysis config' });
    }
});

export default router;
