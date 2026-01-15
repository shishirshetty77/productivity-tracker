'use client';

import { useRef, useEffect, KeyboardEvent } from 'react';

interface TimeBlockItemProps {
  id: string;
  startTime: string;
  endTime: string;
  done: boolean;
  activity: string;
  onUpdate: (id: string, data: { done?: boolean; activity?: string }) => void;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onNavigate: (direction: 'up' | 'down') => void;
}

export default function TimeBlockItem({
  id,
  startTime,
  endTime,
  done,
  activity,
  onUpdate,
  index,
  isFirst,
  isLast,
  onNavigate,
}: TimeBlockItemProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCheckboxChange = () => {
    onUpdate(id, { done: !done });
  };

  const handleActivityChange = (value: string) => {
    onUpdate(id, { activity: value });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp' && !isFirst) {
      e.preventDefault();
      onNavigate('up');
    } else if (e.key === 'ArrowDown' && !isLast) {
      e.preventDefault();
      onNavigate('down');
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleCheckboxChange();
    }
  };

  return (
    <div
      className={`group flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 ${
        done
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600'
      }`}
      data-block-index={index}
    >
      {/* Time Range */}
      <div className="flex-shrink-0 w-32">
        <span
          className={`text-sm font-mono font-medium ${
            done ? 'text-green-700 dark:text-green-300' : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          {startTime} – {endTime}
        </span>
      </div>

      {/* Checkbox */}
      <button
        onClick={handleCheckboxChange}
        className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
          done
            ? 'bg-green-500 border-green-500 text-white'
            : 'border-gray-300 dark:border-gray-600 hover:border-indigo-500 dark:hover:border-indigo-400'
        }`}
        aria-label={done ? 'Mark as incomplete' : 'Mark as complete'}
      >
        {done && (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Activity Input */}
      <input
        ref={inputRef}
        type="text"
        value={activity}
        onChange={(e) => handleActivityChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="What did you work on?"
        className={`flex-1 px-3 py-2 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
          done
            ? 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-700 text-green-800 dark:text-green-200 placeholder-green-400 dark:placeholder-green-600'
            : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500'
        }`}
        data-input-index={index}
      />

      {/* Status indicator */}
      <div className="flex-shrink-0 w-8">
        {done && (
          <span className="text-green-500" title="Completed">
            ✓
          </span>
        )}
      </div>
    </div>
  );
}
