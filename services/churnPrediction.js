import { getAll, getOne } from '../database.js';

/**
 * Calculate churn risk score for a conversation (0-100)
 */
export async function calculateChurnRisk(conversationId) {
    // Get conversation and analysis data
    const conversation = await getOne(`
        SELECT c.*, a.*
        FROM conversations c
        LEFT JOIN analysis_results a ON c.conversation_id = a.conversation_id
        WHERE c.conversation_id = ?
    `, [conversationId]);

    if (!conversation) {
        throw new Error('Conversation not found');
    }

    const riskFactors = [];
    let totalScore = 0;

    // Factor 1: Sentiment Score (30% weight)
    const sentimentScore = calculateSentimentRisk(conversation, riskFactors);
    totalScore += sentimentScore * 0.3;

    // Factor 2: Repeat Contacts (25% weight)
    const repeatScore = await calculateRepeatContactRisk(conversation, riskFactors);
    totalScore += repeatScore * 0.25;

    // Factor 3: Resolution Status (20% weight)
    const resolutionScore = calculateResolutionRisk(conversation, riskFactors);
    totalScore += resolutionScore * 0.2;

    // Factor 4: Negative Keywords (15% weight)
    const keywordScore = calculateKeywordRisk(conversation, riskFactors);
    totalScore += keywordScore * 0.15;

    // Factor 5: Response Time (10% weight)
    const timeScore = calculateTimeRisk(conversation, riskFactors);
    totalScore += timeScore * 0.1;

    const finalScore = Math.round(totalScore);
    const riskLevel = classifyRiskLevel(finalScore);

    return {
        score: finalScore,
        level: riskLevel,
        factors: riskFactors,
        recommended_actions: getRecommendedActions(finalScore, riskFactors)
    };
}

/**
 * Calculate sentiment-based risk
 */
function calculateSentimentRisk(conversation, riskFactors) {
    const sentiment = conversation.overall_sentiment;

    if (!sentiment) return 50; // Unknown = medium risk

    let score = 0;
    if (sentiment < 0.3) {
        score = 100;
        riskFactors.push({
            factor: 'negative_sentiment',
            severity: 'high',
            description: 'Very negative customer sentiment'
        });
    } else if (sentiment < 0.5) {
        score = 70;
        riskFactors.push({
            factor: 'negative_sentiment',
            severity: 'medium',
            description: 'Negative customer sentiment'
        });
    } else if (sentiment < 0.6) {
        score = 40;
    } else {
        score = 10;
    }

    return score;
}

/**
 * Calculate repeat contact risk
 */
async function calculateRepeatContactRisk(conversation, riskFactors) {
    // Count conversations from same customer in last 7 days
    // For now, we'll use a simplified approach based on conversation ID patterns
    // In production, you'd want to track customer IDs

    const externalId = conversation.external_id;
    if (!externalId) return 30; // Unknown = low-medium risk

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const repeatContacts = await getAll(`
        SELECT COUNT(*) as count
        FROM conversations
        WHERE external_id LIKE ?
        AND conversation_date >= ?
        AND conversation_id != ?
    `, [`%${externalId.slice(-5)}%`, sevenDaysAgo, conversation.conversation_id]);

    const count = repeatContacts[0]?.count || 0;

    let score = 0;
    if (count >= 3) {
        score = 100;
        riskFactors.push({
            factor: 'repeat_contact',
            severity: 'high',
            description: `${count} contacts in last 7 days`
        });
    } else if (count >= 2) {
        score = 70;
        riskFactors.push({
            factor: 'repeat_contact',
            severity: 'medium',
            description: `${count} contacts in last 7 days`
        });
    } else if (count === 1) {
        score = 40;
    } else {
        score = 10;
    }

    return score;
}

/**
 * Calculate resolution-based risk
 */
