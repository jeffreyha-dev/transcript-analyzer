import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function AnalysisView() {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);
    const [sentimentFilter, setSentimentFilter] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        loadResults();
    }, [page, sentimentFilter]);

    const loadResults = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.getAnalysisResults(page, 50, sentimentFilter || null);
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
            setAnalyzing(true);
            setError(null);
            const response = await api.runAnalysis();
            alert(`Analysis complete! Analyzed ${response.analyzed} conversations.`);
            loadResults();
        } catch (err) {
            setError(err.message);
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
            <div className="flex justify-between items-center mb-lg">
                <div>
                    <h1>Analysis Results</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        Detailed analysis of conversation transcripts
                    </p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={runAnalysis}
                    disabled={analyzing}
                >
                    {analyzing ? (
                        <>
                            <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
                            Analyzing...
                        </>
                    ) : (
                        '🔍 Run Analysis'
                    )}
                </button>
            </div>

            {error && (
                <div className="card mb-md" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--accent-danger)' }}>
                    <p style={{ color: 'var(--accent-danger)' }}>{error}</p>
                </div>
            )}

            {/* Filters */}
            <div className="card mb-md">
                <div className="flex gap-md items-center">
                    <label style={{ fontWeight: 600, minWidth: '120px' }}>Filter by Sentiment:</label>
                    <select
                        className="input"
                        value={sentimentFilter}
                        onChange={(e) => {
                            setSentimentFilter(e.target.value);
                            setPage(1);
                        }}
                        style={{ maxWidth: '300px' }}
                    >
                        <option value="">All Sentiments</option>
                        <option value="Very Positive">Very Positive</option>
                        <option value="Positive">Positive</option>
                        <option value="Neutral">Neutral</option>
                        <option value="Negative">Negative</option>
                        <option value="Very Negative">Very Negative</option>
                    </select>
                </div>
            </div>

            {/* Results Table */}
            {loading ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="spinner" style={{ margin: '0 auto' }}></div>
                    <p className="mt-md" style={{ color: 'var(--text-secondary)' }}>Loading results...</p>
                </div>
            ) : results.length > 0 ? (
                <>
                    <div className="card">
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Conversation ID</th>
                                        <th>Date</th>
                                        <th>Sentiment</th>
                                        <th>Score</th>
                                        <th>Agent Score</th>
                                        <th>Customer Score</th>
                                        <th>Avg Msg Length</th>
                                        <th>Top Topics</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.map((result) => (
                                        <tr key={result.id}>
                                            <td style={{ fontFamily: 'monospace', color: 'var(--accent-primary)' }}>
                                                {result.conversation_id}
                                            </td>
                                            <td>{result.conversation_date || 'N/A'}</td>
                                            <td>
                                                <span className={`badge badge-${getSentimentBadgeType(result.sentiment_label)}`}>
                                                    {result.sentiment_label}
                                                </span>
                                            </td>
                                            <td>
                                                <span style={{ fontWeight: 600, color: getSentimentScoreColor(result.overall_sentiment) }}>
                                                    {result.overall_sentiment?.toFixed(1)}
                                                </span>
                                            </td>
                                            <td>
                                                <span style={{ fontWeight: 600 }}>
                                                    {result.agent_performance_score?.toFixed(0)}
                                                </span>
                                            </td>
                                            <td>
                                                <span style={{ fontWeight: 600 }}>
                                                    {result.customer_satisfaction_score?.toFixed(0)}
                                                </span>
                                            </td>
                                            <td>{result.avg_message_length?.toFixed(0)}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                                                    {result.topics?.slice(0, 3).map((topic, idx) => (
                                                        <span key={idx} className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                                                            {topic.term}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.pages > 1 && (
                        <div className="flex justify-center items-center gap-md mt-md">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setPage(page - 1)}
                                disabled={page === 1}
                            >
                                ← Previous
                            </button>
                            <span style={{ color: 'var(--text-secondary)' }}>
                                Page {pagination.page} of {pagination.pages}
                            </span>
                            <button
                                className="btn btn-secondary"
                                onClick={() => setPage(page + 1)}
                                disabled={page === pagination.pages}
                            >
                                Next →
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📊</div>
                    <h3>No Analysis Results Yet</h3>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        Upload conversations and run analysis to see results here
                    </p>
                </div>
            )}
        </div>
    );
}

function getSentimentBadgeType(label) {
    const lower = label?.toLowerCase() || '';
    if (lower.includes('positive')) return 'positive';
    if (lower.includes('negative')) return 'negative';
    return 'neutral';
}

function getSentimentScoreColor(score) {
    if (!score) return 'var(--text-primary)';
    if (score >= 70) return 'var(--accent-success)';
    if (score >= 50) return 'var(--accent-primary)';
    return 'var(--accent-danger)';
}
