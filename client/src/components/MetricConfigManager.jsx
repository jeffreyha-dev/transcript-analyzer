import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function MetricConfigManager() {
    const [configs, setConfigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingConfig, setEditingConfig] = useState(null);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        loadConfigs();
    }, []);

    const loadConfigs = async () => {
        try {
            setLoading(true);
            const data = await api.getMetricConfigs();
            setConfigs(data);
        } catch (err) {
            console.error('Failed to load metric configs:', err);
            setMessage({ type: 'error', text: 'Failed to load metric configs' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await api.saveMetricConfig(editingConfig);
            setMessage({ type: 'success', text: 'Metric config saved successfully' });
            setEditingConfig(null);
            loadConfigs();
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to save metric config' });
        }
    };

    const handleDelete = async (name) => {
        if (!window.confirm(`Delete metric config for "${name}"?`)) return;
        try {
            await api.deleteMetricConfig(name);
            setMessage({ type: 'success', text: 'Metric config deleted' });
            loadConfigs();
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to delete metric config' });
        }
    };

    const addThreshold = () => {
        const thresholds = editingConfig.color_thresholds || [];
        setEditingConfig({
            ...editingConfig,
            color_thresholds: [...thresholds, { max: 0, color: '#10b981' }]
        });
    };

    const updateThreshold = (index, field, value) => {
        const thresholds = [...editingConfig.color_thresholds];
        thresholds[index] = { ...thresholds[index], [field]: value };
        setEditingConfig({ ...editingConfig, color_thresholds: thresholds });
    };

    const removeThreshold = (index) => {
        const thresholds = editingConfig.color_thresholds.filter((_, i) => i !== index);
        setEditingConfig({ ...editingConfig, color_thresholds: thresholds });
    };

    if (loading) return <div>Loading metric configs...</div>;

    if (editingConfig) {
        return (
            <div className="card">
                <div className="card-header flex justify-between items-center">
                    <h3>{editingConfig.id ? 'Edit Metric Config' : 'New Metric Config'}</h3>
                    <button onClick={() => setEditingConfig(null)} className="btn btn-secondary">Cancel</button>
                </div>
                <div className="card-body">
                    <form onSubmit={handleSave}>
                        <div className="form-group">
                            <label>Metric Name</label>
                            <input
                                type="text"
                                className="form-control"
                                value={editingConfig.metric_name || ''}
                                onChange={e => setEditingConfig({ ...editingConfig, metric_name: e.target.value })}
                                required
                                placeholder="e.g., CES, NPS, customScore"
                            />
                        </div>

                        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label>Min Value</label>
                                <input
                                    type="number"
                                    step="any"
                                    className="form-control"
                                    value={editingConfig.min_value ?? ''}
                                    onChange={e => setEditingConfig({ ...editingConfig, min_value: parseFloat(e.target.value) })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Max Value</label>
                                <input
                                    type="number"
                                    step="any"
                                    className="form-control"
                                    value={editingConfig.max_value ?? ''}
                                    onChange={e => setEditingConfig({ ...editingConfig, max_value: parseFloat(e.target.value) })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input
                                    type="checkbox"
                                    checked={editingConfig.reverse_scale || false}
                                    onChange={e => setEditingConfig({ ...editingConfig, reverse_scale: e.target.checked })}
                                />
                                Lower is better (reverse scale)
                            </label>
                        </div>

                        <div className="form-group">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <label style={{ margin: 0 }}>Color Thresholds</label>
                                <button type="button" onClick={addThreshold} className="btn btn-sm btn-secondary">
                                    + Add Threshold
                                </button>
                            </div>
                            {(editingConfig.color_thresholds || []).map((threshold, i) => (
                                <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                                    <input
                                        type="number"
                                        step="any"
                                        className="form-control"
                                        placeholder="Max value"
                                        value={threshold.max}
                                        onChange={e => updateThreshold(i, 'max', parseFloat(e.target.value))}
                                        style={{ flex: 1 }}
                                    />
                                    <input
                                        type="color"
                                        value={threshold.color}
                                        onChange={e => updateThreshold(i, 'color', e.target.value)}
                                        style={{ width: '60px', height: '38px', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeThreshold(i)}
                                        className="btn btn-sm btn-secondary"
                                        style={{ color: '#ef4444' }}
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end gap-sm mt-md">
                            <button type="submit" className="btn btn-primary">Save Config</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-md">
                <h3>Metric Configurations</h3>
                <button
                    onClick={() => setEditingConfig({ metric_name: '', min_value: 0, max_value: 100, reverse_scale: false, color_thresholds: [] })}
                    className="btn btn-primary"
                >
                    + New Metric Config
                </button>
            </div>

            {message && (
                <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'} mb-md`}>
                    {message.text}
                </div>
            )}

            <div className="grid gap-md">
                {configs.map(config => (
                    <div key={config.id} className="card">
                        <div className="card-body">
                            <div className="flex justify-between items-start">
                                <div style={{ flex: 1 }}>
                                    <h4 className="m-0">{config.metric_name}</h4>
                                    <p className="text-secondary mt-sm">
                                        Range: {config.min_value} to {config.max_value}
                                        {config.reverse_scale === 1 && ' (Lower is better)'}
                                    </p>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                        {config.color_thresholds.map((t, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <div style={{ width: '20px', height: '20px', background: t.color, borderRadius: '4px', border: '1px solid var(--border-color)' }}></div>
                                                <span style={{ fontSize: '0.875rem' }}>≤ {t.max}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-sm">
                                    <button
                                        onClick={() => setEditingConfig(config)}
                                        className="btn btn-sm btn-secondary"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(config.metric_name)}
                                        className="btn btn-sm btn-secondary"
                                        style={{ color: '#ef4444' }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
