import llmService from '../llmService.js';
import { getAll } from '../database.js';

/**
 * Intent Insights Service
 * Analyzes intent data and generates AI-powered recommendations
 */

/**
 * Classify intent into quadrant based on volume and sentiment
 */
function classifyQuadrant(intent, medianVolume, avgSentiment = 0) {
    const isHighVolume = intent.count >= medianVolume;
    const isNegative = intent.avg_sentiment < 50; // 0-100 scale, 50 is neutral

    if (isHighVolume && isNegative) return 'critical';
    if (isHighVolume && !isNegative) return 'strength';
    if (!isHighVolume && isNegative) return 'niche';
    return 'routine';
}

/**
 * Calculate priority score for an intent
 * Higher score = higher priority
 */
function calculatePriorityScore(intent, totalConversations) {
    // Volume weight (40%) - normalized to 0-100
    const volumeScore = (intent.count / totalConversations) * 100;

    // Sentiment severity (30%) - distance from neutral (50)
    const sentimentDeviation = Math.abs(intent.avg_sentiment - 50);
    const sentimentScore = sentimentDeviation * 2; // Scale to 0-100

    // Complexity factor (30%) - higher complexity = higher priority
    const complexityScore = (intent.avg_complexity / 3) * 100;

    // Weighted sum
    const priority = (volumeScore * 0.4) + (sentimentScore * 0.3) + (complexityScore * 0.3);

    return Math.round(priority);
}

/**
 * Generate AI-powered insights from intent data
 */
export async function generateIntentInsights(intentData) {
    if (!intentData || intentData.length === 0) {
        return {
            recommendations: [],
            summary: 'No intent data available for analysis.'
        };
    }

    // Calculate statistics
    const totalConversations = intentData.reduce((sum, i) => sum + i.count, 0);
    const sortedByVolume = [...intentData].sort((a, b) => b.count - a.count);
    const medianVolume = sortedByVolume[Math.floor(sortedByVolume.length / 2)]?.count || 1;

    // Classify and score each intent
    const analyzedIntents = intentData.map(intent => ({
        ...intent,
        quadrant: classifyQuadrant(intent, medianVolume),
        priorityScore: calculatePriorityScore(intent, totalConversations),
        volumePercent: ((intent.count / totalConversations) * 100).toFixed(1),
        sentimentMapped: (intent.avg_sentiment - 50) * 2 // Map to -100 to 100
    }));

    // Sort by priority score
    const prioritized = analyzedIntents.sort((a, b) => b.priorityScore - a.priorityScore);

    // Get top issues by quadrant
    const critical = prioritized.filter(i => i.quadrant === 'critical').slice(0, 3);
    const strengths = prioritized.filter(i => i.quadrant === 'strength').slice(0, 2);
    const niche = prioritized.filter(i => i.quadrant === 'niche').slice(0, 2);

    // Prepare data for AI analysis
    const analysisContext = {
        totalConversations,
        totalIntents: intentData.length,
        criticalIssues: critical.map(i => ({
            intent: i.intent,
            volume: i.count,
            volumePercent: i.volumePercent,
            sentiment: i.avg_sentiment.toFixed(1),
            complexity: i.avg_complexity.toFixed(1)
        })),
        keyStrengths: strengths.map(i => ({
            intent: i.intent,
            volume: i.count,
            volumePercent: i.volumePercent,
            sentiment: i.avg_sentiment.toFixed(1)
        })),
        nicheProblems: niche.map(i => ({
            intent: i.intent,
            volume: i.count,
            sentiment: i.avg_sentiment.toFixed(1)
        }))
    };

    // Generate AI recommendations
    const prompt = `You are analyzing customer conversation data to provide actionable business insights.

**Data Summary:**
- Total Conversations: ${analysisContext.totalConversations}
- Total Intent Categories: ${analysisContext.totalIntents}

**Critical Issues (High Volume + Negative Sentiment):**
${analysisContext.criticalIssues.map(i => `- "${i.intent}": ${i.volume} conversations (${i.volumePercent}%), Sentiment: ${i.sentiment}/100, Complexity: ${i.complexity}/3`).join('\n') || 'None identified'}

**Key Strengths (High Volume + Positive Sentiment):**
${analysisContext.keyStrengths.map(i => `- "${i.intent}": ${i.volume} conversations (${i.volumePercent}%), Sentiment: ${i.sentiment}/100`).join('\n') || 'None identified'}

**Niche Problems (Low Volume + Negative Sentiment):**
${analysisContext.nicheProblems.map(i => `- "${i.intent}": ${i.volume} conversations, Sentiment: ${i.sentiment}/100`).join('\n') || 'None identified'}

Generate exactly 3 actionable recommendations in this JSON format:
{
  "recommendations": [
    {
      "priority": "critical|high|medium",
      "title": "Brief action-oriented title",
      "description": "Specific recommendation with data context",
      "intent": "The intent name this relates to",
      "impact": "Expected business impact"
    }
  ]
}

Focus on:
1. Highest priority issues first (critical issues with high volume)
2. Quick wins (niche problems that are easy to fix)
3. Opportunities (strengths to amplify or trends to watch)

Keep descriptions concise and actionable. Return ONLY valid JSON.`;

    try {
        const aiResponse = await llmService.generateCompletion(prompt, {
            temperature: 0.3,
            maxTokens: 800
        });

        // Parse AI response
        let insights;
        try {
            insights = JSON.parse(aiResponse);
        } catch (parseError) {
            console.error('Failed to parse AI response:', aiResponse);
            // Fallback to rule-based insights
            insights = generateRuleBasedInsights(critical, strengths, niche);
        }

        return {
            ...insights,
            metadata: {
                totalConversations,
                totalIntents: intentData.length,
                criticalCount: critical.length,
                strengthCount: strengths.length
            }
        };

    } catch (error) {
        console.error('Error generating AI insights:', error);
        // Fallback to rule-based insights
        return {
            recommendations: generateRuleBasedInsights(critical, strengths, niche).recommendations,
            metadata: {
                totalConversations,
                totalIntents: intentData.length,
                criticalCount: critical.length,
                strengthCount: strengths.length
            }
        };
    }
}

/**
 * Fallback: Generate rule-based insights if AI fails
 */
function generateRuleBasedInsights(critical, strengths, niche) {
    const recommendations = [];

    // Add critical issue if exists
    if (critical.length > 0) {
        const top = critical[0];
        recommendations.push({
            priority: 'critical',
            title: `Address "${top.intent}" immediately`,
            description: `${top.count} conversations (${top.volumePercent}%) with negative sentiment (${top.avg_sentiment.toFixed(1)}/100). This is your highest-impact issue.`,
            intent: top.intent,
            impact: 'High - affects significant portion of customers'
        });
    }

    // Add strength if exists
    if (strengths.length > 0) {
        const top = strengths[0];
        recommendations.push({
            priority: 'medium',
            title: `Amplify success in "${top.intent}"`,
            description: `${top.count} conversations with positive sentiment (${top.avg_sentiment.toFixed(1)}/100). Document and replicate this success.`,
            intent: top.intent,
            impact: 'Medium - opportunity to scale best practices'
        });
    }

    // Add niche problem if exists
    if (niche.length > 0) {
        const top = niche[0];
        recommendations.push({
            priority: 'high',
            title: `Quick win: Fix "${top.intent}"`,
            description: `Low volume (${top.count} conversations) but negative sentiment. Easy to address before it grows.`,
            intent: top.intent,
            impact: 'Low volume but prevents escalation'
        });
    }

    return { recommendations };
}

export default {
    generateIntentInsights
};
