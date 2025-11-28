import express from 'express';
import crypto from 'crypto';
import {
    createLPAccount,
    getAllLPAccounts,
    getActiveLPAccounts,
    getLPAccountById,
    updateLPAccount,
    deleteLPAccount,
    toggleLPAccountStatus,
    runQuery,
    getAll,
} from '../database.js';
import { fetchConversations, testConnection } from '../services/livepersonService.js';

const router = express.Router();

// Encryption key for credentials (use environment variable in production)
const ENCRYPTION_KEY = process.env.LP_ENCRYPTION_KEY || 'default-key-change-in-production-32b';
const ALGORITHM = 'aes-256-cbc';

/**
 * Encrypt sensitive data
 */
function encrypt(text) {
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt sensitive data
 */
function decrypt(encryptedText) {
    const [ivHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

/**
 * Mask sensitive data for display
 */
function maskSecret(secret) {
    if (!secret || secret.length < 8) return '****';
    return `****${secret.slice(-4)}`;
}

// =========================================
// LivePerson Account Management
// =========================================

/**
 * GET /api/liveperson/accounts
 * List all LivePerson accounts (with masked credentials)
 */
router.get('/accounts', async (req, res) => {
    try {
        const accounts = await getAllLPAccounts();

        // Mask sensitive data
        const maskedAccounts = accounts.map((account) => ({
            id: account.id,
            account_name: account.account_name,
            account_id: account.account_id,
            consumer_key: maskSecret(account.consumer_key),
            consumer_secret: maskSecret(account.consumer_secret),
            token: maskSecret(account.token),
            token_secret: maskSecret(account.token_secret),
            is_active: account.is_active,
            service_name: account.service_name || 'msgHist',
            api_version: account.api_version || '1.0',
            api_endpoint_path: account.api_endpoint_path || '/messaging_history/api/account/{accountId}/conversations/search',
            created_at: account.created_at,
            updated_at: account.updated_at,
        }));

        res.json(maskedAccounts);
    } catch (error) {
        console.error('Error fetching LP accounts:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/liveperson/accounts/active
 * List active LivePerson accounts
 */
router.get('/accounts/active', async (req, res) => {
    try {
        const accounts = await getActiveLPAccounts();

        const maskedAccounts = accounts.map((account) => ({
            id: account.id,
            account_name: account.account_name,
            account_id: account.account_id,
            is_active: account.is_active,
        }));

        res.json(maskedAccounts);
    } catch (error) {
        console.error('Error fetching active LP accounts:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/liveperson/accounts/:id
 * Get specific account (with masked credentials)
 */
router.get('/accounts/:id', async (req, res) => {
    try {
        const account = await getLPAccountById(req.params.id);

        if (!account) {
            return res.status(404).json({ error: 'Account not found' });
        }

        res.json({
            id: account.id,
            account_name: account.account_name,
            account_id: account.account_id,
            consumer_key: maskSecret(account.consumer_key),
            consumer_secret: maskSecret(account.consumer_secret),
            token: maskSecret(account.token),
            token_secret: maskSecret(account.token_secret),
            is_active: account.is_active,
            service_name: account.service_name || 'msgHist',
            api_version: account.api_version || '1.0',
            api_endpoint_path: account.api_endpoint_path || '/messaging_history/api/account/{accountId}/conversations/search',
            created_at: account.created_at,
            updated_at: account.updated_at,
        });
    } catch (error) {
        console.error('Error fetching LP account:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/liveperson/accounts
 * Create new LivePerson account
 */
router.post('/accounts', async (req, res) => {
    try {
        const { account_name, consumer_key, consumer_secret, token, token_secret, account_id } = req.body;

        // Validate required fields
        if (!account_name || !consumer_key || !consumer_secret || !token || !token_secret || !account_id) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Encrypt sensitive data
        const encryptedData = {
            account_name,
            consumer_key: encrypt(consumer_key),
            consumer_secret: encrypt(consumer_secret),
            token: encrypt(token),
            token_secret: encrypt(token_secret),
            account_id,
            service_name: req.body.service_name,
            api_version: req.body.api_version,
            api_endpoint_path: req.body.api_endpoint_path,
        };

        await createLPAccount(encryptedData);

        res.json({ success: true, message: 'Account created successfully' });
    } catch (error) {
        console.error('Error creating LP account:', error);

        if (error.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Account name already exists' });
        }

        res.status(500).json({ error: error.message });
    }
});

/**
 * PUT /api/liveperson/accounts/:id
 * Update LivePerson account
 */
router.put('/accounts/:id', async (req, res) => {
    try {
        const { account_name, consumer_key, consumer_secret, token, token_secret, account_id, is_active } = req.body;

        // Validate required fields
        if (!account_name || !account_id) {
            return res.status(400).json({ error: 'Account name and account ID are required' });
        }

        // Get existing account
        const existing = await getLPAccountById(req.params.id);
        if (!existing) {
            return res.status(404).json({ error: 'Account not found' });
        }

        // Only encrypt new values if provided, otherwise keep existing
        const updatedData = {
            account_name,
            consumer_key: consumer_key && !consumer_key.includes('****') ? encrypt(consumer_key) : existing.consumer_key,
            consumer_secret: consumer_secret && !consumer_secret.includes('****') ? encrypt(consumer_secret) : existing.consumer_secret,
            token: token && !token.includes('****') ? encrypt(token) : existing.token,
            token_secret: token_secret && !token_secret.includes('****') ? encrypt(token_secret) : existing.token_secret,
            account_id,
            is_active: is_active !== undefined ? is_active : existing.is_active,
            service_name: req.body.service_name !== undefined ? req.body.service_name : existing.service_name,
            api_version: req.body.api_version !== undefined ? req.body.api_version : existing.api_version,
            api_endpoint_path: req.body.api_endpoint_path !== undefined ? req.body.api_endpoint_path : existing.api_endpoint_path,
        };

        await updateLPAccount(req.params.id, updatedData);

        res.json({ success: true, message: 'Account updated successfully' });
    } catch (error) {
        console.error('Error updating LP account:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE /api/liveperson/accounts/:id
 * Delete LivePerson account
 */
router.delete('/accounts/:id', async (req, res) => {
    try {
        await deleteLPAccount(req.params.id);
        res.json({ success: true, message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Error deleting LP account:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/liveperson/accounts/:id/toggle
 * Toggle account active status
 */
router.post('/accounts/:id/toggle', async (req, res) => {
    try {
        const { is_active } = req.body;
        await toggleLPAccountStatus(req.params.id, is_active);
        res.json({ success: true, message: 'Account status updated' });
    } catch (error) {
        console.error('Error toggling account status:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/liveperson/accounts/:id/test
 * Test account credentials
 */
router.post('/accounts/:id/test', async (req, res) => {
    try {
        const account = await getLPAccountById(req.params.id);

        if (!account) {
            return res.status(404).json({ error: 'Account not found' });
        }

        // Decrypt credentials
        const credentials = {
            consumer_key: decrypt(account.consumer_key),
            consumer_secret: decrypt(account.consumer_secret),
            token: decrypt(account.token),
            token_secret: decrypt(account.token_secret),
            accountId: account.account_id,
        };

        const result = await testConnection(credentials);
        res.json(result);
    } catch (error) {
        console.error('Error testing connection:', error);
        res.json({
            success: false,
            message: error.message,
            timestamp: new Date().toISOString(),
        });
    }
});

// =========================================
// Conversation Fetching
// =========================================



/**
 * POST /api/liveperson/fetch-stream
 * Fetch conversations with real-time progress streaming (NDJSON)
 */
router.post('/fetch-stream', async (req, res) => {
    // Set headers for streaming
    res.setHeader('Content-Type', 'application/x-ndjson');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendEvent = (type, data) => {
        res.write(JSON.stringify({ type, ...data }) + '\n');
    };

    try {
        const { accountId, dateRange, status, skillIds, batchSize } = req.body;

        if (!accountId || !dateRange || !dateRange.from || !dateRange.to) {
            sendEvent('error', { message: 'Account ID and date range are required' });
            return res.end();
        }

        const account = await getLPAccountById(accountId);
        if (!account) {
            sendEvent('error', { message: 'Account not found' });
            return res.end();
        }

        if (!account.is_active) {
            sendEvent('error', { message: 'Account is not active' });
            return res.end();
        }

        const credentials = {
            consumer_key: decrypt(account.consumer_key),
            consumer_secret: decrypt(account.consumer_secret),
            token: decrypt(account.token),
            token_secret: decrypt(account.token_secret),
            accountId: account.account_id,
        };

        sendEvent('log', { message: 'Starting fetch...' });

        // Fetch with progress callback
        const conversations = await fetchConversations({
            credentials,
            serviceName: account.service_name,
            apiVersion: account.api_version,
            apiEndpointPath: account.api_endpoint_path,
            dateRange: {
                from: Number(dateRange.from),
                to: Number(dateRange.to),
            },
            status: status || ['CLOSE'],
            skillIds: skillIds || [],
            batchSize: batchSize || 20,
            onProgress: (current, total) => {
                sendEvent('progress', { current, total });
            }
        });

        sendEvent('log', { message: `Processing ${conversations.length} conversations...` });

        // Insert/Update logic
        let newCount = 0;
        let updatedCount = 0;

        for (let i = 0; i < conversations.length; i++) {
            const conv = conversations[i];
            const conversationId = `LP_${account.account_id}_${conv.external_id}`;

            // Check if conversation exists
            const existing = await getAll(
                'SELECT id FROM conversations WHERE conversation_id = ?',
                [conversationId]
            );

            if (existing.length > 0) {
                await runQuery(
                    `UPDATE conversations 
           SET transcript_details = ?, 
               conversation_date = ?, 
               fetched_at = CURRENT_TIMESTAMP,
               raw_lp_response = ?,
               message_count = ?
           WHERE conversation_id = ?`,
                    [conv.transcript_details, conv.conversation_date, conv.raw_response, conv.message_count, conversationId]
                );
                updatedCount++;
            } else {
                await runQuery(
                    `INSERT INTO conversations 
           (conversation_id, transcript_details, conversation_date, source, external_id, fetched_at, lp_account_id, raw_lp_response, message_count)
           VALUES (?, ?, ?, 'liveperson', ?, CURRENT_TIMESTAMP, ?, ?, ?)`,
                    [conversationId, conv.transcript_details, conv.conversation_date, conv.external_id, account.id, conv.raw_response, conv.message_count]
                );
                newCount++;
            }

            // Send saving progress every 10 items
            if ((i + 1) % 10 === 0 || i === conversations.length - 1) {
                sendEvent('saving', { current: i + 1, total: conversations.length });
            }
        }

        sendEvent('complete', {
            success: true,
            total: conversations.length,
            new: newCount,
            updated: updatedCount,
            message: `Fetched ${conversations.length} conversations (${newCount} new, ${updatedCount} updated)`
        });

        res.end();
    } catch (error) {
        console.error('Error in fetch stream:', error);
        sendEvent('error', { message: error.message });
        res.end();
    }
});

/**
 * POST /api/liveperson/fetch
 * Fetch conversations from LivePerson (Legacy/Simple)
 */
router.post('/fetch', async (req, res) => {
    try {
        const { accountId, dateRange, status, skillIds, batchSize } = req.body;

        // Validate inputs
        if (!accountId || !dateRange || !dateRange.from || !dateRange.to) {
            return res.status(400).json({ error: 'Account ID and date range are required' });
        }

        // Get account credentials
        const account = await getLPAccountById(accountId);
        if (!account) {
            return res.status(404).json({ error: 'Account not found' });
        }

        if (!account.is_active) {
            return res.status(400).json({ error: 'Account is not active' });
        }

        // Decrypt credentials
        const credentials = {
            consumer_key: decrypt(account.consumer_key),
            consumer_secret: decrypt(account.consumer_secret),
            token: decrypt(account.token),
            token_secret: decrypt(account.token_secret),
            accountId: account.account_id,
        };

        // Fetch conversations
        const conversations = await fetchConversations({
            credentials,
            serviceName: account.service_name,
            apiVersion: account.api_version,
            apiEndpointPath: account.api_endpoint_path,
            dateRange: {
                from: Number(dateRange.from),
                to: Number(dateRange.to),
            },
            status: status || ['CLOSE'],
            skillIds: skillIds || [],
            batchSize: batchSize || 20,
        });

        // Insert or update conversations in database
        let newCount = 0;
        let updatedCount = 0;

        for (const conv of conversations) {
            const conversationId = `LP_${account.account_id}_${conv.external_id}`;

            // Check if conversation exists
            const existing = await getAll(
                'SELECT id FROM conversations WHERE conversation_id = ?',
                [conversationId]
            );

            if (existing.length > 0) {
                // Update existing
                await runQuery(
                    `UPDATE conversations 
            SET transcript_details = ?, 
                conversation_date = ?, 
                fetched_at = CURRENT_TIMESTAMP,
                raw_lp_response = ?,
                message_count = ?
            WHERE conversation_id = ?`,
                    [conv.transcript_details, conv.conversation_date, conv.raw_response, conv.message_count, conversationId]
                );
                updatedCount++;
            } else {
                // Insert new
                await runQuery(
                    `INSERT INTO conversations 
            (conversation_id, transcript_details, conversation_date, source, external_id, fetched_at, lp_account_id, raw_lp_response, message_count)
            VALUES (?, ?, ?, 'liveperson', ?, CURRENT_TIMESTAMP, ?, ?, ?)`,
                    [conversationId, conv.transcript_details, conv.conversation_date, conv.external_id, account.id, conv.raw_response, conv.message_count]
                );
                newCount++;
            }
        }

        res.json({
            success: true,
            total: conversations.length,
            new: newCount,
            updated: updatedCount,
            message: `Fetched ${conversations.length} conversations (${newCount} new, ${updatedCount} updated)`,
        });
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ error: error.message });
    }
});

// =========================================
// CSV Export
// =========================================

/**
 * GET /api/liveperson/export-csv
 * Export LivePerson conversations to CSV
 */
router.get('/export-csv', async (req, res) => {
    try {
        const { dateRange, accountId, status } = req.query;

        let query = 'SELECT * FROM conversations WHERE source = ?';
        const params = ['liveperson'];

        // Add filters
        if (accountId) {
            query += ' AND lp_account_id = ?';
            params.push(accountId);
        }

        if (dateRange && dateRange !== 'all') {
            const days = parseInt(dateRange.replace('d', ''));
            query += ` AND fetched_at >= datetime('now', '-${days} days')`;
        }

        query += ' ORDER BY fetched_at DESC';

        const conversations = await getAll(query, params);

        if (conversations.length === 0) {
            return res.status(404).json({ error: 'No conversations found' });
        }

        // Convert to CSV
        const headers = [
            'Conversation ID',
            'External ID',
            'Source',
            'Date',
            'Transcript',
            'Fetched At',
            'LP Account ID',
            'Message Count'
        ];

        const escapeCSV = (value) => {
            if (value === null || value === undefined) return '';
            const str = String(value);
            if (str.includes(',') || str.includes('\n') || str.includes('"')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const csvRows = [headers.join(',')];

        for (const conv of conversations) {
            const row = [
                escapeCSV(conv.conversation_id),
                escapeCSV(conv.external_id),
                escapeCSV(conv.source),
                escapeCSV(conv.conversation_date),
                escapeCSV(conv.transcript_details),
                escapeCSV(conv.fetched_at),
                escapeCSV(conv.lp_account_id),
                escapeCSV(conv.message_count)
            ];
            csvRows.push(row.join(','));
        }

        const csv = csvRows.join('\n');

        // Set headers for CSV download
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="liveperson_conversations_${timestamp}.csv"`);

        // Add UTF-8 BOM for Excel compatibility
        res.send('\uFEFF' + csv);
    } catch (error) {
        console.error('Error exporting CSV:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
