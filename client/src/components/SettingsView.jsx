import { useState } from 'react';
import api from '../utils/api';

export default function SettingsView() {
    const [clearing, setClearing] = useState(false);
    const [message, setMessage] = useState(null);

    const handleClearAll = async () => {
        const confirmed = window.confirm(
            '⚠️ WARNING: This will permanently delete ALL conversations and analysis data.\n\n' +
            'This action cannot be undone!\n\n' +
            'Are you sure you want to continue?'
        );

        if (!confirmed) return;

        // Double confirmation for safety
        const doubleConfirmed = window.confirm(
            'Are you ABSOLUTELY sure? This will delete everything!'
        );

        if (!doubleConfirmed) return;

        try {
            setClearing(true);
            setMessage(null);
            const response = await api.deleteAllConversations();
            setMessage({
                type: 'success',
                text: `✓ ${response.message}. Deleted ${response.deleted} conversations.`
            });
        } catch (err) {
            setMessage({
                type: 'error',
                text: `✗ Failed to clear data: ${err.message}`
            });
        } finally {
            setClearing(false);
        }
    };

    return (
        <div className="container" style={{ padding: '2rem 0' }}>
            <div className="card">
                <div className="card-header">
                    <h2>⚙️ Settings</h2>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        Manage your transcript analyzer settings
                    </p>
                </div>

                <div className="card-body">
                    {/* Data Management Section */}
                    <section style={{ marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                            🗄️ Data Management
                        </h3>

                        <div style={{
                            padding: '1.5rem',
                            background: 'var(--bg-tertiary)',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)'
                        }}>
                            <h4 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                                Clear All Data
                            </h4>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                                Permanently delete all conversations, traditional analysis results, and AI analysis data.
                                This is useful for testing or starting fresh.
                            </p>

                            <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
                                <strong>⚠️ Warning:</strong> This action cannot be undone. All data will be permanently deleted.
                            </div>

                            {message && (
                                <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '1rem' }}>
                                    {message.text}
                                </div>
                            )}

                            <button
                                onClick={handleClearAll}
                                disabled={clearing}
                                className="btn"
                                style={{
                                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                    color: 'white'
                                }}
                            >
                                {clearing ? '⏳ Clearing...' : '🗑️ Clear All Data'}
                            </button>
                        </div>
                    </section>

                    {/* AI Configuration Section */}
                    <section style={{ marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                            🤖 AI Configuration
                        </h3>

                        <div style={{
                            padding: '1.5rem',
                            background: 'var(--bg-tertiary)',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)'
                        }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <h4 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                    Primary Provider
                                </h4>
                                <p style={{ fontSize: '1rem', fontWeight: '600' }}>
                                    Ollama (Local)
                                </p>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <h4 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                    Model
                                </h4>
                                <p style={{ fontSize: '1rem', fontWeight: '600' }}>
                                    llama3.1:8b
                                </p>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <h4 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                    Fallback Enabled
                                </h4>
                                <p style={{ fontSize: '1rem', fontWeight: '600' }}>
                                    Yes (OpenAI, Gemini)
                                </p>
                            </div>

                            <div>
                                <h4 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                    Monthly Budget
                                </h4>
                                <p style={{ fontSize: '1rem', fontWeight: '600' }}>
                                    $10.00
                                </p>
                            </div>

                            <div className="alert alert-info" style={{ marginTop: '1rem' }}>
                                <strong>ℹ️ Note:</strong> To change AI settings, edit the <code>.env</code> file and restart the server.
                            </div>
                        </div>
                    </section>

                    {/* About Section */}
                    <section>
                        <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                            ℹ️ About
                        </h3>

                        <div style={{
                            padding: '1.5rem',
                            background: 'var(--bg-tertiary)',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)'
                        }}>
                            <div style={{ marginBottom: '0.75rem' }}>
                                <strong>Application:</strong> Transcript Analyzer
                            </div>
                            <div style={{ marginBottom: '0.75rem' }}>
                                <strong>Version:</strong> 1.0.0
                            </div>
                            <div style={{ marginBottom: '0.75rem' }}>
                                <strong>Features:</strong> Traditional NLP + AI-Powered Analysis
                            </div>
                            <div>
                                <strong>Tech Stack:</strong> Node.js, Express, React, SQLite, Ollama
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
