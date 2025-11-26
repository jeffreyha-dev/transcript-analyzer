import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function AIInsightsPanel() {
    const [insights, setInsights] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadInsights();
    }, []);

    const loadInsights = async () => {
        try {
            setLoading(true);
            const [insightsData, statsData] = await Promise.all([
                api.getAIInsights(),
                api.getAIStats()
            ]);
            setInsights(insightsData);
            setStats(statsData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="card">
                <div className="card-header">
                    <h2>🤖 AI Insights</h2>
                </div>
                <div className="card-body" style={{ textAlign: 'center', padding: '2rem' }}>
                    <div className="spinner"></div>
                    <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading AI insights...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="card">
                <div className="card-header">
                    <h2>🤖 AI Insights</h2>
                </div>
                <div className="card-body">
                    <div className="alert alert-error">
                        <strong>Error:</strong> {error}
                    </div>
                </div>
            </div>
        );
    }

    if (!stats || stats.totalAnalyzed === 0) {
        return (
            <div className="card">
                <div className="card-header">
                    <h2>🤖 AI Insights</h2>
                </div>
                <div className="card-body" style={{ textAlign: 'center', padding: '2rem' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        No AI analysis data yet. Run AI analysis to see insights.
                    </p>
                </div>
            </div>
        );
    }

    const getScoreColor = (score) => {
        if (score >= 80) return '#10b981';
        if (score >= 60) return '#f59e0b';
        return '#ef4444';
    };

    const getScoreLabel = (score) => {
        if (score >= 80) return 'Excellent';
        if (score >= 60) return 'Good';
        if (score >= 40) return 'Fair';
        return 'Needs Improvement';
    };

    return (
        <div className="card">
            <div className="card-header">
                <h2>🤖 AI Insights</h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                    Powered by {insights?.costStats?.providers_used || 'Ollama'} • {stats.totalAnalyzed} conversations analyzed
                </p>
            </div>
            <div className="card-body">
                {/* Key Metrics */}
                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    <div className="metric-card">
                        <div className="metric-label">Resolution Rate</div>
                        <div className="metric-value" style={{ color: getScoreColor(stats.resolutionRate) }}>
                            {stats.resolutionRate?.toFixed(1)}%
                        </div>
                        <div className="metric-sublabel">{getScoreLabel(stats.resolutionRate)}</div>
                    </div>

                    <div className="metric-card">
                        <div className="metric-label">Avg Empathy</div>
                        <div className="metric-value" style={{ color: getScoreColor(stats.averageScores?.avg_empathy) }}>
                            {stats.averageScores?.avg_empathy?.toFixed(0)}
                        </div>
                        <div className="metric-sublabel">Agent empathy score</div>
                    </div>

                    <div className="metric-card">
                        <div className="metric-label">Communication</div>
                        <div className="metric-value" style={{ color: getScoreColor(stats.averageScores?.avg_communication) }}>
                            {stats.averageScores?.avg_communication?.toFixed(0)}
                        </div>
                        <div className="metric-sublabel">Quality score</div>
                    </div>

                    <div className="metric-card">
                        <div className="metric-label">Churn Risk</div>
                        <div className="metric-value" style={{ color: getScoreColor(100 - stats.averageScores?.avg_churn_risk) }}>
                            {stats.averageScores?.avg_churn_risk?.toFixed(0)}
                        </div>
                        <div className="metric-sublabel">{stats.highRiskConversations} high risk</div>
                    </div>
                </div>

                {/* Intent Distribution */}
                {stats.intentDistribution && stats.intentDistribution.length > 0 && (
                    <div style={{ marginTop: '2rem' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                            Top Intents
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {stats.intentDistribution.slice(0, 5).map((item, index) => (
                                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{
                                        minWidth: '150px',
                                        fontSize: '0.875rem',
                                        color: 'var(--text-secondary)',
                                        textTransform: 'capitalize'
                                    }}>
                                        {item.primary_intent?.replace(/_/g, ' ')}
                                    </div>
                                    <div style={{ flex: 1, position: 'relative', height: '24px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{
                                            position: 'absolute',
                                            left: 0,
                                            top: 0,
                                            height: '100%',
                                            width: `${(item.count / stats.totalAnalyzed) * 100}%`,
                                            background: 'linear-gradient(90deg, var(--primary-color), var(--secondary-color))',
                                            transition: 'width 0.3s ease'
                                        }}></div>
                                    </div>
                                    <div style={{ minWidth: '60px', textAlign: 'right', fontSize: '0.875rem', fontWeight: '600' }}>
                                        {item.count} ({((item.count / stats.totalAnalyzed) * 100).toFixed(0)}%)
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Cost Tracking */}
                {insights?.costStats && (
                    <div style={{
                        marginTop: '2rem',
                        padding: '1rem',
                        background: 'var(--bg-tertiary)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    Monthly Budget Usage
                                </div>
                                <div style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '0.25rem' }}>
                                    ${insights.costStats.total_cost?.toFixed(2) || '0.00'} / ${insights.costStats.budget?.toFixed(2)}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    Remaining
                                </div>
                                <div style={{
                                    fontSize: '1.25rem',
                                    fontWeight: '600',
                                    color: insights.costStats.remaining > 2 ? '#10b981' : '#ef4444'
                                }}>
                                    ${insights.costStats.remaining?.toFixed(2)}
                                </div>
                            </div>
                        </div>
                        <div style={{ marginTop: '0.75rem', height: '8px', background: 'var(--bg-primary)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{
                                height: '100%',
                                width: `${Math.min(100, insights.costStats.percentUsed)}%`,
                                background: insights.costStats.percentUsed > 80 ? '#ef4444' : 'linear-gradient(90deg, var(--primary-color), var(--secondary-color))',
                                transition: 'width 0.3s ease'
                            }}></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
