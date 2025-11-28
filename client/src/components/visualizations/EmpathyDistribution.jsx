import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function EmpathyDistribution({ data }) {
    if (!data || data.length === 0) return <div className="text-center p-lg text-secondary">No data available</div>;

    // 1. Create buckets for empathy scores (0-100)
    const buckets = [
        { name: '0-20', min: 0, max: 20, count: 0 },
        { name: '21-40', min: 21, max: 40, count: 0 },
        { name: '41-60', min: 41, max: 60, count: 0 },
        { name: '61-80', min: 61, max: 80, count: 0 },
        { name: '81-100', min: 81, max: 100, count: 0 }
    ];

    // 2. Populate buckets
    data.forEach(d => {
        const score = d.empathy_score || 0;
        const bucket = buckets.find(b => score >= b.min && score <= b.max);
        if (bucket) bucket.count++;
    });

    // 3. Custom Tooltip
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="card p-sm shadow-lg" style={{ border: '1px solid var(--border-color)' }}>
                    <p className="font-bold mb-xs">Range: {label}</p>
                    <p className="text-sm">Conversations: {payload[0].value}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="h-full w-full flex items-center justify-center">
            <BarChart data={buckets} width={500} height={280} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <XAxis
                    dataKey="name"
                    tick={{ fill: 'var(--text-secondary)' }}
                    label={{ value: 'Empathy Score Range', position: 'bottom', offset: 0, fill: 'var(--text-secondary)' }}
                />
                <YAxis
                    tick={{ fill: 'var(--text-secondary)' }}
                    allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--glass-bg)' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {buckets.map((entry, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={index < 2 ? 'var(--accent-danger)' : (index < 3 ? 'var(--accent-warning)' : 'var(--accent-success)')}
                            fillOpacity={0.8}
                        />
                    ))}
                </Bar>
            </BarChart>
        </div>
    );
}
