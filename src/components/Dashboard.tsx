'use client';

import { useState, useEffect, useCallback } from 'react';
import { Day, TimeBlock, SleepQuality } from '@/types';
import { getTodayDate } from '@/lib/utils';
import { useAutoSave } from '@/hooks/useAutoSave';
import DayCard from '@/components/DayCard';
import CalendarView from '@/components/CalendarView';
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
    } catch {
        setAuthError('Something went wrong');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setDays([]);
  };

  const createDay = async (
    date: string, 
    startTime: string = '09:00', 
    endTime: string = '22:00',
    sleepData?: { sleepTime?: string; wakeTime?: string; sleepDuration?: number; sleepQuality?: SleepQuality }
  ) => {
    try {
      const res = await fetch('/api/days', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, startTime, endTime, ...sleepData }),
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
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 overflow-hidden relative">
          {/* Floating Orbs Background */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Orb 1 - Large Blue */}
            <div 
              className="absolute w-[500px] h-[500px] rounded-full opacity-30 blur-[100px] animate-float-slow"
              style={{
                background: 'radial-gradient(circle, #2383E2 0%, transparent 70%)',
                top: '-10%',
                left: '-10%',
              }}
            />
            {/* Orb 2 - Purple */}
            <div 
              className="absolute w-[400px] h-[400px] rounded-full opacity-25 blur-[80px] animate-float-medium"
              style={{
                background: 'radial-gradient(circle, #9333EA 0%, transparent 70%)',
                top: '50%',
                right: '-5%',
              }}
            />
            {/* Orb 3 - Cyan */}
            <div 
              className="absolute w-[350px] h-[350px] rounded-full opacity-20 blur-[90px] animate-float-fast"
              style={{
                background: 'radial-gradient(circle, #06B6D4 0%, transparent 70%)',
                bottom: '0%',
                left: '20%',
              }}
            />
            {/* Orb 4 - Pink */}
            <div 
              className="absolute w-[300px] h-[300px] rounded-full opacity-20 blur-[70px] animate-float-reverse"
              style={{
                background: 'radial-gradient(circle, #EC4899 0%, transparent 70%)',
                top: '20%',
                left: '50%',
              }}
            />
            {/* Small floating particles */}
            <div className="absolute w-2 h-2 bg-blue-400/40 rounded-full blur-[2px] animate-particle-1" style={{ top: '20%', left: '30%' }} />
            <div className="absolute w-1.5 h-1.5 bg-purple-400/40 rounded-full blur-[2px] animate-particle-2" style={{ top: '60%', left: '70%' }} />
            <div className="absolute w-2 h-2 bg-cyan-400/30 rounded-full blur-[2px] animate-particle-3" style={{ top: '80%', left: '20%' }} />
            <div className="absolute w-1 h-1 bg-pink-400/50 rounded-full blur-[1px] animate-particle-4" style={{ top: '30%', left: '80%' }} />
          </div>

          {/* Noise overlay for texture */}
          <div 
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Login Card */}
          <div className="relative z-10 w-full max-w-md animate-fade-in-up">
            {/* Glassmorphic Card */}
            <div className="relative backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-3xl p-10 shadow-2xl">
              {/* Subtle glow behind card */}
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-cyan-500/10 rounded-3xl blur-xl opacity-50" />
              
              <div className="relative">
                {/* Logo/Icon */}
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>

                {/* Title */}
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent mb-2">
                    {isRegistering ? 'Create Account' : 'Welcome Back'}
                  </h1>
                  <p className="text-white/40 text-sm">
                    {isRegistering ? 'Start tracking your productivity today' : 'Sign in to continue your journey'}
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleAuth} className="space-y-5">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-white/50 mb-2 uppercase tracking-wider font-medium">Username</label>
                      <input 
                        type="text" 
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3.5 text-white placeholder-white/20 focus:border-blue-500/50 focus:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                        placeholder="Enter your username"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white/50 mb-2 uppercase tracking-wider font-medium">Password</label>
                      <input 
                        type="password" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3.5 text-white placeholder-white/20 focus:border-blue-500/50 focus:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                        placeholder="Enter your password"
                      />
                    </div>
                  </div>
                  
                  {authError && (
                    <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {authError}
                    </div>
                  )}
                  
                  <button 
                    type="submit" 
                    className="w-full relative group overflow-hidden rounded-xl py-3.5 font-semibold text-white transition-all duration-300"
                  >
                    {/* Button gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 transition-all duration-300 group-hover:scale-105" />
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    <span className="relative z-10">{isRegistering ? 'Create Account' : 'Sign In'}</span>
                  </button>
                  
                  <div className="text-center pt-2">
                    <button 
                      type="button"
                      onClick={() => { setIsRegistering(!isRegistering); setAuthError(''); }}
                      className="text-sm text-white/40 hover:text-white/70 transition-colors duration-300"
                    >
                      {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
            
            {/* Bottom tagline */}
            <p className="text-center text-white/20 text-xs mt-6">
              Track every 30 minutes. Master your day.
            </p>
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
             {/* Mobile Logo */}
             <div className="sm:hidden w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
             </div>

             {user.role === 'ADMIN' && (
                <Link href="/admin" className="text-xs px-2 py-1 bg-purple-500/10 text-purple-400 rounded hover:bg-purple-500/20 transition-colors">
                    Admin
                </Link>
             )}
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            {/* View Toggles */}
            <div className="flex bg-[var(--bg-tertiary)] p-0.5 rounded-lg">
                <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-[var(--bg-primary)] shadow-sm text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}
                    aria-label="List View"
                >
                    <List size={16} />
                </button>
                <button
                    onClick={() => setViewMode('calendar')}
                    className={`p-1.5 rounded-md transition-colors ${viewMode === 'calendar' ? 'bg-[var(--bg-primary)] shadow-sm text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}
                    aria-label="Calendar View"
                >
                    <Calendar size={16} />
                </button>
            </div>

            <button 
                onClick={() => setShowFocusMode(true)}
                className="p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--accent-blue)] rounded-lg transition-colors"
                title="Entered Focus Mode"
            >
                <Focus size={18} />
            </button>

            <div className="h-4 w-[1px] bg-[var(--border-primary)] hidden sm:block" />
            
            <div className="flex items-center gap-2">
                <span className={`text-xs transition-colors duration-300 hidden sm:inline ${
                saveStatus === 'saving' ? 'text-yellow-500/80' : 
                saveStatus === 'saved' ? 'text-green-500/60' : 
                saveStatus === 'error' ? 'text-red-400' : 'text-transparent'
                }`}>
                {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : saveStatus === 'error' ? 'Error' : ''}
                </span>
                <span className="text-xs text-[var(--text-secondary)] hidden md:inline">{user.username}</span>
                <button onClick={handleLogout} className="text-xs bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] px-3 py-1.5 rounded transition-all whitespace-nowrap">
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
          onCreate={(date, startTime, endTime, sleepData) => {
            createDay(date, startTime, endTime, sleepData);
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

// Sleep quality options for dropdown
const SLEEP_QUALITY_OPTIONS: { value: SleepQuality; label: string; emoji: string }[] = [
  { value: 'DEEP', label: 'Deep Sleep', emoji: '😴' },
  { value: 'GOOD', label: 'Good', emoji: '😊' },
  { value: 'LIGHT', label: 'Light', emoji: '💤' },
  { value: 'RESTLESS', label: 'Restless', emoji: '😵‍💫' },
  { value: 'POOR', label: 'Poor', emoji: '😫' },
];

// Helper to calculate sleep duration
function calculateSleepDuration(sleepTime: string, wakeTime: string): number | null {
  if (!sleepTime || !wakeTime) return null;
  const [sleepH, sleepM] = sleepTime.split(':').map(Number);
  const [wakeH, wakeM] = wakeTime.split(':').map(Number);
  
  let sleepMinutes = sleepH * 60 + sleepM;
  let wakeMinutes = wakeH * 60 + wakeM;
  
  // If wake time is earlier than sleep time, assume next day
  if (wakeMinutes <= sleepMinutes) {
    wakeMinutes += 24 * 60;
  }
  
  const durationMinutes = wakeMinutes - sleepMinutes;
  return Math.round((durationMinutes / 60) * 10) / 10; // Round to 1 decimal
}

// New Day Modal Component with Sleep Tracking
function NewDayModal({ 
  onClose, 
  onCreate, 
  existingDates 
}: { 
  onClose: () => void; 
  onCreate: (
    date: string, 
    startTime: string, 
    endTime: string,
    sleepData?: { sleepTime?: string; wakeTime?: string; sleepDuration?: number; sleepQuality?: SleepQuality }
  ) => void;
  existingDates: string[];
}) {
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('22:00');
  
  // Sleep tracking state
  const [sleepTime, setSleepTime] = useState('');
  const [wakeTime, setWakeTime] = useState('');
  const [sleepQuality, setSleepQuality] = useState<SleepQuality | ''>('');
  const [showSleepSection, setShowSleepSection] = useState(false);
  
  const dateExists = existingDates.includes(selectedDate);
  const isValidTime = startTime < endTime;
  
  // Auto-calculate sleep duration
  const sleepDuration = calculateSleepDuration(sleepTime, wakeTime);

  const handleCreate = () => {
    const sleepData = showSleepSection ? {
      sleepTime: sleepTime || undefined,
      wakeTime: wakeTime || undefined,
      sleepDuration: sleepDuration || undefined,
      sleepQuality: sleepQuality || undefined,
    } : undefined;
    
    onCreate(selectedDate, startTime, endTime, sleepData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 overflow-y-auto py-4">
      <div className="bg-[var(--bg-secondary)] rounded-2xl p-6 w-full max-w-md border border-[var(--border-primary)] shadow-xl my-auto">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Create New Day</h2>
        
        <div className="space-y-4">
          {/* Date Selection */}
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

          {/* Day Time Window */}
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

          {/* Quick Date Buttons */}
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

          {/* Sleep Tracking Section */}
          <div className="border-t border-[var(--border-primary)] pt-4">
            <button
              type="button"
              onClick={() => setShowSleepSection(!showSleepSection)}
              className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <span className="text-lg">😴</span>
              <span>Track Sleep</span>
              <svg 
                className={`w-4 h-4 transition-transform ${showSleepSection ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showSleepSection && (
              <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Sleep & Wake Times */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-2">🌙 Bedtime</label>
                    <input
                      type="time"
                      value={sleepTime}
                      onChange={(e) => setSleepTime(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
                      placeholder="23:00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-2">☀️ Wake Time</label>
                    <input
                      type="time"
                      value={wakeTime}
                      onChange={(e) => setWakeTime(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
                      placeholder="07:00"
                    />
                  </div>
                </div>
                
                {/* Auto-calculated Duration */}
                {sleepDuration !== null && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-[var(--text-secondary)]">Sleep Duration:</span>
                    <span className={`font-medium ${
                      sleepDuration >= 7 ? 'text-green-400' : 
                      sleepDuration >= 5 ? 'text-amber-400' : 
                      'text-red-400'
                    }`}>
                      {sleepDuration} hours
                    </span>
                    {sleepDuration >= 7 && <span>✨</span>}
                  </div>
                )}
                
                {/* Sleep Quality Dropdown */}
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-2">Sleep Quality</label>
                  <select
                    value={sleepQuality}
                    onChange={(e) => setSleepQuality(e.target.value as SleepQuality | '')}
                    className="w-full px-4 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)] appearance-none cursor-pointer"
                  >
                    <option value="">Select quality...</option>
                    {SLEEP_QUALITY_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.emoji} {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
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
            onClick={handleCreate}
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
