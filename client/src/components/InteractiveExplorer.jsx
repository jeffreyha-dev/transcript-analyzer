import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, Grid, Filter } from 'lucide-react';
import TopicClusterMap from './visualizations/TopicClusterMap';
import SentimentHeatmap from './visualizations/SentimentHeatmap';

export default function InteractiveExplorer() {
    const [activeView, setActiveView] = useState('topics'); // 'topics' or 'heatmap'
    const [dateRange, setDateRange] = useState('all');
    const [sentimentFilter, setSentimentFilter] = useState('all');

    return (
        <div className="container" style={{ padding: '2rem 0', minHeight: 'calc(100vh - 64px)' }}>
            <div className="flex justify-between items-center mb-lg">
                <div>
                    <h1 className="flex items-center gap-sm">
                        <span style={{ fontSize: '2rem' }}>🧭</span>
                        Interactive Explorer
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        Visually discover trends and patterns in your conversation data.
                    </p>
                </div>

                {/* View Toggles */}
                <div className="flex bg-tertiary p-1 rounded-lg border border-border">
                    <button
                        onClick={() => setActiveView('topics')}
                        className={`flex items-center gap-xs px-md py-sm rounded-md transition-all ${activeView === 'topics'
                                ? 'bg-primary text-white shadow-sm'
                                : 'text-secondary hover:text-primary'
                            }`}
                        style={{
                            background: activeView === 'topics' ? 'var(--accent-primary)' : 'transparent',
                            color: activeView === 'topics' ? 'white' : 'var(--text-secondary)'
                        }}
                    >
                        <Map size={18} />
                        Topic Map
                    </button>
                    <button
                        onClick={() => setActiveView('heatmap')}
                        className={`flex items-center gap-xs px-md py-sm rounded-md transition-all ${activeView === 'heatmap'
                                ? 'bg-primary text-white shadow-sm'
                                : 'text-secondary hover:text-primary'
                            }`}
                        style={{
                            background: activeView === 'heatmap' ? 'var(--accent-primary)' : 'transparent',
                            color: activeView === 'heatmap' ? 'white' : 'var(--text-secondary)'
                        }}
                    >
                        <Grid size={18} />
                        Sentiment Heatmap
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="card mb-lg p-md flex gap-md items-center">
                <div className="flex items-center gap-sm text-secondary">
                    <Filter size={18} />
                    <span className="font-medium">Filters:</span>
                </div>

                <select
                    className="input py-xs"
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    style={{ maxWidth: '200px' }}
                >
                    <option value="all">All Time</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                    <option value="90d">Last 3 Months</option>
                </select>

                <select
                    className="input py-xs"
                    value={sentimentFilter}
                    onChange={(e) => setSentimentFilter(e.target.value)}
                    style={{ maxWidth: '200px' }}
                >
                    <option value="all">All Sentiments</option>
                    <option value="positive">Positive Only</option>
                    <option value="negative">Negative Only</option>
                    <option value="neutral">Neutral Only</option>
                </select>
            </div>

            {/* Main Visualization Area */}
            <div className="relative" style={{ minHeight: '600px' }}>
                <AnimatePresence mode="wait">
                    {activeView === 'topics' ? (
                        <motion.div
                            key="topics"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <TopicClusterMap dateRange={dateRange} sentimentFilter={sentimentFilter} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="heatmap"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <SentimentHeatmap dateRange={dateRange} sentimentFilter={sentimentFilter} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
