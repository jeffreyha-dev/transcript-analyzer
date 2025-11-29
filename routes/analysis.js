import express from 'express';
import { TranscriptAnalyzer } from '../analyzer.js';
import { runQuery, getAll, getOne } from '../database.js';

const router = express.Router();
const analyzer = new TranscriptAnalyzer();

/**
 * POST /api/analysis/run
 * Run analysis on uploaded conversations
 */
router.post('/run', async (req, res) => {
    try {
        const { conversation_ids } = req.body;

        // If no specific IDs provided, analyze all unanalyzed conversations
        let conversations;
        if (conversation_ids && Array.isArray(conversation_ids)) {
            const placeholders = conversation_ids.map(() => '?').join(',');
            conversations = await getAll(
                `SELECT * FROM conversations WHERE conversation_id IN (${placeholders})`,
                conversation_ids
            );
        } else {
            // Get conversations that haven't been analyzed yet
            conversations = await getAll(`
        SELECT c.* FROM conversations c
        LEFT JOIN analysis_results a ON c.conversation_id = a.conversation_id
        WHERE a.id IS NULL
        LIMIT 500
      `);
        }

        if (conversations.length === 0) {
            return res.json({
                success: true,
                analyzed: 0,
                message: 'No conversations to analyze'
            });
        }

        let analyzed = 0;
        const errors = [];

        for (const conv of conversations) {
            try {
                // Run analysis
                const results = analyzer.analyze(
                    conv.conversation_id,
                    conv.transcript_details,
                    conv.conversation_date
                );

                // Store results
                await runQuery(`
          INSERT OR REPLACE INTO analysis_results (
            conversation_id, overall_sentiment, sentiment_label,
            positive_count, negative_count, neutral_count,
            keywords, avg_message_length, avg_response_time,
            agent_performance_score, customer_satisfaction_score
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
                    results.conversation_id,
                    results.overall_sentiment,
                    results.sentiment_label,
                    results.positive_count,
                    results.negative_count,
                    results.neutral_count,
                    results.keywords,
                    results.avg_message_length,
                    results.avg_response_time,
                    results.agent_performance_score,
                    results.customer_satisfaction_score
                ]);

                // Update conversation message count
                await runQuery(
                    'UPDATE conversations SET message_count = ? WHERE conversation_id = ?',
                    [results.message_count, conv.conversation_id]
                );

                analyzed++;
            } catch (err) {
                console.error(`Error analyzing ${conv.conversation_id}:`, err);
                errors.push({ conversation_id: conv.conversation_id, error: err.message });
            }
        }

        res.json({
            success: true,
            analyzed,
            total: conversations.length,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/analysis/results
 * Get analysis results with filters
 */
router.get('/results', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;
        const sentiment = req.query.sentiment; // Filter by sentiment label
        const accountId = req.query.account_id; // Filter by LivePerson account

        let query = `
      SELECT 
        a.*,
        c.conversation_date,
        c.uploaded_at,
        c.lp_account_id
      FROM analysis_results a
      JOIN conversations c ON a.conversation_id = c.conversation_id
      WHERE 1=1
    `;
        const params = [];

        if (sentiment) {
            query += ' AND a.sentiment_label = ?';
            params.push(sentiment);
        }

        if (accountId) {
            query += ' AND c.lp_account_id = ?';
            params.push(accountId);
        }

        query += ' ORDER BY a.analyzed_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const results = await getAll(query, params);

        // Parse JSON fields
        results.forEach(result => {
            try {
                result.keywords = JSON.parse(result.keywords);
            } catch (e) {
                // Keep as string if parse fails
            }
        });

        let totalQuery = 'SELECT COUNT(*) as total FROM analysis_results a JOIN conversations c ON a.conversation_id = c.conversation_id WHERE 1=1';
        const totalParams = [];

        if (sentiment) {
            totalQuery += ' AND a.sentiment_label = ?';
            totalParams.push(sentiment);
        }

        if (accountId) {
            totalQuery += ' AND c.lp_account_id = ?';
            totalParams.push(accountId);
        }

        const totalResult = await getOne(totalQuery, totalParams);

        res.json({
            results,
            pagination: {
                page,
                limit,
                total: totalResult.total,
                pages: Math.ceil(totalResult.total / limit)
            }
        });

    } catch (error) {
        console.error('Get results error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/analysis/dashboard
 * Get aggregated metrics for dashboard
 */
router.get('/dashboard', async (req, res) => {
    try {
        const accountId = req.query.account_id; // Filter by LivePerson account

        // Build WHERE clause for account filtering
        const whereClause = accountId ? 'WHERE c.lp_account_id = ?' : '';
        const params = accountId ? [accountId] : [];

        // Total conversations
        const totalConv = await getOne(`SELECT COUNT(*) as count FROM conversations c ${whereClause}`, params);

        // Total analyzed
        const totalAnalyzed = await getOne(`
            SELECT COUNT(*) as count 
            FROM analysis_results a
            JOIN conversations c ON a.conversation_id = c.conversation_id
            ${whereClause}
        `, params);

        // Get aggregate statistics
        const stats = await getOne(`
      SELECT 
        COUNT(*) as total_conversations,
        AVG(overall_sentiment) as avg_sentiment,
        AVG(customer_satisfaction_score) as avg_csat,
        AVG(agent_performance_score) as avg_agent_score
      FROM analysis_results a
      JOIN conversations c ON a.conversation_id = c.conversation_id
      ${whereClause}
    `, params);

        // Get sentiment distribution
        const sentimentDist = await getAll(`
      SELECT sentiment_label, COUNT(*) as count
      FROM analysis_results a
      JOIN conversations c ON a.conversation_id = c.conversation_id
      ${whereClause}
      GROUP BY sentiment_label
    `, params);

        // Recent conversations
        const recentConversations = await getAll(`
      SELECT 
        c.conversation_id,
        c.conversation_date,
        a.sentiment_label,
        a.customer_satisfaction_score
      FROM conversations c
      LEFT JOIN analysis_results a ON c.conversation_id = a.conversation_id
      ${whereClause}
      ORDER BY c.conversation_date DESC
      LIMIT 5
    `, params);

        res.json({
            overview: {
                totalConversations: totalConv.count,
                totalAnalyzed: totalAnalyzed.count,
                avgSentiment: stats.avg_sentiment,
                avgCSAT: stats.avg_csat,
                avgAgentScore: stats.avg_agent_score
            },
            sentimentDistribution: sentimentDist,
            recentConversations
        });

    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/analysis/export
 * Export analysis results
 */
router.get('/export', async (req, res) => {
    try {
        const format = req.query.format || 'json'; // json or csv

        const results = await getAll(`
      SELECT 
        a.conversation_id,
        c.conversation_date,
        a.overall_sentiment,
        a.sentiment_label,
        a.positive_count,
        a.negative_count,
        a.neutral_count,
        a.keywords,
        a.avg_message_length,
        a.avg_response_time,
        a.agent_performance_score,
        a.customer_satisfaction_score
      FROM analysis_results a
      LEFT JOIN conversations c ON a.conversation_id = c.conversation_id
      ORDER BY c.conversation_date DESC
    `);

        if (format === 'json') {
            // Return JSON
            results.forEach(result => {
                try {
                    result.keywords = JSON.parse(result.keywords);
                } catch (e) {
                    // Keep as string if parse fails
                }
            });
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', 'attachment; filename=analysis_results.json');
            res.json(results);
        } else {
            // CSV export
            const headers = [
                'conversation_id', 'conversation_date', 'overall_sentiment', 'sentiment_label',
                'positive_count', 'negative_count', 'neutral_count',
                'avg_message_length', 'avg_response_time', 'agent_performance_score',
                'customer_satisfaction_score', 'top_keywords'
            ];

            let csv = headers.join(',') + '\n';

            results.forEach(row => {
                const keywords = row.keywords ? JSON.parse(row.keywords).map(k => k.word).join(';') : '';

                const values = [
                    row.conversation_id,
                    row.conversation_date || '',
                    row.overall_sentiment,
                    row.sentiment_label,
                    row.positive_count,
                    row.negative_count,
                    row.neutral_count,
                    row.avg_message_length,
                    row.avg_response_time,
                    row.agent_performance_score,
                    row.customer_satisfaction_score,
                    `"${keywords}"`
                ];

                csv += values.join(',') + '\n';
            });

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=analysis_results.csv');
            res.send(csv);
        }

    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
