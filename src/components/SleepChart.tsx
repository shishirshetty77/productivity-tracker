'use client';

import { useMemo } from 'react';
import { Day } from '@/types';

interface SleepChartProps {
    days: Day[];
}

export default function SleepChart({ days }: SleepChartProps) {
    // Determine data points
    // Sort days chronologically for the chart
    const chartData = useMemo(() => {
        return [...days]
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(-30) // Last 30 days
            .map(day => ({
                date: day.date,
                // Parse duration? Or use the pre-calculated one if backend sends it. 
                // Currently backend Day type in types/index.ts has sleepDuration? (number). Yes.
                duration: day.sleepDuration || 0, 
                quality: day.sleepQuality
            }));
    }, [days]);

    if(chartData.length === 0) return <div className="text-center text-sm text-[var(--text-secondary)] py-10">No sleep data recorded yet.</div>;

    const maxDuration = Math.max(...chartData.map(d => d.duration), 10); // Minimum 10h scale
    const height = 200;
    const width = 600;
    const padding = 20;

    // Helper to map X and Y
    const getX = (index: number) => padding + (index / (chartData.length - 1 || 1)) * (width - 2 * padding);
    const getY = (val: number) => height - padding - (val / maxDuration) * (height - 2 * padding);

    // Generate Points string
    const points = chartData.map((d, i) => `${getX(i)},${getY(d.duration)}`).join(' ');

    return (
        <div className="w-full overflow-x-auto">
            <div className="min-w-[600px]">
                <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
                     {/* Background Grid Lines */}
                     {[0, 2, 4, 6, 8, 10].map(h => (
                        <line 
                            key={h} 
                            x1={padding} 
                            y1={getY(h)} 
                            x2={width - padding} 
                            y2={getY(h)} 
                            stroke="var(--border-primary)" 
                            strokeWidth="1" 
                            strokeDasharray="4 4"
                        />
                     ))}

                     {/* The Line */}
                     <polyline 
                        fill="none" 
                        stroke="var(--accent-blue)" 
                        strokeWidth="2" 
                        points={points} 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                    />

                    {/* Data Points */}
                    {chartData.map((d, i) => (
                        <g key={d.date} className="group">
                            <circle 
                                cx={getX(i)} 
                                cy={getY(d.duration)} 
                                r="4" 
                                fill="var(--bg-secondary)" 
                                stroke="var(--accent-blue)"
                                strokeWidth="2"
                                className="transition-all hover:r-6 hover:fill-[var(--accent-blue)]"
                            />
                            {/* Tooltip on hover */}
                            <g className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <rect 
                                    x={getX(i) - 40} 
                                    y={getY(d.duration) - 40} 
                                    width="80" 
                                    height="30" 
                                    rx="4" 
                                    fill="var(--bg-tertiary)" 
                                    stroke="var(--border-primary)"
                                />
                                <text 
                                    x={getX(i)} 
                                    y={getY(d.duration) - 20} 
                                    textAnchor="middle" 
                                    fill="var(--text-primary)" 
                                    fontSize="10"
                                    fontWeight="bold"
                                >
                                    {d.duration}h ({d.quality || '?'})
                                </text>
                            </g>
                        </g>
                    ))}

                    {/* X Axis Labels (Sparse) */}
                    {chartData.map((d, i) => {
                        if (i % 5 !== 0 && i !== chartData.length - 1) return null;
                        return (
                            <text 
                                key={d.date} 
                                x={getX(i)} 
                                y={height} 
                                textAnchor="middle" 
                                fill="var(--text-secondary)" 
                                fontSize="10"
                            >
                                {d.date.slice(5)}
                            </text>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
}
