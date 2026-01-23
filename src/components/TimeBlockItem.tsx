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
  onUpdate: (id: string, data: { done?: boolean; skipped?: boolean; activity?: string; rating?: BlockRating | null }) => void;
  onNavigate: (direction: 'up' | 'down') => void;
}

import { BlockRating } from '@/types';
import RatingDropdown, { RATINGS } from './RatingDropdown';

interface TimeBlockItemProps {
  id: string;
  startTime: string;
  endTime: string;
  done: boolean;
  skipped: boolean;
  activity: string;
  rating?: BlockRating | null; 
  index: number;
  isFirst: boolean;
  isLast: boolean;
  isCurrent?: boolean;
  onUpdate: (id: string, data: { done?: boolean; skipped?: boolean; activity?: string; rating?: BlockRating | null }) => void;
  onNavigate: (direction: 'up' | 'down') => void;
}

export default function TimeBlockItem({
  id,
  startTime,
  endTime,
  done,
  skipped,
  activity,
  rating,
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
        // Removed default done toggle on enter to avoid confusion with ratings
        // But we could map it to "PRODUCTIVE" if desired. For now let's just keep navigate behavior cleanly.
        e.preventDefault();
        onNavigate('down');
    }
  };

  // Determine row style based on rating or legacy state
  let rowStyle = 'hover:bg-[var(--card-hover)]';
  if (rating === 'PRODUCTIVE') rowStyle = 'bg-green-500/10 border-green-500/20';
  else if (rating === 'MODERATE') rowStyle = 'bg-yellow-500/10 border-yellow-500/20';
  else if (rating === 'DISTRACTED') rowStyle = 'bg-red-500/10 border-red-500/20';
  else if (done) rowStyle = 'bg-green-900/10'; // Legacy fallback
  else if (skipped) rowStyle = 'bg-gray-800/30'; // Legacy fallback

  if (isCurrent) {
     rowStyle = 'bg-[var(--accent-blue)]/10 border border-[var(--accent-blue)]/30 shadow-[0_0_10px_var(--accent-blue)/20]';
  }

  return (
    <div 
        className={`group flex items-start gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-lg transition-all duration-200 border border-transparent ${rowStyle}`}
    >
      <div className="flex flex-col items-center gap-1 mt-1.5">
          <RatingDropdown 
            currentRating={rating}
            onRate={(newRating) => {
                onUpdate(id, { 
                    rating: newRating,
                    // Auto-update legacy flags for backward compatibility
                    done: newRating === 'PRODUCTIVE' || newRating === 'MODERATE',
                    skipped: newRating === 'DISTRACTED'
                });
            }}
          />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between mb-0.5 sm:mb-1">
            <span className={`text-[10px] sm:text-xs font-mono font-medium ${
                rating ? RATINGS.find(r => r.value === rating)?.color : 'text-[var(--text-secondary)]'
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
            placeholder={rating === 'DISTRACTED' ? "What distracted you?" : "What did you do?"}
            className={`w-full bg-transparent resize-none focus:outline-none text-sm transition-colors decoration-gray-600 ${
                rating === 'PRODUCTIVE' || done ? 'text-[var(--text-secondary)]' : 
                rating === 'DISTRACTED' ? 'text-red-300/80' : 
                skipped ? 'text-gray-600 italic' : 
                'text-[var(--text-primary)] placeholder-[var(--text-placeholder)]'
            }`}
        />
      </div>
    </div>
  );
}
