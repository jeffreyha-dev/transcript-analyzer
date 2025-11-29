import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAccount } from '../context/AccountContext';

export default function ChurnRiskPanel() {
    const [churnData, setChurnData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { selectedAccount } = useAccount();

    useEffect(() => {
        loadChurnRisks();
    }, [selectedAccount]);

    const loadChurnRisks = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await api.getChurnRisks(selectedAccount);
            setChurnData(data);
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
                    <h3>🚨 Churn Risk Analysis</h3>
                </div>
                <div className="card-body" style={{ textAlign: 'center', padding: '2rem' }}>
                    <div className="spinner"></div>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>Loading churn risks...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="card">
                <div className="card-header">
                    <h3>🚨 Churn Risk Analysis</h3>
                </div>
                <div className="card-body">
                    <p style={{ color: 'var(--accent-danger)' }}>Error: {error}</p>
                </div>
            </div>
        );
    }

    if (!churnData || !churnData.statistics) {
        return (
            <div className="card">
                <div className="card-header">
                    <h3>🚨 Churn Risk Analysis</h3>
                </div>
                <div className="card-body" style={{ textAlign: 'center', padding: '2rem' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>No churn data available</p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        Run AI analysis to calculate churn risks
                    </p>
                </div>
            </div>
        );
    }

    const { statistics } = churnData;
    const total = statistics.high + statistics.medium + statistics.low;

    const getRiskColor = (level) => {
        switch (level) {
            case 'high': return 'var(--accent-danger)';
            case 'medium': return 'var(--accent-warning)';
            case 'low': return 'var(--accent-success)';
            default: return 'var(--text-secondary)';
        }
    };

    const getRiskIcon = (level) => {
        switch (level) {
            case 'high': return '🔴';
            case 'medium': return '🟡';
            case 'low': return '🟢';
            default: return '⚪';
        }
    };

    return (
        <div className="card">
            <div className="card-header">
                <h3>🚨 Churn Risk Analysis</h3>
            </div>
            <div className="card-body">
                {/* Risk Summary */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '1rem',
                    marginBottom: '1.5rem'
                }}>
                    <div style={{
                        padding: '1rem',
                        background: 'var(--bg-tertiary)',
                        borderRadius: 'var(--radius-md)',
                        border: `2px solid ${getRiskColor('high')}`,
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                            {getRiskIcon('high')}
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: getRiskColor('high') }}>
                            {statistics.high}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                            High Risk
                        </div>
                    </div>

                    <div style={{
                        padding: '1rem',
                        background: 'var(--bg-tertiary)',
                        borderRadius: 'var(--radius-md)',
                        border: `2px solid ${getRiskColor('medium')}`,
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                            {getRiskIcon('medium')}
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: getRiskColor('medium') }}>
                            {statistics.medium}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                            Medium Risk
                        </div>
                    </div>

                    <div style={{
                        padding: '1rem',
                        background: 'var(--bg-tertiary)',
                        borderRadius: 'var(--radius-md)',
                        border: `2px solid ${getRiskColor('low')}`,
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                            {getRiskIcon('low')}
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: getRiskColor('low') }}>
                            {statistics.low}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                            Low Risk
                        </div>
                    </div>
                </div>

                {/* Insights */}
                {statistics.high > 0 && (
                    <div style={{
                        padding: '1rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid var(--accent-danger)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '1rem'
                    }}>
                        <div style={{ fontWeight: 600, color: 'var(--accent-danger)', marginBottom: '0.5rem' }}>
                            ⚠️ Action Required
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                            {statistics.high} customer{statistics.high > 1 ? 's' : ''} at high risk of churning.
                            Immediate intervention recommended.
                        </div>
                    </div>
                )}

                {/* Progress Bar */}
                {total > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                            marginBottom: '0.5rem'
                        }}>
                            <span>Risk Distribution</span>
                            <span>{total} total conversations</span>
                        </div>
                        <div style={{
                            height: '8px',
                            background: 'var(--bg-tertiary)',
                            borderRadius: '4px',
                            overflow: 'hidden',
                            display: 'flex'
                        }}>
                            <div style={{
                                width: `${(statistics.high / total) * 100}%`,
                                background: getRiskColor('high')
                            }} />
                            <div style={{
                                width: `${(statistics.medium / total) * 100}%`,
                                background: getRiskColor('medium')
                            }} />
                            <div style={{
                                width: `${(statistics.low / total) * 100}%`,
                                background: getRiskColor('low')
                            }} />
                        </div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                            marginTop: '0.5rem'
                        }}>
                            <span>{((statistics.high / total) * 100).toFixed(1)}% High</span>
                            <span>{((statistics.medium / total) * 100).toFixed(1)}% Medium</span>
                            <span>{((statistics.low / total) * 100).toFixed(1)}% Low</span>
                        </div>
                    </div>
                )}

                {/* High Risk Conversations Preview */}
                {churnData.conversations && churnData.conversations.length > 0 && (
                    <div>
                        <div style={{
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            marginBottom: '0.75rem'
                        }}>
                            High-Risk Conversations
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {churnData.conversations.slice(0, 5).map((conv) => (
                                <div key={conv.conversation_id} style={{
                                    padding: '0.75rem',
                                    background: 'var(--bg-tertiary)',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--border-color)',
                                    fontSize: '0.875rem'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                                            {conv.conversation_id.substring(0, 20)}...
                                        </span>
                                        <span className={`badge badge-${conv.churn_risk_level}`}>
                                            {getRiskIcon(conv.churn_risk_level)} {conv.churn_risk_score}%
                                        </span>
                                    </div>
                                    {conv.churn_risk_factors && conv.churn_risk_factors.length > 0 && (
                                        <div style={{
                                            marginTop: '0.5rem',
                                            fontSize: '0.75rem',
                                            color: 'var(--text-secondary)'
                                        }}>
                                            Factors: {conv.churn_risk_factors.map(f => f.factor).join(', ')}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        {churnData.conversations.length > 5 && (
                            <div style={{
                                marginTop: '1rem',
                                textAlign: 'center'
                            }}>
                                <button className="btn btn-secondary btn-sm">
                                    View All {churnData.conversations.length} High-Risk Conversations →
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
