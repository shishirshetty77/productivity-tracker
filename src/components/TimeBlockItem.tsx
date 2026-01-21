'use client';

import { useRef, useEffect } from 'react';

interface TimeBlockItemProps {
  id: string;
  startTime: string;
  endTime: string;
  done: boolean;
  skipped: boolean;
  activity: string;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  isCurrent?: boolean;
  onUpdate: (id: string, data: { done?: boolean; skipped?: boolean; activity?: string }) => void;
  onNavigate: (direction: 'up' | 'down') => void;
}

export default function TimeBlockItem({
  id,
  startTime,
  endTime,
  done,
  skipped,
  activity,
  index,
  isCurrent = false,
  onUpdate,
  onNavigate
}: TimeBlockItemProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 100)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [activity]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      onNavigate('up');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      onNavigate('down');
    } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onUpdate(id, { done: !done });
    }
  };

  return (
    <div 
        className={`group flex items-start gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-lg transition-all duration-200 ${
            isCurrent 
              ? 'bg-[var(--accent-blue)]/10 border border-[var(--accent-blue)]/30 shadow-[0_0_10px_var(--accent-blue)/20]' 
              : done 
                ? 'bg-green-900/10' 
                : skipped 
                  ? 'bg-gray-800/30' 
                  : 'hover:bg-[var(--card-hover)]'
        }`}
    >
      <div className="flex flex-col items-center gap-1 mt-1.5">
          <div 
            onClick={() => onUpdate(id, { done: !done })}
            className={`w-5 h-5 rounded-md border cursor-pointer flex items-center justify-center transition-all duration-200 ${
                done 
                ? 'bg-green-500 border-green-500 text-white' 
                : 'border-[var(--border-primary)] hover:border-[var(--text-secondary)]'
            }`}
          >
            {done && (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
            )}
          </div>
          
          <button
             onClick={() => onUpdate(id, { skipped: !skipped })}
             className={`p-1 rounded hover:bg-[var(--bg-tertiary)] transition-colors ${skipped ? 'text-amber-500' : 'text-[var(--text-secondary)]/50 group-hover:text-[var(--text-secondary)]'}`}
             title="Skip block"
          >
             <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
             </svg>
          </button>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between mb-0.5 sm:mb-1">
            <span className={`text-[10px] sm:text-xs font-mono font-medium ${
                done ? 'text-green-500/80' : skipped ? 'text-gray-500' : 'text-[var(--text-secondary)]'
            }`}>
                {startTime} - {endTime}
            </span>
        </div>
        
        <textarea
            ref={textareaRef}
            value={activity}
            onChange={(e) => onUpdate(id, { activity: e.target.value })}
            onKeyDown={handleKeyDown}
            data-input-index={index}
            rows={1}
            placeholder={skipped ? "Marked as skipped" : "What did you do?"}
            className={`w-full bg-transparent resize-none focus:outline-none text-sm transition-colors decoration-gray-600 ${
                done ? 'text-[var(--text-secondary)] line-through' : skipped ? 'text-gray-600 italic' : 'text-[var(--text-primary)] placeholder-[var(--text-placeholder)]'
            }`}
        />
      </div>
    </div>
  );
}
