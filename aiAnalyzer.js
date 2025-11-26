import llmService from './llmService.js';
import prompts from './prompts.js';

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
            // Use combined prompt for efficiency (single LLM call)
            const prompt = prompts.combinedAnalysis(transcript);

            const response = await llmService.analyze(prompt, {
                temperature: 0.7,
                max_tokens: 3000
            });

            // Parse JSON response
            const analysis = llmService.parseJSON(response.content);

            // Format results for database storage
            const results = {
                conversation_id: conversationId,

                // Feature 1: Summarization
                summary: analysis.summary.summary,
                key_points: JSON.stringify(analysis.summary.keyPoints),
                resolved: analysis.summary.resolved,
                action_items: JSON.stringify(analysis.summary.actionItems),

                // Feature 2: Advanced Sentiment
                emotions: JSON.stringify(analysis.sentiment.emotions),
                sentiment_trajectory: JSON.stringify(analysis.sentiment.sentimentTrajectory),
                emotional_turning_points: JSON.stringify(analysis.sentiment.emotionalTurningPoints),
                empathy_score: analysis.sentiment.empathyScore,

                // Feature 3: Intent Classification
                primary_intent: analysis.intent.primaryIntent,
                secondary_intents: JSON.stringify(analysis.intent.secondaryIntents),
                category: analysis.intent.category,
                subcategory: analysis.intent.subcategory,
                complexity: analysis.intent.complexity,

                // Feature 4: Agent Performance
                communication_quality: analysis.agentPerformance.communicationQuality,
                problem_solving_score: analysis.agentPerformance.problemSolving,
                compliance_score: analysis.agentPerformance.compliance,
                personalization_score: analysis.agentPerformance.personalization,
                agent_strengths: JSON.stringify(analysis.agentPerformance.strengths),
                agent_improvements: JSON.stringify(analysis.agentPerformance.improvements),

                // Feature 5: QA
                policy_violations: JSON.stringify(analysis.qa.policyViolations),
                script_adherence_score: analysis.qa.scriptAdherenceScore,
                risk_flags: JSON.stringify(analysis.qa.riskFlags),
                best_practice_suggestions: JSON.stringify(analysis.qa.bestPracticeSuggestions),

                // Feature 6: Customer Journey
                churn_risk_score: analysis.customerJourney.churnRiskScore,
                customer_personality: analysis.customerJourney.customerPersonality,
                lifetime_value_indicator: analysis.customerJourney.lifetimeValueIndicator,
                intervention_suggestions: JSON.stringify(analysis.customerJourney.interventionSuggestions),

                // Metadata
                provider_used: response.provider,
                tokens_used: response.tokensUsed,
                cost: response.cost,
                processing_time_ms: Date.now() - startTime
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
