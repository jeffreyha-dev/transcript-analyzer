import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine, Label } from 'recharts';

export default function IntentAnalysisChart({ data }) {
    if (!data || data.length === 0) return <div className="text-center p-lg text-secondary">No data available</div>;

    // 1. Map Pre-Aggregated Data
    const chartData = data.map(d => ({
        intent: d.intent,
        x: d.avg_sentiment !== undefined ? (d.avg_sentiment - 50) * 2 : 0, // Map 0-100 to -100 to 100
        y: d.count, // Volume (Y-Axis)
        z: d.avg_complexity, // Avg Complexity (Bubble Size)
        complexity: d.avg_complexity,
        count: d.count
    }));

    // 3. Custom Tooltip
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="card p-sm shadow-lg" style={{ border: '1px solid var(--border-color)', minWidth: '200px', backgroundColor: 'var(--bg-secondary)' }}>
                    <p className="font-bold mb-xs" style={{ color: 'var(--text-primary)' }}>{data.intent}</p>
                    <div className="grid grid-2 gap-xs text-xs" style={{ color: 'var(--text-secondary)' }}>
                        <div>Volume:</div>
                        <div className="text-right font-medium">{data.count} conversations</div>
                        <div>Avg Sentiment:</div>
                        <div className="text-right font-medium" style={{ color: data.x >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                            {data.x.toFixed(1)}
                        </div>
                        <div>Avg Complexity:</div>
                        <div className="text-right font-medium">{data.complexity.toFixed(1)} / 3.0</div>
                    </div>
                </div>
            );
        }
        return null;
    };

    // 4. Quadrant Labels
    const renderQuadrantLabels = () => (
        <>
            <text x="95%" y="10%" textAnchor="end" fill="var(--text-muted)" fontSize={10} opacity={0.5}>High Volume & Positive</text>
            <text x="95%" y="90%" textAnchor="end" fill="var(--text-muted)" fontSize={10} opacity={0.5}>Low Volume & Positive</text>
            <text x="5%" y="10%" textAnchor="start" fill="var(--text-muted)" fontSize={10} opacity={0.5}>High Volume & Negative</text>
            <text x="5%" y="90%" textAnchor="start" fill="var(--text-muted)" fontSize={10} opacity={0.5}>Low Volume & Negative</text>
        </>
    );

    // Calculate max volume for Y-axis domain
    const maxVolume = Math.max(...chartData.map(d => d.y), 10);

    return (
        <div className="h-full w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <XAxis
                        type="number"
                        dataKey="x"
                        name="Sentiment"
                        domain={[-100, 100]}
                        label={{ value: 'Avg Sentiment', position: 'bottom', offset: 0, fill: 'var(--text-secondary)', fontSize: 12 }}
                        tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
                        stroke="var(--border-color)"
                    />
                    <YAxis
                        type="number"
                        dataKey="y"
                        name="Volume"
                        domain={[0, 'auto']}
                        label={{ value: 'Volume (Conversations)', angle: -90, position: 'left', offset: 0, fill: 'var(--text-secondary)', fontSize: 12 }}
                        tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
                        stroke="var(--border-color)"
                    />
                    <ZAxis type="number" dataKey="z" range={[100, 1000]} name="Complexity" />

                    <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />

                    {/* Quadrant Lines */}
                    <ReferenceLine x={0} stroke="var(--border-color)" strokeDasharray="3 3" />
                    <ReferenceLine y={maxVolume / 2} stroke="var(--border-color)" strokeDasharray="3 3" />

                    <Scatter name="Intents" data={chartData} fill="#8884d8">
                        {chartData.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.x >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)'}
                                fillOpacity={0.7}
                            />
                        ))}
                    </Scatter>
                    {renderQuadrantLabels()}
                </ScatterChart>
            </ResponsiveContainer>
        </div>
    );
}
