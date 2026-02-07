'use client';

import { useState, useEffect } from 'react';
import HabitList from '@/components/HabitList';
import HabitForm from '@/components/HabitForm';
import SleepChart from '@/components/SleepChart';
import WeightChart from '@/components/WeightChart';
import { Habit, HabitLog, Day } from '@/types';
import Link from 'next/link';
import { ArrowLeft, BarChart, Plus, Moon, Scale } from 'lucide-react';

export default function MobileStatsPage() {
  const [habits, setHabits] = useState<(Habit & { logs: HabitLog[] })[]>([]);
  const [days, setDays] = useState<Day[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'abstinence' | 'sleep' | 'weight'>('abstinence');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [habitsRes, daysRes] = await Promise.all([
         fetch('/api/habits'),
         fetch('/api/days')
      ]);
      
      if (habitsRes.ok) {
        setHabits(await habitsRes.json());
      }
      if (daysRes.ok) {
        setDays(await daysRes.json());
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  const createHabit = async (habitData: Pick<Habit, 'name' | 'color' | 'icon' | 'goalFrequency'>) => {
    try {
       // Force type to Abstinence implicitly
        const res = await fetch('/api/habits', {
            method: 'POST',
            body: JSON.stringify({ ...habitData, type: 'ABSTINENCE' })
        });
        if (res.ok) {
            fetchData();
        }
    } catch (error) {
        console.error('Failed to create', error);
    }
  };

  const toggleHabit = async (habitId: string, date: string) => {
     // Optimistic
     const habit = habits.find(h => h.id === habitId);
     if (!habit) return;

     const exists = habit.logs.find(l => l.date === date);
     
     // Update UI immediately
     setHabits(prev => prev.map(h => {
        if (h.id === habitId) {
             if (exists) {
                return { ...h, logs: h.logs.filter(l => l.date !== date) };
            } else {
                return { ...h, logs: [...h.logs, { id: 'temp', date, value: 1, habitId } as HabitLog] };
            }
        }
        return h;
     }));

     try {
         if (exists) {
            await fetch(`/api/habits/log?habitId=${habitId}&date=${date}`, { method: 'DELETE' });
         } else {
            await fetch('/api/habits/log', {
                method: 'POST',
                body: JSON.stringify({ habitId, date, value: 1 })
            });
         }
         // fetchData(); // Optional sync
     } catch (error) {
         console.error('Failed to toggle', error);
         fetchData(); // Revert on error
     }
  };

  const deleteHabit = async (habitId: string) => {
      if(!confirm('Delete this tracker?')) return;
      try {
          await fetch(`/api/habits/${habitId}`, { method: 'DELETE' });
          setHabits(prev => prev.filter(h => h.id !== habitId));
      } catch (error) {
          console.error('Failed to delete', error);
      }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-4 sm:p-8 pb-24">
       <header className="flex items-center justify-between mb-8 max-w-2xl mx-auto">
            <Link href="/" className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                <ArrowLeft size={20} />
                <span>Dashboard</span>
            </Link>
            <h1 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                <BarChart size={24} className="text-[var(--accent-blue)]" />
                Statistics
            </h1>
       </header>

       <main className="max-w-2xl mx-auto space-y-8">
            {/* Tabs */}
            <div className="flex p-1 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)]">
                <button
                    onClick={() => setActiveTab('abstinence')}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                        activeTab === 'abstinence' 
                        ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm' 
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                >
                    Abstinence
                </button>
                <button
                    onClick={() => setActiveTab('sleep')}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                        activeTab === 'sleep' 
                        ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm' 
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                >
                    Sleep
                </button>
                <button
                    onClick={() => setActiveTab('weight')}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                        activeTab === 'weight' 
                        ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm' 
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                >
                    Weight
                </button>
            </div>

            {/* Content */}
            {activeTab === 'abstinence' ? (
                <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Abstinence Management</h2>
                            <p className="text-xs text-[var(--text-secondary)]">Track bad habits you want to quit.</p>
                        </div>
                        
                        <button 
                            onClick={() => setShowForm(true)}
                            className="p-2 bg-[var(--accent-blue)] hover:bg-[var(--accent-hover)] text-white rounded-lg transition-colors shadow-lg shadow-blue-500/20"
                        >
                            <Plus size={20} />
                        </button>
                    </div>
                    
                    {loading ? (
                        <div className="text-center py-10 text-[var(--text-secondary)]">Loading...</div>
                    ) : habits.length === 0 ? (
                        <div className="text-center py-10 border border-dashed border-[var(--border-primary)] rounded-xl bg-[var(--bg-secondary)]">
                            <p className="text-[var(--text-secondary)] mb-2">No active trackers</p>
                            <button onClick={() => setShowForm(true)} className="text-[var(--accent-blue)] hover:underline">Start quitting a habit</button>
                        </div>
                    ) : (
                        <HabitList habits={habits} onToggle={toggleHabit} onDelete={deleteHabit} />
                    )}
                </section>
            ) : activeTab === 'sleep' ? (
                <section className="bg-[var(--bg-secondary)] p-6 rounded-xl border border-[var(--border-primary)] animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center gap-2 mb-6">
                        <Moon size={20} className="text-purple-400" />
                        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Sleep Trends</h2>
                    </div>
                    <SleepChart days={days} />
                </section>
            ) : (
                <section className="bg-[var(--bg-secondary)] p-6 rounded-xl border border-[var(--border-primary)] animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center gap-2 mb-6">
                        <Scale size={20} className="text-amber-400" />
                        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Weight Trends</h2>
                    </div>
                    <WeightChart days={days} />
                </section>
            )}
       </main>

       {showForm && (
         <HabitForm onClose={() => setShowForm(false)} onSave={createHabit} />
       )}
    </div>
  );
}
