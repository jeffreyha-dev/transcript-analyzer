import 'dotenv/config';
import { Ollama } from 'ollama';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { runQuery, getOne, getAll } from './database.js';

/**
 * LLM Service - Multi-provider support with cost tracking
 * Primary: Ollama (local, free)
 * Fallback: OpenAI, Google Gemini
 */
class LLMService {
    constructor() {
        // Configuration
        // Initial Configuration (Defaults from env)
        this.config = {
            enabled: process.env.AI_ENABLED === 'true',
            primaryProvider: process.env.AI_PRIMARY_PROVIDER || 'ollama',
            fallbackEnabled: process.env.AI_FALLBACK_ENABLED === 'true',
            monthlyBudget: parseFloat(process.env.AI_MONTHLY_BUDGET || '10.00'),
            costAlertThreshold: parseFloat(process.env.AI_COST_ALERT_THRESHOLD || '8.00'),
            ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
            ollamaModel: process.env.OLLAMA_MODEL || 'llama3.1:8b',
            openaiApiKey: process.env.OPENAI_API_KEY,
            openaiModel: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
            geminiApiKey: process.env.GEMINI_API_KEY,
            geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash'
        };

        // Initialize providers
        this.initializeProviders();

        // Cost tracking
        this.currentMonthCost = 0;
        this.loadCurrentMonthCost();
    }

    initializeProviders() {
        // Ollama (Primary)
        try {
            this.ollama = new Ollama({
                host: this.config.ollamaBaseUrl
            });
            this.ollamaModel = this.config.ollamaModel;
            console.log('✓ Ollama initialized:', this.ollamaModel);
        } catch (error) {
            console.warn('⚠ Ollama initialization failed:', error.message);
        }

        // OpenAI (Fallback)
        if (this.config.openaiApiKey) {
            this.openai = new OpenAI({
                apiKey: this.config.openaiApiKey
            });
            this.openaiModel = this.config.openaiModel;
            console.log('✓ OpenAI initialized:', this.openaiModel);
        }

        // Google Gemini (Fallback)
        if (this.config.geminiApiKey) {
            this.gemini = new GoogleGenerativeAI(this.config.geminiApiKey);
            this.geminiModel = this.config.geminiModel;
            console.log('✓ Gemini initialized:', this.geminiModel);
        }
    }

    async reloadConfig() {
        try {
            const settings = await getAll('SELECT * FROM ai_settings');

            if (settings && settings.length > 0) {
                const dbConfig = {};
                settings.forEach(s => {
                    dbConfig[s.setting_key] = s.setting_value;
                });

                // Update config with DB values, falling back to existing/env defaults
                this.config = {
                    ...this.config,
                    enabled: dbConfig.AI_ENABLED === 'true',
                    primaryProvider: dbConfig.AI_PRIMARY_PROVIDER || this.config.primaryProvider,
                    fallbackEnabled: dbConfig.AI_FALLBACK_ENABLED === 'true',
                    monthlyBudget: parseFloat(dbConfig.AI_MONTHLY_BUDGET || this.config.monthlyBudget),
                    costAlertThreshold: parseFloat(dbConfig.AI_COST_ALERT_THRESHOLD || this.config.costAlertThreshold),
                    ollamaBaseUrl: dbConfig.OLLAMA_BASE_URL || this.config.ollamaBaseUrl,
                    ollamaModel: dbConfig.OLLAMA_MODEL || this.config.ollamaModel,
                    openaiApiKey: dbConfig.OPENAI_API_KEY || this.config.openaiApiKey,
                    openaiModel: dbConfig.OPENAI_MODEL || this.config.openaiModel,
                    geminiApiKey: dbConfig.GEMINI_API_KEY || this.config.geminiApiKey,
                    geminiModel: dbConfig.GEMINI_MODEL || this.config.geminiModel
                };
                console.log('✓ AI Configuration reloaded from database');
            }

            // Re-initialize providers with new config
            this.initializeProviders();
        } catch (error) {
            console.error('Failed to reload config:', error);
        }
    }

    async loadCurrentMonthCost() {
        try {
            const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
            const result = await getOne(
                `SELECT SUM(total_cost) as cost FROM ai_cost_tracking 
                 WHERE strftime('%Y-%m', date) = ?`,
                [currentMonth]
            );
            this.currentMonthCost = result?.cost || 0;
        } catch (error) {
            console.warn('Could not load current month cost:', error.message);
            this.currentMonthCost = 0;
        }
    }

