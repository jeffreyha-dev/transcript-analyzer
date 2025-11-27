import llmService from './llmService.js';
import prompts from './prompts.js';
import { getOne } from './database.js';

/**
 * AI-powered transcript analyzer
 * Uses LLM to provide deep insights across 6 feature areas
 */
export class AIAnalyzer {

    /**
     * Run complete AI analysis on a conversation
     * @param {string} conversationId - Conversation ID
     * @param {string} transcript - Full transcript text
     * @param {object} options - Analysis options
     * @returns {object} Complete AI analysis results
     */
    async analyzeConversation(conversationId, transcript, options = {}) {
        const startTime = Date.now();

        try {
            // Fetch active prompt from DB
            const activePrompt = await getOne('SELECT template FROM ai_prompts WHERE is_active = 1');

            let promptText;
            if (activePrompt) {
                // Replace placeholder with transcript
                promptText = activePrompt.template.replace('{{TRANSCRIPT}}', transcript);
            } else {
                // Fallback to hardcoded prompt
                console.warn('No active prompt found in DB, using fallback');
                promptText = prompts.combinedAnalysis(transcript);
            }

            const response = await llmService.analyze(promptText, {
                temperature: 0.7,
                max_tokens: 3000
            });

            // Parse JSON response
            const analysis = llmService.parseJSON(response.content);

            // Format results for database storage
            // Format results for database storage
            const results = {
                conversation_id: conversationId,

                // Feature 1: Summarization
                summary: analysis.summary?.summary || null,
                key_points: analysis.summary?.keyPoints ? JSON.stringify(analysis.summary.keyPoints) : null,
                resolved: analysis.summary?.resolved || false,
                action_items: analysis.summary?.actionItems ? JSON.stringify(analysis.summary.actionItems) : null,

                // Feature 2: Advanced Sentiment
                emotions: analysis.sentiment?.emotions ? JSON.stringify(analysis.sentiment.emotions) : null,
                sentiment_trajectory: analysis.sentiment?.sentimentTrajectory ? JSON.stringify(analysis.sentiment.sentimentTrajectory) : null,
                emotional_turning_points: analysis.sentiment?.emotionalTurningPoints ? JSON.stringify(analysis.sentiment.emotionalTurningPoints) : null,
                empathy_score: analysis.sentiment?.empathyScore || null,

                // Feature 3: Intent Classification
                primary_intent: analysis.intent?.primaryIntent || null,
                secondary_intents: analysis.intent?.secondaryIntents ? JSON.stringify(analysis.intent.secondaryIntents) : null,
                category: analysis.intent?.category || null,
                subcategory: analysis.intent?.subcategory || null,
                complexity: analysis.intent?.complexity || null,

                // Feature 4: Agent Performance
                communication_quality: analysis.agentPerformance?.communicationQuality || null,
                problem_solving_score: analysis.agentPerformance?.problemSolving || null,
                compliance_score: analysis.agentPerformance?.compliance || null,
                personalization_score: analysis.agentPerformance?.personalization || null,
                agent_strengths: analysis.agentPerformance?.strengths ? JSON.stringify(analysis.agentPerformance.strengths) : null,
                agent_improvements: analysis.agentPerformance?.improvements ? JSON.stringify(analysis.agentPerformance.improvements) : null,

                // Feature 5: QA
                policy_violations: analysis.qa?.policyViolations ? JSON.stringify(analysis.qa.policyViolations) : null,
                script_adherence_score: analysis.qa?.scriptAdherenceScore || null,
                risk_flags: analysis.qa?.riskFlags ? JSON.stringify(analysis.qa.riskFlags) : null,
                best_practice_suggestions: analysis.qa?.bestPracticeSuggestions ? JSON.stringify(analysis.qa.bestPracticeSuggestions) : null,

                // Feature 6: Customer Journey
                churn_risk_score: analysis.customerJourney?.churnRiskScore || null,
                customer_personality: analysis.customerJourney?.customerPersonality || null,
                lifetime_value_indicator: analysis.customerJourney?.lifetimeValueIndicator || null,
                intervention_suggestions: analysis.customerJourney?.interventionSuggestions ? JSON.stringify(analysis.customerJourney.interventionSuggestions) : null,

                // Metadata
                provider_used: response.provider,
                tokens_used: response.tokensUsed,
                cost: response.cost,
                processing_time_ms: Date.now() - startTime,

                // Store full analysis as custom data to capture any extra fields
                custom_data: JSON.stringify(analysis)
            };

            return results;

        } catch (error) {
            console.error(`AI analysis failed for ${conversationId}:`, error);
            throw error;
        }
    }

