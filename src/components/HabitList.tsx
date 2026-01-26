'use client';

import { useState } from 'react';
import { Habit, HabitLog } from '@/types';
import { Trash2, XCircle, Trophy } from 'lucide-react';
import { clsx } from 'clsx';
import { format, subDays, parseISO, differenceInCalendarDays, startOfWeek, getDay, isAfter, isBefore } from 'date-fns';

interface HabitListProps {
  habits: (Habit & { logs: HabitLog[] })[];
  onToggle: (habitId: string, date: string) => void;
  onDelete: (habitId: string) => void;
}

// Helper to safely parse dates that might be strings or Date objects
const safeParseDate = (date: string | Date): Date => {
    if (date instanceof Date) return date;
    if (!date) return new Date(); // Fallback to now if missing
    return parseISO(date);
};

export default function HabitList({ habits, onToggle, onDelete }: HabitListProps) {
  const [expandedHabit, setExpandedHabit] = useState<string | null>(null);
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  const getAbstinenceStats = (logs: HabitLog[], createdAt: string | Date) => {
    const startDate = safeParseDate(createdAt);
    const sortedLogs = [...logs].sort((a, b) => b.date.localeCompare(a.date));
    
    // Find most recent relapse...
    const lastRelapse = sortedLogs.find(l => !isAfter(parseISO(l.date), today));
    
    let baseDate = startDate;
    if (lastRelapse) {
        const relapseDate = parseISO(lastRelapse.date);
        if (isAfter(relapseDate, startDate) || relapseDate.getTime() === startDate.getTime()) {
            baseDate = relapseDate; 
        }
    }

    const streak = differenceInCalendarDays(today, baseDate);
    return { streak: Math.max(0, streak) };
  };

  const getHeatmapData = () => {
     const today = new Date();
     const daysToRender = [];
     for(let i = 0; i < 365; i++) {
        const d = subDays(today, 364 - i);
        daysToRender.push(d);
     }
     return daysToRender;
  };

  return (
    <div className="space-y-4">
      {habits.map(habit => {
        const stats = getAbstinenceStats(habit.logs, habit.createdAt);
        const relapsedToday = habit.logs.some(l => l.date === todayStr);
        const isExpanded = expandedHabit === habit.id;
        const creationDate = safeParseDate(habit.createdAt);

        const heatmapDays = getHeatmapData();
        const firstDayOfWeek = getDay(heatmapDays[0]); 
        const paddedDays = Array(firstDayOfWeek).fill(null).concat(heatmapDays);

        return (
          <div key={habit.id} className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl overflow-hidden transition-all duration-300">
            <div className="p-4 flex items-center justify-between">
                <div 
                    className="flex items-center gap-4 cursor-pointer flex-1"
                    onClick={() => setExpandedHabit(isExpanded ? null : habit.id)}
                >
                    <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner"
                        style={{ backgroundColor: `${habit.color}15`, color: habit.color }}
                    >
                        {habit.icon}
                    </div>

                    <div>
                        <h3 className="font-semibold text-[var(--text-primary)] text-lg">{habit.name}</h3>
                        <div className="flex items-center gap-3 text-sm mt-0.5">
                            <span className={clsx(
                                "flex items-center gap-1.5 font-medium px-2 py-0.5 rounded-md",
                                stats.streak > 0 ? "text-green-400 bg-green-400/10" : "text-[var(--text-secondary)] bg-[var(--bg-tertiary)]"
                            )}>
                                {stats.streak > 0 ? (
                                    <><Trophy size={14} /> {stats.streak} Days Clean</>
                                ) : (
                                    <><XCircle size={14} /> Day 0</>
                                )}
                            </span>
                        </div>
                        <p className="text-[10px] text-[var(--text-secondary)] mt-1">
                            Started on {format(creationDate, 'MMM d, yyyy')}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {!relapsedToday ? (
                        <button
                            onClick={() => onToggle(habit.id, todayStr)}
                            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg text-sm font-medium transition-colors"
                        >
                            I Relapsed
                        </button>
                    ) : (
                        <button
                            onClick={() => onToggle(habit.id, todayStr)} 
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

            {isExpanded && (
                <div className="px-4 pb-6 animate-in slide-in-from-top-2 duration-200">
                    <div className="h-px w-full bg-[var(--border-primary)] mb-4" />
                    
                    <div className="flex justify-between items-end mb-2">
                        <h4 className="text-sm font-medium text-[var(--text-secondary)]">Activity Graph</h4>
                        <div className="flex gap-2 text-[10px] text-[var(--text-secondary)]">
                            <span>Less</span>
                            <div className="flex gap-0.5">
                                <div className="w-2.5 h-2.5 bg-[#161b22] rounded-[2px]" />
                                <div className="w-2.5 h-2.5 bg-green-900/40 rounded-[2px]" />
                                <div className="w-2.5 h-2.5 bg-green-500/60 rounded-[2px]" />
                                <div className="w-2.5 h-2.5 bg-green-400 rounded-[2px]" />
                            </div>
                            <span>More</span>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto pb-2">
                         <div className="min-w-fit flex text-[10px] text-[var(--text-secondary)] mb-1 gap-[calc(4*12px)]">
                            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
                                <span key={m}>{m}</span>
                            ))}
                         </div>
                         
                         <div 
                           className="grid grid-flow-col gap-[2px]" 
                           style={{ gridTemplateRows: 'repeat(7, 10px)' }}
                        >
                             {paddedDays.map((date, i) => {
                                 if (!date) return <div key={`empty-${i}`} className="w-2.5 h-2.5" />;
                                 
                                 const dateStr = format(date, 'yyyy-MM-dd');
                                 const isRelapse = habit.logs.some(l => l.date === dateStr);
                                 // Check if strictly before creation (so we paint it black/untracked)
                                 const isUntracked = isBefore(date, startOfWeek(creationDate)) && differenceInCalendarDays(date, creationDate) < 0;

                                 let colorClass = "bg-[#161b22]"; 
                                 if (!isUntracked) {
                                     if (isRelapse) colorClass = "bg-red-500";
                                     else colorClass = "bg-green-500/80";
                                 }

                                 return (
                                     <div 
                                         key={dateStr}
                                         title={`${dateStr}: ${isUntracked ? 'Untracked' : isRelapse ? 'Relapse' : 'Clean'}`}
                                         className={clsx(
                                             "w-2.5 h-2.5 rounded-[2px] transition-colors hover:ring-1 hover:ring-white/20",
                                             colorClass
                                         )}
                                     />
                                 );
                             })}
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
