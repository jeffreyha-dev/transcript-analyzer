import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function ResolutionChart({ data }) {
    if (!data || data.length === 0) return <div className="text-center p-lg text-secondary">No data available</div>;

    // 1. Calculate Resolved vs Unresolved
    const resolvedCount = data.filter(d => d.resolved).length;
    const unresolvedCount = data.length - resolvedCount;

    const chartData = [
        { name: 'Resolved', value: resolvedCount },
        { name: 'Unresolved', value: unresolvedCount }
    ];

    const COLORS = ['var(--accent-success)', 'var(--accent-danger)'];

    // 2. Custom Tooltip
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0];
            const percent = ((data.value / (resolvedCount + unresolvedCount)) * 100).toFixed(1);
            return (
                <div className="card p-sm shadow-lg" style={{ border: '1px solid var(--border-color)' }}>
                    <p className="font-bold mb-xs">{data.name}</p>
                    <p className="text-sm">{data.value} conversations ({percent}%)</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="h-full w-full flex items-center justify-center">
            <PieChart width={350} height={280}>
                <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                >
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
        </div>
    );
}
