'use client';

import { useState, useRef, useCallback } from 'react';
import { Day, TimeBlock } from '@/types';
import { getTodayDate, calculateCompletionPercentage } from '@/lib/utils';
import TimeBlockItem from './TimeBlockItem';

interface DayCardProps {
  day: Day;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdateBlock: (blockId: string, data: { done?: boolean; skipped?: boolean; activity?: string }) => void;
  onToggleCompleted: () => void;
  onDelete: () => void;
}

export default function DayCard({
  day,
  isExpanded,
  onToggleExpand,
  onUpdateBlock,
  onToggleCompleted,
  onDelete
}: DayCardProps) {
  const percentage = calculateCompletionPercentage(day.timeBlocks);
  const completedCount = day.timeBlocks.filter(b => b.done).length;
  const [customName, setCustomName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const handleNavigate = useCallback((currentIndex: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const targetInput = containerRef.current?.querySelector(
      `[data-input-index="${targetIndex}"]`
    ) as HTMLTextAreaElement;
    if (targetInput) {
      targetInput.focus();
    }
  }, []);

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
        <div className="expand-content border-t border-[#373737]" ref={containerRef}>
          <div className="p-5 space-y-2">
            {day.timeBlocks.map((block, index) => (
              <TimeBlockItem
                key={block.id}
                id={block.id}
                startTime={block.startTime}
                endTime={block.endTime}
                done={block.done}
                skipped={block.skipped}
                activity={block.activity}
                onUpdate={onUpdateBlock}
                index={index}
                isFirst={index === 0}
                isLast={index === day.timeBlocks.length - 1}
                onNavigate={(direction) => handleNavigate(index, direction)}
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
