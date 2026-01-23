export interface TimeBlock {
  id: string;
  startTime: string;
  endTime: string;
  done: boolean;
  skipped: boolean;
  activity: string;
  dayId: string;
  rating?: BlockRating | null;
}

export type BlockRating = 'PRODUCTIVE' | 'MODERATE' | 'DISTRACTED';

export interface Day {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  completed: boolean;
  timeBlocks: TimeBlock[];
  // Sleep tracking
  sleepTime?: string | null;
  wakeTime?: string | null;
  sleepDuration?: number | null;
  sleepQuality?: SleepQuality | null;
}

export type SleepQuality = 'GOOD' | 'DEEP' | 'LIGHT' | 'RESTLESS' | 'POOR';

export interface CreateDayRequest {
  date: string;
  startTime: string;
  endTime: string;
  // Sleep tracking (optional)
  sleepTime?: string;
  wakeTime?: string;
  sleepDuration?: number;
  sleepQuality?: SleepQuality;
}

export interface UpdateDayRequest {
  startTime?: string;
  endTime?: string;
  completed?: boolean;
  // Sleep tracking (optional)
  sleepTime?: string | null;
  wakeTime?: string | null;
  sleepDuration?: number | null;
  sleepQuality?: SleepQuality | null;
}

export interface UpdateTimeBlockRequest {
  done?: boolean;
  skipped?: boolean;
  activity?: string;
  rating?: BlockRating | null;
}

export type ExportFormat = 'json' | 'markdown';
