import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function PromptManager() {
    const [prompts, setPrompts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingPrompt, setEditingPrompt] = useState(null);
    const [message, setMessage] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [generateDesc, setGenerateDesc] = useState('');

    useEffect(() => {
        loadPrompts();
    }, []);

    const loadPrompts = async () => {
        try {
            setLoading(true);
            const data = await api.getPrompts();
            setPrompts(data);
        } catch (err) {
            console.error('Failed to load prompts:', err);
            setMessage({ type: 'error', text: 'Failed to load prompts' });
        } finally {
            setLoading(false);
        }
    };

    const handleActivate = async (id) => {
        try {
            await api.activatePrompt(id);
            setMessage({ type: 'success', text: 'Prompt activated successfully' });
            loadPrompts();
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to activate prompt' });
        }
    };

    const handleReset = async () => {
        if (!window.confirm('Are you sure you want to reset to the default prompt?')) return;
        try {
            await api.resetPrompt();
            setMessage({ type: 'success', text: 'Reset to default prompt' });
            loadPrompts();
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to reset prompt' });
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingPrompt.id) {
                await api.updatePrompt(editingPrompt.id, editingPrompt);
                setMessage({ type: 'success', text: 'Prompt updated successfully' });
            } else {
                await api.createPrompt(editingPrompt);
                setMessage({ type: 'success', text: 'Prompt created successfully' });
            }
            setEditingPrompt(null);
            loadPrompts();
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to save prompt' });
        }
    };

    const handleGenerate = async () => {
        if (!generateDesc) return;
        try {
            setGenerating(true);
            const data = await api.generatePrompt(generateDesc);
            setEditingPrompt(prev => ({ ...prev, template: data.template }));
            setGenerateDesc('');
            setMessage({ type: 'success', text: 'Prompt generated successfully!' });
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to generate prompt' });
        } finally {
            setGenerating(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
        try {
            await api.deletePrompt(id);
            setMessage({ type: 'success', text: 'Prompt deleted successfully' });
            loadPrompts();
        } catch (err) {
            setMessage({ type: 'error', text: err.message || 'Failed to delete prompt' });
        }
    };

    if (loading) return <div>Loading prompts...</div>;

    if (editingPrompt) {
        return (
            <div className="card">
                <div className="card-header flex justify-between items-center">
                    <h3>{editingPrompt.id ? 'Edit Prompt' : 'New Prompt'}</h3>
                    <button onClick={() => setEditingPrompt(null)} className="btn btn-secondary">Cancel</button>
                </div>
                <div className="card-body">
                    <form onSubmit={handleSave}>
                        <div className="form-group">
                            <label>Name</label>
                            <input
                                type="text"
                                className="form-control"
                                value={editingPrompt.name}
                                onChange={e => setEditingPrompt({ ...editingPrompt, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Description</label>
                            <input
                                type="text"
                                className="form-control"
                                value={editingPrompt.description || ''}
                                onChange={e => setEditingPrompt({ ...editingPrompt, description: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Template (Must include <code>{`{{TRANSCRIPT}}`}</code> placeholder)</label>

                            {/* Auto-Generate Section */}
                            <div style={{
                                background: 'var(--bg-tertiary)',
                                padding: '1rem',
                                borderRadius: '8px',
                                marginBottom: '1rem',
                                border: '1px solid var(--border-color)'
                            }}>
                                <label style={{ fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>
                                    ✨ Auto-Generate Template
                                </label>
                                <div className="flex gap-sm">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Describe what you want to analyze (e.g., 'Check for sales opportunities and customer sentiment')"
                                        value={generateDesc}
                                        onChange={e => setGenerateDesc(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleGenerate(); } }}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleGenerate}
                                        disabled={generating || !generateDesc}
                                        className="btn btn-secondary"
                                        style={{ whiteSpace: 'nowrap' }}
                                    >
                                        {generating ? 'Generating...' : 'Generate'}
                                    </button>
                                </div>
                            </div>

                            <textarea
                                className="form-control"
                                style={{
                                    height: '600px',
                                    fontFamily: 'monospace',
                                    fontSize: '0.875rem',
                                    whiteSpace: 'pre-wrap',
                                    lineHeight: '1.5'
                                }}
                                value={editingPrompt.template}
                                onChange={e => setEditingPrompt({ ...editingPrompt, template: e.target.value })}
                                required
                            />
                        </div>
                        <div className="flex justify-end gap-sm mt-md">
                            <button type="submit" className="btn btn-primary">Save Prompt</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-md">
                <h3>Analysis Prompts</h3>
                <div className="flex gap-sm">
                    <button onClick={handleReset} className="btn btn-secondary">Reset Default</button>
                    <button
                        onClick={() => setEditingPrompt({ name: '', description: '', template: '' })}
                        className="btn btn-primary"
                    >
                        + New Prompt
                    </button>
                </div>
            </div>

            {message && (
                <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'} mb-md`}>
                    {message.text}
                </div>
            )}

            <div className="grid gap-md">
                {prompts.map(prompt => (
                    <div key={prompt.id} className={`card ${prompt.is_active ? 'border-primary' : ''}`}>
                        <div className="card-body">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-sm">
                                        <h4 className="m-0">{prompt.name}</h4>
                                        {prompt.is_active && <span className="badge badge-primary">Active</span>}
                                        {prompt.is_default === 1 && <span className="badge badge-secondary">Default</span>}
                                    </div>
                                    <p className="text-secondary mt-sm">{prompt.description}</p>
                                </div>
                                <div className="flex gap-sm">
                                    {!prompt.is_active && (
                                        <button
                                            onClick={() => handleActivate(prompt.id)}
                                            className="btn btn-sm btn-secondary"
                                        >
                                            Activate
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setEditingPrompt(prompt)}
                                        className="btn btn-sm btn-secondary"
                                    >
                                        Edit
                                    </button>
                                    {prompt.is_default !== 1 && (
                                        <button
                                            onClick={() => handleDelete(prompt.id, prompt.name)}
                                            className="btn btn-sm btn-secondary"
                                            style={{ color: '#ef4444' }}
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
