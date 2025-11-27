import express from 'express';
import { getAll, getOne, runQuery } from '../database.js';
import llmService from '../llmService.js';

const router = express.Router();

// Get all prompts
router.get('/', async (req, res) => {
    try {
        const prompts = await getAll('SELECT * FROM ai_prompts ORDER BY created_at DESC');
        res.json(prompts);
    } catch (error) {
        console.error('Error fetching prompts:', error);
        res.status(500).json({ error: 'Failed to fetch prompts' });
    }
});

// Get active prompt
router.get('/active', async (req, res) => {
    try {
        const prompt = await getOne('SELECT * FROM ai_prompts WHERE is_active = 1');
        if (!prompt) {
            return res.status(404).json({ error: 'No active prompt found' });
        }
        res.json(prompt);
    } catch (error) {
        console.error('Error fetching active prompt:', error);
        res.status(500).json({ error: 'Failed to fetch active prompt' });
    }
});

// Create new prompt
router.post('/', async (req, res) => {
    try {
        const { name, description, template } = req.body;

        if (!name || !template) {
            return res.status(400).json({ error: 'Name and template are required' });
        }

        const result = await runQuery(
            `INSERT INTO ai_prompts (name, description, template, is_active, is_default)
             VALUES (?, ?, ?, 0, 0)`,
            [name, description, template]
        );

        res.json({ id: result.lastID, message: 'Prompt created successfully' });
    } catch (error) {
        console.error('Error creating prompt:', error);
        res.status(500).json({ error: 'Failed to create prompt' });
    }
});

// Update prompt
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, template } = req.body;

        await runQuery(
            `UPDATE ai_prompts 
             SET name = ?, description = ?, template = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [name, description, template, id]
        );

        res.json({ message: 'Prompt updated successfully' });
    } catch (error) {
        console.error('Error updating prompt:', error);
        res.status(500).json({ error: 'Failed to update prompt' });
    }
});

// Activate prompt
router.post('/:id/activate', async (req, res) => {
    try {
        const { id } = req.params;

        // Deactivate all prompts
        await runQuery('UPDATE ai_prompts SET is_active = 0');

        // Activate selected prompt
        await runQuery('UPDATE ai_prompts SET is_active = 1 WHERE id = ?', [id]);

        res.json({ message: 'Prompt activated successfully' });
    } catch (error) {
        console.error('Error activating prompt:', error);
        res.status(500).json({ error: 'Failed to activate prompt' });
    }
});

// Reset to default
router.post('/reset', async (req, res) => {
    try {
        // Deactivate all
        await runQuery('UPDATE ai_prompts SET is_active = 0');

        // Activate default
        await runQuery('UPDATE ai_prompts SET is_active = 1 WHERE is_default = 1');

        res.json({ message: 'Reset to default prompt' });
    } catch (error) {
        console.error('Error resetting prompt:', error);
        res.status(500).json({ error: 'Failed to reset prompt' });
    }
});

// Generate prompt template
router.post('/generate', async (req, res) => {
    try {
        const { description } = req.body;

        if (!description) {
            return res.status(400).json({ error: 'Description is required' });
        }

        const metaPrompt = `You are an expert prompt engineer. Create a detailed prompt template for analyzing customer service transcripts based on the following user description:

User Description: "${description}"

Requirements:
1. The prompt MUST include the placeholder {{TRANSCRIPT}} where the conversation text will be inserted.
2. The prompt MUST instruct the AI to respond in valid JSON format only.
3. The prompt MUST define a clear JSON structure for the response.
4. Include fields that match the user's description.
5. Do not include any explanation, only the prompt text itself.

Example Output Format:
Analyze this conversation...
Conversation: {{TRANSCRIPT}}
Respond in JSON:
{
  "field1": "description",
  "field2": "description"
}`;

        const response = await llmService.analyze(metaPrompt, {
            temperature: 0.7,
            max_tokens: 2000
        });

        res.json({ template: response.content });
    } catch (error) {
        console.error('Error generating prompt:', error);
        res.status(500).json({ error: 'Failed to generate prompt' });
    }
});

export default router;
