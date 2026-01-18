/**
 * Generate time blocks for a given time window
 * @param startTime - Start time in HH:MM format
 * @param endTime - End time in HH:MM format
 * @returns Array of time block objects with start and end times
 */
export function generateTimeBlocks(startTime: string, endTime: string): { startTime: string; endTime: string }[] {
  const blocks: { startTime: string; endTime: string }[] = [];
  
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  let currentMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  while (currentMinutes < endMinutes) {
    const blockStart = formatMinutesToTime(currentMinutes);
    const blockEnd = formatMinutesToTime(Math.min(currentMinutes + 30, endMinutes));
    
    blocks.push({
      startTime: blockStart,
      endTime: blockEnd,
    });
    
    currentMinutes += 30;
  }
  
  return blocks;
}

/**
 * Convert minutes since midnight to HH:MM format
 */
export function formatMinutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Format a date string for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDate(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Calculate completion percentage
 */
export function calculateCompletionPercentage(timeBlocks: { done: boolean }[]): number {
  if (timeBlocks.length === 0) return 0;
  const completed = timeBlocks.filter(block => block.done).length;
  return Math.round((completed / timeBlocks.length) * 100);
}

/**
 * Format HH:MM string to 12-hour format with AM/PM
 */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
}
