import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAnalysis } from '../context/AnalysisContext';

export default function AnalysisView() {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);
    const [sentimentFilter, setSentimentFilter] = useState('');
    const [error, setError] = useState(null);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [selectedIds, setSelectedIds] = useState(new Set());

    const { isAnalyzing, startAnalysis } = useAnalysis();

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

    const toggleSelection = (id) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === results.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(results.map(r => r.conversation_id)));
        }
    };

    const handleRunAIAnalysis = async () => {
        if (selectedIds.size === 0) return;

        try {
            await startAnalysis(Array.from(selectedIds));
            alert(`AI Analysis initiated for ${selectedIds.size} conversations! Check the AI Analysis tab for results.`);
            setSelectedIds(new Set());
        } catch (err) {
            setError(err.message);
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

    const viewConversation = async (conversationId) => {
        try {
            const response = await api.getConversation(conversationId);
            setSelectedConversation(response.conversation);
        } catch (err) {
            alert('Failed to load conversation: ' + err.message);
        }
    };

    if (selectedConversation) {
        return (
            <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
                <button
                    onClick={() => setSelectedConversation(null)}
                    className="btn btn-secondary"
                    style={{ marginBottom: '1rem' }}
                >
                    ← Back to Results
                </button>

                <div className="card">
                    <div className="card-header">
                        <h2>Conversation: {selectedConversation.conversation_id}</h2>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                            Uploaded: {new Date(selectedConversation.uploaded_at).toLocaleString()}
                        </p>
                    </div>
                    <div className="card-body">
                        <h3 style={{ fontSize: '1.125rem', marginBottom: '0.75rem' }}>💬 Full Transcript</h3>
                        <div style={{
                            background: 'var(--bg-tertiary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            padding: '1.5rem',
                            maxHeight: '600px',
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
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
            <div className="flex justify-between items-center mb-lg">
                <div>
                    <h1>Analysis Results</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        Detailed analysis of conversation transcripts
                    </p>
                </div>
                <div className="flex gap-sm">
                    {selectedIds.size > 0 && (
                        <button
                            className="btn btn-primary"
                            onClick={handleRunAIAnalysis}
                            disabled={isAnalyzing}
                            style={{ background: 'var(--gradient-secondary)' }}
                        >
                            {isAnalyzing ? '⏳ Starting AI...' : `🤖 AI Analyze (${selectedIds.size})`}
                        </button>
                    )}
                    <button
                        className="btn btn-secondary"
                        onClick={runAnalysis}
                        disabled={analyzing}
                    >
                        {analyzing ? (
                            <>
                                <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
                                Analyzing...
                            </>
                        ) : (
                            '🔍 Run Traditional Analysis'
                        )}
                    </button>
                </div>
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
                                        <th style={{ width: '40px' }}>
                                            <input
                                                type="checkbox"
                                                checked={results.length > 0 && selectedIds.size === results.length}
                                                onChange={toggleSelectAll}
                                                style={{ cursor: 'pointer' }}
                                            />
                                        </th>
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
                                        <tr key={result.id} className={selectedIds.has(result.conversation_id) ? 'selected-row' : ''}>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.has(result.conversation_id)}
                                                    onChange={() => toggleSelection(result.conversation_id)}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                            </td>
                                            <td style={{ fontFamily: 'monospace', color: 'var(--accent-primary)' }}>
                                                <button
                                                    onClick={() => viewConversation(result.conversation_id)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: 'var(--accent-primary)',
                                                        cursor: 'pointer',
                                                        textDecoration: 'underline',
                                                        fontFamily: 'monospace',
                                                        fontSize: 'inherit'
                                                    }}
                                                >
                                                    {result.conversation_id}
                                                </button>
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
