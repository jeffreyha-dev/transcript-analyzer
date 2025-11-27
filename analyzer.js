import Sentiment from 'sentiment';
import natural from 'natural';

const sentiment = new Sentiment();
const TfIdf = natural.TfIdf;
const tokenizer = new natural.WordTokenizer();

/**
 * Comprehensive transcript analyzer
 * Analyzes conversations for sentiment, topics, metrics, and performance
 */
export class TranscriptAnalyzer {

    /**
     * Main analysis function
     * @param {string} conversationId - Unique conversation identifier
     * @param {string} transcriptDetails - Full conversation transcript
     * @param {string} conversationDate - Date of conversation (optional)
     * @returns {Object} Analysis results
     */
    analyze(conversationId, transcriptDetails, conversationDate = null) {
        const results = {
            conversation_id: conversationId,
            conversation_date: conversationDate,
        };

        // Parse transcript into messages
        const messages = this.parseTranscript(transcriptDetails);

        // Run all analysis modules
        results.sentiment = this.analyzeSentiment(messages, transcriptDetails);
        results.keywords = this.extractKeywords(transcriptDetails);
        results.metrics = this.calculateMetrics(messages);
        results.agentPerformance = this.analyzeAgentPerformance(messages);
        results.customerSatisfaction = this.estimateCustomerSatisfaction(messages);

        return this.formatResults(results);
    }

    /**
     * Parse transcript into individual messages
     * Supports various formats
     */
    parseTranscript(transcript) {
        const messages = [];

        // Try to parse as JSON first
        try {
            const parsed = JSON.parse(transcript);
            if (Array.isArray(parsed)) {
                return parsed;
            }
        } catch (e) {
            // Not JSON, parse as text
        }

        // Parse text format (line by line)
        const lines = transcript.split('\n').filter(line => line.trim());

        for (const line of lines) {
            // Common patterns: "Agent: message" or "Customer: message" or "timestamp - speaker: message"
            const match = line.match(/^(?:\[?(\d{1,2}:\d{2}(?::\d{2})?)\]?\s*)?-?\s*(Agent|Customer|User|Support):\s*(.+)$/i);

            if (match) {
                messages.push({
                    timestamp: match[1] || null,
                    speaker: match[2].toLowerCase(),
                    text: match[3].trim()
                });
            } else if (line.trim()) {
                // Fallback: treat as generic message
                messages.push({
                    timestamp: null,
                    speaker: 'unknown',
                    text: line.trim()
                });
            }
        }

        return messages;
    }

    /**
     * Sentiment Analysis
     * Analyzes overall sentiment and per-message sentiment
     */
    analyzeSentiment(messages, fullTranscript) {
        // Overall sentiment
        const overallResult = sentiment.analyze(fullTranscript);

        // Per-message sentiment
        let positiveCount = 0;
        let negativeCount = 0;
        let neutralCount = 0;

        messages.forEach(msg => {
            const msgSentiment = sentiment.analyze(msg.text);
            if (msgSentiment.score > 0) positiveCount++;
            else if (msgSentiment.score < 0) negativeCount++;
            else neutralCount++;
        });

        // Normalize score to 0-100 scale
        const normalizedScore = Math.max(0, Math.min(100, 50 + (overallResult.score * 5)));

        return {
            score: overallResult.score,
            normalizedScore: normalizedScore,
            comparative: overallResult.comparative,
            label: this.getSentimentLabel(overallResult.score),
            positiveCount,
            negativeCount,
            neutralCount,
            totalMessages: messages.length
        };
    }

    getSentimentLabel(score) {
        if (score > 2) return 'Very Positive';
        if (score > 0) return 'Positive';
        if (score < -2) return 'Very Negative';
        if (score < 0) return 'Negative';
        return 'Neutral';
    }

    /**
     * Keyword Extraction
     */
    extractKeywords(transcript) {
        const tokens = tokenizer.tokenize(transcript.toLowerCase());
        const wordFreq = {};

        tokens.forEach(token => {
            if (token.length > 3 && !this.isStopWord(token)) {
                wordFreq[token] = (wordFreq[token] || 0) + 1;
            }
        });

        // Sort by frequency and get top 15
        const keywords = Object.entries(wordFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 15)
            .map(([word, count]) => ({ word, count }));

        return keywords;
    }

    /**
     * Calculate conversation metrics
     */
    calculateMetrics(messages) {
        const totalMessages = messages.length;
        const totalLength = messages.reduce((sum, msg) => sum + msg.text.length, 0);
        const avgMessageLength = totalMessages > 0 ? totalLength / totalMessages : 0;

        // Calculate response times (if timestamps available)
        let avgResponseTime = 0;
        let responseTimes = [];

        for (let i = 1; i < messages.length; i++) {
            if (messages[i].timestamp && messages[i - 1].timestamp) {
                const time1 = this.parseTime(messages[i - 1].timestamp);
                const time2 = this.parseTime(messages[i].timestamp);
                if (time1 && time2) {
                    responseTimes.push(time2 - time1);
                }
            }
        }

        if (responseTimes.length > 0) {
            avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
        }

        return {
            messageCount: totalMessages,
            avgMessageLength: avgMessageLength.toFixed(2),
            avgResponseTime: avgResponseTime.toFixed(2),
            totalCharacters: totalLength
        };
    }

