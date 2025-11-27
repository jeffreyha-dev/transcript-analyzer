import express from 'express';
import AIAnalyzer from '../aiAnalyzer.js';
import llmService from '../llmService.js';
import { runQuery, getAll, getOne } from '../database.js';

const router = express.Router();
const aiAnalyzer = new AIAnalyzer();

/**
 * POST /api/ai-analysis/run
 * Run AI analysis on uploaded conversations
 */
router.post('/run', async (req, res) => {
    try {
        const { conversation_ids } = req.body;

        // Get conversations to analyze
        let conversations;
        if (conversation_ids && Array.isArray(conversation_ids)) {
            const placeholders = conversation_ids.map(() => '?').join(',');
            conversations = await getAll(
                `SELECT * FROM conversations WHERE conversation_id IN (${placeholders})`,
                conversation_ids
            );
        } else {
            // Get conversations not yet analyzed with AI
            conversations = await getAll(`
                SELECT c.* FROM conversations c
                LEFT JOIN ai_analysis_results a ON c.conversation_id = a.conversation_id
                WHERE a.id IS NULL
                LIMIT 100
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
                // Run AI analysis
                const results = await aiAnalyzer.analyzeConversation(
                    conv.conversation_id,
                    conv.transcript_details
                );

                // Store results
                await runQuery(`
                    INSERT OR REPLACE INTO ai_analysis_results (
                        conversation_id, summary, key_points, resolved, action_items,
                        emotions, sentiment_trajectory, emotional_turning_points, empathy_score,
                        primary_intent, secondary_intents, category, subcategory, complexity,
                        communication_quality, problem_solving_score, compliance_score, 
                        personalization_score, agent_strengths, agent_improvements,
                        policy_violations, script_adherence_score, risk_flags, 
                        best_practice_suggestions,
                        churn_risk_score, customer_personality, lifetime_value_indicator, 
                        intervention_suggestions,
                        provider_used, tokens_used, cost, processing_time_ms, custom_data
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    results.conversation_id,
                    results.summary,
                    results.key_points,
                    results.resolved ? 1 : 0,
                    results.action_items,
                    results.emotions,
                    results.sentiment_trajectory,
                    results.emotional_turning_points,
                    results.empathy_score,
                    results.primary_intent,
                    results.secondary_intents,
                    results.category,
                    results.subcategory,
                    results.complexity,
                    results.communication_quality,
                    results.problem_solving_score,
                    results.compliance_score,
                    results.personalization_score,
                    results.agent_strengths,
                    results.agent_improvements,
                    results.policy_violations,
                    results.script_adherence_score,
                    results.risk_flags,
                    results.best_practice_suggestions,
                    results.churn_risk_score,
                    results.customer_personality,
                    results.lifetime_value_indicator,
                    results.intervention_suggestions,
                    results.provider_used,
                    results.tokens_used,
                    results.cost,
                    results.processing_time_ms,
                    results.custom_data
                ]);

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

    } catch (err) {
        console.error('AI analysis error:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/ai-analysis/results
 * Get AI analysis results with pagination and filtering
 */
router.get('/results', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;
        const intent = req.query.intent;
        const complexity = req.query.complexity;
        const minChurnRisk = req.query.min_churn_risk;

        let whereClause = '';
        const params = [];

        if (intent) {
            whereClause += ' AND a.primary_intent = ?';
            params.push(intent);
        }
        if (complexity) {
            whereClause += ' AND a.complexity = ?';
            params.push(complexity);
        }
        if (minChurnRisk) {
            whereClause += ' AND a.churn_risk_score >= ?';
            params.push(parseFloat(minChurnRisk));
        }

        const query = `
            SELECT 
                a.*,
                c.conversation_date,
                c.uploaded_at
            FROM ai_analysis_results a
            JOIN conversations c ON a.conversation_id = c.conversation_id
            WHERE 1=1 ${whereClause}
            ORDER BY a.analyzed_at DESC
            LIMIT ? OFFSET ?
        `;

        const countQuery = `
            SELECT COUNT(*) as total
            FROM ai_analysis_results a
            WHERE 1=1 ${whereClause}
        `;

        const results = await getAll(query, [...params, limit, offset]);
        const { total } = await getOne(countQuery, params);

        res.json({
            results,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (err) {
        console.error('Error fetching AI results:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/ai-analysis/summary/:id
 * Get detailed AI analysis for a specific conversation
 */
router.get('/summary/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await getOne(
            `SELECT 
                a.*,
                c.conversation_date,
                c.transcript_details,
                c.uploaded_at
             FROM ai_analysis_results a
             JOIN conversations c ON a.conversation_id = c.conversation_id
             WHERE a.conversation_id = ?`,
            [id]
        );

        if (!result) {
            return res.status(404).json({ error: 'Analysis not found' });
        }

        // Parse JSON fields
        const parsed = {
            ...result,
            key_points: JSON.parse(result.key_points || '[]'),
            action_items: JSON.parse(result.action_items || '[]'),
            emotions: JSON.parse(result.emotions || '{}'),
            sentiment_trajectory: JSON.parse(result.sentiment_trajectory || '[]'),
            emotional_turning_points: JSON.parse(result.emotional_turning_points || '[]'),
            secondary_intents: JSON.parse(result.secondary_intents || '[]'),
            agent_strengths: JSON.parse(result.agent_strengths || '[]'),
            agent_improvements: JSON.parse(result.agent_improvements || '[]'),
            policy_violations: JSON.parse(result.policy_violations || '[]'),
            risk_flags: JSON.parse(result.risk_flags || '[]'),
            best_practice_suggestions: JSON.parse(result.best_practice_suggestions || '[]'),
            intervention_suggestions: JSON.parse(result.intervention_suggestions || '[]'),
            custom_data: result.custom_data || null,
        };

        res.json(parsed);

    } catch (err) {
        console.error('Error fetching summary:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/ai-analysis/insights
 * Get aggregated AI insights across all conversations
 */
router.get('/insights', async (req, res) => {
    try {
        const results = await getAll('SELECT * FROM ai_analysis_results');
        const insights = await aiAnalyzer.getAggregatedInsights(results);

        // Add cost stats
        const costStats = await llmService.getCostStats('month');

        res.json({
            ...insights,
            costStats
        });

    } catch (err) {
        console.error('Error generating insights:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/ai-analysis/costs
 * Get cost tracking data
 */
router.get('/costs', async (req, res) => {
    try {
        const period = req.query.period || 'month'; // day, week, month
        const stats = await llmService.getCostStats(period);

        // Get daily breakdown for the period
        let dateFilter;
        if (period === 'month') {
            const currentMonth = new Date().toISOString().slice(0, 7);
            dateFilter = `strftime('%Y-%m', date) = '${currentMonth}'`;
        } else if (period === 'week') {
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            dateFilter = `date >= '${weekAgo}'`;
        } else {
            const today = new Date().toISOString().split('T')[0];
            dateFilter = `date = '${today}'`;
        }

        const breakdown = await getAll(
            `SELECT date, provider, conversations_analyzed, total_tokens, total_cost
             FROM ai_cost_tracking
             WHERE ${dateFilter}
             ORDER BY date DESC`
        );

        res.json({
            summary: stats,
            breakdown
        });

    } catch (err) {
        console.error('Error fetching costs:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/ai-analysis/stats
 * Get quick statistics for dashboard
 */
router.get('/stats', async (req, res) => {
    try {
        const totalAnalyzed = await getOne(
            'SELECT COUNT(*) as count FROM ai_analysis_results'
        );

        const avgScores = await getOne(`
            SELECT 
                AVG(empathy_score) as avg_empathy,
                AVG(communication_quality) as avg_communication,
                AVG(problem_solving_score) as avg_problem_solving,
                AVG(churn_risk_score) as avg_churn_risk
            FROM ai_analysis_results
        `);

        const resolutionRate = await getOne(`
            SELECT 
                COUNT(CASE WHEN resolved = 1 THEN 1 END) * 100.0 / COUNT(*) as rate
            FROM ai_analysis_results
        `);

        const highRiskCount = await getOne(`
            SELECT COUNT(*) as count
            FROM ai_analysis_results
            WHERE churn_risk_score > 70
        `);

        const intentDistribution = await getAll(`
            SELECT primary_intent, COUNT(*) as count
            FROM ai_analysis_results
            GROUP BY primary_intent
            ORDER BY count DESC
            LIMIT 10
        `);

        const unanalyzedCount = await getOne(`
            SELECT COUNT(*) as count
            FROM conversations c
            LEFT JOIN ai_analysis_results a ON c.conversation_id = a.conversation_id
            WHERE a.id IS NULL
        `);

        res.json({
            totalAnalyzed: totalAnalyzed.count,
            unanalyzedCount: unanalyzedCount.count,
            averageScores: avgScores,
            resolutionRate: resolutionRate.rate || 0,
            highRiskConversations: highRiskCount.count,
            intentDistribution
        });

    } catch (err) {
        console.error('Error fetching stats:', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
