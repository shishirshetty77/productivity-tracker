'use client';

import { useState, useRef, useCallback, useEffect, ReactNode } from 'react';
import { Day } from '@/types';
import { getTodayDate, calculateCompletionPercentage } from '@/lib/utils';
import TimeBlockItem from './TimeBlockItem';
import { ChevronDown } from 'lucide-react';

// Collapsible group component for time periods
interface TimeBlockGroupProps {
  label: string;
  icon: string;
  completedCount: number;
  totalCount: number;
  isCurrentPeriod: boolean;
  defaultExpanded: boolean;
  children: ReactNode;
}

function TimeBlockGroup({ 
  label, 
  icon, 
  completedCount, 
  totalCount, 
  isCurrentPeriod,
  defaultExpanded,
  children 
}: TimeBlockGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  
  return (
    <div className="border-b border-[var(--border-primary)] last:border-b-0">
      {/* Group Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full px-5 py-3 flex items-center justify-between hover:bg-[var(--card-hover)] transition-colors ${
          isCurrentPeriod ? 'bg-[var(--accent-blue)]/5' : ''
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{icon}</span>
          <span className={`text-sm font-medium ${isCurrentPeriod ? 'text-[var(--accent-blue)]' : 'text-[var(--text-primary)]'}`}>
            {label}
          </span>
          {isCurrentPeriod && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--accent-blue)] text-white font-medium">
              NOW
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {/* Mini progress bar */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-16 h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[var(--accent-blue)] rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-xs text-[var(--text-secondary)] font-mono w-10">
              {completedCount}/{totalCount}
            </span>
          </div>
          
          <ChevronDown 
            size={18} 
            className={`text-[var(--text-secondary)] transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>
      
      {/* Collapsible Content */}
      {isExpanded && (
        <div className="px-5 pb-4 space-y-2">
          {children}
        </div>
      )}
    </div>
  );
}

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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isToday = day.date === getTodayDate();
  
  // Get current time to highlight current block
  const getCurrentTimeString = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };
  const [currentTime, setCurrentTime] = useState(getCurrentTimeString());
  
  // Update current time every minute
  useEffect(() => {
    if (!isToday) return;
    const interval = setInterval(() => {
      setCurrentTime(getCurrentTimeString());
    }, 60000);
    return () => clearInterval(interval);
  }, [isToday]);
  
  // Find current block index
  const currentBlockIndex = isToday ? day.timeBlocks.findIndex(block => 
    currentTime >= block.startTime && currentTime < block.endTime
  ) : -1;
  
  // Auto-scroll to current block when expanded
  useEffect(() => {
    if (isExpanded && isToday && currentBlockIndex >= 0 && scrollContainerRef.current) {
      const blockElement = scrollContainerRef.current.querySelector(
        `[data-block-index="${currentBlockIndex}"]`
      );
      if (blockElement) {
        setTimeout(() => {
          blockElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }
  }, [isExpanded, isToday, currentBlockIndex]);

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
    <div className={`day-card bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl overflow-hidden ${day.completed ? 'border-green-500/30' : ''}`}>
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
                  className="editable-title text-[var(--text-primary)] bg-[var(--bg-tertiary)] px-2 py-1 rounded w-40"
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => setIsEditingName(true)}
                  className="text-[var(--text-primary)] font-semibold hover:text-[var(--accent-blue)] transition-colors"
                  title="Click to edit name"
                >
                  {displayName}
                </button>
              )}
              <span className="text-xs text-[var(--text-secondary)]">({day.date})</span>
              {day.completed && (
                <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded-full">Done</span>
              )}
            </div>
            <div className="text-xs text-[var(--text-secondary)] mt-0.5">
              {day.startTime} – {day.endTime} • {day.timeBlocks.length} blocks
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Progress */}
          <div className="flex items-center gap-3">
            <div className="w-24 h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
              <div 
                className="h-full accent-notion transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-xs text-[var(--text-secondary)] font-mono w-16 text-right">
              {completedCount}/{day.timeBlocks.length}
            </span>
          </div>
          
          {/* Expand Icon */}
          <button
            onClick={onToggleExpand}
            className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
          >
            <svg 
              className={`w-5 h-5 text-[var(--text-secondary)] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
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
        <div className="expand-content border-t border-[var(--border-primary)]" ref={containerRef}>
          {/* Scrollable time blocks container */}
          <div 
            ref={scrollContainerRef}
            className="max-h-[450px] overflow-y-auto scroll-smooth"
          >
            {/* Group time blocks by period */}
            {(() => {
              // Define time periods
              type Period = 'morning' | 'afternoon' | 'evening';
              const periods: { key: Period; label: string; icon: string; start: string; end: string }[] = [
                { key: 'morning', label: 'Morning', icon: '🌤️', start: '00:00', end: '12:00' },
                { key: 'afternoon', label: 'Afternoon', icon: '☀️', start: '12:00', end: '17:00' },
                { key: 'evening', label: 'Evening', icon: '🌙', start: '17:00', end: '24:00' },
              ];
              
              // Group blocks by period
              const groupedBlocks = periods.map(period => ({
                ...period,
                blocks: day.timeBlocks.filter(block => 
                  block.startTime >= period.start && block.startTime < period.end
                ).map(block => ({
                  ...block,
                  originalIndex: day.timeBlocks.findIndex(b => b.id === block.id)
                }))
              })).filter(group => group.blocks.length > 0);
              
              // Determine which period the current time is in
              const currentPeriod = periods.find(p => 
                currentTime >= p.start && currentTime < p.end
              )?.key;
              
              return groupedBlocks.map((group, groupIndex) => {
                const completedInGroup = group.blocks.filter(b => b.done).length;
                const isCurrentPeriod = isToday && group.key === currentPeriod;
                
                return (
                  <TimeBlockGroup
                    key={group.key}
                    label={group.label}
                    icon={group.icon}
                    completedCount={completedInGroup}
                    totalCount={group.blocks.length}
                    isCurrentPeriod={isCurrentPeriod}
                    defaultExpanded={isCurrentPeriod || groupIndex === 0}
                  >
                    {group.blocks.map((block) => (
                      <div key={block.id} data-block-index={block.originalIndex}>
                        <TimeBlockItem
                          id={block.id}
                          startTime={block.startTime}
                          endTime={block.endTime}
                          done={block.done}
                          skipped={block.skipped}
                          activity={block.activity}
                          onUpdate={onUpdateBlock}
                          index={block.originalIndex}
                          isFirst={block.originalIndex === 0}
                          isLast={block.originalIndex === day.timeBlocks.length - 1}
                          onNavigate={(direction) => handleNavigate(block.originalIndex, direction)}
                          isCurrent={block.originalIndex === currentBlockIndex}
                        />
                      </div>
                    ))}
                  </TimeBlockGroup>
                );
              });
            })()}
          </div>
          
          {/* Footer */}
          <div className="px-5 py-3 bg-[var(--bg-primary)] border-t border-[var(--border-primary)] flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-xs text-[var(--text-secondary)]">
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
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--card-hover)] hover:text-[var(--text-primary)]'
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