    /**
     * Analyze agent performance
     */
    analyzeAgentPerformance(messages) {
        const agentMessages = messages.filter(m =>
            m.speaker.toLowerCase().includes('agent') ||
            m.speaker.toLowerCase().includes('support')
        );

        if (agentMessages.length === 0) {
            return { score: 50, messageCount: 0, avgLength: 0 };
        }

        // Score based on various factors
        let score = 50; // Base score

        // Professional language indicators
        const professionalWords = ['please', 'thank', 'help', 'assist', 'understand', 'apologize', 'certainly'];
        let professionalCount = 0;

        agentMessages.forEach(msg => {
            const lowerText = msg.text.toLowerCase();
            professionalWords.forEach(word => {
                if (lowerText.includes(word)) professionalCount++;
            });
        });

        // Adjust score based on professionalism
        score += Math.min(20, professionalCount * 2);

        // Response completeness (longer responses generally indicate thoroughness)
        const avgLength = agentMessages.reduce((sum, msg) => sum + msg.text.length, 0) / agentMessages.length;
        if (avgLength > 100) score += 10;
        if (avgLength > 200) score += 10;

        return {
            score: Math.min(100, score),
            messageCount: agentMessages.length,
            avgLength: avgLength.toFixed(2),
            professionalIndicators: professionalCount
        };
    }

    /**
     * Estimate customer satisfaction
     */
    estimateCustomerSatisfaction(messages) {
        const customerMessages = messages.filter(m =>
            m.speaker.toLowerCase().includes('customer') ||
            m.speaker.toLowerCase().includes('user')
        );

        if (customerMessages.length === 0) {
            return { score: 50, indicators: [] };
        }

        let score = 50;
        const indicators = [];

        // Positive indicators
        const positiveWords = ['thanks', 'thank you', 'great', 'perfect', 'excellent', 'appreciate', 'helpful'];
        const negativeWords = ['frustrated', 'angry', 'disappointed', 'terrible', 'awful', 'useless', 'waste'];

        customerMessages.forEach(msg => {
            const lowerText = msg.text.toLowerCase();

            positiveWords.forEach(word => {
                if (lowerText.includes(word)) {
                    score += 5;
                    indicators.push(`positive: ${word}`);
                }
            });

            negativeWords.forEach(word => {
                if (lowerText.includes(word)) {
                    score -= 5;
                    indicators.push(`negative: ${word}`);
                }
            });
        });

        return {
            score: Math.max(0, Math.min(100, score)),
            indicators: indicators.slice(0, 5)
        };
    }

    /**
     * Format results for database storage
     */
    formatResults(results) {
        return {
            conversation_id: results.conversation_id,
            overall_sentiment: results.sentiment.normalizedScore,
            sentiment_label: results.sentiment.label,
            positive_count: results.sentiment.positiveCount,
            negative_count: results.sentiment.negativeCount,
            neutral_count: results.sentiment.neutralCount,
            keywords: JSON.stringify(results.keywords),
            avg_message_length: parseFloat(results.metrics.avgMessageLength),
            avg_response_time: parseFloat(results.metrics.avgResponseTime),
            agent_performance_score: results.agentPerformance.score,
            customer_satisfaction_score: results.customerSatisfaction.score,
            message_count: results.metrics.messageCount
        };
    }

