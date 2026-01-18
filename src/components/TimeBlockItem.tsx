'use client';

import { useRef, KeyboardEvent, useEffect } from 'react';

interface TimeBlockItemProps {
  id: string;
  startTime: string;
  endTime: string;
  done: boolean;
  skipped?: boolean;
  activity: string;
  onUpdate: (id: string, data: { done?: boolean; skipped?: boolean; activity?: string }) => void;
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
  skipped,
  activity,
  onUpdate,
  index,
  isFirst,
  isLast,
  onNavigate,
}: TimeBlockItemProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(24, textarea.scrollHeight)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [activity]);

  const handleDone = () => {
    // Toggle done, clear skipped if marking done
    onUpdate(id, { done: !done, skipped: false });
  };

  const handleSkip = () => {
    // Toggle skipped, clear done if marking skipped
    const newSkipped = !skipped;
    onUpdate(id, { 
      skipped: newSkipped, 
      done: false,
      activity: newSkipped ? 'Did not work in this period' : (activity === 'Did not work in this period' ? '' : activity)
    });
  };

  const handleActivityChange = (value: string) => {
    onUpdate(id, { activity: value });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'ArrowUp' && !isFirst) {
      e.preventDefault();
      onNavigate('up');
    } else if (e.key === 'ArrowDown' && !isLast) {
      e.preventDefault();
      onNavigate('down');
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleDone();
    }
  };

  // Determine styling based on state
  const isSkipped = skipped;
  const isDone = done;

  return (
    <div
      className={`group flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 ${
        isDone 
          ? 'bg-green-500/10 border-green-500/30' 
          : isSkipped 
            ? 'bg-red-500/10 border-red-500/30' 
            : 'bg-[#252525] border-transparent hover:bg-[#2d2d2d]'
      }`}
      data-block-index={index}
    >
      {/* Time Range */}
      <div className="flex-shrink-0 pt-2">
         <span className={`time-badge px-2 py-1 rounded text-sm font-mono font-medium ${
          isDone ? 'bg-green-500/20 text-green-400' : 
          isSkipped ? 'bg-red-500/20 text-red-400' :
          'bg-[#373737] text-[#9b9b9b]'
        }`}>
          {startTime}
        </span>
      </div>

      {/* Done Checkbox */}
      <button
        onClick={handleDone}
        title="Mark as completed"
        className={`flex-shrink-0 mt-2 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
          isDone 
            ? 'bg-green-500 border-green-500' 
            : 'border-[#4a4a4a] hover:border-green-500'
        }`}
      >
        {isDone && (
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Skip Button */}
      <button
        onClick={handleSkip}
        title="Mark as skipped"
        className={`flex-shrink-0 mt-2 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
          isSkipped 
            ? 'bg-red-500 border-red-500' 
            : 'border-[#4a4a4a] hover:border-red-500'
        }`}
      >
        {isSkipped && (
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </button>

      {/* Activity Input */}
      <textarea
        ref={textareaRef}
        value={activity}
        onChange={(e) => handleActivityChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="What did you work on?"
        className={`flex-1 auto-expand bg-transparent border-none outline-none text-sm leading-relaxed resize-none p-0 mt-2 ${
          isDone ? 'text-green-300/80' : 
          isSkipped ? 'text-red-300/80 italic' :
          'text-[#ddd]'
        }`}
        rows={1}
        data-input-index={index}
      />
    </div>
  );
}
