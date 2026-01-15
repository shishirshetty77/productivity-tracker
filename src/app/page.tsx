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

  // Fetch all days on mount
  useEffect(() => {
    fetchAllDays();
  }, []);

  // Auto-create today if not exists
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

  const createDay = async (date: string) => {
    try {
      const res = await fetch('/api/days', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, startTime: '09:00', endTime: '22:00' }),
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const today = getTodayDate();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (dateStr === today) return 'Today';
    if (dateStr === yesterday.toISOString().split('T')[0]) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <main className="min-h-screen bg-[#0f0f0f]">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-[#0f0f0f]/95 backdrop-blur border-b border-[#1f1f1f]">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 accent-gradient rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Productivity Tracker</h1>
                <p className="text-xs text-[#666]">30-minute intervals</p>
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
                  className="px-3 py-1.5 text-xs font-medium bg-[#1a1a1a] hover:bg-[#252525] text-[#999] hover:text-white rounded-lg transition-colors"
                >
                  Export JSON
                </button>
                <button
                  onClick={() => handleExport('markdown')}
                  className="px-3 py-1.5 text-xs font-medium bg-[#1a1a1a] hover:bg-[#252525] text-[#999] hover:text-white rounded-lg transition-colors"
                >
                  Export MD
                </button>
              </div>
              
              <button
                onClick={() => createDay(getTodayDate())}
                className="px-4 py-2 text-sm font-medium accent-gradient text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                + New Day
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#333] border-t-[#667eea] rounded-full animate-spin" />
          </div>
        ) : days.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#666]">No days yet. Create your first day!</p>
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
                formatDate={formatDate}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

// Day Card Component
function DayCard({ 
  day, 
  isExpanded, 
  onToggleExpand, 
  onUpdateBlock, 
  onToggleCompleted,
  formatDate 
}: {
  day: Day;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdateBlock: (blockId: string, data: { done?: boolean; activity?: string }) => void;
  onToggleCompleted: () => void;
  formatDate: (date: string) => string;
}) {
  const percentage = calculateCompletionPercentage(day.timeBlocks);
  const completedCount = day.timeBlocks.filter(b => b.done).length;

  return (
    <div className={`day-card bg-[#151515] border border-[#222] rounded-2xl overflow-hidden ${day.completed ? 'border-green-500/30' : ''}`}>
      {/* Card Header - Always Visible */}
      <button
        onClick={onToggleExpand}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#1a1a1a] transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold">{formatDate(day.date)}</span>
              {day.completed && (
                <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded-full">Done</span>
              )}
            </div>
            <div className="text-xs text-[#666] mt-0.5">
              {day.startTime} – {day.endTime} • {day.timeBlocks.length} blocks
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Progress */}
          <div className="flex items-center gap-3">
            <div className="w-24 h-2 bg-[#252525] rounded-full overflow-hidden">
              <div 
                className="h-full accent-gradient transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-xs text-[#888] font-mono w-16 text-right">
              {completedCount}/{day.timeBlocks.length}
            </span>
          </div>
          
          {/* Expand Icon */}
          <svg 
            className={`w-5 h-5 text-[#666] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="expand-content border-t border-[#222]">
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
          <div className="px-5 py-3 bg-[#0f0f0f] border-t border-[#222] flex justify-between items-center">
            <span className="text-xs text-[#666]">
              {percentage}% complete
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleCompleted(); }}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                day.completed 
                  ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                  : 'bg-[#252525] text-[#888] hover:bg-[#333] hover:text-white'
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
  index 
}: { 
  block: { id: string; startTime: string; endTime: string; done: boolean; activity: string };
  onUpdate: (data: { done?: boolean; activity?: string }) => void;
  index: number;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-expand textarea
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

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${
      block.done ? 'block-completed' : 'bg-[#1a1a1a] hover:bg-[#1f1f1f]'
    }`}>
      {/* Time Badge */}
      <div className="flex-shrink-0 pt-2">
        <span className={`time-badge px-2 py-1 rounded ${
          block.done ? 'bg-green-500/20 text-green-400' : 'bg-[#252525] text-[#888]'
        }`}>
          {block.startTime}
        </span>
      </div>
      
      {/* Checkbox */}
      <button
        onClick={() => onUpdate({ done: !block.done })}
        className={`flex-shrink-0 mt-2 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
          block.done 
            ? 'bg-green-500 border-green-500' 
            : 'border-[#444] hover:border-[#666]'
        }`}
      >
        {block.done && (
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
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
          block.done ? 'text-green-300/80' : 'text-[#ccc]'
        }`}
        rows={1}
      />
    </div>
  );
}
