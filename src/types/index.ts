export interface TimeBlock {
  id: string;
  startTime: string;
  endTime: string;
  done: boolean;
  activity: string;
  dayId: string;
}

export interface Day {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  completed: boolean;
  timeBlocks: TimeBlock[];
}

export interface CreateDayRequest {
  date: string;
  startTime: string;
  endTime: string;
}

export interface UpdateDayRequest {
  startTime?: string;
  endTime?: string;
  completed?: boolean;
}

export interface UpdateTimeBlockRequest {
  done?: boolean;
  activity?: string;
}

export type ExportFormat = 'json' | 'markdown';
