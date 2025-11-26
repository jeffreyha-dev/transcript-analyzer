const API_BASE_URL = 'http://localhost:3000/api';

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

    async getAnalysisResults(page = 1, limit = 50, sentiment = null) {
        let url = `/analysis/results?page=${page}&limit=${limit}`;
        if (sentiment) url += `&sentiment=${sentiment}`;
        return this.request(url);
    }

    async getDashboardData() {
        return this.request('/analysis/dashboard');
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

    async getAIResults(page = 1, limit = 50, filters = {}) {
        let url = `/ai-analysis/results?page=${page}&limit=${limit}`;
        if (filters.intent) url += `&intent=${filters.intent}`;
        if (filters.complexity) url += `&complexity=${filters.complexity}`;
        if (filters.minChurnRisk) url += `&min_churn_risk=${filters.minChurnRisk}`;
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
}

export default new APIClient();
