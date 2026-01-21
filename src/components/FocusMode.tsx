'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Play, Pause, RotateCw, CheckCircle2, Square } from 'lucide-react';
import { TimeBlock } from '@/types';
import { clsx } from 'clsx';

// Timer States
type TimerState = 'IDLE' | 'READY' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

// Constants
const DEFAULT_TIME = 25 * 60; // 25 minutes in seconds
const MIN_TIME = 1; // 1 second
const MAX_TIME = 48 * 60 * 60; // 48 hours in seconds
const STORAGE_KEY = 'focus_timer_state';

interface TimerPersistence {
  state: TimerState;
  endTime: number | null;
  remainingMs: number;
  totalTime: number;
}

// Helper function for loading persisted state (outside component to avoid purity rules)
function loadPersistedState(): { 
  timerState: TimerState; 
  remainingMs: number; 
  totalTime: number; 
  endTime: number | null;
} {
  if (typeof window === 'undefined') {
    return { timerState: 'IDLE', remainingMs: DEFAULT_TIME * 1000, totalTime: DEFAULT_TIME * 1000, endTime: null };
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data: TimerPersistence = JSON.parse(saved);
      
      if (data.state === 'RUNNING' && data.endTime) {
        const now = Date.now();
        if (now >= data.endTime) {
          return { timerState: 'COMPLETED', remainingMs: 0, totalTime: data.totalTime, endTime: null };
        } else {
          return { timerState: 'RUNNING', remainingMs: data.endTime - now, totalTime: data.totalTime, endTime: data.endTime };
        }
      } else if (data.state === 'PAUSED') {
        return { timerState: 'PAUSED', remainingMs: data.remainingMs, totalTime: data.totalTime, endTime: null };
      } else {
        return { 
          timerState: 'IDLE', 
          remainingMs: data.remainingMs || DEFAULT_TIME * 1000, 
          totalTime: data.totalTime || DEFAULT_TIME * 1000, 
          endTime: null 
        };
      }
    }
  } catch {
    console.error('Failed to load timer state');
  }
  return { timerState: 'IDLE', remainingMs: DEFAULT_TIME * 1000, totalTime: DEFAULT_TIME * 1000, endTime: null };
}

interface FocusModeProps {
  currentBlock: TimeBlock | null;
  onClose: () => void;
  onComplete: (blockId: string) => void;
}

