'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface HabitFormProps {
  onClose: () => void;
  onSave: (habit: { name: string; color: string; icon: string; goalFrequency: number }) => void;
}

const COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#a855f7', // purple
  '#ec4899', // pink
];

const ICONS = ['📝', '🏃', '💧', '🧘', '📚', '💪', '🧠', '🥗', '💤', '🎸', '💻', '🎨', '🚬', '🍬', '🍺', '🎮', '📱'];

export default function HabitForm({ onClose, onSave }: HabitFormProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[5]);
  const [icon, setIcon] = useState(ICONS[13]); // Candy default for abstinence example?
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name, color, icon, goalFrequency: 7 }); // Default 7 for schema compat
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-[var(--bg-secondary)] rounded-2xl p-6 w-full max-w-md border border-[var(--border-primary)] shadow-xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">New Habit</h2>
            <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <X size={20} />
            </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-2">Habit Name</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Read 30 mins"
                    className="w-full px-4 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
                    autoFocus
                />
            </div>

            <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-2">Color & Icon</label>
                <div className="flex gap-4">
                    <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap gap-2">
                            {COLORS.map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setColor(c)}
                                    className={`w-6 h-6 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-white/50' : 'hover:scale-110'}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className="grid grid-cols-6 gap-2">
                            {ICONS.map(i => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => setIcon(i)}
                                    className={`text-lg p-1 rounded hover:bg-[var(--bg-tertiary)] ${icon === i ? 'bg-[var(--bg-tertiary)]' : ''}`}
                                >
                                    {i}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div>
                 <label className="block text-sm text-[var(--text-secondary)] mb-2">Goal: Abstinence</label>
                 <p className="text-xs text-[var(--text-secondary)]">We will track how many days you stay clean from this habit.</p>
            </div>

            <button
                type="submit"
                className="w-full py-2.5 bg-[var(--accent-blue)] hover:bg-[var(--accent-hover)] text-white rounded-lg font-medium transition-colors"
            >
                Start Quitting
            </button>
        </form>
      </div>
    </div>
  );
}
