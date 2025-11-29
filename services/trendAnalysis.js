import { runQuery, getAll, getOne } from '../database.js';

/**
 * Calculate daily sentiment trends for a given account and date range
 */
export async function calculateDailyTrends(accountId = null, startDate = null, endDate = null) {
    let query = `
        SELECT 
            DATE(c.conversation_date) as date,
            AVG(a.overall_sentiment) as avg_sentiment,
            COUNT(*) as conversation_count,
            SUM(CASE WHEN a.sentiment_label LIKE '%positive%' THEN 1 ELSE 0 END) as positive_count,
            SUM(CASE WHEN a.sentiment_label LIKE '%negative%' THEN 1 ELSE 0 END) as negative_count,
            SUM(CASE WHEN a.sentiment_label LIKE '%neutral%' THEN 1 ELSE 0 END) as neutral_count
        FROM analysis_results a
        JOIN conversations c ON a.conversation_id = c.conversation_id
        WHERE c.conversation_date IS NOT NULL
    `;

    const params = [];

    if (accountId) {
        query += ' AND c.lp_account_id = ?';
        params.push(accountId);
    }

    if (startDate) {
        query += ' AND DATE(c.conversation_date) >= ?';
        params.push(startDate);
    }

    if (endDate) {
        query += ' AND DATE(c.conversation_date) <= ?';
        params.push(endDate);
    }

    query += ' GROUP BY DATE(c.conversation_date) ORDER BY date ASC';

    return await getAll(query, params);
}

/**
 * Forecast sentiment using simple moving average
 */
export function forecastSentiment(historicalData, days = 7) {
    if (!historicalData || historicalData.length < 7) {
        return [];
    }

    // Calculate 7-day moving average
    const windowSize = 7;
    const lastValues = historicalData.slice(-windowSize).map(d => d.avg_sentiment);
    const movingAvg = lastValues.reduce((sum, val) => sum + val, 0) / windowSize;

    // Calculate trend (simple linear regression on last 14 days)
    const trendWindow = Math.min(14, historicalData.length);
    const trendData = historicalData.slice(-trendWindow);

    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    trendData.forEach((point, i) => {
        sumX += i;
        sumY += point.avg_sentiment;
        sumXY += i * point.avg_sentiment;
        sumX2 += i * i;
    });

    const n = trendData.length;
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    // Generate forecast
    const forecast = [];
    const lastDate = new Date(historicalData[historicalData.length - 1].date);

    for (let i = 1; i <= days; i++) {
        const forecastDate = new Date(lastDate);
        forecastDate.setDate(forecastDate.getDate() + i);

        const predictedSentiment = Math.max(0, Math.min(1, movingAvg + (slope * i)));

        forecast.push({
            date: forecastDate.toISOString().split('T')[0],
            predicted_sentiment: Math.round(predictedSentiment * 100) / 100,
            confidence: Math.max(0.5, 1 - (i * 0.05)) // Confidence decreases with distance
        });
    }

    return forecast;
}

/**
 * Detect anomalies in sentiment data
 */
export function detectAnomalies(historicalData) {
    if (!historicalData || historicalData.length < 7) {
        return [];
    }

    const anomalies = [];
    const windowSize = 7;

    for (let i = windowSize; i < historicalData.length; i++) {
        const window = historicalData.slice(i - windowSize, i);
        const mean = window.reduce((sum, d) => sum + d.avg_sentiment, 0) / windowSize;
        const variance = window.reduce((sum, d) => sum + Math.pow(d.avg_sentiment - mean, 2), 0) / windowSize;
        const stdDev = Math.sqrt(variance);

        const current = historicalData[i].avg_sentiment;
        const zScore = Math.abs((current - mean) / stdDev);

        // Flag if z-score > 2 (more than 2 standard deviations from mean)
        if (zScore > 2) {
            anomalies.push({
                date: historicalData[i].date,
                value: current,
                expected: mean,
                deviation: zScore,
                type: current > mean ? 'spike' : 'drop'
            });
        }
    }

    return anomalies;
}

/**
 * Generate actionable insights from trend data
 */
export function getTrendInsights(historicalData, forecast) {
    if (!historicalData || historicalData.length < 7) {
        return {
            trend: 'insufficient_data',
            change_percent: 0,
            message: 'Not enough data to generate insights'
        };
    }

    // Compare last 7 days to previous 7 days
    const recent = historicalData.slice(-7);
    const previous = historicalData.slice(-14, -7);

    const recentAvg = recent.reduce((sum, d) => sum + d.avg_sentiment, 0) / recent.length;
    const previousAvg = previous.length > 0
        ? previous.reduce((sum, d) => sum + d.avg_sentiment, 0) / previous.length
        : recentAvg;

    const changePercent = ((recentAvg - previousAvg) / previousAvg) * 100;

    let trend = 'stable';
    let message = 'Sentiment is stable';

    if (changePercent > 5) {
        trend = 'improving';
        message = `Sentiment improving by ${changePercent.toFixed(1)}%`;
    } else if (changePercent < -5) {
        trend = 'declining';
        message = `Sentiment declining by ${Math.abs(changePercent).toFixed(1)}%`;
    }

    // Check forecast
    const forecastAvg = forecast.reduce((sum, d) => sum + d.predicted_sentiment, 0) / forecast.length;
    const forecastChange = ((forecastAvg - recentAvg) / recentAvg) * 100;

    let forecastTrend = 'stable';
    if (forecastChange > 5) {
        forecastTrend = 'improving';
    } else if (forecastChange < -5) {
        forecastTrend = 'declining';
    }

    return {
        trend,
        change_percent: Math.round(changePercent * 10) / 10,
        message,
        forecast_trend: forecastTrend,
        forecast_change_percent: Math.round(forecastChange * 10) / 10,
        current_avg: Math.round(recentAvg * 100) / 100,
        previous_avg: Math.round(previousAvg * 100) / 100
    };
}

/**
 * Update sentiment trends table with latest data
 */
export async function updateSentimentTrends(accountId = null) {
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const trends = await calculateDailyTrends(accountId, thirtyDaysAgo, today);

    for (const trend of trends) {
        await runQuery(`
            INSERT OR REPLACE INTO sentiment_trends 
            (date, avg_sentiment, conversation_count, positive_count, negative_count, neutral_count, account_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            trend.date,
            trend.avg_sentiment,
            trend.conversation_count,
            trend.positive_count,
            trend.negative_count,
            trend.neutral_count,
            accountId
        ]);
    }

    return trends.length;
}
