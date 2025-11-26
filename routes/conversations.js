import express from 'express';
import multer from 'multer';
import { runQuery, getAll, getOne } from '../database.js';
import { promises as fs } from 'fs';
import { parse } from 'csv-parse/sync';

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
        const fieldMapping = req.body.fieldMapping ? JSON.parse(req.body.fieldMapping) : null;

        // Parse conversations
        let conversations = [];

        // Try JSON format first
        try {
            const jsonData = JSON.parse(fileContent);
            conversations = Array.isArray(jsonData) ? jsonData : [jsonData];
        } catch (e) {
            // Try CSV format
            try {
                // Heuristic: check if it looks like CSV (has commas and newlines)
                // But we can just try parsing
                const records = parse(fileContent, {
                    columns: true,
                    skip_empty_lines: true,
                    relax_quotes: true
                });

                if (records.length > 0) {
                    conversations = records;
                } else {
                    throw new Error('No records found');
                }
            } catch (csvError) {
                // Fallback to text format
                conversations = parseTextFormat(fileContent, fieldMapping);
            }
        }

        // Insert conversations into database
        let inserted = 0;
        let errors = [];

        for (const conv of conversations) {
            try {
                // Apply mapping if provided, otherwise use default keys
                const mapping = fieldMapping || {
                    id: 'conversation_id',
                    transcript: 'transcript_details',
                    date: 'conversation_date'
                };

                // Helper to get value from object using mapped key
                const getValue = (obj, key) => {
                    if (!key) return null;
                    return obj[key] || obj[key.toLowerCase()] || null;
                };

                // Extract values using mapping
                // For default mapping, we also check fallback keys (e.g. 'date' for conversation_date)
                let conversationId, transcriptDetails, conversationDate;

                if (fieldMapping) {
                    conversationId = getValue(conv, mapping.id);
                    transcriptDetails = getValue(conv, mapping.transcript);
                    conversationDate = getValue(conv, mapping.date);
                } else {
                    // Default behavior with fallbacks
                    conversationId = conv.conversation_id;
                    transcriptDetails = conv.transcript_details;
                    conversationDate = conv.conversation_date || conv.date;
                }

                // Generate ID if missing
                if (!conversationId) {
                    conversationId = `conv_${Date.now()}_${inserted}`;
                }

                // Ensure transcript is string
                if (typeof transcriptDetails !== 'string') {
                    transcriptDetails = JSON.stringify(transcriptDetails);
                }

                await runQuery(
                    `INSERT INTO conversations (conversation_id, transcript_details, conversation_date) 
           VALUES (?, ?, ?)`,
                    [conversationId, transcriptDetails, conversationDate]
                );
                inserted++;
            } catch (err) {
                errors.push({ conversation: conv.conversation_id || 'unknown', error: err.message });
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
        const { conversations, fieldMapping } = req.body;

        if (!conversations || !Array.isArray(conversations)) {
            return res.status(400).json({ error: 'Invalid format. Expected { conversations: [...] }' });
        }

        let inserted = 0;
        let errors = [];

        for (const conv of conversations) {
            try {
                // Apply mapping if provided, otherwise use default keys
                const mapping = fieldMapping || {
                    id: 'conversation_id',
                    transcript: 'transcript_details',
                    date: 'conversation_date'
                };

                // Helper to get value from object using mapped key
                const getValue = (obj, key) => {
                    if (!key) return null;
                    return obj[key] || obj[key.toLowerCase()] || null;
                };

                // Extract values using mapping
                let conversationId, transcriptDetails, conversationDate;

                if (fieldMapping) {
                    conversationId = getValue(conv, mapping.id);
                    transcriptDetails = getValue(conv, mapping.transcript);
                    conversationDate = getValue(conv, mapping.date);
                } else {
                    // Default behavior with fallbacks
                    conversationId = conv.conversation_id;
                    transcriptDetails = conv.transcript_details;
                    conversationDate = conv.conversation_date || conv.date;
                }

                // Generate ID if missing
                if (!conversationId) {
                    conversationId = `conv_${Date.now()}_${inserted}`;
                }

                // Ensure transcript is string
                if (typeof transcriptDetails !== 'string') {
                    transcriptDetails = JSON.stringify(transcriptDetails);
                }

                await runQuery(
                    `INSERT INTO conversations (conversation_id, transcript_details, conversation_date) 
           VALUES (?, ?, ?)`,
                    [conversationId, transcriptDetails, conversationDate]
                );
                inserted++;
            } catch (err) {
                errors.push({ conversation: conv.conversation_id || 'unknown', error: err.message });
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
/**
 * Helper: Parse text format conversations
 */
function parseTextFormat(text, fieldMapping = null) {
    const conversations = [];

    // Split by common delimiters
    const sections = text.split(/\n\s*\n/).filter(s => s.trim());

    for (const section of sections) {
        const lines = section.split('\n');
        let conversationId = null;
        let conversationDate = null;
        let transcript = [];

        // Determine keys to look for
        const idKey = fieldMapping?.id || 'conversation_id';
        const dateKey = fieldMapping?.date || 'date';

        // Create regex for dynamic keys
        // Escape special regex characters in keys
        const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const idRegex = new RegExp(`^${escapeRegex(idKey)}[:\\s]+(.+)`, 'i');
        const dateRegex = new RegExp(`^${escapeRegex(dateKey)}[:\\s]+(.+)`, 'i');

        for (const line of lines) {
            // Look for conversation_id (or mapped key)
            const idMatch = line.match(idRegex);
            if (idMatch) {
                conversationId = idMatch[1].trim();
                continue;
            }

            // Look for date (or mapped key)
            const dateMatch = line.match(dateRegex);
            if (dateMatch) {
                conversationDate = dateMatch[1].trim();
                continue;
            }

            // Otherwise, it's part of the transcript
            if (line.trim()) {
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
