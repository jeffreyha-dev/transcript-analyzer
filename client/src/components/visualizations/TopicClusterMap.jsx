import { useState, useEffect } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '../../utils/api';

export default function TopicClusterMap({ dateRange, sentimentFilter }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await api.getTopicClusters(dateRange, sentimentFilter);

                const processed = response.map((r, idx) => {
                    // Parse topics JSON if string
                    let topics = [];
                    try {
                        topics = typeof r.topics === 'string' ? JSON.parse(r.topics) : (r.topics || []);
                    } catch (e) {
                        topics = [];
                    }

                    // Use 3rd or 4th topic for better clustering (skip "agent", "customer")
                    // Fall back to first meaningful term if not enough topics
                    const meaningfulTopics = topics.filter(t =>
                        !['agent', 'customer', 'support'].includes(t.term.toLowerCase())
                    );
                    const topicTerm = meaningfulTopics[0]?.term || topics[0]?.term || 'Uncategorized';

                    // Hash topic to Y-axis base value
                    const baseY = topicTerm.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 80;

                    // Add jitter to prevent exact overlaps (±10 units)
                    const jitter = (idx % 20) - 10;
                    const yVal = baseY + jitter;

                    // Sentiment to X-axis (-100 to 100)
                    const xVal = (r.overall_sentiment || 0) * 2 - 100;

                    const csat = r.customer_satisfaction_score || 0;

                    return {
                        id: r.conversation_id,
                        x: xVal,
                        y: yVal,
                        z: csat,
                        csat: csat,
                        topic: topicTerm,
                        sentiment: r.sentiment_label,
                        score: r.overall_sentiment
                    };
                });
                setData(processed);
            } catch (err) {
                console.error("Failed to load map data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [dateRange, sentimentFilter]);

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="card p-sm shadow-lg" style={{ border: '1px solid var(--border-color)' }}>
                    <p className="font-bold mb-xs">{data.topic}</p>
                    <p className="text-sm text-secondary">ID: {data.id}</p>
                    <p className="text-sm">
                        Sentiment: <span style={{ color: getSentimentColor(data.score) }}>{data.sentiment}</span>
                    </p>
                    <p className="text-sm">CSAT: {data.csat}</p>
                </div>
            );
        }
        return null;
    };

    if (loading) return <div className="flex justify-center p-xl"><div className="spinner"></div></div>;

    if (data.length === 0) {
        return (
            <div className="card h-full" style={{ minHeight: '600px' }}>
                <div className="p-md border-b border-border">
                    <h3 className="text-lg font-semibold">Topic Landscape</h3>
                    <p className="text-sm text-secondary">
                        X-Axis: Sentiment (Negative ← → Positive) • Y-Axis: Topic Cluster
                    </p>
                </div>
                <div className="flex items-center justify-center" style={{ height: '500px' }}>
                    <div className="text-center p-xl">
                        <p className="text-lg mb-sm">No AI Analysis Data Available</p>
                        <p className="text-sm text-secondary">
                            Topic clustering requires AI analysis to be run first.<br />
                            Go to the AI Analysis tab and run analysis on your conversations.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="card h-full" style={{ minHeight: '600px' }}>
            <div className="p-md border-b border-border">
                <h3 className="text-lg font-semibold">Topic Landscape</h3>
                <p className="text-sm text-secondary">
                    X-Axis: Sentiment (Negative ← → Positive) • Y-Axis: Topic Cluster
                </p>
            </div>
            <div style={{ height: '500px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <XAxis
                            type="number"
                            dataKey="x"
                            name="Sentiment"
                            domain={[-100, 100]}
                            label={{ value: 'Sentiment', position: 'bottom', offset: 0 }}
                        />
                        <YAxis
                            type="number"
                            dataKey="y"
                            name="Topic Cluster"
                            domain={[0, 100]}
                            hide
                        />
                        <ZAxis type="number" dataKey="z" range={[50, 400]} name="CSAT" />
                        <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                        <Scatter name="Conversations" data={data} fill="#8884d8">
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={getSentimentColor(entry.score)} />
                            ))}
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

function getSentimentColor(score) {
    if (score >= 75) return 'var(--accent-success)'; // Green
    if (score >= 40) return 'var(--accent-primary)'; // Blue/Neutral
    return 'var(--accent-danger)'; // Red
}
