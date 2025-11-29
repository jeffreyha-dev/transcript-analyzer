import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAnalysis } from '../context/AnalysisContext';
import { useAccount } from '../context/AccountContext';

export default function AIAnalysisView() {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);
    const [filters, setFilters] = useState({});
    const [error, setError] = useState(null);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [metricConfigs, setMetricConfigs] = useState([]);

    const { isAnalyzing, progress, startAnalysis, lastAnalysisResult } = useAnalysis();
    const { selectedAccount } = useAccount();

    useEffect(() => {
        // Check for filters passed via navigation
        const storedFilter = sessionStorage.getItem('aiAnalysisFilter');
        if (storedFilter) {
            try {
                const filter = JSON.parse(storedFilter);
                setFilters(prev => ({ ...prev, ...filter }));
                sessionStorage.removeItem('aiAnalysisFilter'); // Clear after use
            } catch (e) {
                console.error('Error parsing stored filter:', e);
            }
        }
    }, []);

    useEffect(() => {
        loadResults();
        loadMetricConfigs();
    }, [page, filters, selectedAccount]);

    // Reload results when analysis completes
    useEffect(() => {
        if (lastAnalysisResult) {
            loadResults();
        }
    }, [lastAnalysisResult]);

    const loadMetricConfigs = async () => {
        try {
            const configs = await api.getMetricConfigs();
            setMetricConfigs(configs);
        } catch (err) {
            console.error('Failed to load metric configs:', err);
        }
    };

    const loadResults = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.getAIResults(page, 50, filters, selectedAccount);
            setResults(response.results || []);
            setPagination(response.pagination);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const runAnalysis = async () => {
        try {
            await startAnalysis();
        } catch (err) {
            setError(err.message);
        }
    };

    const viewDetails = async (conversationId) => {
        try {
            const details = await api.getAISummary(conversationId);
            setSelectedConversation(details);
        } catch (err) {
            alert('Failed to load conversation details: ' + err.message);
        }
    };

    const getComplexityColor = (complexity) => {
        switch (complexity) {
            case 'low': return '#10b981';
            case 'medium': return '#f59e0b';
            case 'high': return '#ef4444';
            default: return 'var(--text-secondary)';
        }
    };

    const getScoreColor = (score, metricName = null) => {
        // Try to find custom config for this metric
        if (metricName) {
            const config = metricConfigs.find(c => c.metric_name.toLowerCase() === metricName.toLowerCase());
            if (config && config.color_thresholds && config.color_thresholds.length > 0) {
                // Normalize score to the metric's range
                const normalizedScore = score;

                // Find the appropriate color based on thresholds
                for (const threshold of config.color_thresholds) {
                    if (normalizedScore <= threshold.max) {
                        return threshold.color;
                    }
                }
                // If no threshold matched, use the last color
                return config.color_thresholds[config.color_thresholds.length - 1].color;
            }
        }

        // Default 0-100 logic
        if (score >= 80) return '#10b981';
        if (score >= 60) return '#f59e0b';
        return '#ef4444';
    };

    if (selectedConversation) {
        return (
            <div className="container" style={{ padding: '2rem 0' }}>
                <button
                    onClick={() => setSelectedConversation(null)}
                    className="btn btn-secondary"
                    style={{ marginBottom: '1rem' }}
                >
                    ← Back to Results
                </button>

                <div className="card">
                    <div className="card-header">
                        <h2>Conversation Analysis: {selectedConversation.conversation_id}</h2>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                            Analyzed by {selectedConversation.provider_used} • {selectedConversation.processing_time_ms}ms
                        </p>
                    </div>
                    <div className="card-body">
                        {/* Summary Section */}
                        <section style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.125rem', marginBottom: '0.75rem' }}>📝 Summary</h3>
                            <p style={{ color: 'var(--text-primary)', lineHeight: '1.6' }}>
                                {selectedConversation.summary}
                            </p>
                            <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                <span className={`badge ${selectedConversation.resolved ? 'badge-success' : 'badge-warning'}`}>
                                    {selectedConversation.resolved ? '✓ Resolved' : '⚠ Unresolved'}
                                </span>
                                <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>
                                    {selectedConversation.primary_intent?.replace(/_/g, ' ')}
                                </span>
                                <span className="badge" style={{ background: getComplexityColor(selectedConversation.complexity) }}>
                                    {selectedConversation.complexity} complexity
                                </span>
                                {selectedConversation.category && (
                                    <span className="badge badge-secondary">
                                        📂 {selectedConversation.category}
                                    </span>
                                )}
                            </div>
                        </section>

                        {/* Key Points */}
                        {selectedConversation.key_points && (() => {
                            try {
                                const points = JSON.parse(selectedConversation.key_points);
                                return points.length > 0 && (
                                    <section style={{ marginBottom: '2rem' }}>
                                        <h3 style={{ fontSize: '1.125rem', marginBottom: '0.75rem' }}>🔑 Key Points</h3>
                                        <ul style={{ paddingLeft: '1.5rem', color: 'var(--text-secondary)' }}>
                                            {points.map((point, i) => (
                                                <li key={i} style={{ marginBottom: '0.5rem' }}>{point}</li>
                                            ))}
                                        </ul>
                                    </section>
                                );
                            } catch (e) { return null; }
                        })()}

                        {/* Detailed Sentiment Analysis */}
                        <section style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.125rem', marginBottom: '0.75rem' }}>❤️ Sentiment & Emotions</h3>

                            {/* Emotions Grid */}
                            {selectedConversation.emotions && (() => {
                                try {
                                    const emotions = JSON.parse(selectedConversation.emotions);
                                    return (
                                        <div className="grid grid-2 gap-md mb-md">
                                            {/* Customer Emotions */}
                                            <div className="card" style={{ background: 'var(--bg-secondary)', padding: '1rem' }}>
                                                <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Customer Emotions</h4>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                    {Object.entries(emotions.customer || {}).map(([emotion, score]) => (
                                                        score > 0.1 && (
                                                            <div key={emotion} style={{
                                                                flex: '1 1 40%',
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                fontSize: '0.85rem'
                                                            }}>
                                                                <span style={{ textTransform: 'capitalize' }}>{emotion}</span>
                                                                <span style={{ fontWeight: 'bold' }}>{Math.round(score * 100)}%</span>
                                                            </div>
                                                        )
                                                    ))}
                                                </div>
                                            </div>
                                            {/* Agent Emotions */}
                                            <div className="card" style={{ background: 'var(--bg-secondary)', padding: '1rem' }}>
                                                <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Agent Traits</h4>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                    {Object.entries(emotions.agent || {}).map(([trait, score]) => (
                                                        <div key={trait} style={{
                                                            flex: '1 1 100%',
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            fontSize: '0.85rem'
                                                        }}>
                                                            <span style={{ textTransform: 'capitalize' }}>{trait}</span>
                                                            <div style={{ width: '60%', background: 'var(--bg-primary)', height: '6px', borderRadius: '3px', alignSelf: 'center' }}>
                                                                <div style={{ width: `${score * 100}%`, background: '#3b82f6', height: '100%', borderRadius: '3px' }}></div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                } catch (e) { return null; }
                            })()}
                        </section>

                        {/* Performance Scores Grid */}
                        <section style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.125rem', marginBottom: '0.75rem' }}>📊 Performance Scores</h3>
                            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                                <div className="metric-card">
                                    <div className="metric-label">Overall Score</div>
                                    <div className="metric-value" style={{ color: getScoreColor(selectedConversation.custom_data ? JSON.parse(selectedConversation.custom_data).agentPerformance?.overallScore : 0) }}>
                                        {selectedConversation.custom_data ? JSON.parse(selectedConversation.custom_data).agentPerformance?.overallScore || 'N/A' : 'N/A'}
                                    </div>
                                </div>
                                <div className="metric-card">
                                    <div className="metric-label">Empathy</div>
                                    <div className="metric-value" style={{ color: getScoreColor(selectedConversation.empathy_score) }}>
                                        {selectedConversation.empathy_score || 'N/A'}
                                    </div>
                                </div>
                                <div className="metric-card">
                                    <div className="metric-label">Communication</div>
                                    <div className="metric-value" style={{ color: getScoreColor(selectedConversation.communication_quality) }}>
                                        {selectedConversation.communication_quality || 'N/A'}
                                    </div>
                                </div>
                                <div className="metric-card">
                                    <div className="metric-label">Problem Solving</div>
                                    <div className="metric-value" style={{ color: getScoreColor(selectedConversation.problem_solving_score) }}>
                                        {selectedConversation.problem_solving_score || 'N/A'}
                                    </div>
                                </div>
                                <div className="metric-card">
                                    <div className="metric-label">Compliance</div>
                                    <div className="metric-value" style={{ color: getScoreColor(selectedConversation.compliance_score) }}>
                                        {selectedConversation.compliance_score || 'N/A'}
                                    </div>
                                </div>
                                <div className="metric-card">
                                    <div className="metric-label">Personalization</div>
                                    <div className="metric-value" style={{ color: getScoreColor(selectedConversation.personalization_score) }}>
                                        {selectedConversation.personalization_score || 'N/A'}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Agent Strengths & Improvements */}
                        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                            {selectedConversation.agent_strengths && (() => {
                                try {
                                    const strengths = JSON.parse(selectedConversation.agent_strengths);
                                    return strengths.length > 0 && (
                                        <div>
                                            <h3 style={{ fontSize: '1.125rem', marginBottom: '0.75rem', color: '#10b981' }}>✨ Strengths</h3>
                                            <ul style={{ paddingLeft: '1.5rem', color: 'var(--text-secondary)' }}>
                                                {strengths.map((strength, i) => (
                                                    <li key={i} style={{ marginBottom: '0.5rem' }}>{strength}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    );
                                } catch (e) { return null; }
                            })()}

                            {selectedConversation.agent_improvements && (() => {
                                try {
                                    const improvements = JSON.parse(selectedConversation.agent_improvements);
                                    return improvements.length > 0 && (
                                        <div>
                                            <h3 style={{ fontSize: '1.125rem', marginBottom: '0.75rem', color: '#f59e0b' }}>💡 Improvements</h3>
                                            <ul style={{ paddingLeft: '1.5rem', color: 'var(--text-secondary)' }}>
                                                {improvements.map((improvement, i) => (
                                                    <li key={i} style={{ marginBottom: '0.5rem' }}>{improvement}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    );
                                } catch (e) { return null; }
                            })()}
                        </div>

                        {/* QA & Compliance */}
                        <section style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.125rem', marginBottom: '0.75rem' }}>🛡️ QA & Compliance</h3>
                            <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
                                <div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Script Adherence</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: getScoreColor(selectedConversation.script_adherence_score) }}>
                                        {selectedConversation.script_adherence_score ? selectedConversation.script_adherence_score + '%' : 'N/A'}
                                    </div>
                                </div>
                            </div>

                            {/* Risk Flags */}
                            {selectedConversation.risk_flags && (() => {
                                try {
                                    const flags = JSON.parse(selectedConversation.risk_flags);
                                    return flags.length > 0 && (
                                        <div style={{ marginBottom: '1rem' }}>
                                            <h4 style={{ fontSize: '0.9rem', color: '#ef4444', marginBottom: '0.5rem' }}>Risk Flags</h4>
                                            {flags.map((risk, i) => (
                                                <div key={i} className="alert alert-warning" style={{ marginBottom: '0.5rem', padding: '0.75rem' }}>
                                                    <strong>{risk.type}:</strong> {risk.description}
                                                </div>
                                            ))}
                                        </div>
                                    );
                                } catch (e) { return null; }
                            })()}

                            {/* Policy Violations */}
                            {selectedConversation.policy_violations && (() => {
                                try {
                                    const violations = JSON.parse(selectedConversation.policy_violations);
                                    return violations.length > 0 && (
                                        <div>
                                            <h4 style={{ fontSize: '0.9rem', color: '#ef4444', marginBottom: '0.5rem' }}>Policy Violations</h4>
                                            {violations.map((v, i) => (
                                                <div key={i} className="alert alert-danger" style={{ marginBottom: '0.5rem', padding: '0.75rem' }}>
                                                    <strong>{v.policy}:</strong> {v.description}
                                                </div>
                                            ))}
                                        </div>
                                    );
                                } catch (e) { return null; }
                            })()}
                        </section>

                        {/* Customer Journey */}
                        <section>
                            <h3 style={{ fontSize: '1.125rem', marginBottom: '0.75rem' }}>🎯 Customer Journey</h3>
                            <div className="grid grid-3 gap-md mb-md">
                                <div className="card" style={{ background: 'var(--bg-secondary)', padding: '1rem' }}>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Churn Risk</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: getScoreColor(100 - selectedConversation.churn_risk_score) }}>
                                        {selectedConversation.churn_risk_score}%
                                    </div>
                                </div>
                                <div className="card" style={{ background: 'var(--bg-secondary)', padding: '1rem' }}>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Personality</div>
                                    <div style={{ fontSize: '1.125rem', fontWeight: '600', textTransform: 'capitalize' }}>
                                        {selectedConversation.customer_personality || 'Unknown'}
                                    </div>
                                </div>
                                <div className="card" style={{ background: 'var(--bg-secondary)', padding: '1rem' }}>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Lifetime Value</div>
                                    <div style={{ fontSize: '1.125rem', fontWeight: '600', textTransform: 'capitalize' }}>
                                        {selectedConversation.lifetime_value_indicator || 'Unknown'}
                                    </div>
                                </div>
                            </div>

                            {/* Intervention Suggestions */}
                            {selectedConversation.intervention_suggestions && (() => {
                                try {
                                    const suggestions = JSON.parse(selectedConversation.intervention_suggestions);
                                    return suggestions.length > 0 && (
                                        <div className="alert alert-info">
                                            <strong>💡 Recommended Actions:</strong>
                                            <ul style={{ margin: '0.5rem 0 0 1.5rem' }}>
                                                {suggestions.map((s, i) => <li key={i}>{s}</li>)}
                                            </ul>
                                        </div>
                                    );
                                } catch (e) { return null; }
                            })()}
                        </section>

                        {/* Custom Insights (Dynamic Fields) */}
                        {selectedConversation.custom_data && (() => {
                            let customData = {};
                            try {
                                customData = JSON.parse(selectedConversation.custom_data);
                            } catch (e) {
                                return null;
                            }

                            // Filter out fields we already displayed
                            const displayedFields = [
                                'summary', 'sentiment', 'intent', 'agentPerformance', 'qa', 'customerJourney',
                                'conversation_id', 'transcript', 'provider_used', 'tokens_used', 'cost', 'processing_time_ms'
                            ];

                            const filteredData = Object.entries(customData).reduce((acc, [key, value]) => {
                                if (!displayedFields.includes(key)) {
                                    acc[key] = value;
                                }
                                return acc;
                            }, {});

                            if (Object.keys(filteredData).length === 0) return null;

                            const renderValue = (value, key = '') => {
                                if (value === null || value === undefined) {
                                    return <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>N/A</span>;
                                }

                                if (typeof value === 'boolean') {
                                    return <span className={`badge ${value ? 'badge-success' : 'badge-warning'}`}>
                                        {value ? '✓' : '✗'}
                                    </span>;
                                }

                                if (typeof value === 'number') {
                                    if ((value >= 0 && value <= 100) || (value >= 0 && value <= 1)) {
                                        const score = value <= 1 ? value * 100 : value;
                                        return (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ flex: 1, height: '8px', background: 'var(--bg-primary)', borderRadius: '4px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${score}%`, height: '100%', background: getScoreColor(value, key), transition: 'width 0.3s ease' }}></div>
                                                </div>
                                                <span style={{ fontWeight: '600', color: getScoreColor(value, key), minWidth: '3rem', textAlign: 'right' }}>{Math.round(score)}</span>
                                            </div>
                                        );
                                    }
                                    return <span style={{ fontWeight: '500' }}>{value}</span>;
                                }

                                if (typeof value === 'string') {
                                    return <span style={{ color: 'var(--text-primary)' }}>{value}</span>;
                                }

                                if (Array.isArray(value)) {
                                    if (value.length === 0) return <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>None</span>;
                                    return (
                                        <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                                            {value.map((item, i) => (
                                                <li key={i} style={{ marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>
                                                    {typeof item === 'object' ? JSON.stringify(item) : String(item)}
                                                </li>
                                            ))}
                                        </ul>
                                    );
                                }

                                if (typeof value === 'object') {
                                    return (
                                        <div style={{ marginLeft: '1rem', paddingLeft: '1rem', borderLeft: '2px solid var(--border-color)', marginTop: '0.5rem' }}>
                                            {Object.entries(value).map(([k, v]) => (
                                                <div key={k} style={{ marginBottom: '0.75rem' }}>
                                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', textTransform: 'capitalize' }}>
                                                        {k.replace(/_/g, ' ')}
                                                    </div>
                                                    {renderValue(v, k)}
                                                </div>
                                            ))}
                                        </div>
                                    );
                                }

                                return String(value);
                            };

                            const getFieldIcon = (key) => {
                                const lowerKey = key.toLowerCase();
                                if (lowerKey.includes('score') || lowerKey.includes('quality')) return '📊';
                                if (lowerKey.includes('risk') || lowerKey.includes('violation')) return '⚠️';
                                if (lowerKey.includes('sentiment') || lowerKey.includes('emotion')) return '😊';
                                if (lowerKey.includes('intent') || lowerKey.includes('category')) return '🎯';
                                if (lowerKey.includes('performance') || lowerKey.includes('agent')) return '👤';
                                if (lowerKey.includes('customer') || lowerKey.includes('journey')) return '🛤️';
                                if (lowerKey.includes('summary') || lowerKey.includes('key')) return '📝';
                                return '✨';
                            };

                            return (
                                <section style={{ marginTop: '2rem' }}>
                                    <h3 style={{ fontSize: '1.125rem', marginBottom: '0.75rem' }}>✨ Custom Insights</h3>
                                    <div style={{ display: 'grid', gap: '1rem' }}>
                                        {Object.entries(filteredData).map(([key, value]) => (
                                            <div key={key} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                                                <h4 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <span>{getFieldIcon(key)}</span>
                                                    <span style={{ textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</span>
                                                </h4>
                                                {renderValue(value, key)}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            );
                        })()}

                        {/* Full Transcript */}
                        {selectedConversation.transcript_details && (
                            <section style={{ marginTop: '2rem' }}>
                                <h3 style={{ fontSize: '1.125rem', marginBottom: '0.75rem' }}>💬 Full Transcript</h3>
                                <div style={{
                                    background: 'var(--bg-tertiary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: 'var(--radius-md)',
                                    padding: '1.5rem',
                                    maxHeight: '500px',
                                    overflowY: 'auto'
                                }}>
                                    {selectedConversation.transcript_details.split(/\n|\\n|\|/).map((line, i) => {
                                        const trimmed = line.trim();
                                        if (!trimmed) return null;

                                        // Parse speaker and message
                                        const match = trimmed.match(/^(Agent|Customer|User|Support):\s*(.+)$/i);
                                        if (match) {
                                            const speaker = match[1];
                                            const message = match[2];
                                            const isAgent = speaker.toLowerCase() === 'agent' || speaker.toLowerCase() === 'support';

                                            return (
                                                <div key={i} style={{
                                                    marginBottom: '1rem',
                                                    padding: '0.75rem',
                                                    background: isAgent ? 'rgba(99, 102, 241, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                                                    borderLeft: `3px solid ${isAgent ? '#6366f1' : '#8b5cf6'}`,
                                                    borderRadius: '0.25rem'
                                                }}>
                                                    <div style={{
                                                        fontSize: '0.75rem',
                                                        fontWeight: '600',
                                                        color: isAgent ? '#6366f1' : '#8b5cf6',
                                                        marginBottom: '0.25rem',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.05em'
                                                    }}>
                                                        {speaker}
                                                    </div>
                                                    <div style={{
                                                        fontSize: '0.875rem',
                                                        color: 'var(--text-primary)',
                                                        lineHeight: '1.5'
                                                    }}>
                                                        {message}
                                                    </div>
                                                </div>
                                            );
                                        }

                                        // Fallback for unformatted lines
                                        return (
                                            <div key={i} style={{
                                                marginBottom: '0.5rem',
                                                fontSize: '0.875rem',
                                                color: 'var(--text-secondary)',
                                                lineHeight: '1.5'
                                            }}>
                                                {trimmed}
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </div>

        );
    }

    return (
        <div className="container" style={{ padding: '2rem 0' }}>
            <div className="card">
                <div className="card-header">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <h2>🤖 AI Analysis Results {pagination?.total ? <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>({pagination.total} total)</span> : ''}</h2>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                Advanced AI-powered conversation insights
                            </p>
                        </div>
                        <button
                            onClick={runAnalysis}
                            disabled={isAnalyzing}
                            className="btn btn-primary"
                        >
                            {isAnalyzing ? '⏳ Analyzing...' : '▶ Run AI Analysis'}
                        </button>
                    </div>
                </div>

                <div className="card-body">
                    {error && (
                        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                            <strong>Error:</strong> {error}
                        </div>
                    )}

                    {/* Progress Bar */}
                    {progress && (
                        <div style={{
                            padding: '1.5rem',
                            background: 'var(--bg-tertiary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: '1.5rem'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                <div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                        AI Analysis in Progress...
                                    </div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: '600', marginTop: '0.25rem' }}>
                                        {progress.current} / {progress.target} conversations
                                    </div>
                                </div>
                                <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--accent-primary)' }}>
                                    {progress.target > 0
                                        ? Math.round((progress.current / progress.target) * 100)
                                        : 0}%
                                </div>
                            </div>
                            <div style={{
                                width: '100%',
                                height: '12px',
                                background: 'var(--bg-primary)',
                                borderRadius: '9999px',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    height: '100%',
                                    width: progress.target > 0
                                        ? `${(progress.current / progress.target) * 100}%`
                                        : '0%',
                                    background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
                                    transition: 'width 0.5s ease',
                                    borderRadius: '9999px'
                                }}></div>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                ⏱️ Estimated time: ~{Math.ceil((progress.target - progress.current) * 0.9)} seconds remaining
                            </div>
                        </div>
                    )}

                    {/* Filters */}
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                        <select
                            value={filters.complexity || ''}
                            onChange={(e) => setFilters({ ...filters, complexity: e.target.value || undefined })}
                            className="form-select"
                            style={{ width: 'auto' }}
                        >
                            <option value="">All Complexity</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>

                        <select
                            value={filters.intent || ''}
                            onChange={(e) => setFilters({ ...filters, intent: e.target.value || undefined })}
                            className="form-select"
                            style={{ width: 'auto' }}
                        >
                            <option value="">All Intents</option>
                            <option value="product_return">Product Return</option>
                            <option value="refund_request">Refund Request</option>
                            <option value="technical_support">Technical Support</option>
                            <option value="billing_inquiry">Billing Inquiry</option>
                            <option value="complaint">Complaint</option>
                        </select>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem' }}>
                            <div className="spinner"></div>
                            <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading results...</p>
                        </div>
                    ) : results.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem' }}>
                            <p style={{ color: 'var(--text-secondary)' }}>
                                No AI analysis results yet. Click "Run AI Analysis" to get started.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Conversation ID</th>
                                            <th>Summary</th>
                                            <th>Intent</th>
                                            <th>Complexity</th>
                                            <th>Empathy</th>
                                            <th>Churn Risk</th>
                                            <th>Provider</th>
                                            <th>Resolved</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.map((result) => (
                                            <tr key={result.id}>
                                                <td style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                                                    {result.conversation_id}
                                                </td>
                                                <td style={{ maxWidth: '300px' }}>
                                                    <div style={{
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                        fontSize: '0.875rem'
                                                    }}>
                                                        {result.summary}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="badge badge-info" style={{ fontSize: '0.75rem', textTransform: 'capitalize' }}>
                                                        {result.primary_intent?.replace(/_/g, ' ')}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="badge" style={{
                                                        background: getComplexityColor(result.complexity),
                                                        fontSize: '0.75rem'
                                                    }}>
                                                        {result.complexity}
                                                    </span>
                                                </td>
                                                <td style={{ color: getScoreColor(result.empathy_score), fontWeight: '600' }}>
                                                    {result.empathy_score}
                                                </td>
                                                <td style={{ color: getScoreColor(100 - result.churn_risk_score), fontWeight: '600' }}>
                                                    {result.churn_risk_score}
                                                </td>
                                                <td>
                                                    <span className="badge badge-neutral" style={{
                                                        fontSize: '0.75rem',
                                                        textTransform: 'capitalize',
                                                        fontFamily: 'monospace'
                                                    }}>
                                                        {result.provider_used || 'N/A'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`badge ${result.resolved ? 'badge-success' : 'badge-warning'}`}>
                                                        {result.resolved ? '✓' : '✗'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button
                                                        onClick={() => viewDetails(result.conversation_id)}
                                                        className="btn btn-sm btn-secondary"
                                                    >
                                                        View Details
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {pagination && pagination.totalPages > 1 && (
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                                    <button
                                        onClick={() => setPage(page - 1)}
                                        disabled={page === 1}
                                        className="btn btn-secondary"
                                    >
                                        Previous
                                    </button>
                                    <span style={{ padding: '0.5rem 1rem', color: 'var(--text-secondary)' }}>
                                        Page {page} of {pagination.totalPages}
                                    </span>
                                    <button
                                        onClick={() => setPage(page + 1)}
                                        disabled={page === pagination.totalPages}
                                        className="btn btn-secondary"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
