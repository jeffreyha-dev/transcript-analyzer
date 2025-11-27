import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../utils/api';

export default function SentimentHeatmap({ dateRange, sentimentFilter }) {
    const [gridData, setGridData] = useState([]);
    const [loading, setLoading] = useState(true);

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hours = Array.from({ length: 12 }, (_, i) => i * 2); // 0, 2, 4... 22

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const data = await api.getHeatmapData(dateRange, sentimentFilter);

                // Process data into grid format
                const newGrid = [];
                for (let d = 0; d < 7; d++) {
                    const dayRow = [];
                    for (let h = 0; h < 12; h++) {
                        // Find data for this day (0-6) and hour range (h*2 to h*2+1)
                        // Note: SQLite strftime('%w') returns 0 for Sunday, 1 for Monday...
                        // Our grid is Mon(0) - Sun(6). So we need to map.
                        // SQLite: 0=Sun, 1=Mon, ... 6=Sat
                        // UI: 0=Mon, 1=Tue, ... 6=Sun
                        // Mapping: UI_Day = (SQLite_Day + 6) % 7

                        const targetDay = (d + 1) % 7; // Convert UI index to SQLite day (0=Mon -> 1)

                        const hourStart = h * 2;
                        const hourEnd = hourStart + 1;

                        const matches = data.filter(item => {
                            const itemDay = parseInt(item.day_of_week);
                            const itemHour = parseInt(item.hour_of_day);
                            // Adjust for SQLite Sunday=0
                            const adjustedItemDay = (itemDay + 6) % 7;

                            return adjustedItemDay === d && (itemHour === hourStart || itemHour === hourEnd);
                        });

                        if (matches.length > 0) {
                            const totalSentiment = matches.reduce((sum, m) => sum + (m.avg_sentiment * m.count), 0);
                            const totalCount = matches.reduce((sum, m) => sum + m.count, 0);
                            const weightedAvg = totalSentiment / totalCount;

                            dayRow.push({
                                value: Math.round(weightedAvg),
                                count: totalCount
                            });
                        } else {
                            dayRow.push({ value: 50, count: 0 }); // Default neutral
                        }
                    }
                    newGrid.push(dayRow);
                }
                setGridData(newGrid);
            } catch (err) {
                console.error("Failed to load heatmap data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [dateRange, sentimentFilter]);

    if (loading) return <div className="flex justify-center p-xl"><div className="spinner"></div></div>;

    return (
        <div className="card h-full" style={{ minHeight: '600px' }}>
            <div className="p-md border-b border-border">
                <h3 className="text-lg font-semibold">Sentiment Heatmap</h3>
                <p className="text-sm text-secondary">
                    Average sentiment by Day of Week and Time of Day
                </p>
            </div>

            <div className="p-lg overflow-x-auto">
                <div style={{ minWidth: '600px' }}>
                    {/* Header Row (Hours) */}
                    <div className="flex mb-sm">
                        <div style={{ width: '60px' }}></div> {/* Spacer for Y-axis labels */}
                        {hours.map(h => (
                            <div key={h} className="flex-1 text-center text-xs text-secondary font-mono">
                                {h}:00
                            </div>
                        ))}
                    </div>

                    {/* Grid Rows */}
                    {gridData.map((row, dayIndex) => (
                        <div key={days[dayIndex]} className="flex items-center mb-sm">
                            {/* Y-Axis Label */}
                            <div className="text-sm font-semibold text-secondary" style={{ width: '60px' }}>
                                {days[dayIndex]}
                            </div>

                            {/* Cells */}
                            {row.map((cell, hourIndex) => (
                                <motion.div
                                    key={`${dayIndex}-${hourIndex}`}
                                    className="flex-1 mx-xs rounded-sm relative group cursor-pointer"
                                    style={{
                                        height: '40px',
                                        background: getHeatmapColor(cell.value)
                                    }}
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: (dayIndex * 12 + hourIndex) * 0.005 }}
                                    whileHover={{ scale: 1.1, zIndex: 10 }}
                                >
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-20 transition-opacity">
                                        Score: {cell.value} | Vol: {cell.count}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ))}
                </div>

                {/* Legend */}
                <div className="flex justify-center items-center gap-md mt-xl">
                    <div className="flex items-center gap-xs">
                        <div className="w-4 h-4 rounded bg-red-500 opacity-20"></div>
                        <span className="text-xs text-secondary">Negative</span>
                    </div>
                    <div className="h-1 w-32 bg-gradient-to-r from-red-200 via-gray-200 to-green-200 rounded-full"></div>
                    <div className="flex items-center gap-xs">
                        <div className="w-4 h-4 rounded bg-green-500"></div>
                        <span className="text-xs text-secondary">Positive</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function getHeatmapColor(value) {
    // 0-100 scale
    // < 50: Red (Negative)
    // 50: Gray (Neutral)
    // > 50: Green (Positive)

    if (value < 50) {
        const opacity = 1 - (value / 50);
        return `rgba(239, 68, 68, ${Math.max(0.1, opacity)})`; // Red
    } else {
        const opacity = (value - 50) / 50;
        return `rgba(34, 197, 94, ${Math.max(0.1, opacity)})`; // Green
    }
}
