import express from 'express';
import {
    createLPAccount,
    getAllLPAccounts,
    getActiveLPAccounts,
    getLPAccountById,
    updateLPAccount,
    deleteLPAccount,
    toggleLPAccountStatus
} from '../database.js';
import { fetchLivePersonConversations, testLivePersonConnection } from '../services/livepersonService.js';

const router = express.Router();

// Get all LivePerson accounts
router.get('/accounts', async (req, res) => {
    try {
        const accounts = await getAllLPAccounts();
        res.json(accounts);
    } catch (error) {
        console.error('Error fetching LP accounts:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get active LivePerson accounts
router.get('/accounts/active', async (req, res) => {
    try {
        const accounts = await getActiveLPAccounts();
        res.json(accounts);
    } catch (error) {
        console.error('Error fetching active LP accounts:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get single LivePerson account
router.get('/accounts/:id', async (req, res) => {
    try {
        const account = await getLPAccountById(req.params.id);
        if (!account) {
            return res.status(404).json({ error: 'Account not found' });
        }
        res.json(account);
    } catch (error) {
        console.error('Error fetching LP account:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create new LivePerson account
router.post('/accounts', async (req, res) => {
    try {
        const result = await createLPAccount(req.body);
        res.status(201).json({
            message: 'LivePerson account created successfully',
            id: result.lastID
        });
    } catch (error) {
        console.error('Error creating LP account:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update LivePerson account
router.put('/accounts/:id', async (req, res) => {
    try {
        await updateLPAccount(req.params.id, req.body);
        res.json({ message: 'LivePerson account updated successfully' });
    } catch (error) {
        console.error('Error updating LP account:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete LivePerson account
router.delete('/accounts/:id', async (req, res) => {
    try {
        await deleteLPAccount(req.params.id);
        res.json({ message: 'LivePerson account deleted successfully' });
    } catch (error) {
        console.error('Error deleting LP account:', error);
        res.status(500).json({ error: error.message });
    }
});

// Toggle account active status
router.post('/accounts/:id/toggle', async (req, res) => {
    try {
        const { is_active } = req.body;
        await toggleLPAccountStatus(req.params.id, is_active);
        res.json({ message: 'Account status updated successfully' });
    } catch (error) {
        console.error('Error toggling LP account status:', error);
        res.status(500).json({ error: error.message });
    }
});

// Test LivePerson connection
router.post('/accounts/:id/test', async (req, res) => {
    try {
        const account = await getLPAccountById(req.params.id);
        if (!account) {
            return res.status(404).json({ error: 'Account not found' });
        }

        const result = await testLivePersonConnection(account);
        res.json(result);
    } catch (error) {
        console.error('Error testing LP connection:', error);
        res.status(500).json({ error: error.message });
    }
});

// Fetch conversations from LivePerson
router.post('/fetch', async (req, res) => {
    try {
        const { accountId, startDate, endDate, limit } = req.body;

        if (!accountId) {
            return res.status(400).json({ error: 'Account ID is required' });
        }

        const account = await getLPAccountById(accountId);
        if (!account) {
            return res.status(404).json({ error: 'Account not found' });
        }

        if (!account.is_active) {
            return res.status(400).json({ error: 'Account is not active' });
        }

        const result = await fetchLivePersonConversations(account, {
            startDate,
            endDate,
            limit: limit || 100
        });

        res.json(result);
    } catch (error) {
        console.error('Error fetching LP conversations:', error);
        res.status(500).json({ error: error.message });
    }
});

// Export conversations to CSV
router.get('/export', async (req, res) => {
    try {
        const { accountId, startDate, endDate, status } = req.query;

        if (!accountId) {
            return res.status(400).json({ error: 'Account ID is required' });
        }

        // Build query
        let query = `
            SELECT 
                conversation_id,
                conversation_date,
                duration_minutes,
                message_count,
                source,
                external_id,
                transcript_details,
                raw_lp_response
            FROM conversations 
            WHERE lp_account_id = ? 
            AND source = 'liveperson'
        `;

        const params = [accountId];

        if (startDate) {
            query += ` AND conversation_date >= ?`;
            params.push(startDate);
        }

        if (endDate) {
            query += ` AND conversation_date <= ?`;
            params.push(endDate);
        }

        // Note: Status is stored in raw_lp_response, so we might need to filter in JS or extract it
        // For now, let's fetch and filter if needed, or rely on the fact that we usually fetch by status

        const conversations = await new Promise((resolve, reject) => {
            db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        // Filter by status if provided (since it's inside the JSON)
        let filteredConversations = conversations;
        if (status) {
            filteredConversations = conversations.filter(c => {
                try {
                    const raw = JSON.parse(c.raw_lp_response);
                    return raw.info?.status === status;
                } catch (e) {
                    return false;
                }
            });
        }

        // Generate CSV
        const csvHeader = 'Conversation ID,Date,Duration (min),Messages,Status,Agent,Customer,Transcript\n';
        const csvRows = filteredConversations.map(c => {
            let status = 'UNKNOWN';
            let agent = 'Unknown';
            let customer = 'Unknown';

            try {
                const raw = JSON.parse(c.raw_lp_response);
                status = raw.info?.status || 'UNKNOWN';
                agent = raw.info?.latestAgentNickname || 'Unknown';
                customer = raw.info?.visitorId || 'Unknown';
            } catch (e) {
                // Ignore parsing errors
            }

            // Escape fields for CSV
            const escape = (field) => {
                if (field === null || field === undefined) return '';
                const stringField = String(field);
                if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
                    return `"${stringField.replace(/"/g, '""')}"`;
                }
                return stringField;
            };

            return [
                escape(c.external_id || c.conversation_id),
                escape(c.conversation_date),
                escape(c.duration_minutes ? c.duration_minutes.toFixed(2) : '0'),
                escape(c.message_count),
                escape(status),
                escape(agent),
                escape(customer),
                escape(c.transcript_details)
            ].join(',');
        });

        const csvContent = csvHeader + csvRows.join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=conversations_${accountId}_${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csvContent);

    } catch (error) {
        console.error('Error exporting CSV:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
