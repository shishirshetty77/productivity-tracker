export interface Habit {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  goalFrequency: number;
  type: 'POSITIVE' | 'ABSTINENCE';
  createdAt: string;
}

export interface HabitLog {
  id: string;
  date: string;
  value: number;
  habitId: string;
}

export type Day = {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    completed: boolean;
    createdAt: string;
    updatedAt: string;
    timeBlocks: TimeBlock[];
    sleepTime?: string | null;
    wakeTime?: string | null;
    sleepDuration?: number | null;
    sleepQuality?: SleepQuality | null;
};

export type TimeBlock = {
    id: string;
    startTime: string;
    endTime: string;
    done: boolean;
    skipped: boolean;
    activity: string;
    dayId: string;
    createdAt: string;
    updatedAt: string;
    rating?: BlockRating | null;
};

export type SleepQuality = 'DEEP' | 'GOOD' | 'LIGHT' | 'RESTLESS' | 'POOR';
export type BlockRating = 'PRODUCTIVE' | 'MODERATE' | 'DISTRACTED';