    /**
     * Helper: Check if word is a stop word
     */
    isStopWord(word) {
        const stopWords = [
            // Common English stop words
            'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'as', 'are', 'was', 'were', 'been', 'be',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
            'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what',
            'who', 'when', 'where', 'why', 'how', 'for', 'with', 'from', 'to', 'of', 'in', 'out', 'up', 'down',
            'but', 'or', 'not', 'no', 'yes', 'if', 'then', 'than', 'so', 'just', 'now', 'very', 'too', 'also',
            'only', 'some', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'such', 'own', 'same',
            'here', 'there', 'about', 'after', 'before', 'between', 'into', 'through', 'during', 'above', 'below',
            'off', 'over', 'under', 'again', 'further', 'once', 'while', 'because', 'until', 'since', 'though',
            'although', 'unless', 'whether', 'either', 'neither', 'nor', 'yet', 'still', 'even', 'ever', 'never',

            // Generic conversation/support terms (these appear in ALL conversations)
            'agent', 'customer', 'support', 'user', 'representative', 'rep', 'team', 'member', 'staff',

            // Greetings and closings
            'hello', 'hi', 'hey', 'greetings', 'welcome', 'goodbye', 'bye', 'farewell', 'later', 'cheers',

            // Politeness and acknowledgment
            'thanks', 'thank', 'please', 'sorry', 'apologize', 'apologies', 'excuse', 'pardon',
            'appreciate', 'appreciated', 'appreciation', 'grateful', 'gratitude', 'welcomed',

            // Help and assistance (generic)
            'help', 'helped', 'helping', 'helps', 'assist', 'assisted', 'assisting', 'assists', 'assistance',

            // Communication verbs
            'call', 'called', 'calling', 'calls', 'contact', 'contacted', 'contacting', 'contacts',
            'speak', 'spoke', 'speaking', 'speaks', 'talk', 'talked', 'talking', 'talks', 'tell', 'told',
            'say', 'said', 'saying', 'says', 'ask', 'asked', 'asking', 'asks', 'answer', 'answered',
            'reply', 'replied', 'respond', 'responded', 'chat', 'chatting', 'message', 'messaging',

            // Understanding and knowledge
            'understand', 'understood', 'understanding', 'understands', 'see', 'saw', 'seen', 'seeing',
            'know', 'knew', 'known', 'knowing', 'knows', 'aware', 'realize', 'realized',

            // Wanting and needing (too generic)
            'need', 'needed', 'needing', 'needs', 'want', 'wanted', 'wanting', 'wants', 'wish', 'wished',
            'like', 'liked', 'prefer', 'preferred',

            // Getting and having (too generic)
            'get', 'got', 'getting', 'gets', 'gotten', 'receive', 'received', 'receiving',
            'give', 'gave', 'given', 'giving', 'gives', 'take', 'took', 'taken', 'taking', 'takes',
            'make', 'made', 'making', 'makes', 'put', 'putting',

            // Being and doing (too generic)
            'come', 'came', 'coming', 'comes', 'go', 'went', 'going', 'goes', 'gone',
            'use', 'used', 'using', 'uses', 'try', 'tried', 'trying', 'tries', 'attempt', 'attempted',

            // Affirmations and negations
            'okay', 'ok', 'alright', 'fine', 'sure', 'certainly', 'definitely', 'absolutely',
            'right', 'correct', 'exactly', 'yes', 'yeah', 'yep', 'yup', 'nope', 'nah',

            // Qualifiers and intensifiers
            'well', 'really', 'actually', 'basically', 'literally', 'honestly', 'truly',
            'quite', 'rather', 'pretty', 'fairly', 'somewhat', 'kind', 'sort', 'type',
            'probably', 'possibly', 'maybe', 'perhaps', 'hopefully',

            // Quality descriptors (too generic without context)
            'good', 'better', 'best', 'great', 'excellent', 'wonderful', 'perfect', 'amazing',
            'bad', 'worse', 'worst', 'terrible', 'awful', 'horrible', 'poor',
            'new', 'old', 'different', 'same', 'similar', 'easy', 'hard', 'difficult',

            // Pronouns and determiners
            'my', 'your', 'his', 'her', 'its', 'our', 'their', 'mine', 'yours', 'ours', 'theirs',
            'myself', 'yourself', 'himself', 'herself', 'itself', 'ourselves', 'themselves',
            'one', 'ones', 'another', 'others',

            // Time references (too generic)
            'time', 'times', 'today', 'tomorrow', 'yesterday', 'day', 'days', 'week', 'weeks',
            'month', 'months', 'year', 'years', 'hour', 'hours', 'minute', 'minutes', 'second', 'seconds',
            'moment', 'moments', 'morning', 'afternoon', 'evening', 'night', 'soon', 'later', 'earlier',
            'currently', 'recently', 'previously', 'already', 'always', 'sometimes', 'often', 'usually',

            // Quantity and amount (too generic)
            'much', 'many', 'little', 'less', 'least', 'enough', 'several', 'couple', 'bit',

            // Actions without context
            'let', 'lets', 'letting', 'allow', 'allowed', 'enable', 'enabled',
            'start', 'started', 'starting', 'begin', 'began', 'begun', 'beginning',
            'end', 'ended', 'ending', 'finish', 'finished', 'finishing', 'complete', 'completed',
            'continue', 'continued', 'continuing', 'keep', 'kept', 'keeping',

            // Meta-conversation words
            'thing', 'things', 'stuff', 'something', 'anything', 'everything', 'nothing',
            'someone', 'anyone', 'everyone', 'nobody', 'somebody', 'anybody', 'everybody',
            'somewhere', 'anywhere', 'everywhere', 'nowhere',

            // Filler words and discourse markers
            'um', 'uh', 'hmm', 'ah', 'oh', 'you', 'know', 'mean',
            'essentially', 'generally', 'specifically', 'particularly'
        ];
        return stopWords.includes(word.toLowerCase());
    }

    /**
     * Helper: Parse time string to minutes
     */
    parseTime(timeStr) {
        const match = timeStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
        if (!match) return null;

        const hours = parseInt(match[1]);
        const minutes = parseInt(match[2]);
        const seconds = match[3] ? parseInt(match[3]) : 0;

        return hours * 60 + minutes + seconds / 60;
    }
}

export default TranscriptAnalyzer;
