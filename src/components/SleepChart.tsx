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
            .filter(day => day.sleepDuration != null && day.sleepDuration > 0)
            .slice(-30) // Last 30 entries with sleep data
            .map(day => ({
                date: day.date,
                duration: day.sleepDuration as number,
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

    // Calculate Averages
    const validSleepDays = chartData.filter(d => d.duration > 0);
    const avgDuration = validSleepDays.length > 0 
        ? (validSleepDays.reduce((acc, curr) => acc + curr.duration, 0) / validSleepDays.length).toFixed(1)
        : '0';
    
    // Count quality
    const qualityCounts: Record<string, number> = {};
    validSleepDays.forEach(d => {
        if(d.quality) qualityCounts[d.quality] = (qualityCounts[d.quality] || 0) + 1;
    });
    // Find mode quality
    const topQuality = Object.entries(qualityCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || '-';

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-[var(--bg-tertiary)] p-4 rounded-xl border border-[var(--border-primary)]">
                    <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-1">Avg Duration</p>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">{avgDuration}<span className="text-sm font-normal text-[var(--text-secondary)]">h</span></p>
                </div>
                <div className="bg-[var(--bg-tertiary)] p-4 rounded-xl border border-[var(--border-primary)]">
                    <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-1">Typ. Quality</p>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">{topQuality}</p>
                </div>
            </div>

            <div className="w-full overflow-x-auto">
                <div className="min-w-[500px]">
                    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
                         {/* Background Grid Lines */}
                         {[0, 2, 4, 6, 8, 10, 12].map(h => (
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
                                <g className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    <rect 
                                        x={getX(i) - 40} 
                                        y={getY(d.duration) - 45} 
                                        width="80" 
                                        height="35" 
                                        rx="4" 
                                        fill="var(--bg-tertiary)" 
                                        stroke="var(--border-primary)"
                                    />
                                    <text 
                                        x={getX(i)} 
                                        y={getY(d.duration) - 22} 
                                        textAnchor="middle" 
                                        fill="var(--text-primary)" 
                                        fontSize="11"
                                        fontWeight="bold"
                                    >
                                        {d.duration}h
                                    </text>
                                    <text 
                                        x={getX(i)} 
                                        y={getY(d.duration) - 13} 
                                        textAnchor="middle" 
                                        fill="var(--text-secondary)" 
                                        fontSize="9"
                                    >
                                        {d.quality || 'No Data'}
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
                                    y={height + 15} 
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
        </div>
    );
}
