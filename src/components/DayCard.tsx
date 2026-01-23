'use client';

import { useState, useRef, useCallback, useEffect, ReactNode } from 'react';
import { Day, SleepQuality, BlockRating } from '@/types';
import { getTodayDate, calculateCompletionPercentage } from '@/lib/utils';
import TimeBlockItem from './TimeBlockItem';
import { ChevronDown, Moon } from 'lucide-react';

// Sleep quality display helper
const SLEEP_QUALITY_INFO: Record<SleepQuality, { emoji: string; label: string; color: string }> = {
  DEEP: { emoji: '😴', label: 'Deep', color: 'text-purple-400' },
  GOOD: { emoji: '😊', label: 'Good', color: 'text-green-400' },
  LIGHT: { emoji: '💤', label: 'Light', color: 'text-blue-400' },
  RESTLESS: { emoji: '😵‍💫', label: 'Restless', color: 'text-amber-400' },
  POOR: { emoji: '😫', label: 'Poor', color: 'text-red-400' },
};

// Collapsible group component for time periods
// Collapsible group component for time periods
interface TimeBlockGroupProps {
  label: string;
  icon: string;
  completedCount: number;
  totalCount: number;
  isCurrentPeriod: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}

function TimeBlockGroup({ 
  label, 
  icon, 
  completedCount, 
  totalCount, 
  isCurrentPeriod,
  isExpanded,
  onToggle,
  children 
}: TimeBlockGroupProps) {
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  
  return (
    <div className="border-b border-[var(--border-primary)] last:border-b-0">
      {/* Group Header */}
      <button
        onClick={onToggle}
        className={`w-full px-4 sm:px-5 py-3 flex items-center justify-between hover:bg-[var(--card-hover)] transition-colors ${
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
        <div className="px-3 sm:px-5 pb-4 space-y-2">
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
  onUpdateBlock: (blockId: string, data: { done?: boolean; skipped?: boolean; activity?: string; rating?: BlockRating | null }) => void;
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
  
  // Define time periods
  type Period = 'morning' | 'afternoon' | 'evening';
  const periods: { key: Period; label: string; icon: string; start: string; end: string }[] = [
    { key: 'morning', label: 'Morning', icon: '🌤️', start: '00:00', end: '12:00' },
    { key: 'afternoon', label: 'Afternoon', icon: '☀️', start: '12:00', end: '17:00' },
    { key: 'evening', label: 'Evening', icon: '🌙', start: '17:00', end: '24:00' },
  ];

  // Determine current period
  const getCurrentPeriod = () => {
    if (!isToday) return 'morning'; // Default to morning for past days
    const time = getCurrentTimeString();
    return periods.find(p => time >= p.start && time < p.end)?.key || 'morning';
  };

  // State for expanded accordion group - defaults to current period only
  const [expandedPeriod, setExpandedPeriod] = useState<Period | null>(() => getCurrentPeriod() as Period);

  // Update expanded period when day becomes expaned (only if not already set)
  useEffect(() => {
      if (isExpanded && isToday) {
          const current = getCurrentPeriod();
          if (current !== expandedPeriod) {
            setExpandedPeriod(current as Period);
          }
      }
  }, [isExpanded, isToday]); // Intentionally not including expandedPeriod to avoid loops, just on open

  
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
      <div className="px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="text-left w-full sm:w-auto">
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <div className="flex items-center gap-2">
                  {isEditingName ? (
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      onBlur={() => setIsEditingName(false)}
                      onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                      placeholder={formatDate(day.date)}
                      className="editable-title text-[var(--text-primary)] bg-[var(--bg-tertiary)] px-2 py-1 rounded w-32 sm:w-40"
                      autoFocus
                    />
                  ) : (
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="text-[var(--text-primary)] font-semibold hover:text-[var(--accent-blue)] transition-colors truncate max-w-[150px] sm:max-w-none"
                      title="Click to edit name"
                    >
                      {displayName}
                    </button>
                  )}
                  <span className="text-xs text-[var(--text-secondary)] whitespace-nowrap">({day.date})</span>
              </div>
              
              {day.completed && (
                <span className="sm:hidden px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded-full">Done</span>
              )}

              {/* Mobile Expand Icon */}
              <button
                onClick={onToggleExpand}
                className="p-1 sm:hidden hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors ml-auto"
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
            
            <div className="flex items-center justify-between mt-1 sm:mt-0.5">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs text-[var(--text-secondary)]">
                    {day.startTime} – {day.endTime} • {day.timeBlocks.length} blocks
                  </span>
                  
                  {/* Sleep Info Badge */}
                  {(day.sleepDuration || day.sleepQuality) && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-500/10 rounded-full">
                      <Moon size={12} className="text-indigo-400" />
                      {day.sleepDuration && (
                        <span className={`text-xs font-medium ${
                          day.sleepDuration >= 7 ? 'text-green-400' : 
                          day.sleepDuration >= 5 ? 'text-amber-400' : 
                          'text-red-400'
                        }`}>
                          {day.sleepDuration}h
                        </span>
                      )}
                      {day.sleepQuality && (
                        <span className="text-xs">
                          {SLEEP_QUALITY_INFO[day.sleepQuality as SleepQuality]?.emoji || ''}
                        </span>
                      )}
                    </div>
                  )}
                </div>
            </div>
          </div>
        </div>
        
        <div className="hidden sm:flex items-center gap-4">
          {day.completed && (
            <span className="hidden sm:inline px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded-full">Done</span>
          )}
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
        
        {/* Mobile Progress Bar */}
        <div className="sm:hidden w-full flex items-center gap-3 mt-2">
            <div className="flex-1 h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
              <div 
                className="h-full accent-notion transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-xs text-[var(--text-secondary)] font-mono">
              {completedCount}/{day.timeBlocks.length}
            </span>
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
              
              const currentPeriodKey = getCurrentPeriod();

              return groupedBlocks.map((group, groupIndex) => {
                const completedInGroup = group.blocks.filter(b => b.done).length;
                const isCurrentPeriod = isToday && group.key === currentPeriodKey;
                const isGroupExpanded = expandedPeriod === group.key;

                return (
                  <TimeBlockGroup
                    key={group.key}
                    label={group.label}
                    icon={group.icon}
                    completedCount={completedInGroup}
                    totalCount={group.blocks.length}
                    isCurrentPeriod={isCurrentPeriod}
                    isExpanded={isGroupExpanded}
                    onToggle={() => setExpandedPeriod(isGroupExpanded ? null : group.key as Period)}
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
                          rating={block.rating}
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
