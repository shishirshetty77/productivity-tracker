'use client';

import { useMemo } from 'react';
import { Day } from '@/types';

interface CaloriesChartProps {
    days: Day[];
}

export default function CaloriesChart({ days }: CaloriesChartProps) {
    const chartData = useMemo(() => {
        return [...days]
            .sort((a, b) => a.date.localeCompare(b.date))
            .filter(day => day.calories != null && day.calories > 0)
            .slice(-60) // Last 60 entries
            .map(day => ({
                date: day.date,
                calories: day.calories as number,
            }));
    }, [days]);

    if (chartData.length === 0) {
        return (
            <div className="text-center text-sm text-[var(--text-secondary)] py-10">
                No calorie data recorded yet. Add your calories when creating a new day.
            </div>
        );
    }

    // Stats
    const values = chartData.map(d => d.calories);
    const currentCalories = values[values.length - 1];
    const minCalories = Math.min(...values);
    const maxCalories = Math.max(...values);
    const avgCalories = Math.round(values.reduce((a, b) => a + b, 0) / values.length);

    // 7-day average
    const last7 = values.slice(-7);
    const weekAvg = last7.length > 0 ? Math.round(last7.reduce((a, b) => a + b, 0) / last7.length) : 0;

    // Chart dimensions
    const height = 200;
    const width = 600;
    const padding = 30;

    // Dynamic Y scale with some padding
    const yMin = Math.max(0, minCalories - 200);
    const yMax = maxCalories + 200;
    const yRange = yMax - yMin || 1;

    const getX = (index: number) => padding + (index / (chartData.length - 1 || 1)) * (width - 2 * padding);
    const getY = (val: number) => height - padding - ((val - yMin) / yRange) * (height - 2 * padding);

    // Generate line points
    const points = chartData.map((d, i) => `${getX(i)},${getY(d.calories)}`).join(' ');

    // Generate fill area
    const areaPath = `M ${getX(0)},${height - padding} ` +
        chartData.map((d, i) => `L ${getX(i)},${getY(d.calories)}`).join(' ') +
        ` L ${getX(chartData.length - 1)},${height - padding} Z`;

    // Y-axis grid lines
    const gridStep = yRange <= 500 ? 100 : yRange <= 1500 ? 250 : yRange <= 3000 ? 500 : 1000;
    const gridLines: number[] = [];
    for (let v = Math.ceil(yMin / gridStep) * gridStep; v <= yMax; v += gridStep) {
        gridLines.push(Math.round(v));
    }

    // Color based on calorie target (2000 kcal reference)
    const getCalorieColor = (cal: number) => {
        if (cal >= 1800 && cal <= 2500) return 'text-green-400';
        if (cal < 1800) return 'text-amber-400';
        return 'text-red-400';
    };

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[var(--bg-tertiary)] p-4 rounded-xl border border-[var(--border-primary)]">
                    <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-1">Latest</p>
                    <p className={`text-2xl font-bold ${getCalorieColor(currentCalories)}`}>
                        {currentCalories.toLocaleString()}
                        <span className="text-sm font-normal text-[var(--text-secondary)]">kcal</span>
                    </p>
                </div>
                <div className="bg-[var(--bg-tertiary)] p-4 rounded-xl border border-[var(--border-primary)]">
                    <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-1">Average</p>
                    <p className={`text-2xl font-bold ${getCalorieColor(avgCalories)}`}>
                        {avgCalories.toLocaleString()}
                        <span className="text-sm font-normal text-[var(--text-secondary)]">kcal</span>
                    </p>
                </div>
                <div className="bg-[var(--bg-tertiary)] p-4 rounded-xl border border-[var(--border-primary)]">
                    <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-1">7-Day Avg</p>
                    <p className={`text-2xl font-bold ${getCalorieColor(weekAvg)}`}>
                        {weekAvg.toLocaleString()}
                        <span className="text-sm font-normal text-[var(--text-secondary)]">kcal</span>
                    </p>
                </div>
                <div className="bg-[var(--bg-tertiary)] p-4 rounded-xl border border-[var(--border-primary)]">
                    <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-1">Range</p>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">
                        {minCalories.toLocaleString()}
                        <span className="text-sm font-normal text-[var(--text-secondary)]">–{maxCalories.toLocaleString()}</span>
                    </p>
                </div>
            </div>

            {/* Entries count */}
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                <span>Target: 1,800–2,500 kcal/day</span>
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

                        {/* Target zone highlight */}
                        {yMin < 2500 && yMax > 1800 && (
                            <rect
                                x={padding}
                                y={getY(Math.min(2500, yMax))}
                                width={width - 2 * padding}
                                height={Math.abs(getY(Math.min(2500, yMax)) - getY(Math.max(1800, yMin)))}
                                fill="rgba(34, 197, 94, 0.05)"
                                stroke="rgba(34, 197, 94, 0.15)"
                                strokeWidth="1"
                                strokeDasharray="6 3"
                                rx="4"
                            />
                        )}

                        {/* Gradient fill under curve */}
                        <defs>
                            <linearGradient id="caloriesGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
                                <stop offset="100%" stopColor="#22c55e" stopOpacity="0.02" />
                            </linearGradient>
                        </defs>
                        <path d={areaPath} fill="url(#caloriesGradient)" />

                        {/* The Line */}
                        <polyline
                            fill="none"
                            stroke="#22c55e"
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
                                    cy={getY(d.calories)}
                                    r="4"
                                    fill="var(--bg-secondary)"
                                    stroke="#22c55e"
                                    strokeWidth="2"
                                    className="transition-all hover:r-6 hover:fill-[#22c55e]"
                                />
                                {/* Tooltip on hover */}
                                <g className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    <rect
                                        x={getX(i) - 45}
                                        y={getY(d.calories) - 45}
                                        width="90"
                                        height="35"
                                        rx="4"
                                        fill="var(--bg-tertiary)"
                                        stroke="var(--border-primary)"
                                    />
                                    <text
                                        x={getX(i)}
                                        y={getY(d.calories) - 25}
                                        textAnchor="middle"
                                        fill="var(--text-primary)"
                                        fontSize="11"
                                        fontWeight="bold"
                                    >
                                        {d.calories.toLocaleString()} kcal
                                    </text>
                                    <text
                                        x={getX(i)}
                                        y={getY(d.calories) - 13}
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
