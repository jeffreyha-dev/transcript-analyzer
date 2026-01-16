import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function ConversationsView() {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadConversations();
    }, [page]);

    const loadConversations = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.getConversations(page, 50);
            setConversations(response.conversations || []);
            setPagination(response.pagination);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
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

    // If viewing a specific conversation, show transcript view
    if (selectedConversation) {
        return (
            <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
                <button
                    onClick={() => setSelectedConversation(null)}
                    className="btn btn-secondary"
                    style={{ marginBottom: '1rem' }}
                >
                    ← Back to Conversations
                </button>

                <div className="card">
                    <div className="card-header">
                        <h2>Conversation: {selectedConversation.source === 'liveperson' && selectedConversation.external_id ? selectedConversation.external_id : selectedConversation.conversation_id}</h2>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                            {selectedConversation.source === 'liveperson' ? 'Source: LivePerson' : 'Source: Upload'} •
                            {selectedConversation.conversation_date ? ` Date: ${new Date(selectedConversation.conversation_date).toLocaleString()}` : ''}
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
                            {selectedConversation.transcript_details.split(/\n|\\\n|\|/).map((line, i) => {
                                const trimmed = line.trim();
                                if (!trimmed) return null;

                                // Parse speaker and message
                                const match = trimmed.match(/^(Agent|Customer|User|Support|Consumer):\s*(.+)$/i);
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

    // Main list view
    return (
        <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
            <div className="flex justify-between items-center mb-lg">
                <div>
                    <h1>Conversations</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        Browse all uploaded and fetched conversations
                    </p>
                </div>
            </div>

            {error && (
                <div className="card mb-md" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--accent-danger)' }}>
                    <p style={{ color: 'var(--accent-danger)' }}>{error}</p>
                </div>
            )}

            {/* Conversations Table */}
            {loading ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="spinner" style={{ margin: '0 auto' }}></div>
                    <p className="mt-md" style={{ color: 'var(--text-secondary)' }}>Loading conversations...</p>
                </div>
            ) : conversations.length > 0 ? (
                <>
                    <div className="card">
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Conversation ID</th>
                                        <th>Date</th>
                                        <th>Source</th>
                                        <th>Messages</th>
                                        <th>Uploaded</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {conversations.map((conv) => (
                                        <tr key={conv.id} style={{ cursor: 'pointer' }} onClick={() => viewConversation(conv.conversation_id)}>
                                            <td style={{ fontFamily: 'monospace', color: 'var(--accent-primary)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ textDecoration: 'underline' }}>
                                                        {conv.source === 'liveperson' && conv.external_id ? conv.external_id : conv.conversation_id}
                                                    </span>
                                                    {conv.source === 'liveperson' && (
                                                        <span style={{
                                                            fontSize: '0.7rem',
                                                            padding: '2px 6px',
                                                            borderRadius: '4px',
                                                            background: 'var(--accent-secondary)',
                                                            color: 'white',
                                                            fontWeight: 'bold'
                                                        }}>
                                                            LP
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>{conv.conversation_date ? new Date(conv.conversation_date).toLocaleDateString() : 'N/A'}</td>
                                            <td>
                                                <span className={`badge ${conv.source === 'liveperson' ? 'badge-secondary' : 'badge-neutral'}`}>
                                                    {conv.source === 'liveperson' ? 'LivePerson' : 'Upload'}
                                                </span>
                                            </td>
                                            <td>{conv.message_count || 'N/A'}</td>
                                            <td style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                                {new Date(conv.uploaded_at).toLocaleDateString()}
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
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>💬</div>
                    <h3>No Conversations Yet</h3>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        Upload conversations or fetch from LivePerson to get started
                    </p>
                </div>
            )}
        </div>
    );
}
