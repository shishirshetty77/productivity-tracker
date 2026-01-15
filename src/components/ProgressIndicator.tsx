'use client';

import { calculateCompletionPercentage } from '@/lib/utils';

interface ProgressIndicatorProps {
  timeBlocks: { done: boolean }[];
  dayCompleted: boolean;
}

export default function ProgressIndicator({ timeBlocks, dayCompleted }: ProgressIndicatorProps) {
  const percentage = calculateCompletionPercentage(timeBlocks);
  const completedCount = timeBlocks.filter((b) => b.done).length;
  const totalCount = timeBlocks.length;

  const getProgressColor = () => {
    if (dayCompleted) return 'bg-green-500';
    if (percentage >= 80) return 'bg-emerald-500';
    if (percentage >= 60) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-indigo-500';
    if (percentage >= 20) return 'bg-amber-500';
    return 'bg-gray-400';
  };

  if (totalCount === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-700 dark:text-gray-300">Progress</span>
          {dayCompleted && (
            <span className="px-2 py-0.5 text-xs font-semibold bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full">
              Day Completed
            </span>
          )}
        </div>
        <span className="font-mono text-gray-600 dark:text-gray-400">
          {completedCount}/{totalCount} blocks ({percentage}%)
        </span>
      </div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${getProgressColor()} transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
