'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Day } from '@/types';
import { getTodayDate, calculateCompletionPercentage } from '@/lib/utils';
import { useAutoSave } from '@/hooks/useAutoSave';

export default function Home() {
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
      <header className="sticky top-0 z-20 bg-[#191919]/95 backdrop-blur border-b border-[#373737]">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 accent-notion rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Productivity Tracker</h1>
                <p className="text-xs text-[#9b9b9b]">30-minute intervals</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {saveStatus && (
                <span className={`text-xs px-2.5 py-1 rounded-full ${
                  saveStatus === 'saved' ? 'bg-green-500/20 text-green-400' :
                  saveStatus === 'saving' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {saveStatus === 'saved' ? '✓ Saved' : saveStatus === 'saving' ? 'Saving...' : 'Error'}
                </span>
              )}
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleExport('json')}
                  className="px-3 py-1.5 text-xs font-medium bg-[#2f2f2f] hover:bg-[#3f3f3f] text-[#aaa] hover:text-white rounded-lg transition-colors"
                >
                  Export JSON
                </button>
                <button
                  onClick={() => handleExport('markdown')}
                  className="px-3 py-1.5 text-xs font-medium bg-[#2f2f2f] hover:bg-[#3f3f3f] text-[#aaa] hover:text-white rounded-lg transition-colors"
                >
                  Export MD
                </button>
              </div>
              
              <button
                onClick={() => setShowNewDayModal(true)}
                className="px-4 py-2 text-sm font-medium accent-notion text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                + New Day
              </button>
            </div>
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

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
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

// Day Card Component
function DayCard({ 
  day, 
  isExpanded, 
  onToggleExpand, 
  onUpdateBlock, 
  onToggleCompleted,
  onDelete
}: {
  day: Day;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdateBlock: (blockId: string, data: { done?: boolean; activity?: string }) => void;
  onToggleCompleted: () => void;
  onDelete: () => void;
}) {
  const percentage = calculateCompletionPercentage(day.timeBlocks);
  const completedCount = day.timeBlocks.filter(b => b.done).length;
  const [customName, setCustomName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const today = getTodayDate();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (dateStr === today) return 'Today';
    if (dateStr === yesterday.toISOString().split('T')[0]) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const displayName = customName || formatDate(day.date);

  return (
    <div className={`day-card bg-[#202020] border border-[#373737] rounded-2xl overflow-hidden ${day.completed ? 'border-green-500/30' : ''}`}>
      {/* Card Header - Always Visible */}
      <div className="px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-left">
            <div className="flex items-center gap-2">
              {isEditingName ? (
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  onBlur={() => setIsEditingName(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                  placeholder={formatDate(day.date)}
                  className="editable-title text-white bg-[#373737] px-2 py-1 rounded w-40"
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => setIsEditingName(true)}
                  className="text-white font-semibold hover:text-[#2383e2] transition-colors"
                  title="Click to edit name"
                >
                  {displayName}
                </button>
              )}
              <span className="text-xs text-[#5a5a5a]">({day.date})</span>
              {day.completed && (
                <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded-full">Done</span>
              )}
            </div>
            <div className="text-xs text-[#5a5a5a] mt-0.5">
              {day.startTime} – {day.endTime} • {day.timeBlocks.length} blocks
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Progress */}
          <div className="flex items-center gap-3">
            <div className="w-24 h-2 bg-[#373737] rounded-full overflow-hidden">
              <div 
                className="h-full accent-notion transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-xs text-[#9b9b9b] font-mono w-16 text-right">
              {completedCount}/{day.timeBlocks.length}
            </span>
          </div>
          
          {/* Expand Icon */}
          <button
            onClick={onToggleExpand}
            className="p-2 hover:bg-[#373737] rounded-lg transition-colors"
          >
            <svg 
              className={`w-5 h-5 text-[#9b9b9b] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="expand-content border-t border-[#373737]">
          <div className="p-5 space-y-2">
            {day.timeBlocks.map((block, index) => (
              <TimeBlockRow
                key={block.id}
                block={block}
                onUpdate={(data) => onUpdateBlock(block.id, data)}
                index={index}
              />
            ))}
          </div>
          
          {/* Footer */}
          <div className="px-5 py-3 bg-[#1f1f1f] border-t border-[#373737] flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#5a5a5a]">
                {percentage}% complete
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="px-3 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
              >
                Delete
              </button>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleCompleted(); }}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                day.completed 
                  ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                  : 'bg-[#373737] text-[#9b9b9b] hover:bg-[#4a4a4a] hover:text-white'
              }`}
            >
              {day.completed ? '✓ Completed' : 'Mark Complete'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Time Block Row Component
function TimeBlockRow({ 
  block, 
  onUpdate,
  index: _index 
}: { 
  block: { id: string; startTime: string; endTime: string; done: boolean; skipped?: boolean; activity: string };
  onUpdate: (data: { done?: boolean; skipped?: boolean; activity?: string }) => void;
  index: number;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(40, textarea.scrollHeight)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [block.activity]);

  const handleDone = () => {
    // Toggle done, clear skipped if marking done
    onUpdate({ done: !block.done, skipped: false });
  };

  const handleSkip = () => {
    // Toggle skipped, clear done if marking skipped
    const newSkipped = !block.skipped;
    onUpdate({ 
      skipped: newSkipped, 
      done: false,
      activity: newSkipped ? 'Did not work in this period' : (block.activity === 'Did not work in this period' ? '' : block.activity)
    });
  };

  // Determine styling based on state
  const isSkipped = block.skipped;
  const isDone = block.done;

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${
      isDone ? 'bg-green-500/10 border border-green-500/30' : 
      isSkipped ? 'bg-red-500/10 border border-red-500/30' : 
      'bg-[#252525] hover:bg-[#2d2d2d]'
    }`}>
      {/* Time Badge */}
      <div className="flex-shrink-0 pt-2">
        <span className={`time-badge px-2 py-1 rounded ${
          isDone ? 'bg-green-500/20 text-green-400' : 
          isSkipped ? 'bg-red-500/20 text-red-400' :
          'bg-[#373737] text-[#9b9b9b]'
        }`}>
          {block.startTime}
        </span>
      </div>
      
      {/* Done Checkbox (Checkmark) */}
      <button
        onClick={handleDone}
        title="Mark as completed"
        className={`flex-shrink-0 mt-2 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
          isDone 
            ? 'bg-green-500 border-green-500' 
            : 'border-[#4a4a4a] hover:border-green-500'
        }`}
      >
        {isDone && (
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Skip Button (Cross) */}
      <button
        onClick={handleSkip}
        title="Mark as skipped"
        className={`flex-shrink-0 mt-2 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
          isSkipped 
            ? 'bg-red-500 border-red-500' 
            : 'border-[#4a4a4a] hover:border-red-500'
        }`}
      >
        {isSkipped && (
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </button>
      
      {/* Activity Input - Auto-expanding */}
      <textarea
        ref={textareaRef}
        value={block.activity}
        onChange={(e) => {
          onUpdate({ activity: e.target.value });
          adjustHeight();
        }}
        placeholder="What did you work on?"
        className={`flex-1 auto-expand bg-transparent border-none outline-none text-sm leading-relaxed resize-none ${
          isDone ? 'text-green-300/80' : 
          isSkipped ? 'text-red-300/80 italic' :
          'text-[#ddd]'
        }`}
        rows={1}
      />
    </div>
  );
}
