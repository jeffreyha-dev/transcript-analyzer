import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

export default function IntentClusterMap({ data }) {
    if (!data || data.length === 0) return <div className="text-center p-lg text-secondary">No data available</div>;

    // 1. Extract unique intents and assign numeric values for Y-axis
    const uniqueIntents = [...new Set(data.map(d => d.primary_intent || 'Unknown'))].sort();
    const intentMap = {};
    uniqueIntents.forEach((intent, index) => {
        intentMap[intent] = index;
    });

    // 2. Process data for chart
    const chartData = data.map(d => ({
        ...d,
        x: d.overall_sentiment !== undefined ? (d.overall_sentiment - 50) * 2 : 0, // Map 0-100 to -100 to 100
        y: intentMap[d.primary_intent || 'Unknown'], // Intent index on Y
        z: d.complexity === 'High' ? 300 : (d.complexity === 'Medium' ? 150 : 80), // Size by complexity
        intent: d.primary_intent || 'Unknown',
        sentiment: d.sentiment_label,
        complexity: d.complexity || 'Low'
    }));

    // 3. Custom Tooltip
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="card p-sm shadow-lg" style={{ border: '1px solid var(--border-color)', minWidth: '200px' }}>
                    <p className="font-bold mb-xs" style={{ color: 'var(--accent-primary)' }}>{data.intent}</p>
                    <p className="text-sm text-secondary mb-xs">ID: {data.conversation_id}</p>
                    <div className="grid grid-2 gap-xs text-xs">
                        <div>Sentiment:</div>
                        <div className="text-right font-medium">{data.x.toFixed(1)}</div>
                        <div>Complexity:</div>
                        <div className="text-right font-medium">{data.complexity}</div>
                    </div>
                </div>
            );
        }
        return null;
    };

    // 4. Color generation
    const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#14b8a6'];

    return (
        <div className="h-full w-full flex items-center justify-center">
            <ScatterChart width={500} height={280} margin={{ top: 20, right: 20, bottom: 20, left: 60 }}>
                <XAxis
                    type="number"
                    dataKey="x"
                    name="Sentiment"
                    domain={[-100, 100]}
                    label={{ value: 'Sentiment Score', position: 'bottom', offset: 0, fill: 'var(--text-secondary)' }}
                    tick={{ fill: 'var(--text-secondary)' }}
                />
                <YAxis
                    type="number"
                    dataKey="y"
                    name="Intent"
                    domain={[-1, uniqueIntents.length]}
                    ticks={uniqueIntents.map((_, i) => i)}
                    tickFormatter={(value) => uniqueIntents[value]}
                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                    width={100}
                />
                <ZAxis type="number" dataKey="z" range={[50, 400]} />
                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="Conversations" data={chartData} fill="#8884d8">
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[intentMap[entry.intent] % COLORS.length]} />
                    ))}
                </Scatter>
            </ScatterChart>
        </div>
    );
}