    /**
     * Run individual feature analysis (for selective analysis)
     */
    async analyzeSummarization(transcript) {
        const prompt = prompts.summarization(transcript);
        const response = await llmService.analyze(prompt);
        return llmService.parseJSON(response.content);
    }

    async analyzeSentiment(transcript) {
        const prompt = prompts.sentimentAnalysis(transcript);
        const response = await llmService.analyze(prompt);
        return llmService.parseJSON(response.content);
    }

    async analyzeIntent(transcript) {
        const prompt = prompts.intentClassification(transcript);
        const response = await llmService.analyze(prompt);
        return llmService.parseJSON(response.content);
    }

    async analyzeAgentPerformance(transcript) {
        const prompt = prompts.agentPerformance(transcript);
        const response = await llmService.analyze(prompt);
        return llmService.parseJSON(response.content);
    }

    async analyzeQuality(transcript) {
        const prompt = prompts.qualityAssurance(transcript);
        const response = await llmService.analyze(prompt);
        return llmService.parseJSON(response.content);
    }

    async analyzeCustomerJourney(transcript) {
        const prompt = prompts.customerJourney(transcript);
        const response = await llmService.analyze(prompt);
        return llmService.parseJSON(response.content);
    }

    /**
     * Get aggregated insights across multiple conversations
     */
    async getAggregatedInsights(results) {
        // Calculate aggregate statistics
        const insights = {
            totalAnalyzed: results.length,

            // Intent distribution
            intentDistribution: this.calculateDistribution(results, 'primary_intent'),

            // Average scores
            averageScores: {
                empathy: this.calculateAverage(results, 'empathy_score'),
                communicationQuality: this.calculateAverage(results, 'communication_quality'),
                problemSolving: this.calculateAverage(results, 'problem_solving_score'),
                compliance: this.calculateAverage(results, 'compliance_score'),
                churnRisk: this.calculateAverage(results, 'churn_risk_score'),
            },

            // Resolution rate
            resolutionRate: (results.filter(r => r.resolved).length / results.length) * 100,

            // Top issues
            topIssues: this.extractTopIssues(results),

            // Risk summary
            highRiskConversations: results.filter(r =>
                r.churn_risk_score > 70 ||
                (r.risk_flags && JSON.parse(r.risk_flags).length > 0)
            ).length,

            // Personality distribution
            personalityDistribution: this.calculateDistribution(results, 'customer_personality'),
        };

        return insights;
    }

    calculateDistribution(results, field) {
        const distribution = {};
        results.forEach(r => {
            const value = r[field];
            if (value) {
                distribution[value] = (distribution[value] || 0) + 1;
            }
        });
        return distribution;
    }

    calculateAverage(results, field) {
        const values = results.map(r => r[field]).filter(v => v != null);
        if (values.length === 0) return 0;
        return values.reduce((sum, v) => sum + v, 0) / values.length;
    }

    extractTopIssues(results) {
        const issues = {};
        results.forEach(r => {
            if (r.key_points) {
                try {
                    const points = JSON.parse(r.key_points);
                    points.forEach(point => {
                        issues[point] = (issues[point] || 0) + 1;
                    });
                } catch (e) {
                    // Skip invalid JSON
                }
            }
        });

        return Object.entries(issues)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([issue, count]) => ({ issue, count }));
    }
}

export default AIAnalyzer;
