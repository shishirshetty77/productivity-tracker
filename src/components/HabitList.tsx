'use client';

import { useState } from 'react';
import { Habit, HabitLog } from '@/types';
import { Flame, Trash2, XCircle, Trophy } from 'lucide-react';
import { clsx } from 'clsx';
import { format, subDays, isSameDay, parseISO } from 'date-fns';

interface HabitListProps {
  habits: (Habit & { logs: HabitLog[] })[];
  onToggle: (habitId: string, date: string) => void;
  onDelete: (habitId: string) => void;
}

export default function HabitList({ habits, onToggle, onDelete }: HabitListProps) {
  const [expandedHabit, setExpandedHabit] = useState<string | null>(null);
  const today = new Date().toISOString().split('T')[0];

  // Abstinence Logic:
  // Streak = Number of continuous days going backwards from today found NOT in logs.
  // If Log exists today: Streak = 0.
  // If Log exists yesterday: Streak = 0 (unless we ignore today if not logged yet? No, usually relapse resets instantly).
  
  const getAbstinenceStats = (logs: HabitLog[]) => {
    // Sort logs descending (newest first)
    const sortedLogs = [...logs].sort((a, b) => b.date.localeCompare(a.date));
    
    // 1. Current Streak
    let streak = 0;
    let checkDate = new Date();
    // Safety break
    let limit = 365 * 2; 

    while (limit > 0) {
        const dateStr = checkDate.toISOString().split('T')[0];
        const hasRelapse = sortedLogs.some(l => l.date === dateStr);
        
        if (hasRelapse) {
            break;
        } else {
            streak++;
        }
        checkDate.setDate(checkDate.getDate() - 1);
        limit--;
    }

    // 2. Best Streak (Simple algo: Max gap between logs)
    // Actually best streak calculation needs to look at all gaps.
    // For MVP we can just show current streak or compute properly.
    // Let's stick to Current Streak for the card, maybe detailed stats later.
    
    return { streak }; 
  };

  const getLast365Days = () => {
    const dates = [];
    for (let i = 364; i >= 0; i--) {
        dates.push(subDays(new Date(), i));
    }
    return dates;
  };

  const heatmapDates = getLast365Days();

  return (
    <div className="space-y-4">
      {habits.map(habit => {
        const stats = getAbstinenceStats(habit.logs);
        const relapsedToday = habit.logs.some(l => l.date === today);
        const isExpanded = expandedHabit === habit.id;

        return (
          <div key={habit.id} className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl overflow-hidden transition-all duration-300">
            {/* Header / Summary */}
            <div className="p-4 flex items-center justify-between">
                <div 
                    className="flex items-center gap-4 cursor-pointer flex-1"
                    onClick={() => setExpandedHabit(isExpanded ? null : habit.id)}
                >
                    {/* Icon Box */}
                    <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner"
                        style={{ backgroundColor: `${habit.color}15`, color: habit.color }}
                    >
                        {habit.icon}
                    </div>

                    {/* Text Info */}
                    <div>
                        <h3 className="font-semibold text-[var(--text-primary)] text-lg">{habit.name}</h3>
                        <div className="flex items-center gap-3 text-sm mt-0.5">
                            <span className={clsx(
                                "flex items-center gap-1.5 font-medium px-2 py-0.5 rounded-md",
                                stats.streak > 0 ? "text-green-400 bg-green-400/10" : "text-red-400 bg-red-400/10"
                            )}>
                                {stats.streak > 0 ? (
                                    <><Trophy size={14} /> {stats.streak} Days Clean</>
                                ) : (
                                    <><XCircle size={14} /> Relapsed Today</>
                                )}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Relapse Button */}
                <div className="flex items-center gap-4">
                    {!relapsedToday ? (
                        <button
                            onClick={() => onToggle(habit.id, today)}
                            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg text-sm font-medium transition-colors"
                        >
                            I Relapsed
                        </button>
                    ) : (
                        <button
                            onClick={() => onToggle(habit.id, today)} // Expecting toggle to remove it
                            className="px-4 py-2 text-[var(--text-secondary)] text-xs hover:text-[var(--text-primary)]"
                        >
                            Undo
                        </button>
                    )}
                    
                     <button 
                        onClick={() => onDelete(habit.id)}
                        className="p-2 text-[var(--text-secondary)] hover:text-red-400 transition-opacity"
                        title="Delete Tracker"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            {/* Expanded Heatmap */}
            {isExpanded && (
                <div className="px-4 pb-6 animate-in slide-in-from-top-2 duration-200">
                    <div className="h-px w-full bg-[var(--border-primary)] mb-4" />
                    
                    <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-3">History (Last Year)</h4>
                    
                    <div className="flex flex-wrap gap-1">
                        {heatmapDates.map((date) => {
                            const dateStr = format(date, 'yyyy-MM-dd');
                            const isRelapse = habit.logs.some(l => l.date === dateStr);
                            const isFuture = date > new Date();
                            
                            if (isFuture) return null;

                            return (
                                <div 
                                    key={dateStr}
                                    title={`${dateStr}: ${isRelapse ? 'Relapsed' : 'Clean'}`}
                                    className={clsx(
                                        "w-2.5 h-2.5 rounded-[2px] transition-colors",
                                        isRelapse ? "bg-red-500/50" : "bg-green-500/20 hover:bg-green-500/40"
                                    )}
                                />
                            );
                        })}
                    </div>
                    
                    <div className="flex items-center gap-4 mt-4 text-xs text-[var(--text-secondary)]">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-[2px] bg-green-500/20" />
                            <span>Clean</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-[2px] bg-red-500/50" />
                            <span>Relapse</span>
                        </div>
                    </div>
                </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
