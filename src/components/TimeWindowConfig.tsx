'use client';

import { useState } from 'react';

interface TimeWindowConfigProps {
  startTime: string;
  endTime: string;
  onSave: (startTime: string, endTime: string) => void;
  isLoading?: boolean;
  hasExistingData?: boolean;
}

export default function TimeWindowConfig({
  startTime: initialStartTime,
  endTime: initialEndTime,
  onSave,
  isLoading = false,
  hasExistingData = false,
}: TimeWindowConfigProps) {
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);
  const [isEditing, setIsEditing] = useState(!hasExistingData);

  const handleSave = () => {
    if (startTime && endTime && startTime < endTime) {
      onSave(startTime, endTime);
      setIsEditing(false);
    }
  };

  const isValid = startTime && endTime && startTime < endTime;

  if (!isEditing && hasExistingData) {
    return (
      <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-gray-700 dark:text-gray-300 font-medium">
            Day Window: {initialStartTime} – {initialEndTime}
          </span>
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
        {hasExistingData ? 'Update Day Window' : 'Set Your Productive Day Window'}
      </h3>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="start-time" className="text-sm text-gray-600 dark:text-gray-400">
            Start:
          </label>
          <input
            id="start-time"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="end-time" className="text-sm text-gray-600 dark:text-gray-400">
            End:
          </label>
          <input
            id="end-time"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={!isValid || isLoading}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {isLoading ? 'Creating...' : hasExistingData ? 'Update Window' : 'Create Day'}
        </button>
        {hasExistingData && (
          <button
            onClick={() => {
              setStartTime(initialStartTime);
              setEndTime(initialEndTime);
              setIsEditing(false);
            }}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 rounded-lg"
          >
            Cancel
          </button>
        )}
      </div>
      {!isValid && startTime && endTime && (
        <p className="mt-2 text-sm text-red-500">End time must be after start time</p>
      )}
      {hasExistingData && isEditing && (
        <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
          ⚠️ Changing the window will reset all time blocks for this day
        </p>
      )}
    </div>
  );
}
