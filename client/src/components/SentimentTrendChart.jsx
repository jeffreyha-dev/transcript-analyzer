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
    const historicalDates = trendData.historical.map(d => d.date);
    const forecastDates = trendData.forecast.map(d => d.date);
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
                    color: 'var(--text-primary)',
                    font: { size: 12 }
                }
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'var(--bg-secondary)',
                titleColor: 'var(--text-primary)',
                bodyColor: 'var(--text-secondary)',
                borderColor: 'var(--border-color)',
                borderWidth: 1,
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
                    color: 'var(--border-color)',
                    drawBorder: false
                },
                ticks: {
                    color: 'var(--text-secondary)',
                    maxRotation: 45,
                    minRotation: 45
                }
            },
            y: {
                min: 0,
                max: 100,
                grid: {
                    color: 'var(--border-color)',
                    drawBorder: false
                },
                ticks: {
                    color: 'var(--text-secondary)',
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
                    <h3>📈 Sentiment Trends</h3>
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
                        padding: '1rem',
                        background: 'var(--bg-tertiary)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)'
                    }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                            Current Trend
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 600, color: trendColor }}>
                            {trendIcon} {insights.trend.charAt(0).toUpperCase() + insights.trend.slice(1)}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                            {insights.change_percent > 0 ? '+' : ''}{insights.change_percent}% vs previous period
                        </div>
                    </div>

                    <div style={{
                        padding: '1rem',
                        background: 'var(--bg-tertiary)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)'
                    }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                            Current Average
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {(insights.current_avg * 100).toFixed(1)}%
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                            Previous: {(insights.previous_avg * 100).toFixed(1)}%
                        </div>
                    </div>

                    {trendData.anomalies && trendData.anomalies.length > 0 && (
                        <div style={{
                            padding: '1rem',
                            background: 'var(--bg-tertiary)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--accent-warning)'
                        }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                Anomalies Detected
                            </div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--accent-warning)' }}>
                                ⚠️ {trendData.anomalies.length}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                Unusual patterns found
                            </div>
                        </div>
                    )}
                </div>

                {/* Chart */}
                <div style={{ height: '300px' }}>
                    <Line data={chartData} options={options} />
                </div>
            </div>
        </div>
    );
}
