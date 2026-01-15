'use client';

import { useState, useEffect, useCallback } from 'react';
import DateSelector from '@/components/DateSelector';

import TimeBlockList from '@/components/TimeBlockList';
import ProgressIndicator from '@/components/ProgressIndicator';
import ExportButton from '@/components/ExportButton';
import DarkModeToggle from '@/components/DarkModeToggle';
import { Day, TimeBlock } from '@/types';
import { getTodayDate } from '@/lib/utils';
import { useAutoSave } from '@/hooks/useAutoSave';

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [currentDay, setCurrentDay] = useState<Day | null>(null);
  const [daysWithData, setDaysWithData] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null);

  // Fetch all days to show in calendar
  useEffect(() => {
    fetchAllDays();
  }, []);

  // Fetch current day when date changes
  useEffect(() => {
    fetchDay(selectedDate);
  }, [selectedDate]);

  const fetchAllDays = async () => {
    try {
      const res = await fetch('/api/days');
      const days: Day[] = await res.json();
      setDaysWithData(days.map((d) => d.date));
    } catch (error) {
      console.error('Failed to fetch days:', error);
    }
  };

  const fetchDay = async (date: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/days/${date}`);
      if (res.ok) {
        const day: Day = await res.json();
        setCurrentDay(day);
      } else if (res.status === 404) {
        // Auto-create day with default time window (09:00-17:00)
        await autoCreateDay(date);
      }
    } catch (error) {
      console.error('Failed to fetch day:', error);
      setCurrentDay(null);
    } finally {
      setIsLoading(false);
    }
  };

  const autoCreateDay = async (date: string) => {
    try {
      const res = await fetch('/api/days', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, startTime: '09:00', endTime: '17:00' }),
      });
      if (res.ok) {
        const day: Day = await res.json();
        setCurrentDay(day);
        setDaysWithData((prev) => [...prev, date]);
      }
    } catch (error) {
      console.error('Failed to auto-create day:', error);
      setCurrentDay(null);
    }
  };



  const toggleDayCompleted = async () => {
    if (!currentDay) return;
    try {
      const res = await fetch(`/api/days/${selectedDate}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !currentDay.completed }),
      });
      if (res.ok) {
        const day: Day = await res.json();
        setCurrentDay(day);
      }
    } catch (error) {
      console.error('Failed to toggle day completion:', error);
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
        setTimeout(() => setSaveStatus(null), 2000);
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Failed to save time block:', error);
      setSaveStatus('error');
    }
  }, []);

  const { save: debouncedSave } = useAutoSave(saveTimeBlock, 500);

  const handleTimeBlockUpdate = (id: string, data: { done?: boolean; activity?: string }) => {
    // Optimistic update
    if (currentDay) {
      setCurrentDay({
        ...currentDay,
        timeBlocks: currentDay.timeBlocks.map((block) =>
          block.id === id ? { ...block, ...data } : block
        ),
      });
    }
    // Debounced save
    debouncedSave({ id, ...data });
  };

  const handleExport = async (format: 'json' | 'markdown') => {
    try {
      const res = await fetch(`/api/export?format=${format}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = format === 'json' ? 'productivity-log.json' : 'productivity-log.md';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export:', error);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Productivity Tracker
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">30-minute intervals</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {saveStatus && (
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    saveStatus === 'saved'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      : saveStatus === 'saving'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                  }`}
                >
                  {saveStatus === 'saved' ? '✓ Saved' : saveStatus === 'saving' ? 'Saving...' : 'Error'}
                </span>
              )}
              <ExportButton onExport={handleExport} />
              <DarkModeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Date Selector */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <DateSelector
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            daysWithData={daysWithData}
          />
        </section>



        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        )}

        {/* Day Content */}
        {!isLoading && currentDay && (
          <>
            {/* Progress */}
            <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <ProgressIndicator
                timeBlocks={currentDay.timeBlocks}
                dayCompleted={currentDay.completed}
              />
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {currentDay.timeBlocks.length} time blocks
                </span>
                <button
                  onClick={toggleDayCompleted}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    currentDay.completed
                      ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800 focus:ring-green-500'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 focus:ring-gray-500'
                  }`}
                >
                  {currentDay.completed ? '✓ Day Completed' : 'Mark Day Complete'}
                </button>
              </div>
            </section>

            {/* Time Blocks */}
            <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Time Blocks
              </h2>
              <TimeBlockList
                timeBlocks={currentDay.timeBlocks}
                onUpdateBlock={handleTimeBlockUpdate}
              />
            </section>
          </>
        )}

        {/* Loading indicator while auto-creating */}
        {!isLoading && !currentDay && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        )}

        {/* Keyboard Shortcuts Help */}
        <div className="text-center text-xs text-gray-400 dark:text-gray-500 space-x-4">
          <span>↑↓ Navigate blocks</span>
          <span>Enter Toggle completion</span>
          <span>Tab Next field</span>
        </div>
      </div>
    </main>
  );
}
