import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import api from '../utils/api';
import { useAccount } from '../context/AccountContext';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export default function SentimentTrendChart({ days = 30 }) {
    const [trendData, setTrendData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAnomalies, setShowAnomalies] = useState(false);
    const { selectedAccount } = useAccount();

    useEffect(() => {
        loadTrends();
    }, [days, selectedAccount]);

    const loadTrends = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await api.getTrends(days, selectedAccount);
            setTrendData(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="card">
                <div className="card-header">
                    <h3>📈 Sentiment Trends</h3>
                </div>
                <div className="card-body" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="spinner"></div>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>Loading trends...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="card">
                <div className="card-header">
                    <h3>📈 Sentiment Trends</h3>
                </div>
                <div className="card-body">
                    <p style={{ color: 'var(--accent-danger)' }}>Error: {error}</p>
                </div>
            </div>
        );
    }

    if (!trendData || !trendData.historical || trendData.historical.length === 0) {
        return (
            <div className="card">
                <div className="card-header">
                    <h3>📈 Sentiment Trends</h3>
                </div>
                <div className="card-body" style={{ textAlign: 'center', padding: '3rem' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>No trend data available</p>
                </div>
            </div>
        );
    }

    // Prepare chart data
    const historicalDates = trendData.historical.map(d => {
        const date = new Date(d.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    const forecastDates = trendData.forecast.map(d => {
        const date = new Date(d.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    const allDates = [...historicalDates, ...forecastDates];

    const historicalSentiment = trendData.historical.map(d => d.avg_sentiment * 100);
    const forecastSentiment = new Array(historicalDates.length).fill(null).concat(
        trendData.forecast.map(d => d.predicted_sentiment * 100)
    );

    const chartData = {
        labels: allDates,
        datasets: [
            {
                label: 'Historical Sentiment',
                data: [...historicalSentiment, ...new Array(forecastDates.length).fill(null)],
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                pointHoverRadius: 5
            },
            {
                label: 'Forecast',
                data: forecastSentiment,
                borderColor: 'rgb(168, 85, 247)',
                backgroundColor: 'rgba(168, 85, 247, 0.1)',
                borderWidth: 2,
                borderDash: [5, 5],
                fill: false,
                tension: 0.4,
                pointRadius: 3,
                pointHoverRadius: 5
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top',
                labels: {
                    color: '#e5e7eb', // Bright gray for legend text
                    font: { size: 13, weight: '500' },
                    usePointStyle: true,
                    padding: 15
                }
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(17, 24, 39, 0.95)',
                titleColor: '#f3f4f6',
                bodyColor: '#d1d5db',
                borderColor: '#4b5563',
                borderWidth: 1,
                padding: 12,
                titleFont: { size: 13, weight: '600' },
                bodyFont: { size: 12 },
                callbacks: {
                    label: function (context) {
                        return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.08)',
                    drawBorder: false
                },
                ticks: {
                    color: '#d1d5db', // Bright gray for X axis labels
                    maxRotation: 45,
                    minRotation: 45,
                    font: { size: 11, weight: '500' }
                }
            },
            y: {
                min: 0,
                max: 100,
                grid: {
                    color: 'rgba(255, 255, 255, 0.08)',
                    drawBorder: false
                },
                ticks: {
                    color: '#d1d5db', // Bright gray for Y axis labels
                    font: { size: 11, weight: '500' },
                    callback: function (value) {
                        return value + '%';
                    }
                }
            }
        }
    };

    const { insights } = trendData;
    const trendIcon = insights.trend === 'improving' ? '📈' : insights.trend === 'declining' ? '📉' : '➡️';
    const trendColor = insights.trend === 'improving' ? 'var(--accent-success)' : insights.trend === 'declining' ? 'var(--accent-danger)' : 'var(--text-secondary)';

    return (
        <div className="card">
            <div className="card-header">
                <div className="flex justify-between items-center">
                    <div>
                        <h3>📈 Sentiment Trends</h3>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                            Based on Traditional Analysis
                        </div>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        Last {days} days
                    </div>
                </div>
            </div>
            <div className="card-body">
                {/* Insights Summary */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                    marginBottom: '1.5rem'
                }}>
                    <div style={{
                        padding: '1.25rem',
                        background: 'var(--bg-tertiary)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)'
                    }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Current Trend
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: trendColor, marginBottom: '0.5rem' }}>
                            {trendIcon} {insights.trend.charAt(0).toUpperCase() + insights.trend.slice(1)}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            {insights.change_percent > 0 ? '+' : ''}{insights.change_percent}% vs previous period
                        </div>
                    </div>

                    <div style={{
                        padding: '1.25rem',
                        background: 'var(--bg-tertiary)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)'
                    }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Current Average
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                            {(insights.current_avg * 100).toFixed(1)}%
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            Previous: {(insights.previous_avg * 100).toFixed(1)}%
                        </div>
                    </div>

                    {trendData.anomalies && trendData.anomalies.length > 0 && (
                        <div
                            style={{
                                padding: '1.25rem',
                                background: 'rgba(251, 191, 36, 0.1)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--accent-warning)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                            onClick={() => setShowAnomalies(!showAnomalies)}
                        >
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Anomalies Detected
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-warning)', marginBottom: '0.5rem' }}>
                                ⚠️ {trendData.anomalies.length}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                Unusual patterns found
                                <span style={{ fontSize: '0.75rem' }}>{showAnomalies ? '▼' : '▶'}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Anomaly Details (Expandable) */}
                {showAnomalies && trendData.anomalies && trendData.anomalies.length > 0 && (
                    <div style={{
                        marginBottom: '1.5rem',
                        padding: '1rem',
                        background: 'rgba(251, 191, 36, 0.05)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--accent-warning)'
                    }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                            📊 Anomaly Details
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                            Anomalies are days where sentiment deviated significantly (&gt;2 standard deviations) from the normal trend.
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {trendData.anomalies.map((anomaly, idx) => {
                                const date = new Date(anomaly.date);
                                const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                const isSpike = anomaly.type === 'spike';

                                return (
                                    <div key={idx} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        padding: '0.75rem',
                                        background: 'var(--bg-tertiary)',
                                        borderRadius: 'var(--radius-sm)',
                                        fontSize: '0.875rem'
                                    }}>
                                        <span style={{ fontSize: '1.25rem' }}>{isSpike ? '📈' : '📉'}</span>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                                {formattedDate}
                                            </div>
                                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                                                {isSpike ? 'Spike' : 'Drop'}: {(anomaly.value * 100).toFixed(1)}%
                                                (expected: {(anomaly.expected * 100).toFixed(1)}%)
                                            </div>
                                        </div>
                                        <div style={{
                                            padding: '0.25rem 0.5rem',
                                            background: isSpike ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                            color: isSpike ? 'var(--accent-success)' : 'var(--accent-danger)',
                                            borderRadius: 'var(--radius-sm)',
                                            fontSize: '0.75rem',
                                            fontWeight: 600
                                        }}>
                                            {isSpike ? '+' : ''}{((anomaly.value - anomaly.expected) * 100).toFixed(1)}%
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Chart */}
                <div style={{ height: '350px', marginTop: '1rem' }}>
                    <Line data={chartData} options={options} />
                </div>

                {/* Forecast Info */}
                {trendData.forecast && trendData.forecast.length > 0 && (
                    <div style={{
                        marginTop: '1rem',
                        padding: '0.75rem 1rem',
                        background: 'rgba(168, 85, 247, 0.1)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid rgba(168, 85, 247, 0.3)',
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)'
                    }}>
                        <strong style={{ color: 'var(--text-primary)' }}>Forecast:</strong> Next 7 days predicted to be{' '}
                        <span style={{ color: insights.forecast_trend === 'improving' ? 'var(--accent-success)' : insights.forecast_trend === 'declining' ? 'var(--accent-danger)' : 'var(--text-secondary)', fontWeight: 600 }}>
                            {insights.forecast_trend}
                        </span>
                        {' '}({insights.forecast_change_percent > 0 ? '+' : ''}{insights.forecast_change_percent}%)
                    </div>
                )}
            </div>
        </div>
    );
}
