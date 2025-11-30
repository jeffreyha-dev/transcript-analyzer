import { useState, useEffect } from 'react';
import { AlertCircle, TrendingUp, CheckCircle, Sparkles } from 'lucide-react';
import api from '../../utils/api';

export default function IntentInsightsPanel({ accountId = null }) {
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchInsights();
    }, [accountId]);

    const fetchInsights = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.getIntentInsights(accountId);
            setInsights(data);
        } catch (err) {
            console.error('Failed to load intent insights:', err);
            setError('Failed to generate insights');
        } finally {
            setLoading(false);
        }
    };

    const getPriorityIcon = (priority) => {
        switch (priority) {
            case 'critical':
                return <AlertCircle size={18} className="text-danger" />;
            case 'high':
                return <TrendingUp size={18} className="text-warning" />;
            case 'medium':
                return <CheckCircle size={18} className="text-info" />;
            default:
                return <Sparkles size={18} className="text-secondary" />;
        }
    };

    const getPriorityBadge = (priority) => {
        const badges = {
            critical: { label: '🚨 Critical', class: 'badge-danger' },
            high: { label: '⚠️ High', class: 'badge-warning' },
            medium: { label: 'ℹ️ Medium', class: 'badge-info' }
        };
        return badges[priority] || { label: priority, class: 'badge-secondary' };
    };

    if (loading) {
        return (
            <div className="card p-lg">
                <div className="flex items-center gap-sm mb-md">
                    <Sparkles size={20} />
                    <h3 className="text-lg font-semibold">AI-Powered Insights</h3>
                </div>
                <div className="flex justify-center p-xl">
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="card p-lg border-danger">
                <div className="flex items-center gap-sm mb-md">
                    <AlertCircle size={20} className="text-danger" />
                    <h3 className="text-lg font-semibold text-danger">Insights Error</h3>
                </div>
                <p className="text-sm text-secondary">{error}</p>
            </div>
        );
    }

    if (!insights || !insights.recommendations || insights.recommendations.length === 0) {
        return (
            <div className="card p-lg">
                <div className="flex items-center gap-sm mb-md">
                    <Sparkles size={20} />
                    <h3 className="text-lg font-semibold">AI-Powered Insights</h3>
                </div>
                <p className="text-sm text-secondary">No insights available. Analyze more conversations to generate recommendations.</p>
            </div>
        );
    }

    return (
        <div className="card p-lg">
            <div className="flex justify-between items-center mb-md">
                <div className="flex items-center gap-sm">
                    <Sparkles size={20} style={{ color: 'var(--accent-primary)' }} />
                    <h3 className="text-lg font-semibold">AI-Powered Insights</h3>
                </div>
                {insights.metadata && (
                    <div className="text-xs text-secondary">
                        Based on {insights.metadata.totalConversations} conversations
                    </div>
                )}
            </div>

            <div className="space-y-md">
                {insights.recommendations.map((rec, index) => {
                    const badge = getPriorityBadge(rec.priority);
                    return (
                        <div
                            key={index}
                            className="p-md rounded"
                            style={{
                                backgroundColor: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)'
                            }}
                        >
                            <div className="flex items-start gap-sm mb-xs">
                                {getPriorityIcon(rec.priority)}
                                <div className="flex-1">
                                    <div className="flex items-center gap-sm mb-xs">
                                        <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                                            {rec.title}
                                        </h4>
                                        <span className={`badge ${badge.class} text-xs`}>
                                            {badge.label}
                                        </span>
                                    </div>
                                    <p className="text-sm mb-xs" style={{ color: 'var(--text-secondary)' }}>
                                        {rec.description}
                                    </p>
                                    {rec.impact && (
                                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                            <strong>Impact:</strong> {rec.impact}
                                        </div>
                                    )}
                                    {rec.intent && (
                                        <div className="text-xs mt-xs" style={{ color: 'var(--accent-primary)' }}>
                                            <strong>Related Intent:</strong> {rec.intent}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {insights.metadata && insights.metadata.criticalCount > 0 && (
                <div className="mt-md pt-md border-t border-border">
                    <div className="text-xs text-secondary">
                        💡 <strong>{insights.metadata.criticalCount}</strong> critical issues identified requiring immediate attention
                    </div>
                </div>
            )}
        </div>
    );
}
