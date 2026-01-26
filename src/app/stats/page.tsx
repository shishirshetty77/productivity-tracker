'use client';

import { useState, useEffect } from 'react';
import HabitList from '@/components/HabitList';
import HabitForm from '@/components/HabitForm';
import { Habit, HabitLog } from '@/types';
import Link from 'next/link';
import { ArrowLeft, BarChart, Plus } from 'lucide-react';

export default function MobileStatsPage() {
  const [habits, setHabits] = useState<(Habit & { logs: HabitLog[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    try {
      const res = await fetch('/api/habits');
      if (res.ok) {
        const data = await res.json();
        setHabits(data);
      }
    } catch (error) {
      console.error('Failed to fetch habits', error);
    } finally {
      setLoading(false);
    }
  };

  const createHabit = async (habitData: any) => {
    try {
        const res = await fetch('/api/habits', {
            method: 'POST',
            body: JSON.stringify(habitData)
        });
        if (res.ok) {
            fetchHabits();
        }
    } catch (error) {
        console.error('Failed to create', error);
    }
  };

  const toggleHabit = async (habitId: string, date: string) => {
     // Optimistic update
     setHabits(prev => prev.map(h => {
        if (h.id === habitId) {
            const exists = h.logs.find(l => l.date === date);
            if (exists) {
                return { ...h, logs: h.logs.filter(l => l.date !== date) };
            } else {
                return { ...h, logs: [...h.logs, { id: 'temp', date, value: 1, habitId } as HabitLog] };
            }
        }
        return h;
     }));

     // Call API
     try {
         // Determine if adding or removing (actually logic is simpler to just post/delete but log route handles toggle-ish logic? No, logs route is upsert)
         // Wait, my log route is UPSERT. To toggle OFF I need delete.
         
         const habit = habits.find(h => h.id === habitId);
         const exists = habit?.logs.find(l => l.date === date);

         if (exists) {
            await fetch(`/api/habits/log?habitId=${habitId}&date=${date}`, { method: 'DELETE' });
         } else {
            await fetch('/api/habits/log', {
                method: 'POST',
                body: JSON.stringify({ habitId, date, value: 1 })
            });
         }
         fetchHabits(); // Re-fetch to sync
     } catch (error) {
         console.error('Failed to toggle', error);
         fetchHabits(); // Revert
     }
  };

  const deleteHabit = async (habitId: string) => {
      if(!confirm('Delete this habit?')) return;
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
            {/* Habits Section */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">My Habits</h2>
                    <button 
                        onClick={() => setShowForm(true)}
                        className="p-2 bg-[var(--accent-blue)] hover:bg-[var(--accent-hover)] text-white rounded-lg transition-colors"
                    >
                        <Plus size={20} />
                    </button>
                </div>
                
                {loading ? (
                    <div className="text-center py-10 text-[var(--text-secondary)]">Loading...</div>
                ) : habits.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-[var(--border-primary)] rounded-xl bg-[var(--bg-secondary)]">
                        <p className="text-[var(--text-secondary)] mb-2">No habits tracked yet</p>
                        <button onClick={() => setShowForm(true)} className="text-[var(--accent-blue)] hover:underline">Create one</button>
                    </div>
                ) : (
                    <HabitList habits={habits} onToggle={toggleHabit} onDelete={deleteHabit} />
                )}
            </section>
            
            {/* Charts Section (Placeholder for now) */}
            <section className="bg-[var(--bg-secondary)] p-6 rounded-xl border border-[var(--border-primary)]">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Sleep & Performance</h2>
                <div className="h-40 flex items-center justify-center text-[var(--text-secondary)] text-sm italic">
                    Sleep charts coming soon...
                </div>
            </section>
       </main>

       {showForm && (
         <HabitForm onClose={() => setShowForm(false)} onSave={createHabit} />
       )}
    </div>
  );
}
