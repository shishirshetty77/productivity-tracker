"use client";

import { useState, useRef, useEffect } from "react";
import { BlockRating } from "@/types";

// Ratings config with colors and labels
export const RATINGS: {
  value: BlockRating | null;
  label: string;
  color: string;
  dotColor: string;
}[] = [
  {
    value: "PRODUCTIVE",
    label: "Productive",
    color: "text-green-400",
    dotColor: "bg-green-500",
  },
  {
    value: "MODERATE",
    label: "Moderate",
    color: "text-yellow-400",
    dotColor: "bg-yellow-500",
  },
  {
    value: "DISTRACTED",
    label: "Distracted",
    color: "text-red-400",
    dotColor: "bg-red-500",
  },
  {
    value: null,
    label: "Unrated",
    color: "text-[var(--text-secondary)]",
    dotColor:
      "bg-[var(--text-secondary)]/30 border border-[var(--text-secondary)]",
  },
];

interface RatingDropdownProps {
  currentRating?: BlockRating | null;
  onRate: (rating: BlockRating | null) => void;
  disabled?: boolean;
}

export default function RatingDropdown({
  currentRating,
  onRate,
  disabled,
}: RatingDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentConfig =
    RATINGS.find((r) => r.value === currentRating) || RATINGS[3]; // Default to Unrated

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (disabled) {
    return (
      <div
        className={`w-3 h-3 rounded-full ${currentConfig.dotColor} opacity-50`}
      />
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 rounded-md hover:bg-[var(--bg-tertiary)] transition-colors flex items-center gap-2 group"
        title={`Current rating: ${currentConfig.label}`}
      >
        <div
          className={`w-3 h-3 rounded-full ${currentConfig.dotColor} shadow-sm`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-32 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg shadow-xl z-50 overflow-hidden text-xs py-1 animate-in fade-in zoom-in-95 duration-100">
          {RATINGS.map((rating) => (
            <button
              key={rating.label}
              onClick={() => {
                onRate(rating.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 hover:bg-[var(--bg-tertiary)] flex items-center gap-2 transition-colors ${
                currentRating === rating.value
                  ? "bg-[var(--accent-blue)]/10"
                  : ""
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${rating.dotColor}`} />
              <span className={rating.color}>{rating.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
