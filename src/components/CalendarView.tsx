'use client';

import { useState } from 'react';
import { Day } from '@/types';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths 
} from 'date-fns';
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx'; // Assuming clsx is installed or using template literals if not

interface CalendarViewProps {
  days: Day[];
  onSelectDay: (date: string) => void;
}

export default function CalendarView({ days, onSelectDay }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 flex items-center justify-between border-b border-[var(--border-primary)] bg-[var(--bg-primary)]">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-2">
          <button onClick={goToToday} className="px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded-md transition-colors">
            Today
          </button>
          <button onClick={prevMonth} className="p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] rounded-md transition-colors">
            <ChevronLeft size={18} />
          </button>
          <button onClick={nextMonth} className="p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] rounded-md transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 bg-[var(--bg-tertiary)] border-b border-[var(--border-primary)]">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="py-2 text-center text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 bg-[var(--bg-tertiary)] gap-[1px]">
        {calendarDays.map((day, dayIdx) => {
          const formattedDate = format(day, 'yyyy-MM-dd');
          const dayData = days.find(d => d.date === formattedDate);
          const isToday = isSameDay(day, new Date());
          const isCurrentMonth = isSameMonth(day, monthStart);
          
          // Calculate completion percentage
          const totalBlocks = dayData?.timeBlocks.length || 0;
          const completedBlocks = dayData?.timeBlocks.filter(b => b.done).length || 0;
          const percentage = totalBlocks > 0 ? Math.round((completedBlocks / totalBlocks) * 100) : 0;

          return (
            <div 
              key={day.toString()}
              onClick={() => onSelectDay(formattedDate)}
              className={clsx(
                "min-h-[100px] bg-[var(--bg-primary)] p-2 cursor-pointer transition-colors hover:bg-[var(--card-hover)] flex flex-col justify-between",
                !isCurrentMonth && "opacity-50 bg-[var(--bg-secondary)]"
              )}
            >
              <div className="flex justify-between items-start">
                <span 
                  className={clsx(
                    "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                    isToday 
                      ? "bg-[var(--accent-blue)] text-white" 
                      : "text-[var(--text-secondary)]"
                  )}
                >
                  {format(day, 'd')}
                </span>
                {dayData?.completed && (
                   <CheckCircle2 size={16} className="text-green-500" />
                )}
              </div>

              {dayData && (
                <div className="mt-2 space-y-1">
                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[var(--accent-blue)] rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  
                  {/* Stats */}
                  <div className="text-[10px] text-[var(--text-secondary)] flex justify-between">
                    <span>{percentage}%</span>
                    <span>{completedBlocks}/{totalBlocks}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
