import { useState, useEffect } from 'react';
import api from '../utils/api';
import AIInsightsPanel from './AIInsightsPanel';
import { useAccount } from '../context/AccountContext';

export default function Dashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { selectedAccount } = useAccount();

    useEffect(() => {
        loadDashboard();
    }, [selectedAccount]);

    const loadDashboard = async () => {
        try {
            setLoading(true);
            const response = await api.getDashboardData(selectedAccount);
            setData(response);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="container" style={{ paddingTop: '4rem', textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto' }}></div>
                <p className="mt-md" style={{ color: 'var(--text-secondary)' }}>Loading dashboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container" style={{ paddingTop: '2rem' }}>
                <div className="card" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--accent-danger)' }}>
                    <h3 style={{ color: 'var(--accent-danger)' }}>Error Loading Dashboard</h3>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{error}</p>
                    <button className="btn btn-primary mt-md" onClick={loadDashboard}>Retry</button>
                </div>
            </div>
        );
    }

    const { overview, sentimentDistribution, recentConversations } = data || {};

    return (
        <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
            <div className="flex justify-between items-center mb-lg">
                <div>
                    <h1>Dashboard</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        Overview of conversation analytics and insights
                    </p>
                </div>
                <button className="btn btn-secondary" onClick={loadDashboard}>
                    🔄 Refresh
                </button>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-4 gap-md mb-lg">
                <div className="stat-card">
                    <div className="stat-value">{overview?.totalConversations || 0}</div>
                    <div className="stat-label">Total Conversations</div>
                </div>

                <div className="stat-card">
                    <div className="stat-value">{overview?.totalAnalyzed || 0}</div>
                    <div className="stat-label">Analyzed</div>
                </div>

                <div className="stat-card">
                    <div className="stat-value" style={{ backgroundImage: getSentimentGradient(overview?.avgSentiment) }}>
                        {overview?.avgSentiment || 0}
                    </div>
                    <div className="stat-label">
                        Avg Sentiment Score
                        <span className="tooltip" data-tooltip="Average overall sentiment score (0-100) across all analyzed conversations" style={{ marginLeft: '4px', opacity: 0.7 }}>ℹ️</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-value" style={{ backgroundImage: 'var(--gradient-success)' }}>
                        {overview?.avgAgentScore || 0}
                    </div>
                    <div className="stat-label">
                        Avg Agent Score
                        <span className="tooltip" data-tooltip="Average agent performance score (0-100) based on empathy, resolution, and communication quality" style={{ marginLeft: '4px', opacity: 0.7 }}>ℹ️</span>
                    </div>
                </div>
            </div>

            {/* Sentiment Distribution */}
            <div className="card mb-lg">
                <h3 className="card-title">Sentiment Distribution</h3>
                <div className="mt-md">
                    {sentimentDistribution && sentimentDistribution.length > 0 ? (
                        sentimentDistribution.map((item) => (
                            <div key={item.sentiment_label} className="mb-md">
                                <div className="flex justify-between items-center mb-sm">
                                    <span className={`badge badge-${getSentimentBadgeType(item.sentiment_label)}`}>
                                        {item.sentiment_label}
                                    </span>
                                    <span style={{ fontWeight: 600 }}>{item.count}</span>
                                </div>
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill"
                                        style={{
                                            width: `${(item.count / overview?.totalAnalyzed) * 100}%`,
                                            background: getSentimentColor(item.sentiment_label)
                                        }}
                                    ></div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
                            No sentiment data available
                        </p>
                    )}
                </div>
            </div>

            {/* AI Insights Panel */}
            <div className="mb-lg">
                <AIInsightsPanel />
            </div>

            {/* Recent Conversations */}
            <div className="card">
                <h3 className="card-title mb-md">Recent Conversations</h3>
                {recentConversations && recentConversations.length > 0 ? (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Conversation ID</th>
                                    <th>Date</th>
                                    <th>Uploaded</th>
                                    <th>Sentiment</th>
                                    <th>Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentConversations.map((conv) => (
                                    <tr key={conv.conversation_id}>
                                        <td style={{ fontFamily: 'monospace', color: 'var(--accent-primary)' }}>
                                            {conv.conversation_id}
                                        </td>
                                        <td>{conv.conversation_date || 'N/A'}</td>
                                        <td>{new Date(conv.uploaded_at).toLocaleDateString()}</td>
                                        <td>
                                            {conv.sentiment_label ? (
                                                <span className={`badge badge-${getSentimentBadgeType(conv.sentiment_label)}`}>
                                                    {conv.sentiment_label}
                                                </span>
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)' }}>Not analyzed</span>
                                            )}
                                        </td>
                                        <td style={{ fontWeight: 600 }}>
                                            {conv.overall_sentiment ? conv.overall_sentiment.toFixed(1) : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
                        No conversations yet. Upload some to get started!
                    </p>
                )}
            </div>
        </div>
    );
}

function getSentimentGradient(score) {
    if (!score) return 'var(--gradient-primary)';
    if (score >= 70) return 'var(--gradient-success)';
    if (score >= 50) return 'var(--gradient-primary)';
    return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
}

function getSentimentColor(label) {
    const lower = label?.toLowerCase() || '';
    if (lower.includes('positive')) return 'var(--gradient-success)';
    if (lower.includes('negative')) return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
    return 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)';
}

function getSentimentBadgeType(label) {
    const lower = label?.toLowerCase() || '';
    if (lower.includes('positive')) return 'positive';
    if (lower.includes('negative')) return 'negative';
    return 'neutral';
}
