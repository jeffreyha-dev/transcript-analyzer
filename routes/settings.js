import express from 'express';
import { getAll, runQuery } from '../database.js';
import llmService from '../llmService.js';

const router = express.Router();

// Get all settings
router.get('/', async (req, res) => {
    try {
        const settings = await getAll('SELECT * FROM ai_settings');

        // Convert array of {setting_key, setting_value} to object
        const config = {};
        settings.forEach(s => {
            config[s.setting_key] = s.setting_value;
        });

        // If DB is empty, return current llmService config (which might be from .env)
        if (Object.keys(config).length === 0) {
            // We need to expose the internal config for the initial load if DB is empty
            // This allows the frontend to populate the form with .env defaults
            const defaults = {
                AI_ENABLED: String(llmService.config.enabled),
                AI_PRIMARY_PROVIDER: llmService.config.primaryProvider,
                AI_FALLBACK_ENABLED: String(llmService.config.fallbackEnabled),
                AI_MONTHLY_BUDGET: String(llmService.config.monthlyBudget),
                AI_COST_ALERT_THRESHOLD: String(llmService.config.costAlertThreshold),
                OLLAMA_BASE_URL: llmService.ollama?.config?.host || 'http://localhost:11434',
                OLLAMA_MODEL: llmService.ollamaModel,
                OPENAI_MODEL: llmService.openaiModel,
                GEMINI_MODEL: llmService.geminiModel,
                // Don't send API keys for security, or send masked?
                // For this app, we'll send them so they can be edited, but in a real app we might mask them.
                // Since this is a local tool, it's acceptable.
                OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
                GEMINI_API_KEY: process.env.GEMINI_API_KEY || ''
            };
            return res.json(defaults);
        }

        res.json(config);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// Update settings
router.put('/', async (req, res) => {
    try {
        const newSettings = req.body;

        // Validate required fields (basic)
        if (!newSettings) {
            return res.status(400).json({ error: 'No settings provided' });
        }

        // Save to DB
        // We use REPLACE INTO or INSERT ON CONFLICT to update
        const updates = Object.entries(newSettings).map(([key, value]) => {
            return runQuery(
                `INSERT INTO ai_settings (setting_key, setting_value, updated_at) 
                 VALUES (?, ?, CURRENT_TIMESTAMP) 
                 ON CONFLICT(setting_key) DO UPDATE SET 
                 setting_value = excluded.setting_value, 
                 updated_at = CURRENT_TIMESTAMP`,
                [key, String(value)]
            );
        });

        await Promise.all(updates);

        // Reload LLM Service
        await llmService.reloadConfig();

        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

export default router;