export default function FocusMode({ currentBlock, onClose, onComplete }: FocusModeProps) {
  // State with lazy initialization (function form avoids re-computation)
  const [timerState, setTimerState] = useState<TimerState>(() => loadPersistedState().timerState);
  const [remainingMs, setRemainingMs] = useState(() => loadPersistedState().remainingMs);
  const [totalTime, setTotalTime] = useState(() => loadPersistedState().totalTime);
  const [endTime, setEndTime] = useState<number | null>(() => loadPersistedState().endTime);
  
  // Input state - lazy initialization
  const [hoursInput, setHoursInput] = useState(() => {
    const initSec = Math.floor(loadPersistedState().remainingMs / 1000);
    return Math.floor(initSec / 3600).toString().padStart(2, '0');
  });
  const [minutesInput, setMinutesInput] = useState(() => {
    const initSec = Math.floor(loadPersistedState().remainingMs / 1000);
    return Math.floor((initSec % 3600) / 60).toString().padStart(2, '0');
  });
  const [secondsInput, setSecondsInput] = useState(() => {
    const initSec = Math.floor(loadPersistedState().remainingMs / 1000);
    return (initSec % 60).toString().padStart(2, '0');
  });
  
  // Refs
  const animationRef = useRef<number | null>(null);
  const lastClickRef = useRef<number>(0);
  const completionFiredRef = useRef(false);
  
  // Debounce constant
  const DEBOUNCE_MS = 300;

  // Helper: Update input fields from milliseconds
  const updateInputsFromMs = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    setHoursInput(hrs.toString().padStart(2, '0'));
    setMinutesInput(mins.toString().padStart(2, '0'));
    setSecondsInput(secs.toString().padStart(2, '0'));
  };

  // Persist state changes
  useEffect(() => {
    const data: TimerPersistence = {
      state: timerState,
      endTime: endTime,
      remainingMs: remainingMs,
      totalTime: totalTime,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [timerState, endTime, remainingMs, totalTime]);

  // Precision timer loop using requestAnimationFrame
  useEffect(() => {
    if (timerState !== 'RUNNING' || !endTime) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const tick = () => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      setRemainingMs(remaining);

      if (remaining <= 0 && !completionFiredRef.current) {
        completionFiredRef.current = true;
        setTimerState('COMPLETED');
        setRemainingMs(0);
        // Could trigger audio/notification here
        return;
      }

      animationRef.current = requestAnimationFrame(tick);
    };

    animationRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [timerState, endTime]);

  // Handle visibility change (background tab)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && timerState === 'RUNNING' && endTime) {
        const now = Date.now();
        const remaining = Math.max(0, endTime - now);
        setRemainingMs(remaining);
        
        if (remaining <= 0) {
          setTimerState('COMPLETED');
          completionFiredRef.current = true;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [timerState, endTime]);

  // Note: Input sync now handled via lazy state initialization

  // Parse and validate input time
  const parseInputTime = useCallback((): number => {
    const hrs = Math.min(48, Math.max(0, parseInt(hoursInput) || 0));
    const mins = Math.min(59, Math.max(0, parseInt(minutesInput) || 0));
    const secs = Math.min(59, Math.max(0, parseInt(secondsInput) || 0));
    
    let totalSec = hrs * 3600 + mins * 60 + secs;
    
    // Clamp to valid range
    if (totalSec < MIN_TIME) totalSec = MIN_TIME;
    if (totalSec > MAX_TIME) totalSec = MAX_TIME;
    
    return totalSec * 1000;
  }, [hoursInput, minutesInput, secondsInput]);

  // Validate and format on blur
  const handleInputBlur = useCallback(() => {
    if (timerState === 'RUNNING') return;
    
    const ms = parseInputTime();
    setRemainingMs(ms);
    setTotalTime(ms);
    updateInputsFromMs(ms);
    
    if (timerState === 'IDLE') {
      setTimerState('READY');
    }
  }, [parseInputTime, timerState]);

  // Debounced action handler
  const debounce = useCallback((action: () => void) => {
    const now = Date.now();
    if (now - lastClickRef.current < DEBOUNCE_MS) return;
    lastClickRef.current = now;
    action();
  }, []);

  // Start timer
  const startTimer = useCallback(() => {
    debounce(() => {
      if (timerState === 'RUNNING' || timerState === 'COMPLETED') return;
      
      const ms = parseInputTime();
      if (ms < MIN_TIME * 1000) return; // Block 00:00:00
      
      completionFiredRef.current = false;
      const end = Date.now() + ms;
      setEndTime(end);
      setRemainingMs(ms);
      setTotalTime(ms);
      setTimerState('RUNNING');
    });
  }, [debounce, parseInputTime, timerState]);

  // Pause timer
  const pauseTimer = useCallback(() => {
    debounce(() => {
      if (timerState !== 'RUNNING') return;
      
      const remaining = endTime ? Math.max(0, endTime - Date.now()) : remainingMs;
      setRemainingMs(remaining);
      setEndTime(null);
      setTimerState('PAUSED');
    });
  }, [debounce, endTime, remainingMs, timerState]);

  // Resume timer
  const resumeTimer = useCallback(() => {
    debounce(() => {
      if (timerState !== 'PAUSED') return;
      
      const end = Date.now() + remainingMs;
      setEndTime(end);
      setTimerState('RUNNING');
    });
  }, [debounce, remainingMs, timerState]);

  // Cancel timer
  const cancelTimer = useCallback(() => {
    debounce(() => {
      if (timerState === 'IDLE') return;
      
      setTimerState('CANCELLED');
      setEndTime(null);
      // Don't reset time, keep last setting
    });
  }, [debounce, timerState]);

  // Reset timer to default
  const resetTimer = useCallback(() => {
    debounce(() => {
      setTimerState('IDLE');
      setEndTime(null);
      setRemainingMs(DEFAULT_TIME * 1000);
      setTotalTime(DEFAULT_TIME * 1000);
      completionFiredRef.current = false;
      updateInputsFromMs(DEFAULT_TIME * 1000);
    });
  }, [debounce]);

  // Toggle play/pause
  const toggleTimer = useCallback(() => {
    if (timerState === 'RUNNING') {
      pauseTimer();
    } else if (timerState === 'PAUSED') {
      resumeTimer();
    } else if (timerState === 'IDLE' || timerState === 'READY' || timerState === 'CANCELLED') {
      startTimer();
    }
  }, [pauseTimer, resumeTimer, startTimer, timerState]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        toggleTimer();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (timerState === 'RUNNING' || timerState === 'PAUSED') {
          cancelTimer();
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleTimer, cancelTimer, onClose, timerState]);

  // Calculate display values
  const displayTotalSec = Math.ceil(remainingMs / 1000);
  const displayHours = Math.floor(displayTotalSec / 3600);
  const displayMinutes = Math.floor((displayTotalSec % 3600) / 60);
  const displaySeconds = displayTotalSec % 60;
  
  // Progress calculation
  const progress = totalTime > 0 ? remainingMs / totalTime : 0;
  
  // Input disabled when running
  const inputsDisabled = timerState === 'RUNNING';

  // Input change handlers with validation
  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (inputsDisabled) return;
    // Allow free typing - only keep digits, max 2 chars
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    setHoursInput(val);
    if (timerState === 'IDLE' || timerState === 'CANCELLED') setTimerState('READY');
  };

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (inputsDisabled) return;
    // Allow free typing - only keep digits, max 2 chars
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    setMinutesInput(val);
    if (timerState === 'IDLE' || timerState === 'CANCELLED') setTimerState('READY');
  };

  const handleSecondsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (inputsDisabled) return;
    // Allow free typing - only keep digits, max 2 chars
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    setSecondsInput(val);
    if (timerState === 'IDLE' || timerState === 'CANCELLED') setTimerState('READY');
  };

  // Status text
  const getStatusText = () => {
    switch (timerState) {
      case 'RUNNING': return 'Running';
      case 'PAUSED': return 'Paused';
      case 'COMPLETED': return 'Completed!';
      case 'CANCELLED': return 'Cancelled';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[var(--bg-primary)] flex flex-col items-center justify-center animate-in fade-in duration-500 font-sans">
      
      {/* Main Container - Hover to show controls */}
      <div className="relative group flex flex-col items-center w-full max-w-4xl h-full justify-center">

          {/* Top Right Exit - Visible on Hover */}
          <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button 
              onClick={onClose}
              className="p-3 text-[var(--text-secondary)] hover:text-white rounded-full transition-colors hover:bg-white/5"
            >
              <X size={28} />
            </button>
          </div>

          {/* Activity Name & Status */}
          <div className="absolute top-20 text-center space-y-2 opacity-80 group-hover:opacity-100 transition-opacity">
            <h1 className="text-2xl md:text-3xl font-medium tracking-wide text-[var(--text-secondary)]">
                {currentBlock?.activity || "Deep Focus"}
            </h1>
            {getStatusText() && (
              <p className={clsx(
                "text-sm font-medium",
                timerState === 'COMPLETED' ? "text-green-400" :
                timerState === 'PAUSED' ? "text-yellow-400" :
                timerState === 'CANCELLED' ? "text-red-400" :
                "text-[var(--text-secondary)]"
              )}>
                {getStatusText()}
              </p>
            )}
          </div>

          {/* Rectangular Timer Container */}
          <div className="relative w-full max-w-[800px] h-[220px] md:h-[280px] flex items-center justify-center">
             
             {/* SVG Rectangle Progress */}
             <svg className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-2xl overflow-visible">
                 <rect
                     x="0"
                     y="0"
                     width="100%"
                     height="100%"
                     rx="12"
                     ry="12"
                     fill="none"
                     stroke="var(--bg-tertiary)"
                     strokeWidth="4"
                 />
                 <rect
                     x="0"
                     y="0"
                     width="100%"
                     height="100%"
                     rx="12"
                     ry="12"
                     fill="none"
                     stroke={timerState === 'COMPLETED' ? '#22c55e' : 'var(--timer-progress)'} 
                     strokeWidth="4"
                     pathLength={100}
                     strokeDasharray="100"
                     strokeDashoffset={100 - (progress * 100)}
                     strokeLinecap="round"
                     className="transition-all duration-300 ease-linear"
                 />
             </svg>

             {/* Small/Mobile Timer Display (Stacked or scaled) */}
             <div className="flex items-end gap-2 md:gap-8 z-50 px-4 md:px-8 relative w-full justify-center">
                 
                 {/* Hours */}
                 <div className="flex flex-col items-center gap-1 md:gap-2">
                    <input
                        type="text"
                        inputMode="numeric"
                        value={inputsDisabled ? displayHours.toString().padStart(2, '0') : hoursInput}
                        onChange={handleHoursChange}
                        onBlur={handleInputBlur}
                        disabled={inputsDisabled}
                        className={clsx(
                            "w-16 sm:w-20 md:w-32 lg:w-40 text-center bg-transparent text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-light tracking-tighter text-white focus:outline-none focus:bg-white/5 rounded-xl transition-all p-0",
                            inputsDisabled ? "cursor-default select-none opacity-80" : "cursor-text hover:bg-white/5"
                        )}
                    />
                    <span className="text-xs md:text-sm lg:text-base font-semibold text-zinc-400 uppercase tracking-widest">hr</span>
                 </div>
                 
                 <span className="text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-light text-zinc-600 pb-3 md:pb-6 lg:pb-10">:</span>

                 {/* Minutes */}
                 <div className="flex flex-col items-center gap-1 md:gap-2">
                    <input
                        type="text"
                        inputMode="numeric"
                        value={inputsDisabled ? displayMinutes.toString().padStart(2, '0') : minutesInput}
                        onChange={handleMinutesChange}
                        onBlur={handleInputBlur}
                        disabled={inputsDisabled}
                        className={clsx(
                            "w-16 sm:w-20 md:w-32 lg:w-40 text-center bg-transparent text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-light tracking-tighter text-white focus:outline-none focus:bg-white/5 rounded-xl transition-all p-0",
                            inputsDisabled ? "cursor-default select-none opacity-80" : "cursor-text hover:bg-white/5"
                        )}
                    />
                    <span className="text-xs md:text-sm lg:text-base font-semibold text-zinc-400 uppercase tracking-widest">min</span>
                 </div>

                 <span className="text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-light text-zinc-600 pb-3 md:pb-6 lg:pb-10">:</span>

                 {/* Seconds */}
                 <div className="flex flex-col items-center gap-1 md:gap-2">
                    <input
                        type="text"
                        inputMode="numeric"
                        value={inputsDisabled ? displaySeconds.toString().padStart(2, '0') : secondsInput}
                        onChange={handleSecondsChange}
                        onBlur={handleInputBlur}
                        disabled={inputsDisabled}
                        className={clsx(
                            "w-16 sm:w-20 md:w-32 lg:w-40 text-center bg-transparent text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-light tracking-tighter text-white focus:outline-none focus:bg-white/5 rounded-xl transition-all p-0",
                            inputsDisabled ? "cursor-default select-none opacity-80" : "cursor-text hover:bg-white/5"
                        )}
                    />
                    <span className="text-xs md:text-sm lg:text-base font-semibold text-zinc-400 uppercase tracking-widest">sec</span>
                 </div>
             </div>

          </div>

          {/* Bottom Controls - Fade in on hover */}
          <div className="absolute bottom-24 flex items-center gap-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-4 group-hover:translate-y-0 ease-out">
             
             {/* Reset button */}
             <button 
                onClick={resetTimer}
                className="p-4 rounded-full text-[var(--text-secondary)] hover:text-white hover:bg-white/5 transition-all"
                title="Reset to 25 min"
             >
                <RotateCw size={24} />
             </button>

             {/* Play/Pause button */}
             <button 
                onClick={toggleTimer}
                disabled={timerState === 'COMPLETED'}
                className={clsx(
                  "w-20 h-20 flex items-center justify-center rounded-full transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]",
                  timerState === 'COMPLETED' 
                    ? "bg-green-500 text-white cursor-default"
                    : "bg-white text-black hover:scale-110 active:scale-95"
                )}
             >
                {timerState === 'RUNNING' ? (
                  <Pause size={32} fill="currentColor" />
                ) : timerState === 'COMPLETED' ? (
                  <CheckCircle2 size={32} />
                ) : (
                  <Play size={32} fill="currentColor" className="ml-1" />
                )}
             </button>

             {/* Cancel button (when running/paused) */}
             {(timerState === 'RUNNING' || timerState === 'PAUSED') && (
               <button
                  onClick={cancelTimer}
                  className="p-4 rounded-full text-[var(--text-secondary)] hover:text-red-400 hover:bg-white/5 transition-all"
                  title="Cancel"
               >
                  <Square size={24} />
               </button>
             )}

             {/* Complete block button */}
             {currentBlock && timerState !== 'RUNNING' && timerState !== 'PAUSED' && (
                <button
                    onClick={() => {
                        onComplete(currentBlock.id);
                        onClose();
                    }}
                    className={clsx(
                        "p-4 rounded-full transition-all",
                        currentBlock.done 
                             ? "text-green-500 bg-green-500/10"
                             : "text-[var(--text-secondary)] hover:text-green-400 hover:bg-white/5"
                    )}
                    title="Mark Complete"
                >
                    <CheckCircle2 size={24} />
                </button>
            )}
          </div>
          
      </div>
    </div>
  );
}
