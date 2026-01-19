import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import cloud from 'd3-cloud';

export default function IntentCloud() {
    const [intents, setIntents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const svgRef = useRef(null);

    useEffect(() => {
        fetchIntents();
    }, []);

    const fetchIntents = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/ai-analysis/intents');
            if (!res.ok) throw new Error('Failed to fetch intent data');
            const data = await res.json();
            setIntents(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!intents.length || !svgRef.current) return;

        // Clear previous SVG
        d3.select(svgRef.current).selectAll("*").remove();

        const width = svgRef.current.clientWidth;
        const height = 300; // Fixed height

        // Normalization for font size
        const maxCount = Math.max(...intents.map(d => d.count));
        const minCount = Math.min(...intents.map(d => d.count));

        const fontSizeScale = d3.scaleLinear()
            .domain([minCount, maxCount])
            .range([14, 48]); // Min 14px, Max 48px

        // Color scale based on sentiment
        const getColor = (sentiment) => {
            if (sentiment >= 60) return '#10b981'; // Green
            if (sentiment <= 40) return '#ef4444'; // Red
            return '#6b7280'; // Gray
        };

        const layout = cloud()
            .size([width, height])
            .words(intents.map(d => ({
                text: d.intent,
                size: fontSizeScale(d.count),
                sentiment: d.avgSentiment,
                count: d.count
            })))
            .padding(5)
            .rotate(() => (~~(Math.random() * 2) * 90)) // Rotate 0 or 90
            .font("Inter, sans-serif")
            .fontSize(d => d.size)
            .on("end", draw);

        layout.start();

        function draw(words) {
            const svg = d3.select(svgRef.current)
                .attr("width", width)
                .attr("height", height)
                .append("g")
                .attr("transform", `translate(${width / 2},${height / 2})`);

            const text = svg.selectAll("text")
                .data(words)
                .enter().append("text")
                .style("font-size", d => `${d.size}px`)
                .style("font-family", "Inter, sans-serif")
                .style("fill", d => getColor(d.sentiment))
                .style("cursor", "default")
                .attr("text-anchor", "middle")
                .attr("transform", d => `translate(${d.x},${d.y})rotate(${d.rotate})`)
                .text(d => d.text)
                .style("opacity", 0)
                .transition()
                .duration(600)
                .style("opacity", 1);

            // Tooltip via title
            svg.selectAll("text")
                .append("title")
                .text(d => `${d.text}\nCount: ${d.count}\nSentiment: ${d.sentiment.toFixed(0)}`);
        }

    }, [intents]);

    if (loading) return (
        <div className="card mb-6 p-8 flex justify-center">
            <div className="spinner w-6 h-6 border-2"></div>
        </div>
    );

    if (error) return null;
    if (intents.length === 0) return null;

    return (
        <div className="card mb-6 overflow-hidden">
            <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <span className="text-xl">️☁️</span> Intent Cloud
                </h3>
            </div>

            <div className="bg-gray-50/50 dark:bg-gray-900/30 rounded-lg border border-gray-100 dark:border-gray-800/50 flex justify-center items-center">
                <svg
                    ref={svgRef}
                    style={{ width: '100%', minHeight: '300px' }}
                />
            </div>

            <div className="mt-3 flex justify-center gap-4 text-xs text-gray-400">
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div> Positive
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-gray-500"></div> Neutral
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div> Negative
                </div>
            </div>
        </div>
    );
}
