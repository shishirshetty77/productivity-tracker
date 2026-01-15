'use client';

import { getTodayDate } from '@/lib/utils';

interface DateSelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  daysWithData?: string[];
}

export default function DateSelector({ selectedDate, onDateChange, daysWithData = [] }: DateSelectorProps) {
  const today = getTodayDate();

  const navigateDay = (direction: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + direction);
    onDateChange(date.toISOString().split('T')[0]);
  };

  const formatDisplayDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const hasData = daysWithData.includes(selectedDate);
  const isToday = selectedDate === today;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigateDay(-1)}
          className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Previous day"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="relative">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          />
        </div>

        <button
          onClick={() => navigateDay(1)}
          className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Next day"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
          {formatDisplayDate(selectedDate)}
        </span>
        {isToday && (
          <span className="px-2 py-1 text-xs font-semibold bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full">
            Today
          </span>
        )}
        {hasData && (
          <span className="w-2 h-2 bg-green-500 rounded-full" title="Has entries" />
        )}
      </div>

      {!isToday && (
        <button
          onClick={() => onDateChange(today)}
          className="px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
        >
          Go to Today
        </button>
      )}
    </div>
  );
}
