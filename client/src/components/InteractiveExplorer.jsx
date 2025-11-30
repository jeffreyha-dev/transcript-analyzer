import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, RefreshCw } from 'lucide-react';
import api from '../utils/api';
import IntentAnalysisChart from './visualizations/IntentAnalysisChart';
import EmpathyDistribution from './visualizations/EmpathyDistribution';
import ChurnRiskVisuals from './visualizations/ChurnRiskVisuals';
import ResolutionChart from './visualizations/ResolutionChart';

export default function InteractiveExplorer() {
    const [data, setData] = useState([]);
    const [intentData, setIntentData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('all');
    const [error, setError] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch AI results (limit 500 for visualization)
            // Note: We might want to add date filtering to the API call in the future
            // Fetch AI results (limit 500 for visualization)
            // Note: We might want to add date filtering to the API call in the future
            const [response, intents] = await Promise.all([
                api.getAIResults(1, 500),
                api.getIntentStats()
            ]);
            setData(response.results || []);
            setIntentData(intents || []);
        } catch (err) {
            console.error("Failed to load explorer data", err);
            setError("Failed to load analysis data. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Filter data locally for now based on dateRange
    // In a real app, this should be done on the backend
    const filteredData = data.filter(d => {
        if (dateRange === 'all') return true;
        const date = new Date(d.analyzed_at);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const rangeDays = parseInt(dateRange.replace('d', ''));
        return diffDays <= rangeDays;
    });

    return (
        <div className="container" style={{ padding: '2rem 0', minHeight: 'calc(100vh - 64px)' }}>
            <div className="flex justify-between items-center mb-lg">
                <div>
                    <h1 className="flex items-center gap-sm">
                        <span style={{ fontSize: '2rem' }}>🧭</span>
                        Interactive Explorer
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        Deep dive into AI-powered insights across your conversations.
                    </p>
                </div>

                <div className="flex gap-sm">
                    <button
                        onClick={fetchData}
                        className="btn btn-secondary"
                        disabled={loading}
                    >
                        <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                        Refresh Data
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
            </div>

            {loading ? (
                <div className="flex justify-center p-xl">
                    <div className="spinner"></div>
                </div>
            ) : error ? (
                <div className="card p-xl text-center border-red-500 bg-red-500/10 text-red-500">
                    <p>{error}</p>
                    <button onClick={fetchData} className="btn btn-secondary mt-md">Retry</button>
                </div>
            ) : filteredData.length === 0 ? (
                <div className="card p-xl text-center">
                    <p className="text-lg text-secondary">No AI analysis data found.</p>
                    <p className="text-sm text-muted mt-sm">Run AI analysis on your conversations to see insights here.</p>
                </div>
            ) : (
                <div className="grid grid-2 gap-lg">
                    {/* Top Row: Intent Map & Empathy */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="card"
                        style={{ height: '400px' }}
                    >
                        <div className="p-md border-b border-border mb-md flex justify-between items-end">
                            <div>
                                <h3 className="text-lg font-semibold">Intent Impact Analysis</h3>
                                <p className="text-sm text-secondary">Volume vs Sentiment (Size = Complexity)</p>
                            </div>
                            <div className="text-xs text-secondary text-right">
                                Based on <span className="font-medium text-primary">{intentData.reduce((acc, curr) => acc + curr.count, 0)}</span> AI-analyzed conversations
                            </div>
                        </div>
                        <div style={{ height: '300px', width: '100%' }}>
                            <IntentAnalysisChart data={intentData} />
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className="card"
                        style={{ height: '400px' }}
                    >
                        <div className="p-md border-b border-border mb-md">
                            <h3 className="text-lg font-semibold">Empathy Distribution</h3>
                            <p className="text-sm text-secondary">Distribution of agent empathy scores across conversations</p>
                        </div>
                        <div style={{ height: '300px', width: '100%' }}>
                            <EmpathyDistribution data={filteredData} />
                        </div>
                    </motion.div>

                    {/* Bottom Row: Churn Risk & Resolutions */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                        className="card"
                        style={{ height: '400px' }}
                    >
                        <div className="p-md border-b border-border mb-md">
                            <h3 className="text-lg font-semibold">Churn Risk Analysis</h3>
                            <p className="text-sm text-secondary">Overview of customer churn risk levels</p>
                        </div>
                        <div style={{ height: '300px', width: '100%' }}>
                            <ChurnRiskVisuals data={filteredData} />
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.3 }}
                        className="card"
                        style={{ height: '400px' }}
                    >
                        <div className="p-md border-b border-border mb-md">
                            <h3 className="text-lg font-semibold">Resolution Status</h3>
                            <p className="text-sm text-secondary">Proportion of resolved vs. unresolved issues</p>
                        </div>
                        <div style={{ height: '300px', width: '100%' }}>
                            <ResolutionChart data={filteredData} />
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