    /**
     * Main analyze method - routes to appropriate provider
     */
    async analyze(prompt, options = {}) {
        if (!this.config.enabled) {
            throw new Error('AI analysis is disabled');
        }

        const startTime = Date.now();
        let result;
        let provider;
        let tokensUsed = 0;
        let cost = 0;

        try {
            // Helper function to check if a provider is available
            const isProviderAvailable = (providerName) => {
                if (providerName === 'ollama') return !!this.ollama;
                if (providerName === 'openai') return !!this.openai && this.config.openaiApiKey && !this.config.openaiApiKey.includes('your-');
                if (providerName === 'gemini') return !!this.gemini && this.config.geminiApiKey && !this.config.geminiApiKey.includes('your-');
                return false;
            };

            // Helper function to try a specific provider
            const tryProvider = async (providerName) => {
                if (providerName === 'ollama' && isProviderAvailable('ollama')) {
                    const content = await this.analyzeWithOllama(prompt, options);
                    return {
                        content,
                        provider: 'ollama',
                        tokensUsed: this.estimateTokens(prompt + content),
                        cost: 0
                    };
                } else if (providerName === 'openai' && isProviderAvailable('openai')) {
                    // Check budget before using paid API
                    if (this.currentMonthCost >= this.config.monthlyBudget) {
                        throw new Error(`Monthly budget of $${this.config.monthlyBudget} exceeded`);
                    }
                    const response = await this.analyzeWithOpenAI(prompt, options);
                    return {
                        content: response.content,
                        provider: 'openai',
                        tokensUsed: response.tokensUsed,
                        cost: response.cost
                    };
                } else if (providerName === 'gemini' && isProviderAvailable('gemini')) {
                    // Check budget before using paid API
                    if (this.currentMonthCost >= this.config.monthlyBudget) {
                        throw new Error(`Monthly budget of $${this.config.monthlyBudget} exceeded`);
                    }
                    const response = await this.analyzeWithGemini(prompt, options);
                    return {
                        content: response.content,
                        provider: 'gemini',
                        tokensUsed: response.tokensUsed,
                        cost: response.cost
                    };
                }
                throw new Error(`Provider ${providerName} is not available or not configured`);
            };

            // Try primary provider first
            const primaryProvider = this.config.primaryProvider;
            if (isProviderAvailable(primaryProvider)) {
                try {
                    const response = await tryProvider(primaryProvider);
                    result = response.content;
                    provider = response.provider;
                    tokensUsed = response.tokensUsed;
                    cost = response.cost;
                } catch (error) {
                    console.warn(`${primaryProvider} failed:`, error.message);
                    if (!this.config.fallbackEnabled) {
                        throw error;
                    }
                }
            } else {
                console.warn(`Primary provider ${primaryProvider} is not available or not configured`);
                if (!this.config.fallbackEnabled) {
                    throw new Error(`Primary provider ${primaryProvider} is not available. Please configure the API key or enable fallback.`);
                }
            }

            // Try fallback providers if primary failed and fallback is enabled
            if (!result && this.config.fallbackEnabled) {
                const fallbackOrder = ['ollama', 'gemini', 'openai'].filter(p => p !== primaryProvider);

                for (const fallbackProvider of fallbackOrder) {
                    if (!result && isProviderAvailable(fallbackProvider)) {
                        try {
                            const response = await tryProvider(fallbackProvider);
                            result = response.content;
                            provider = response.provider;
                            tokensUsed = response.tokensUsed;
                            cost = response.cost;
                            console.log(`✓ Fallback to ${fallbackProvider} successful`);
                            break;
                        } catch (error) {
                            console.warn(`${fallbackProvider} fallback failed:`, error.message);
                        }
                    }
                }
            }

            if (!result) {
                throw new Error('All available LLM providers failed. Please check your API keys and provider configuration.');
            }

            const processingTime = Date.now() - startTime;

            // Track cost if using paid API
            if (cost > 0) {
                await this.trackCost(provider, tokensUsed, cost);
                this.currentMonthCost += cost;

                // Alert if approaching budget
                if (this.currentMonthCost >= this.config.costAlertThreshold) {
                    console.warn(`⚠ AI cost alert: $${this.currentMonthCost.toFixed(2)} / $${this.config.monthlyBudget}`);
                }
            }

            return {
                content: result,
                provider,
                tokensUsed,
                cost,
                processingTime
            };

        } catch (error) {
            console.error('LLM analysis failed:', error);
            throw error;
        }
    }

    /**
     * Analyze with Ollama (local, free)
     */
    async analyzeWithOllama(prompt, options = {}) {
        const response = await this.ollama.generate({
            model: this.ollamaModel,
            prompt: prompt,
            stream: false,
            options: {
                temperature: options.temperature || 0.7,
                top_p: options.top_p || 0.9,
            }
        });

        return response.response;
    }

