import { useState, useEffect } from 'react';
import api from '../utils/api';
import PromptManager from './PromptManager';
import MetricConfigManager from './MetricConfigManager';

export default function SettingsView() {
    const [clearing, setClearing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const [settings, setSettings] = useState({
        AI_ENABLED: 'false',
        AI_PRIMARY_PROVIDER: 'ollama',
        AI_FALLBACK_ENABLED: 'false',
        AI_MONTHLY_BUDGET: '10.00',
        AI_COST_ALERT_THRESHOLD: '8.00',
        OLLAMA_BASE_URL: 'http://localhost:11434',
        OLLAMA_MODEL: 'llama3.1:8b',
        OPENAI_API_KEY: '',
        OPENAI_MODEL: 'gpt-3.5-turbo',
        GEMINI_API_KEY: '',
        GEMINI_MODEL: 'gemini-1.5-flash'
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const data = await api.getSettings();
            setSettings(data);
        } catch (err) {
            console.error('Failed to load settings:', err);
            setMessage({
                type: 'error',
                text: 'Failed to load settings'
            });
        }
    };

    const handleClearAll = async () => {
        const confirmed = window.confirm(
            '⚠️ WARNING: This will permanently delete ALL conversations and analysis data.\n\n' +
            'This action cannot be undone!\n\n' +
            'Are you sure you want to continue?'
        );

        if (!confirmed) return;

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

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            setMessage(null);
            await api.updateSettings(settings);
            setMessage({
                type: 'success',
                text: '✓ Settings saved successfully'
            });
        } catch (err) {
            setMessage({
                type: 'error',
                text: `✗ Failed to save settings: ${err.message}`
            });
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? String(checked) : value
        }));
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
                    {message && (
                        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '1rem' }}>
                            {message.text}
                        </div>
                    )}

                    {/* AI Configuration Section */}
                    <section style={{ marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                            🤖 AI Configuration
                        </h3>

                        <form onSubmit={handleSaveSettings} style={{
                            padding: '1.5rem',
                            background: 'var(--bg-tertiary)',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)'
                        }}>
                            <div style={{ display: 'grid', gap: '1.5rem' }}>
                                {/* General Settings */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label className="flex items-center gap-sm" style={{ cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                name="AI_ENABLED"
                                                checked={settings.AI_ENABLED === 'true'}
                                                onChange={handleChange}
                                            />
                                            Enable AI Features
                                        </label>
                                    </div>

                                    <div className="form-group">
                                        <label className="flex items-center gap-sm" style={{ cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                name="AI_FALLBACK_ENABLED"
                                                checked={settings.AI_FALLBACK_ENABLED === 'true'}
                                                onChange={handleChange}
                                            />
                                            Enable Fallback Providers
                                        </label>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Primary Provider</label>
                                    <select
                                        name="AI_PRIMARY_PROVIDER"
                                        value={settings.AI_PRIMARY_PROVIDER}
                                        onChange={handleChange}
                                        className="form-control"
                                    >
                                        <option value="ollama">Ollama (Local)</option>
                                        <option value="openai">OpenAI</option>
                                        <option value="gemini">Google Gemini</option>
                                    </select>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label>Monthly Budget ($)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            name="AI_MONTHLY_BUDGET"
                                            value={settings.AI_MONTHLY_BUDGET}
                                            onChange={handleChange}
                                            className="form-control"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Cost Alert Threshold ($)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            name="AI_COST_ALERT_THRESHOLD"
                                            value={settings.AI_COST_ALERT_THRESHOLD}
                                            onChange={handleChange}
                                            className="form-control"
                                        />
                                    </div>
                                </div>

                                <hr style={{ borderColor: 'var(--border-color)' }} />

                                {/* Ollama Settings */}
                                <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>🦙 Ollama Settings</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label>Base URL</label>
                                        <input
                                            type="text"
                                            name="OLLAMA_BASE_URL"
                                            value={settings.OLLAMA_BASE_URL}
                                            onChange={handleChange}
                                            className="form-control"
                                            placeholder="http://localhost:11434"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Model</label>
                                        <input
                                            type="text"
                                            name="OLLAMA_MODEL"
                                            value={settings.OLLAMA_MODEL}
                                            onChange={handleChange}
                                            className="form-control"
                                            placeholder="llama3.1:8b"
                                        />
                                    </div>
                                </div>

                                <hr style={{ borderColor: 'var(--border-color)' }} />

                                {/* OpenAI Settings */}
                                <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>🤖 OpenAI Settings</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label>API Key</label>
                                        <input
                                            type="password"
                                            name="OPENAI_API_KEY"
                                            value={settings.OPENAI_API_KEY}
                                            onChange={handleChange}
                                            className="form-control"
                                            placeholder="sk-..."
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Model</label>
                                        <input
                                            type="text"
                                            name="OPENAI_MODEL"
                                            value={settings.OPENAI_MODEL}
                                            onChange={handleChange}
                                            className="form-control"
                                            placeholder="gpt-3.5-turbo"
                                        />
                                    </div>
                                </div>

                                <hr style={{ borderColor: 'var(--border-color)' }} />

                                {/* Gemini Settings */}
                                <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>✨ Gemini Settings</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label>API Key</label>
                                        <input
                                            type="password"
                                            name="GEMINI_API_KEY"
                                            value={settings.GEMINI_API_KEY}
                                            onChange={handleChange}
                                            className="form-control"
                                            placeholder="AIza..."
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Model</label>
                                        <input
                                            type="text"
                                            name="GEMINI_MODEL"
                                            value={settings.GEMINI_MODEL}
                                            onChange={handleChange}
                                            className="form-control"
                                            placeholder="gemini-1.5-flash"
                                        />
                                    </div>
                                </div>

                                <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="btn btn-primary"
                                    >
                                        {saving ? '💾 Saving...' : '💾 Save Changes'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </section>

                    {/* Prompt Management */}
                    <section style={{ marginTop: '3rem' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>📝 Prompt Management</h2>
                        <PromptManager />
                    </section>

                    {/* Metric Configuration */}
                    <section style={{ marginTop: '3rem' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>📊 Metric Configuration</h2>
                        <MetricConfigManager />
                    </section>

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
            </div >
        </div >
    );
}