function calculateResolutionRisk(conversation, riskFactors) {
    // Check if issue was resolved (based on sentiment and keywords)
    const transcript = conversation.transcript_details?.toLowerCase() || '';

    const resolvedKeywords = ['resolved', 'fixed', 'solved', 'thank you', 'thanks', 'appreciate'];
    const unresolvedKeywords = ['still', 'not working', 'unresolved', 'frustrated', 'disappointed'];

    const hasResolved = resolvedKeywords.some(kw => transcript.includes(kw));
    const hasUnresolved = unresolvedKeywords.some(kw => transcript.includes(kw));

    let score = 50; // Default: unknown

    if (hasUnresolved && !hasResolved) {
        score = 90;
        riskFactors.push({
            factor: 'unresolved_issue',
            severity: 'high',
            description: 'Issue appears unresolved'
        });
    } else if (!hasResolved && !hasUnresolved) {
        score = 50;
    } else if (hasResolved) {
        score = 10;
    }

    return score;
}

/**
 * Calculate keyword-based risk
 */
function calculateKeywordRisk(conversation, riskFactors) {
    const transcript = conversation.transcript_details?.toLowerCase() || '';

    const highRiskKeywords = ['cancel', 'cancellation', 'competitor', 'switch', 'leave'];
    const mediumRiskKeywords = ['disappointed', 'frustrated', 'angry', 'upset', 'terrible'];

    const highRiskMatches = highRiskKeywords.filter(kw => transcript.includes(kw));
    const mediumRiskMatches = mediumRiskKeywords.filter(kw => transcript.includes(kw));

    let score = 0;

    if (highRiskMatches.length > 0) {
        score = 100;
        riskFactors.push({
            factor: 'churn_keywords',
            severity: 'high',
            description: `Mentioned: ${highRiskMatches.join(', ')}`
        });
    } else if (mediumRiskMatches.length >= 2) {
        score = 70;
        riskFactors.push({
            factor: 'negative_keywords',
            severity: 'medium',
            description: `Mentioned: ${mediumRiskMatches.join(', ')}`
        });
    } else if (mediumRiskMatches.length === 1) {
        score = 40;
    } else {
        score = 10;
    }

    return score;
}

/**
 * Calculate time-based risk
 */
function calculateTimeRisk(conversation, riskFactors) {
    const duration = conversation.duration_minutes || 0;

    let score = 0;

    if (duration > 30) {
        score = 80;
        riskFactors.push({
            factor: 'long_duration',
            severity: 'medium',
            description: `${Math.round(duration)} minute conversation`
        });
    } else if (duration > 15) {
        score = 50;
    } else {
        score = 20;
    }

    return score;
}

/**
 * Classify risk level based on score
 */
export function classifyRiskLevel(score) {
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
}

/**
 * Get recommended actions based on risk score and factors
 */
function getRecommendedActions(score, factors) {
    const actions = [];

    if (score >= 70) {
        actions.push('escalate_to_senior');
        actions.push('proactive_outreach');
    }

    const factorTypes = factors.map(f => f.factor);

    if (factorTypes.includes('churn_keywords')) {
        actions.push('retention_offer');
        actions.push('executive_review');
    }

    if (factorTypes.includes('repeat_contact')) {
        actions.push('root_cause_analysis');
        actions.push('priority_handling');
    }

    if (factorTypes.includes('unresolved_issue')) {
        actions.push('follow_up_call');
        actions.push('issue_escalation');
    }

    if (factorTypes.includes('negative_sentiment')) {
        actions.push('sentiment_recovery');
        actions.push('customer_feedback');
    }

    // Default action for any high risk
    if (score >= 70 && actions.length === 0) {
        actions.push('manager_review');
    }

    return actions;
}

/**
 * Get churn risk statistics for an account
 */
export async function getChurnStatistics(accountId = null) {
    let query = `
        SELECT 
            churn_risk_level,
            COUNT(*) as count,
            AVG(churn_risk_score) as avg_score
        FROM ai_analysis_results a
        JOIN conversations c ON a.conversation_id = c.conversation_id
        WHERE a.churn_risk_level IS NOT NULL
    `;

    const params = [];
    if (accountId) {
        query += ' AND c.lp_account_id = ?';
        params.push(accountId);
    }

    query += ' GROUP BY churn_risk_level';

    const stats = await getAll(query, params);

    return {
        high: stats.find(s => s.churn_risk_level === 'high')?.count || 0,
        medium: stats.find(s => s.churn_risk_level === 'medium')?.count || 0,
        low: stats.find(s => s.churn_risk_level === 'low')?.count || 0,
        details: stats
    };
}
