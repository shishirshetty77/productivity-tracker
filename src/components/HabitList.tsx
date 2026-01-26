'use client';

import { useState } from 'react';
import { Habit, HabitLog } from '@/types'; // I need to define these types
import { Check, Flame, Plus, Trash2 } from 'lucide-react';

interface HabitListProps {
  habits: (Habit & { logs: HabitLog[] })[];
  onToggle: (habitId: string, date: string) => void;
  onDelete: (habitId: string) => void;
}

export default function HabitList({ habits, onToggle, onDelete }: HabitListProps) {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  // Simple streak calculation
  const getStreak = (logs: HabitLog[]) => {
    // Sort logs descending
    const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));
    let streak = 0;
    let checkDate = new Date();
    
    // Check if done today
    const doneToday = sorted.some(l => l.date === today);
    if (!doneToday) {
        // If not done today, start checking from yesterday
        checkDate.setDate(checkDate.getDate() - 1);
    }
    
    while (true) {
        const dateStr = checkDate.toISOString().split('T')[0];
        const log = sorted.find(l => l.date === dateStr);
        if (log) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }
    return streak;
  };

  return (
    <div className="space-y-3">
      {habits.map(habit => {
        const isDoneToday = habit.logs.some(l => l.date === today);
        const streak = getStreak(habit.logs);
        
        return (
          <div key={habit.id} className="group flex items-center justify-between p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl hover:border-[var(--accent-blue)] transition-all">
            <div className="flex items-center gap-3">
               <div 
                 className="w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-opacity-20"
                 style={{ backgroundColor: `${habit.color}20`, color: habit.color }}
               >
                 {habit.icon}
               </div>
               <div>
                  <h3 className="font-medium text-[var(--text-primary)]">{habit.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                    {streak > 0 && (
                        <span className="flex items-center gap-1 text-orange-400">
                            <Flame size={12} fill="currentColor" />
                            {streak} day streak
                        </span>
                    )}
                  </div>
               </div>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={() => onToggle(habit.id, today)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isDoneToday 
                        ? 'bg-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.3)]' 
                        : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]'
                    }`}
                >
                    <Check size={20} />
                </button>
                
                <button 
                  onClick={() => onDelete(habit.id)}
                  className="p-2 text-[var(--text-secondary)] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <Trash2 size={16} />
                </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
