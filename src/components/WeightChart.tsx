'use client';

import { useMemo } from 'react';
import { Day } from '@/types';

interface WeightChartProps {
    days: Day[];
}

export default function WeightChart({ days }: WeightChartProps) {
    const chartData = useMemo(() => {
        return [...days]
            .sort((a, b) => a.date.localeCompare(b.date))
            .filter(day => day.weight != null && day.weight > 0)
            .slice(-60) // Last 60 entries for better trend visibility
            .map(day => ({
                date: day.date,
                weight: day.weight as number,
            }));
    }, [days]);

    if (chartData.length === 0) {
        return (
            <div className="text-center text-sm text-[var(--text-secondary)] py-10">
                No weight data recorded yet. Add your weight when creating a new day.
            </div>
        );
    }

    // Stats
    const weights = chartData.map(d => d.weight);
    const currentWeight = weights[weights.length - 1];
    const startWeight = weights[0];
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    const avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length;
    const totalChange = currentWeight - startWeight;

    // 7-day trend
    const last7 = weights.slice(-7);
    const weekChange = last7.length >= 2 ? last7[last7.length - 1] - last7[0] : 0;

    // Chart dimensions
    const height = 200;
    const width = 600;
    const padding = 30;

    // Dynamic Y scale with some padding
    const yMin = minWeight - 1;
    const yMax = maxWeight + 1;
    const yRange = yMax - yMin || 1;

    const getX = (index: number) => padding + (index / (chartData.length - 1 || 1)) * (width - 2 * padding);
    const getY = (val: number) => height - padding - ((val - yMin) / yRange) * (height - 2 * padding);

    // Generate line points
    const points = chartData.map((d, i) => `${getX(i)},${getY(d.weight)}`).join(' ');

    // Generate fill area
    const areaPath = `M ${getX(0)},${height - padding} ` +
        chartData.map((d, i) => `L ${getX(i)},${getY(d.weight)}`).join(' ') +
        ` L ${getX(chartData.length - 1)},${height - padding} Z`;

    // Y-axis grid lines (dynamic based on range)
    const gridStep = yRange <= 5 ? 0.5 : yRange <= 10 ? 1 : yRange <= 20 ? 2 : 5;
    const gridLines: number[] = [];
    for (let v = Math.ceil(yMin / gridStep) * gridStep; v <= yMax; v += gridStep) {
        gridLines.push(Math.round(v * 10) / 10);
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[var(--bg-tertiary)] p-4 rounded-xl border border-[var(--border-primary)]">
                    <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-1">Current</p>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">
                        {currentWeight.toFixed(1)}
                        <span className="text-sm font-normal text-[var(--text-secondary)]">kg</span>
                    </p>
                </div>
                <div className="bg-[var(--bg-tertiary)] p-4 rounded-xl border border-[var(--border-primary)]">
                    <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-1">Average</p>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">
                        {avgWeight.toFixed(1)}
                        <span className="text-sm font-normal text-[var(--text-secondary)]">kg</span>
                    </p>
                </div>
                <div className="bg-[var(--bg-tertiary)] p-4 rounded-xl border border-[var(--border-primary)]">
                    <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-1">Total Δ</p>
                    <p className={`text-2xl font-bold ${totalChange < 0 ? 'text-green-400' : totalChange > 0 ? 'text-red-400' : 'text-[var(--text-primary)]'}`}>
                        {totalChange > 0 ? '+' : ''}{totalChange.toFixed(1)}
                        <span className="text-sm font-normal text-[var(--text-secondary)]">kg</span>
                    </p>
                </div>
                <div className="bg-[var(--bg-tertiary)] p-4 rounded-xl border border-[var(--border-primary)]">
                    <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-1">7-Day Δ</p>
                    <p className={`text-2xl font-bold ${weekChange < 0 ? 'text-green-400' : weekChange > 0 ? 'text-red-400' : 'text-[var(--text-primary)]'}`}>
                        {weekChange > 0 ? '+' : ''}{weekChange.toFixed(1)}
                        <span className="text-sm font-normal text-[var(--text-secondary)]">kg</span>
                    </p>
                </div>
            </div>

            {/* Range indicator */}
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                <span>Range: {minWeight.toFixed(1)} – {maxWeight.toFixed(1)} kg</span>
                <span>{chartData.length} entries</span>
            </div>

            {/* Chart */}
            <div className="w-full overflow-x-auto">
                <div className="min-w-[500px]">
                    <svg width="100%" height={height + 20} viewBox={`0 0 ${width} ${height + 20}`} className="overflow-visible">
                        {/* Background Grid Lines */}
                        {gridLines.map(v => (
                            <g key={v}>
                                <line
                                    x1={padding}
                                    y1={getY(v)}
                                    x2={width - padding}
                                    y2={getY(v)}
                                    stroke="var(--border-primary)"
                                    strokeWidth="1"
                                    strokeDasharray="4 4"
                                />
                                <text
                                    x={padding - 5}
                                    y={getY(v) + 4}
                                    textAnchor="end"
                                    fill="var(--text-secondary)"
                                    fontSize="9"
                                >
                                    {v}
                                </text>
                            </g>
                        ))}

                        {/* Gradient fill under curve */}
                        <defs>
                            <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
                                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" />
                            </linearGradient>
                        </defs>
                        <path d={areaPath} fill="url(#weightGradient)" />

                        {/* The Line */}
                        <polyline
                            fill="none"
                            stroke="#f59e0b"
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
                                    cy={getY(d.weight)}
                                    r="4"
                                    fill="var(--bg-secondary)"
                                    stroke="#f59e0b"
                                    strokeWidth="2"
                                    className="transition-all hover:r-6 hover:fill-[#f59e0b]"
                                />
                                {/* Tooltip on hover */}
                                <g className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    <rect
                                        x={getX(i) - 40}
                                        y={getY(d.weight) - 45}
                                        width="80"
                                        height="35"
                                        rx="4"
                                        fill="var(--bg-tertiary)"
                                        stroke="var(--border-primary)"
                                    />
                                    <text
                                        x={getX(i)}
                                        y={getY(d.weight) - 25}
                                        textAnchor="middle"
                                        fill="var(--text-primary)"
                                        fontSize="11"
                                        fontWeight="bold"
                                    >
                                        {d.weight.toFixed(1)} kg
                                    </text>
                                    <text
                                        x={getX(i)}
                                        y={getY(d.weight) - 13}
                                        textAnchor="middle"
                                        fill="var(--text-secondary)"
                                        fontSize="9"
                                    >
                                        {d.date.slice(5)}
                                    </text>
                                </g>
                            </g>
                        ))}

                        {/* X Axis Labels (Sparse) */}
                        {chartData.map((d, i) => {
                            if (chartData.length <= 10 || i % Math.ceil(chartData.length / 8) === 0 || i === chartData.length - 1) {
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
                            }
                            return null;
                        })}
                    </svg>
                </div>
            </div>
        </div>
    );
}
