'use client';

import { useState, useEffect, useCallback } from 'react';
import { Day, TimeBlock } from '@/types'; // Import TimeBlock
import { generateTimeBlocks, formatTime, getTodayDate } from '@/lib/utils';
import { useAutoSave } from '@/hooks/useAutoSave';
import DayCard from '@/components/DayCard';
import CalendarView from '@/components/CalendarView';
import { ThemeToggle } from '@/components/ThemeToggle';
import FocusMode from '@/components/FocusMode';
import Link from 'next/link';
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor, TouchSensor } from '@dnd-kit/core';
import { Calendar, List, Focus } from 'lucide-react'; // Import icons

interface User {
  id: string;
  username: string;
  role: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  
  const [days, setDays] = useState<Day[]>([]);
  const [expandedDayId, setExpandedDayId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null);
  const [showNewDayModal, setShowNewDayModal] = useState(false);
  
  // New States
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [showFocusMode, setShowFocusMode] = useState(false);
  const [activeFocusBlock, setActiveFocusBlock] = useState<TimeBlock | null>(null);

  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState('');

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
            setUser(data.user);
            fetchAllDays();
        }
        setLoadingUser(false);
      });
  }, []);

  // Update active focus block based on current time
  useEffect(() => {
    if (showFocusMode && user) {
        const now = new Date();
        const currentTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        const todayDate = now.toISOString().split('T')[0];
        
        const todayDay = days.find(d => d.date === todayDate);
        if (todayDay) {
            const currentBlock = todayDay.timeBlocks.find(b => 
                b.startTime <= currentTime && b.endTime > currentTime
            );
            setActiveFocusBlock(currentBlock || null);
        }
    }
  }, [showFocusMode, days, user]);

  const fetchAllDays = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/days');
      if (res.ok) {
        const data: Day[] = await res.json();
        setDays(data.sort((a, b) => b.date.localeCompare(a.date)));
      }
    } catch (error) {
      console.error('Failed to fetch days:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
    
    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        const data = await res.json();
        
        if (res.ok) {
            setUser(data.user);
            fetchAllDays();
        } else {
            setAuthError(data.error || 'Authentication failed');
        }
    } catch (err) {
        setAuthError('Something went wrong');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setDays([]);
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
        setViewMode('list'); // Switch to list view to see the new day
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

  // DnD Handler (Placeholder for now, logic will be in DayCard mostly)
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    
    // Logic to swap activities will be implemented here or passed down
    // For now we just log
    console.log('Dragged', active.id, 'over', over.id);
  };

  if (loadingUser) {
    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[var(--border-primary)] border-t-[var(--accent-blue)] rounded-full animate-spin" />
        </div>
    );
  }

  if (!user) {
    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4">
            <div className="w-full max-w-sm bg-[var(--bg-secondary)] p-8 rounded-2xl border border-[var(--border-primary)] shadow-2xl">
                <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2 text-center">Welcome Back</h1>
                <p className="text-[var(--text-secondary)] text-center mb-6 text-sm">Sign in to track your productivity</p>
                
                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <label className="block text-xs text-[var(--text-secondary)] mb-1.5 uppercase font-medium">Username</label>
                        <input 
                            type="text" 
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg px-4 py-2.5 text-[var(--text-primary)] focus:border-[var(--accent-blue)] focus:outline-none transition-colors"
                            placeholder="Enter username"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-[var(--text-secondary)] mb-1.5 uppercase font-medium">Password</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg px-4 py-2.5 text-[var(--text-primary)] focus:border-[var(--accent-blue)] focus:outline-none transition-colors"
                            placeholder="Enter password"
                        />
                    </div>
                    
                    {authError && <p className="text-red-400 text-sm">{authError}</p>}
                    
                    <button type="submit" className="w-full bg-[var(--accent-blue)] hover:bg-[var(--accent-hover)] text-white py-2.5 rounded-lg font-medium transition-colors">
                        {isRegistering ? 'Create Account' : 'Sign In'}
                    </button>
                    
                    <div className="text-center mt-4">
                        <button 
                            type="button"
                            onClick={() => { setIsRegistering(!isRegistering); setAuthError(''); }}
                            className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                        >
                            {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
    <main className="min-h-screen bg-[var(--bg-primary)] transition-colors duration-300">
      <header className="fixed top-0 left-0 right-0 h-14 bg-[var(--bg-overlay)] backdrop-blur-md border-b border-[var(--border-primary)] z-50 transition-all duration-300">
        <div className="max-w-3xl mx-auto h-full px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <h1 className="text-sm font-medium text-[var(--text-secondary)] hidden sm:block">Productivity Tracker</h1>
             {user.role === 'ADMIN' && (
                <Link href="/admin" className="text-xs px-2 py-1 bg-purple-500/10 text-purple-400 rounded hover:bg-purple-500/20 transition-colors">
                    Admin
                </Link>
             )}
          </div>
          
          <div className="flex items-center gap-3 sm:gap-4">
            {/* View Toggles */}
            <div className="flex bg-[var(--bg-tertiary)] p-0.5 rounded-lg">
                <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-[var(--bg-primary)] shadow-sm text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}
                >
                    <List size={16} />
                </button>
                <button
                    onClick={() => setViewMode('calendar')}
                    className={`p-1.5 rounded-md transition-colors ${viewMode === 'calendar' ? 'bg-[var(--bg-primary)] shadow-sm text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}
                >
                    <Calendar size={16} />
                </button>
            </div>

            <button 
                onClick={() => setShowFocusMode(true)}
                className="p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--accent-blue)] rounded-lg transition-colors"
                title="Entered Focus Mode"
            >
                <Focus size={18} /> {/* Using Focus Icon if available, or just a generic one */}
            </button>

            <ThemeToggle />

            <div className="h-4 w-[1px] bg-[var(--border-primary)]" />
            
            <div className="flex items-center gap-2">
                <span className={`text-xs transition-colors duration-300 ${
                saveStatus === 'saving' ? 'text-yellow-500/80' : 
                saveStatus === 'saved' ? 'text-green-500/60' : 
                saveStatus === 'error' ? 'text-red-400' : 'text-transparent'
                }`}>
                {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : saveStatus === 'error' ? 'Error' : ''}
                </span>
                <span className="text-xs text-[var(--text-secondary)] hidden sm:inline">{user.username}</span>
                <button onClick={handleLogout} className="text-xs bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] px-3 py-1.5 rounded transition-all">
                    Sign Out
                </button>
            </div>
          </div>
        </div>
      </header>

      {/* Focus Mode Overlay */}
      {showFocusMode && (
        <FocusMode 
            currentBlock={activeFocusBlock} 
            onClose={() => setShowFocusMode(false)}
            onComplete={(blockId) => {
                if(activeFocusBlock?.dayId) {
                   handleTimeBlockUpdate(activeFocusBlock.dayId, blockId, { done: true });
                }
            }}
        />
      )}

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

      <div className="max-w-3xl mx-auto px-4 py-6 pt-20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Your Days</h2>
            <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => handleExport('json')}
                  className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg transition-colors border border-[var(--border-primary)]"
                >
                  Export JSON
                </button>
                <button
                    onClick={() => setShowNewDayModal(true)}
                    className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium bg-[var(--accent-blue)] hover:bg-[var(--accent-hover)] text-white rounded-lg transition-colors shadow-sm"
                >
                    + New Day
                </button>
            </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[var(--border-primary)] border-t-[var(--accent-blue)] rounded-full animate-spin" />
          </div>
        ) : days.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[var(--text-secondary)]">No days yet. Create your first day!</p>
          </div>
        ) : viewMode === 'list' ? (
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
        ) : (
           <CalendarView days={days} onSelectDay={(date) => {
              // Find the day and expand it, switch to list view
              const day = days.find(d => d.date === date);
              if (day) {
                  setExpandedDayId(day.id);
                  setViewMode('list');
              } else {
                  // Optional: Trigger create new day for this date
                  setShowNewDayModal(true);
                  // Pre-fill date logic would go here if we lifted NewDayModal state up higher
              }
           }} />
        )}
      </div>
    </main>
    </DndContext>
  );
}

// New Day Modal Component (Updated with CSS variables)
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-[var(--bg-secondary)] rounded-2xl p-6 w-full max-w-md border border-[var(--border-primary)] shadow-xl">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Create New Day</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-2">Select Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
            />
            {dateExists && (
              <p className="mt-1 text-xs text-amber-400">This date already exists</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-2">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-2">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-4 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
              />
            </div>
          </div>
          {!isValidTime && startTime && endTime && (
            <p className="text-xs text-red-400">End time must be after start time</p>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => setSelectedDate(getTodayDate())}
              className="px-3 py-1.5 text-xs bg-[var(--bg-tertiary)] hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg transition-colors border border-[var(--border-primary)]"
            >
              Today
            </button>
            <button
              onClick={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                setSelectedDate(tomorrow.toISOString().split('T')[0]);
              }}
              className="px-3 py-1.5 text-xs bg-[var(--bg-tertiary)] hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg transition-colors border border-[var(--border-primary)]"
            >
              Tomorrow
            </button>
            <button
              onClick={() => {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                setSelectedDate(yesterday.toISOString().split('T')[0]);
              }}
              className="px-3 py-1.5 text-xs bg-[var(--bg-tertiary)] hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg transition-colors border border-[var(--border-primary)]"
            >
              Yesterday
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
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
