'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Day } from '@/types';
import { generateTimeBlocks, formatTime, getTodayDate } from '@/lib/utils';
import { useAutoSave } from '@/hooks/useAutoSave';
import DayCard from '@/components/DayCard';
import Link from 'next/link';
import { logout } from '@/app/actions/logout';

interface DashboardProps {
  user: {
    id: string;
    name?: string | null;
    role: string;
  };
}

export default function Dashboard({ user }: DashboardProps) {
  const [days, setDays] = useState<Day[]>([]);
  const [expandedDayId, setExpandedDayId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null);
  const [showNewDayModal, setShowNewDayModal] = useState(false);

  useEffect(() => {
    fetchAllDays();
  }, []);

  useEffect(() => {
    if (!isLoading && days.length >= 0) {
      const today = getTodayDate();
      const todayExists = days.some(d => d.date === today);
      if (!todayExists) {
        createDay(today);
      }
    }
  }, [isLoading, days]);

  const fetchAllDays = async () => {
    try {
      const res = await fetch('/api/days');
      const data: Day[] = await res.json();
      setDays(data.sort((a, b) => b.date.localeCompare(a.date)));
    } catch (error) {
      console.error('Failed to fetch days:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createDay = async (date: string, startTime: string = '09:00', endTime: string = '22:00') => {
    try {
      const res = await fetch('/api/days', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, startTime, endTime }),
      });
      if (res.ok) {
        const day: Day = await res.json();
        setDays(prev => [day, ...prev].sort((a, b) => b.date.localeCompare(a.date)));
        setExpandedDayId(day.id);
      }
    } catch (error) {
      console.error('Failed to create day:', error);
    }
  };

  const saveTimeBlock = useCallback(async (data: { id: string; done?: boolean; activity?: string }) => {
    setSaveStatus('saving');
    try {
      const res = await fetch(`/api/timeblocks/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done: data.done, activity: data.activity }),
      });
      if (res.ok) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus(null), 1500);
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Failed to save:', error);
      setSaveStatus('error');
    }
  }, []);

  const { save: debouncedSave } = useAutoSave(saveTimeBlock, 400);

  const handleTimeBlockUpdate = (dayId: string, blockId: string, data: { done?: boolean; activity?: string }) => {
    setDays(prev => prev.map(day => 
      day.id === dayId 
        ? { ...day, timeBlocks: day.timeBlocks.map(block => 
            block.id === blockId ? { ...block, ...data } : block
          )}
        : day
    ));
    debouncedSave({ id: blockId, ...data });
  };

  const toggleDayCompleted = async (day: Day) => {
    try {
      const res = await fetch(`/api/days/${day.date}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !day.completed }),
      });
      if (res.ok) {
        setDays(prev => prev.map(d => d.id === day.id ? { ...d, completed: !d.completed } : d));
      }
    } catch (error) {
      console.error('Failed to toggle:', error);
    }
  };

  const deleteDay = async (day: Day) => {
    if (!confirm(`Delete ${day.date}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/days/${day.date}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDays(prev => prev.filter(d => d.id !== day.id));
        if (expandedDayId === day.id) setExpandedDayId(null);
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleExport = async (format: 'json' | 'markdown') => {
    const res = await fetch(`/api/export?format=${format}`);
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = format === 'json' ? 'productivity-log.json' : 'productivity-log.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <main className="min-h-screen bg-[#191919]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-[#202020]/80 backdrop-blur-md border-b border-[#333] z-50 transition-all duration-300">
        <div className="max-w-3xl mx-auto h-full px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <h1 className="text-sm font-medium text-[#888]">Productivity Tracker</h1>
             {user.role === 'ADMIN' && (
                <Link href="/admin" className="text-xs px-2 py-1 bg-purple-500/10 text-purple-400 rounded hover:bg-purple-500/20 transition-colors">
                    Admin
                </Link>
             )}
          </div>
          
          <div className="flex items-center gap-4">
            <span className={`text-xs transition-colors duration-300 ${
              saveStatus === 'saving' ? 'text-yellow-500/80' : 
              saveStatus === 'saved' ? 'text-green-500/60' : 
              saveStatus === 'error' ? 'text-red-400' : 'text-transparent'
            }`}>
              {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : saveStatus === 'error' ? 'Error saving' : ''}
            </span>
            <div className="h-4 w-[1px] bg-[#333]" />
            <span className="text-xs text-[#888]">{user.name}</span>
            <form action={logout}>
                <button type="submit" className="text-xs bg-[#2a2a2a] hover:bg-[#333] text-[#aaa] px-3 py-1.5 rounded transition-all">
                    Sign Out
                </button>
            </form>
          </div>
        </div>
      </header>

      {/* New Day Modal */}
      {showNewDayModal && (
        <NewDayModal 
          onClose={() => setShowNewDayModal(false)}
          onCreate={(date, startTime, endTime) => {
            createDay(date, startTime, endTime);
            setShowNewDayModal(false);
          }}
          existingDates={days.map(d => d.date)}
        />
      )}

      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Your Days</h2>
            <div className="flex gap-2">
                <button
                  onClick={() => handleExport('json')}
                  className="px-3 py-1.5 text-xs font-medium bg-[#2f2f2f] hover:bg-[#3f3f3f] text-[#aaa] hover:text-white rounded-lg transition-colors"
                >
                  Export JSON
                </button>
                <button
                    onClick={() => setShowNewDayModal(true)}
                    className="px-4 py-2 text-sm font-medium bg-[#2383e2] hover:bg-[#1a6cb8] text-white rounded-lg transition-colors"
                >
                    + New Day
                </button>
            </div>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#444] border-t-[#2383e2] rounded-full animate-spin" />
          </div>
        ) : days.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#9b9b9b]">No days yet. Create your first day!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {days.map(day => (
              <DayCard
                key={day.id}
                day={day}
                isExpanded={expandedDayId === day.id}
                onToggleExpand={() => setExpandedDayId(expandedDayId === day.id ? null : day.id)}
                onUpdateBlock={(blockId, data) => handleTimeBlockUpdate(day.id, blockId, data)}
                onToggleCompleted={() => toggleDayCompleted(day)}
                onDelete={() => deleteDay(day)}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

// New Day Modal Component
function NewDayModal({ 
  onClose, 
  onCreate, 
  existingDates 
}: { 
  onClose: () => void; 
  onCreate: (date: string, startTime: string, endTime: string) => void;
  existingDates: string[];
}) {
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('22:00');
  const dateExists = existingDates.includes(selectedDate);
  const isValidTime = startTime < endTime;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[#202020] rounded-2xl p-6 w-full max-w-md border border-[#4a4a4a] shadow-xl">
        <h2 className="text-lg font-semibold text-white mb-4">Create New Day</h2>
        
        <div className="space-y-4">
          {/* Date Picker */}
          <div>
            <label className="block text-sm text-[#aaa] mb-2">Select Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#373737] border border-[#4a4a4a] rounded-lg text-white focus:outline-none focus:border-[#2383e2]"
            />
            {dateExists && (
              <p className="mt-1 text-xs text-amber-400">This date already exists</p>
            )}
          </div>

          {/* Time Frame */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#aaa] mb-2">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#373737] border border-[#4a4a4a] rounded-lg text-white focus:outline-none focus:border-[#2383e2]"
              />
            </div>
            <div>
              <label className="block text-sm text-[#aaa] mb-2">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#373737] border border-[#4a4a4a] rounded-lg text-white focus:outline-none focus:border-[#2383e2]"
              />
            </div>
          </div>
          {!isValidTime && startTime && endTime && (
            <p className="text-xs text-red-400">End time must be after start time</p>
          )}

          {/* Quick Date Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedDate(getTodayDate())}
              className="px-3 py-1.5 text-xs bg-[#373737] hover:bg-[#4a4a4a] text-[#aaa] hover:text-white rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                setSelectedDate(tomorrow.toISOString().split('T')[0]);
              }}
              className="px-3 py-1.5 text-xs bg-[#373737] hover:bg-[#4a4a4a] text-[#aaa] hover:text-white rounded-lg transition-colors"
            >
              Tomorrow
            </button>
            <button
              onClick={() => {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                setSelectedDate(yesterday.toISOString().split('T')[0]);
              }}
              className="px-3 py-1.5 text-xs bg-[#373737] hover:bg-[#4a4a4a] text-[#aaa] hover:text-white rounded-lg transition-colors"
            >
              Yesterday
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[#aaa] hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onCreate(selectedDate, startTime, endTime)}
            disabled={dateExists || !isValidTime}
            className="px-4 py-2 text-sm font-medium accent-notion text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Day
          </button>
        </div>
      </div>
    </div>
  );
}

