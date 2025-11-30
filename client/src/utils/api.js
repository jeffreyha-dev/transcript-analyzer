export const API_BASE_URL = 'http://localhost:3000/api';

class APIClient {
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;

        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Request failed');
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Conversations
    async uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/conversations/upload`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Upload failed');
        }

        return await response.json();
    }

    async uploadBulk(conversations) {
        return this.request('/conversations/bulk', {
            method: 'POST',
            body: JSON.stringify({ conversations }),
        });
    }

    async getConversations(page = 1, limit = 50) {
        return this.request(`/conversations?page=${page}&limit=${limit}`);
    }

    async getConversation(id) {
        return this.request(`/conversations/${id}`);
    }

    async deleteConversation(id) {
        return this.request(`/conversations/${id}`, { method: 'DELETE' });
    }

    async deleteAllConversations() {
        return this.request('/conversations/all', { method: 'DELETE' });
    }

    // Analysis
    async runAnalysis(conversationIds = null) {
        return this.request('/analysis/run', {
            method: 'POST',
            body: JSON.stringify({ conversation_ids: conversationIds }),
        });
    }

    async getAnalysisResults(page = 1, limit = 50, sentiment = null, accountId = null) {
        let url = `/analysis/results?page=${page}&limit=${limit}`;
        if (sentiment) url += `&sentiment=${sentiment}`;
        if (accountId) url += `&account_id=${accountId}`;
        return this.request(url);
    }

    async getDashboardData(accountId = null) {
        let url = '/analysis/dashboard';
        if (accountId) url += `?account_id=${accountId}`;
        return this.request(url);
    }

    async exportResults(format = 'json') {
        const response = await fetch(`${API_BASE_URL}/analysis/export?format=${format}`);

        if (!response.ok) {
            throw new Error('Export failed');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analysis_results.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }

    // AI Analysis
    async runAIAnalysis(conversationIds = null) {
        return this.request('/ai-analysis/run', {
            method: 'POST',
            body: JSON.stringify({ conversation_ids: conversationIds }),
        });
    }

    async getAIResults(page = 1, limit = 50, filters = {}, accountId = null) {
        let url = `/ai-analysis/results?page=${page}&limit=${limit}`;
        if (filters.intent) url += `&intent=${filters.intent}`;
        if (filters.complexity) url += `&complexity=${filters.complexity}`;
        if (filters.minChurnRisk) url += `&min_churn_risk=${filters.minChurnRisk}`;
        if (accountId) url += `&account_id=${accountId}`;
        return this.request(url);
    }

    async getIntentStats(accountId = null) {
        let url = '/ai-analysis/intents';
        if (accountId) url += `?account_id=${accountId}`;
        return this.request(url);
    }

    async getAISummary(conversationId) {
        return this.request(`/ai-analysis/summary/${conversationId}`);
    }

    async getAIInsights() {
        return this.request('/ai-analysis/insights');
    }

    async getAICosts(period = 'month') {
        return this.request(`/ai-analysis/costs?period=${period}`);
    }

    async getAIStats() {
        return this.request('/ai-analysis/stats');
    }

    async getTrends(days = 30, accountId = null) {
        let url = `/ai-analysis/trends?days=${days}`;
        if (accountId) url += `&account_id=${accountId}`;
        return this.request(url);
    }

    async getChurnRisks(accountId = null, riskLevel = null) {
        let url = '/ai-analysis/churn-risks?';
        if (accountId) url += `account_id=${accountId}&`;
        if (riskLevel) url += `risk_level=${riskLevel}&`;
        return this.request(url);
    }

    async calculateChurn(conversationIds = null) {
        return this.request('/ai-analysis/calculate-churn', {
            method: 'POST',
            body: JSON.stringify({ conversation_ids: conversationIds })
        });
    }

    async getSettings() {
        return this.request('/settings');
    }

    async updateSettings(settings) {
        return this.request('/settings', {
            method: 'PUT',
            body: JSON.stringify(settings)
        });
    }

    // Prompts
    async getPrompts() {
        return this.request('/prompts');
    }

    async getActivePrompt() {
        return this.request('/prompts/active');
    }

    async createPrompt(prompt) {
        return this.request('/prompts', {
            method: 'POST',
            body: JSON.stringify(prompt)
        });
    }

    async updatePrompt(id, prompt) {
        return this.request(`/prompts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(prompt)
        });
    }

    async activatePrompt(id) {
        return this.request(`/prompts/${id}/activate`, { method: 'POST' });
    }

    async resetPrompt() {
        return this.request('/prompts/reset', { method: 'POST' });
    }

    async generatePrompt(description) {
        return this.request('/prompts/generate', {
            method: 'POST',
            body: JSON.stringify({ description })
        });
    }

    async deletePrompt(id) {
        return this.request(`/prompts/${id}`, { method: 'DELETE' });
    }

    // Metric Configs
    async getMetricConfigs() {
        return this.request('/metric-configs');
    }

    async getMetricConfig(name) {
        return this.request(`/metric-configs/${name}`);
    }

    async saveMetricConfig(config) {
        return this.request('/metric-configs', {
            method: 'POST',
            body: JSON.stringify(config)
        });
    }

    async deleteMetricConfig(name) {
        return this.request(`/metric-configs/${name}`, { method: 'DELETE' });
    }

    // Analysis Config
    async getAnalysisConfig() {
        return this.request('/analysis-config');
    }

    async getAnalysisConfigByType(type) {
        return this.request(`/analysis-config/${type}`);
    }

    async updateAnalysisConfig(config) {
        return this.request('/analysis-config', {
            method: 'PUT',
            body: JSON.stringify(config)
        });
    }

    async resetAnalysisConfig() {
        return this.request('/analysis-config/reset', { method: 'POST' });
    }

    // Analytics
    async getHeatmapData(dateRange, sentimentFilter) {
        const params = new URLSearchParams();
        if (dateRange) params.append('dateRange', dateRange);
        if (sentimentFilter) params.append('sentimentFilter', sentimentFilter);
        return this.request(`/analytics/heatmap?${params.toString()}`);
    }

    async getTopicClusters(dateRange, sentimentFilter) {
        const params = new URLSearchParams();
        if (dateRange) params.append('dateRange', dateRange);
        if (sentimentFilter) params.append('sentimentFilter', sentimentFilter);
        return this.request(`/analytics/topics?${params.toString()}`);
    }

    // LivePerson
    async getLPAccounts() {
        return this.request('/liveperson/accounts');
    }

    async getActiveLPAccounts() {
        return this.request('/liveperson/accounts/active');
    }

    async getLPAccount(id) {
        return this.request(`/liveperson/accounts/${id}`);
    }

    async createLPAccount(accountData) {
        return this.request('/liveperson/accounts', {
            method: 'POST',
            body: JSON.stringify(accountData),
        });
    }

    async updateLPAccount(id, accountData) {
        return this.request(`/liveperson/accounts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(accountData),
        });
    }

    async deleteLPAccount(id) {
        return this.request(`/liveperson/accounts/${id}`, {
            method: 'DELETE',
        });
    }

    async toggleLPAccount(id, is_active) {
        return this.request(`/liveperson/accounts/${id}/toggle`, {
            method: 'POST',
            body: JSON.stringify({ is_active }),
        });
    }

    async testLPConnection(id) {
        return this.request(`/liveperson/accounts/${id}/test`, {
            method: 'POST',
        });
    }

    async fetchLPConversations(params) {
        return this.request('/liveperson/fetch', {
            method: 'POST',
            body: JSON.stringify(params),
        });
    }
}

export default new APIClient();
