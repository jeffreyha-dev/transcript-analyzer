import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function ChurnRiskVisuals({ data }) {
    if (!data || data.length === 0) return <div className="text-center p-lg text-secondary">No data available</div>;

    // 1. Calculate Average Churn Risk
    const avgRisk = data.reduce((sum, d) => sum + (d.churn_risk_score || 0), 0) / data.length;

    // 2. Identify High Risk Conversations (> 70)
    const highRiskConvs = data
        .filter(d => (d.churn_risk_score || 0) > 70)
        .sort((a, b) => b.churn_risk_score - a.churn_risk_score)
        .slice(0, 5);

    // 3. Gauge Data
    const gaugeData = [
        { name: 'Risk', value: avgRisk },
        { name: 'Safe', value: 100 - avgRisk }
    ];

    const COLORS = [
        avgRisk > 70 ? 'var(--accent-danger)' : (avgRisk > 30 ? 'var(--accent-warning)' : 'var(--accent-success)'),
        'var(--bg-tertiary)'
    ];

    return (
        <div className="grid grid-2 gap-md h-full">
            {/* Gauge Chart */}
            <div className="flex flex-col items-center justify-center">
                <div style={{ width: '100%', height: '200px', position: 'relative' }}>
                    <PieChart width={300} height={200}>
                        <Pie
                            data={gaugeData}
                            cx="50%"
                            cy="70%"
                            startAngle={180}
                            endAngle={0}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={0}
                            dataKey="value"
                        >
                            {gaugeData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index]} stroke="none" />
                            ))}
                        </Pie>
                    </PieChart>
                    <div className="absolute" style={{ top: '65%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                        <div className="text-2xl font-bold">{avgRisk.toFixed(1)}%</div>
                        <div className="text-xs text-secondary">Avg Risk</div>
                    </div>
                </div>
            </div>

            {/* High Risk List */}
            <div className="overflow-y-auto" style={{ maxHeight: '250px' }}>
                <h4 className="text-sm font-semibold mb-sm text-secondary uppercase">High Risk Conversations</h4>
                {highRiskConvs.length > 0 ? (
                    <div className="flex flex-col gap-xs">
                        {highRiskConvs.map(conv => (
                            <div key={conv.conversation_id} className="p-sm rounded bg-tertiary border border-border flex justify-between items-center">
                                <div>
                                    <div className="font-medium text-sm">{conv.conversation_id}</div>
                                    <div className="text-xs text-secondary">{conv.primary_intent || 'Unknown'}</div>
                                </div>
                                <div className="badge badge-negative">{conv.churn_risk_score}%</div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-sm text-secondary text-center py-md">No high risk conversations detected</div>
                )}
            </div>
        </div>
    );
}
