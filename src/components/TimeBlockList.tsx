'use client';

import { useRef, useCallback } from 'react';
import TimeBlockItem from './TimeBlockItem';
import { TimeBlock } from '@/types';

interface TimeBlockListProps {
  timeBlocks: TimeBlock[];
  onUpdateBlock: (id: string, data: { done?: boolean; activity?: string }) => void;
}

export default function TimeBlockList({ timeBlocks, onUpdateBlock }: TimeBlockListProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleNavigate = useCallback((currentIndex: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const targetInput = containerRef.current?.querySelector(
      `[data-input-index="${targetIndex}"]`
    ) as HTMLInputElement;
    if (targetInput) {
      targetInput.focus();
    }
  }, []);

  if (timeBlocks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">No time blocks yet</h3>
        <p className="text-gray-500 dark:text-gray-400">Set your day window above to generate time blocks</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-2">
      {timeBlocks.map((block, index) => (
        <TimeBlockItem
          key={block.id}
          id={block.id}
          startTime={block.startTime}
          endTime={block.endTime}
          done={block.done}
          activity={block.activity}
          onUpdate={onUpdateBlock}
          index={index}
          isFirst={index === 0}
          isLast={index === timeBlocks.length - 1}
          onNavigate={(direction) => handleNavigate(index, direction)}
        />
      ))}
    </div>
  );
}