    /**
     * Analyze with OpenAI
     */
    async analyzeWithOpenAI(prompt, options = {}) {
        const response = await this.openai.chat.completions.create({
            model: this.openaiModel,
            messages: [
                { role: 'system', content: 'You are a helpful assistant that analyzes customer service conversations. Always respond with valid JSON.' },
                { role: 'user', content: prompt }
            ],
            temperature: options.temperature || 0.7,
            max_tokens: options.max_tokens || 2000,
        });

        const content = response.choices[0].message.content;
        const tokensUsed = response.usage.total_tokens;

        // Cost calculation for GPT-3.5-turbo (as of 2024)
        // Input: $0.0005 per 1K tokens, Output: $0.0015 per 1K tokens
        const inputCost = (response.usage.prompt_tokens / 1000) * 0.0005;
        const outputCost = (response.usage.completion_tokens / 1000) * 0.0015;
        const cost = inputCost + outputCost;

        return { content, tokensUsed, cost };
    }

    /**
     * Analyze with Google Gemini
     */
    async analyzeWithGemini(prompt, options = {}) {
        const model = this.gemini.getGenerativeModel({ model: this.geminiModel });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const content = response.text();

        // Estimate tokens (Gemini doesn't provide exact count in all cases)
        const tokensUsed = this.estimateTokens(prompt + content);

        // Cost calculation for Gemini 1.5 Flash (as of 2024)
        // Input: $0.00001875 per 1K tokens, Output: $0.000075 per 1K tokens
        const estimatedInputTokens = this.estimateTokens(prompt);
        const estimatedOutputTokens = this.estimateTokens(content);
        const cost = (estimatedInputTokens / 1000) * 0.00001875 + (estimatedOutputTokens / 1000) * 0.000075;

        return { content, tokensUsed, cost };
    }

    /**
     * Estimate token count (rough approximation)
     */
    estimateTokens(text) {
        // Rough estimate: ~4 characters per token
        return Math.ceil(text.length / 4);
    }

    /**
     * Track API costs in database
     */
    async trackCost(provider, tokens, cost) {
        try {
            const today = new Date().toISOString().split('T')[0];

            // Check if entry exists for today and provider
            const existing = await getOne(
                'SELECT * FROM ai_cost_tracking WHERE date = ? AND provider = ?',
                [today, provider]
            );

            if (existing) {
                // Update existing entry
                await runQuery(
                    `UPDATE ai_cost_tracking 
                     SET conversations_analyzed = conversations_analyzed + 1,
                         total_tokens = total_tokens + ?,
                         total_cost = total_cost + ?
                     WHERE date = ? AND provider = ?`,
                    [tokens, cost, today, provider]
                );
            } else {
                // Insert new entry
                await runQuery(
                    `INSERT INTO ai_cost_tracking (date, provider, conversations_analyzed, total_tokens, total_cost)
                     VALUES (?, ?, 1, ?, ?)`,
                    [today, provider, tokens, cost]
                );
            }
        } catch (error) {
            console.error('Failed to track cost:', error);
        }
    }

    /**
     * Get cost statistics
     */
    async getCostStats(period = 'month') {
        try {
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

            const stats = await getOne(
                `SELECT 
                    SUM(conversations_analyzed) as total_conversations,
                    SUM(total_tokens) as total_tokens,
                    SUM(total_cost) as total_cost,
                    COUNT(DISTINCT provider) as providers_used
                 FROM ai_cost_tracking 
                 WHERE ${dateFilter}`
            );

            return {
                ...stats,
                budget: this.config.monthlyBudget,
                remaining: this.config.monthlyBudget - (stats?.total_cost || 0),
                percentUsed: ((stats?.total_cost || 0) / this.config.monthlyBudget) * 100
            };
        } catch (error) {
            console.error('Failed to get cost stats:', error);
            return null;
        }
    }

    /**
     * Parse JSON response from LLM (with error handling)
     */
    parseJSON(content) {
        try {
            // Try to extract JSON from markdown code blocks
            const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) ||
                content.match(/```\n([\s\S]*?)\n```/);

            if (jsonMatch) {
                return JSON.parse(jsonMatch[1]);
            }

            // Try direct parse
            return JSON.parse(content);
        } catch (error) {
            console.error('Failed to parse JSON response:', error);
            console.error('Content:', content);
            throw new Error('Invalid JSON response from LLM');
        }
    }
}

// Export singleton instance
export const llmService = new LLMService();
export default llmService;
