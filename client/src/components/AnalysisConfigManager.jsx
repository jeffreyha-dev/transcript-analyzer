import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function AnalysisConfigManager() {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const [activeTab, setActiveTab] = useState('sentiment');

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            setLoading(true);
            const data = await api.getAnalysisConfig();
            setConfig(data);
        } catch (err) {
            console.error('Failed to load analysis config:', err);
            setMessage({ type: 'error', text: 'Failed to load configuration' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await api.updateAnalysisConfig(config);
            setMessage({ type: 'success', text: 'Configuration saved successfully' });
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to save configuration' });
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        if (!window.confirm('Reset all analysis configuration to defaults?')) return;
        try {
            await api.resetAnalysisConfig();
            setMessage({ type: 'success', text: 'Configuration reset to defaults' });
            loadConfig();
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to reset configuration' });
        }
    };

    const addKeyword = (category, word) => {
        if (!word.trim()) return;
        const keywords = config.sentiment_keywords[category];
        if (!keywords.includes(word.trim())) {
            setConfig({
                ...config,
                sentiment_keywords: {
                    ...config.sentiment_keywords,
                    [category]: [...keywords, word.trim()]
                }
            });
        }
    };

    const removeKeyword = (category, index) => {
        setConfig({
            ...config,
            sentiment_keywords: {
                ...config.sentiment_keywords,
                [category]: config.sentiment_keywords[category].filter((_, i) => i !== index)
            }
        });
    };

    const addTopic = (topicName, keywords) => {
        if (!topicName.trim()) return;
        setConfig({
            ...config,
            topic_patterns: {
                ...config.topic_patterns,
                [topicName.trim()]: keywords || []
            }
        });
    };

    const removeTopic = (topicName) => {
        const { [topicName]: removed, ...rest } = config.topic_patterns;
        setConfig({
            ...config,
            topic_patterns: rest
        });
    };

    const updateTopicKeywords = (topicName, keywords) => {
        setConfig({
            ...config,
            topic_patterns: {
                ...config.topic_patterns,
                [topicName]: keywords
            }
        });
    };

    if (loading) return <div>Loading configuration...</div>;
    if (!config) return <div>No configuration found</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-md">
                <h3>Traditional Analysis Configuration</h3>
                <div className="flex gap-sm">
                    <button onClick={handleReset} className="btn btn-secondary">Reset to Defaults</button>
                    <button onClick={handleSave} disabled={saving} className="btn btn-primary">
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            {message && (
                <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'} mb-md`}>
                    {message.text}
                </div>
            )}

            {/* Tabs */}
            <div style={{ borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    {['sentiment', 'topics', 'performance', 'keywords'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                padding: '0.75rem 1rem',
                                background: 'none',
                                border: 'none',
                                borderBottom: activeTab === tab ? '2px solid var(--primary-color)' : '2px solid transparent',
                                color: activeTab === tab ? 'var(--primary-color)' : 'var(--text-secondary)',
                                fontWeight: activeTab === tab ? '600' : '400',
                                cursor: 'pointer',
                                textTransform: 'capitalize'
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Sentiment Tab */}
            {activeTab === 'sentiment' && (
                <div className="card">
                    <div className="card-body">
                        <h4>Sentiment Keywords</h4>
                        <p className="text-secondary">Define words that indicate positive, negative, or neutral sentiment.</p>

                        {['positive', 'negative', 'neutral'].map(category => (
                            <div key={category} style={{ marginTop: '1.5rem' }}>
                                <label style={{ textTransform: 'capitalize', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                                    {category} Words
                                </label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    {config.sentiment_keywords[category].map((word, i) => (
                                        <span key={i} className="badge badge-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            {word}
                                            <button
                                                onClick={() => removeKeyword(category, i)}
                                                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '0' }}
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Add word and press Enter"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            addKeyword(category, e.target.value);
                                            e.target.value = '';
                                        }
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Topics Tab */}
            {activeTab === 'topics' && (
                <div className="card">
                    <div className="card-body">
                        <h4>Topic Patterns</h4>
                        <p className="text-secondary">Define topics and their associated keywords.</p>

                        {Object.entries(config.topic_patterns).map(([topic, keywords]) => (
                            <div key={topic} style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                    <h5 style={{ margin: 0, textTransform: 'capitalize' }}>{topic}</h5>
                                    <button onClick={() => removeTopic(topic)} className="btn btn-sm btn-secondary" style={{ color: '#ef4444' }}>
                                        Delete Topic
                                    </button>
                                </div>

                                {/* Keywords as tags */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    {keywords.map((keyword, i) => (
                                        <span key={i} className="badge badge-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            {keyword}
                                            <button
                                                onClick={() => {
                                                    const newKeywords = keywords.filter((_, idx) => idx !== i);
                                                    updateTopicKeywords(topic, newKeywords);
                                                }}
                                                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '0' }}
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>

                                {/* Add keyword input */}
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Add keyword and press Enter"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && e.target.value.trim()) {
                                            const newKeyword = e.target.value.trim();
                                            if (!keywords.includes(newKeyword)) {
                                                updateTopicKeywords(topic, [...keywords, newKeyword]);
                                            }
                                            e.target.value = '';
                                        }
                                    }}
                                />
                            </div>
                        ))}

                        <button
                            onClick={() => {
                                const name = prompt('Enter topic name:');
                                if (name) addTopic(name, []);
                            }}
                            className="btn btn-secondary"
                            style={{ marginTop: '1rem' }}
                        >
                            + Add Topic
                        </button>
                    </div>
                </div>
            )}

            {/* Performance Tab */}
            {activeTab === 'performance' && (
                <div className="card">
                    <div className="card-body">
                        <h4>Performance Thresholds</h4>
                        <p className="text-secondary">Set thresholds for agent performance scoring.</p>

                        <div className="form-group">
                            <label>Good Agent Score Threshold (0-100)</label>
                            <input
                                type="number"
                                className="form-control"
                                value={config.performance_thresholds.goodAgentScore}
                                onChange={(e) => setConfig({
                                    ...config,
                                    performance_thresholds: {
                                        ...config.performance_thresholds,
                                        goodAgentScore: parseInt(e.target.value)
                                    }
                                })}
                            />
                        </div>

                        <div className="form-group">
                            <label>Average Response Time Target (seconds)</label>
                            <input
                                type="number"
                                className="form-control"
                                value={config.performance_thresholds.avgResponseTimeTarget}
                                onChange={(e) => setConfig({
                                    ...config,
                                    performance_thresholds: {
                                        ...config.performance_thresholds,
                                        avgResponseTimeTarget: parseInt(e.target.value)
                                    }
                                })}
                            />
                        </div>

                        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label>Min Message Length</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={config.performance_thresholds.minMessageLength}
                                    onChange={(e) => setConfig({
                                        ...config,
                                        performance_thresholds: {
                                            ...config.performance_thresholds,
                                            minMessageLength: parseInt(e.target.value)
                                        }
                                    })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Max Message Length</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={config.performance_thresholds.maxMessageLength}
                                    onChange={(e) => setConfig({
                                        ...config,
                                        performance_thresholds: {
                                            ...config.performance_thresholds,
                                            maxMessageLength: parseInt(e.target.value)
                                        }
                                    })}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Keywords Tab */}
            {activeTab === 'keywords' && (
                <div className="card">
                    <div className="card-body">
                        <h4>Keyword Extraction Settings</h4>
                        <p className="text-secondary">Configure how keywords are extracted from conversations.</p>

                        <div className="form-group">
                            <label>Minimum Frequency</label>
                            <input
                                type="number"
                                className="form-control"
                                value={config.keyword_extraction.minFrequency}
                                onChange={(e) => setConfig({
                                    ...config,
                                    keyword_extraction: {
                                        ...config.keyword_extraction,
                                        minFrequency: parseInt(e.target.value)
                                    }
                                })}
                            />
                            <small className="text-secondary">Minimum times a word must appear to be considered a keyword</small>
                        </div>

                        <div className="form-group">
                            <label>Stop Words</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                {config.keyword_extraction.stopWords.map((word, i) => (
                                    <span key={i} className="badge badge-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {word}
                                        <button
                                            onClick={() => {
                                                const newWords = config.keyword_extraction.stopWords.filter((_, idx) => idx !== i);
                                                setConfig({
                                                    ...config,
                                                    keyword_extraction: {
                                                        ...config.keyword_extraction,
                                                        stopWords: newWords
                                                    }
                                                });
                                            }}
                                            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '0' }}
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Add stop word and press Enter"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && e.target.value.trim()) {
                                        const newWord = e.target.value.trim();
                                        if (!config.keyword_extraction.stopWords.includes(newWord)) {
                                            setConfig({
                                                ...config,
                                                keyword_extraction: {
                                                    ...config.keyword_extraction,
                                                    stopWords: [...config.keyword_extraction.stopWords, newWord]
                                                }
                                            });
                                        }
                                        e.target.value = '';
                                    }
                                }}
                            />
                            <small className="text-secondary">Words to exclude from keyword extraction</small>
                        </div>

                        <div className="form-group">
                            <label>Always Include</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                {config.keyword_extraction.alwaysInclude.map((word, i) => (
                                    <span key={i} className="badge badge-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {word}
                                        <button
                                            onClick={() => {
                                                const newWords = config.keyword_extraction.alwaysInclude.filter((_, idx) => idx !== i);
                                                setConfig({
                                                    ...config,
                                                    keyword_extraction: {
                                                        ...config.keyword_extraction,
                                                        alwaysInclude: newWords
                                                    }
                                                });
                                            }}
                                            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '0' }}
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Add keyword and press Enter"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && e.target.value.trim()) {
                                        const newWord = e.target.value.trim();
                                        if (!config.keyword_extraction.alwaysInclude.includes(newWord)) {
                                            setConfig({
                                                ...config,
                                                keyword_extraction: {
                                                    ...config.keyword_extraction,
                                                    alwaysInclude: [...config.keyword_extraction.alwaysInclude, newWord]
                                                }
                                            });
                                        }
                                        e.target.value = '';
                                    }
                                }}
                            />
                            <small className="text-secondary">Words to always include as keywords</small>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
