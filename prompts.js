/**
 * Centralized prompt templates for AI analysis
 */

export const prompts = {
    /**
     * Feature 1: Conversation Summarization
     */
    summarization: (transcript) => `Analyze this customer service conversation and provide a comprehensive summary.

Conversation:
${transcript}

Respond in JSON format with the following structure:
{
  "summary": "2-3 sentence summary of the conversation",
  "keyPoints": ["key point 1", "key point 2", "key point 3"],
  "resolved": true or false (was the customer's issue resolved?),
  "actionItems": ["action item 1", "action item 2"] or [] if none
}

Only respond with valid JSON, no additional text.`,

    /**
     * Feature 2: Advanced Sentiment & Emotion Analysis
     */
    sentimentAnalysis: (transcript) => `Analyze the emotions and sentiment in this customer service conversation.

Conversation:
${transcript}

Respond in JSON format with the following structure:
{
  "emotions": {
    "customer": {
      "joy": 0.0-1.0,
      "frustration": 0.0-1.0,
      "anger": 0.0-1.0,
      "confusion": 0.0-1.0,
      "satisfaction": 0.0-1.0,
      "disappointment": 0.0-1.0,
      "anxiety": 0.0-1.0,
      "neutral": 0.0-1.0
    },
    "agent": {
      "empathy": 0.0-1.0,
      "professionalism": 0.0-1.0,
      "patience": 0.0-1.0
    }
  },
  "sentimentTrajectory": [
    {"stage": "beginning", "sentiment": "negative/neutral/positive", "score": -1.0 to 1.0},
    {"stage": "middle", "sentiment": "negative/neutral/positive", "score": -1.0 to 1.0},
    {"stage": "end", "sentiment": "negative/neutral/positive", "score": -1.0 to 1.0}
  ],
  "emotionalTurningPoints": [
    {"message": "approximate message text", "emotion": "emotion that changed", "reason": "why it changed"}
  ],
  "empathyScore": 0-100 (agent's empathy level)
}

Only respond with valid JSON, no additional text.`,

    /**
     * Feature 3: Intent Classification
     */
    intentClassification: (transcript) => `Classify the intent and topics of this customer service conversation.

Conversation:
${transcript}

Respond in JSON format with the following structure:
{
  "primaryIntent": "one of: product_return, refund_request, technical_support, billing_inquiry, shipping_question, account_management, complaint, general_inquiry, feature_request, cancellation, other",
  "secondaryIntents": ["intent1", "intent2"] or [] if none,
  "category": "main business category (e.g., Order Management, Technical Support, Account Services)",
  "subcategory": "more specific category",
  "complexity": "low, medium, or high",
  "urgency": "low, medium, or high"
}

Only respond with valid JSON, no additional text.`,

    /**
     * Feature 4: Agent Performance Analysis
     */
    agentPerformance: (transcript) => `Evaluate the customer service agent's performance in this conversation.

Conversation:
${transcript}

Respond in JSON format with the following structure:
{
  "communicationQuality": 0-100 (clarity, professionalism, tone),
  "problemSolving": 0-100 (effectiveness in addressing the issue),
  "compliance": 0-100 (following company policies and procedures),
  "personalization": 0-100 (personalized vs generic responses),
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement suggestion 1", "improvement suggestion 2"],
  "overallScore": 0-100
}

Only respond with valid JSON, no additional text.`,

    /**
     * Feature 5: Quality Assurance
     */
    qualityAssurance: (transcript) => `Perform a quality assurance check on this customer service conversation.

Conversation:
${transcript}

Respond in JSON format with the following structure:
{
  "policyViolations": [
    {"policy": "policy name", "severity": "low/medium/high", "description": "what was violated"}
  ] or [] if none,
  "scriptAdherenceScore": 0-100 (how well agent followed standard procedures),
  "riskFlags": [
    {"type": "legal/escalation/refund_abuse/data_privacy/other", "severity": "low/medium/high", "description": "description of risk"}
  ] or [] if none,
  "bestPracticeSuggestions": ["suggestion 1", "suggestion 2"] or [] if none,
  "complianceIssues": ["issue 1", "issue 2"] or [] if none
}

Only respond with valid JSON, no additional text.`,

    /**
     * Feature 6: Customer Journey Insights
     */
    customerJourney: (transcript) => `Analyze the customer journey and predict future behavior based on this conversation.

Conversation:
${transcript}

Respond in JSON format with the following structure:
{
  "churnRiskScore": 0-100 (likelihood customer will leave),
  "customerPersonality": "one of: analytical, emotional, direct, friendly, demanding, cooperative",
  "lifetimeValueIndicator": "high, medium, or low",
  "interventionSuggestions": ["suggestion 1", "suggestion 2"] or [] if none,
  "satisfactionLevel": "very_dissatisfied, dissatisfied, neutral, satisfied, very_satisfied",
  "loyaltyIndicators": ["indicator 1", "indicator 2"] or [] if none
}

Only respond with valid JSON, no additional text.`,

    /**
     * Combined analysis prompt (for efficiency)
     */
    combinedAnalysis: (transcript) => `Analyze this customer service conversation comprehensively across multiple dimensions.

Conversation:
${transcript}

Respond in JSON format with ALL of the following sections:

{
  "summary": {
    "summary": "2-3 sentence summary",
    "keyPoints": ["point 1", "point 2"],
    "resolved": true/false,
    "actionItems": ["item 1"] or []
  },
  "sentiment": {
    "emotions": {
      "customer": {"joy": 0-1, "frustration": 0-1, "anger": 0-1, "confusion": 0-1, "satisfaction": 0-1, "disappointment": 0-1, "anxiety": 0-1, "neutral": 0-1},
      "agent": {"empathy": 0-1, "professionalism": 0-1, "patience": 0-1}
    },
    "sentimentTrajectory": [{"stage": "beginning/middle/end", "sentiment": "negative/neutral/positive", "score": -1 to 1}],
    "emotionalTurningPoints": [{"message": "text", "emotion": "emotion", "reason": "reason"}] or [],
    "empathyScore": 0-100
  },
  "intent": {
    "primaryIntent": "intent type",
    "secondaryIntents": [] or ["intent"],
    "category": "category",
    "subcategory": "subcategory",
    "complexity": "low/medium/high",
    "urgency": "low/medium/high"
  },
  "agentPerformance": {
    "communicationQuality": 0-100,
    "problemSolving": 0-100,
    "compliance": 0-100,
    "personalization": 0-100,
    "strengths": ["strength"],
    "improvements": ["improvement"],
    "overallScore": 0-100
  },
  "qa": {
    "policyViolations": [] or [{"policy": "name", "severity": "low/medium/high", "description": "desc"}],
    "scriptAdherenceScore": 0-100,
    "riskFlags": [] or [{"type": "type", "severity": "low/medium/high", "description": "desc"}],
    "bestPracticeSuggestions": [] or ["suggestion"],
    "complianceIssues": [] or ["issue"]
  },
  "customerJourney": {
    "churnRiskScore": 0-100,
    "customerPersonality": "type",
    "lifetimeValueIndicator": "high/medium/low",
    "interventionSuggestions": [] or ["suggestion"],
    "satisfactionLevel": "level",
    "loyaltyIndicators": [] or ["indicator"]
  }
}

Only respond with valid JSON, no additional text.`
};

export default prompts;
