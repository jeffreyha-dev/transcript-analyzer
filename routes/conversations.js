import express from 'express';
import multer from 'multer';
import { runQuery, getAll, getOne } from '../database.js';
import { promises as fs } from 'fs';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

/**
 * POST /api/conversations/upload
 * Upload conversations in bulk (text or JSON format)
 */
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Read file content
        const fileContent = await fs.readFile(req.file.path, 'utf-8');

        // Parse conversations
        let conversations = [];

        // Try JSON format first
        try {
            const jsonData = JSON.parse(fileContent);
            conversations = Array.isArray(jsonData) ? jsonData : [jsonData];
        } catch (e) {
            // Parse as text format (one conversation per section, separated by blank lines or delimiters)
            conversations = parseTextFormat(fileContent);
        }

        // Insert conversations into database
        let inserted = 0;
        let errors = [];

        for (const conv of conversations) {
            try {
                const conversationId = conv.conversation_id || `conv_${Date.now()}_${inserted}`;
                const transcriptDetails = typeof conv.transcript_details === 'string'
                    ? conv.transcript_details
                    : JSON.stringify(conv.transcript_details);
                const conversationDate = conv.conversation_date || conv.date || null;

                await runQuery(
                    `INSERT INTO conversations (conversation_id, transcript_details, conversation_date) 
           VALUES (?, ?, ?)`,
                    [conversationId, transcriptDetails, conversationDate]
                );
                inserted++;
            } catch (err) {
                errors.push({ conversation: conv.conversation_id, error: err.message });
            }
        }

        // Clean up uploaded file
        await fs.unlink(req.file.path);

        res.json({
            success: true,
            inserted,
            total: conversations.length,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/conversations/bulk
 * Upload conversations via JSON body
 */
router.post('/bulk', async (req, res) => {
    try {
        const { conversations } = req.body;

        if (!conversations || !Array.isArray(conversations)) {
            return res.status(400).json({ error: 'Invalid format. Expected { conversations: [...] }' });
        }

        let inserted = 0;
        let errors = [];

        for (const conv of conversations) {
            try {
                const conversationId = conv.conversation_id || `conv_${Date.now()}_${inserted}`;
                const transcriptDetails = typeof conv.transcript_details === 'string'
                    ? conv.transcript_details
                    : JSON.stringify(conv.transcript_details);
                const conversationDate = conv.conversation_date || conv.date || null;

                await runQuery(
                    `INSERT INTO conversations (conversation_id, transcript_details, conversation_date) 
           VALUES (?, ?, ?)`,
                    [conversationId, transcriptDetails, conversationDate]
                );
                inserted++;
            } catch (err) {
                errors.push({ conversation: conv.conversation_id, error: err.message });
            }
        }

        res.json({
            success: true,
            inserted,
            total: conversations.length,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error('Bulk upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/conversations
 * List all conversations with pagination
 */
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;

        const conversations = await getAll(
            `SELECT id, conversation_id, conversation_date, uploaded_at, message_count 
       FROM conversations 
       ORDER BY uploaded_at DESC 
       LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        const totalResult = await getOne('SELECT COUNT(*) as total FROM conversations');
        const total = totalResult.total;

        res.json({
            conversations,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('List error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/conversations/:id
 * Get specific conversation details
 */
router.get('/:id', async (req, res) => {
    try {
        const conversation = await getOne(
            'SELECT * FROM conversations WHERE conversation_id = ?',
            [req.params.id]
        );

        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        // Get analysis results if available
        const analysis = await getOne(
            'SELECT * FROM analysis_results WHERE conversation_id = ?',
            [req.params.id]
        );

        res.json({
            conversation,
            analysis
        });

    } catch (error) {
        console.error('Get conversation error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE /api/conversations/:id
 * Delete a conversation
 */
router.delete('/:id', async (req, res) => {
    try {
        const result = await runQuery(
            'DELETE FROM conversations WHERE conversation_id = ?',
            [req.params.id]
        );

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        res.json({ success: true, deleted: req.params.id });

    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Helper: Parse text format conversations
 */
function parseTextFormat(text) {
    const conversations = [];

    // Split by common delimiters
    const sections = text.split(/\n\s*\n/).filter(s => s.trim());

    for (const section of sections) {
        const lines = section.split('\n');
        let conversationId = null;
        let conversationDate = null;
        let transcript = [];

        for (const line of lines) {
            // Look for conversation_id
            if (line.match(/conversation_id[:\s]+(.+)/i)) {
                conversationId = line.match(/conversation_id[:\s]+(.+)/i)[1].trim();
            }
            // Look for date
            else if (line.match(/date[:\s]+(.+)/i)) {
                conversationDate = line.match(/date[:\s]+(.+)/i)[1].trim();
            }
            // Otherwise, it's part of the transcript
            else if (line.trim()) {
                transcript.push(line.trim());
            }
        }

        if (transcript.length > 0) {
            conversations.push({
                conversation_id: conversationId || `conv_${Date.now()}_${conversations.length}`,
                conversation_date: conversationDate,
                transcript_details: transcript.join('\n')
            });
        }
    }

    return conversations;
}

export default router;
