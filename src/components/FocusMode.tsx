'use client';

import { useState, useEffect } from 'react';
import { X, Play, Pause, RotateCw, CheckCircle2, Maximize2, Minimize2 } from 'lucide-react';
import { TimeBlock } from '@/types';
import { formatTime } from '@/lib/utils';
import { clsx } from 'clsx';

interface FocusModeProps {
  currentBlock: TimeBlock | null;
  onClose: () => void;
  onComplete: (blockId: string) => void;
}

export default function FocusMode({ currentBlock, onClose, onComplete }: FocusModeProps) {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes default
  const [isActive, setIsActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      // Play sound or notification here
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(25 * 60);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[var(--bg-primary)] flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
      {/* Controls */}
      <div className="absolute top-6 right-6 flex items-center gap-4">
        <button 
          onClick={toggleFullscreen}
          className="p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] rounded-full transition-colors"
        >
          {isFullscreen ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
        </button>
        <button 
          onClick={onClose}
          className="p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] rounded-full transition-colors"
        >
          <X size={28} />
        </button>
      </div>

      <div className="max-w-2xl w-full text-center space-y-12">
        {/* Status */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-primary)]">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium uppercase tracking-wider">Focus Mode</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-[var(--text-primary)]">
            {currentBlock?.activity || "No active task"}
          </h1>
          
          {currentBlock && (
             <p className="text-xl text-[var(--text-secondary)] font-mono">
                {currentBlock.startTime} - {currentBlock.endTime}
             </p>
          )}
        </div>

        {/* Timer */}
        <div className="relative group">
            <div className="text-[120px] md:text-[180px] font-bold font-mono text-[var(--text-primary)] leading-none tracking-tighter tabular-nums select-none">
                {formatTimer(timeLeft)}
            </div>
            
            {/* Timer Controls */}
            <div className="flex items-center justify-center gap-6 mt-8">
                <button 
                    onClick={toggleTimer}
                    className="w-16 h-16 flex items-center justify-center rounded-full bg-[var(--accent-blue)] text-white hover:bg-[var(--accent-hover)] transition-transform hover:scale-105 active:scale-95 shadow-lg"
                >
                    {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                </button>
                
                <button 
                    onClick={resetTimer}
                    className="w-12 h-12 flex items-center justify-center rounded-full bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                    <RotateCw size={20} />
                </button>
            </div>
        </div>

        {/* Actions */}
        {currentBlock && (
            <button
                onClick={() => {
                    onComplete(currentBlock.id);
                    onClose();
                }}
                className={clsx(
                    "flex items-center gap-3 px-8 py-4 mx-auto rounded-full text-lg font-medium transition-all duration-300",
                    currentBlock.done 
                        ? "bg-green-500/10 text-green-500 cursor-default"
                        : "bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-green-500 hover:text-white"
                )}
            >
                <CheckCircle2 size={24} />
                {currentBlock.done ? 'Completed' : 'Mark as Complete'}
            </button>
        )}
      </div>
    </div>
  );
}
