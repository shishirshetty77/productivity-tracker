import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

// GET /api/export - Export all data in JSON or Markdown format
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    const days = await prisma.day.findMany({
      where: {
        userId: session.userId as string
      },
      include: {
        timeBlocks: {
          orderBy: { startTime: 'asc' },
        },
      },
      orderBy: { date: 'asc' },
    });

    const habits = await prisma.habit.findMany({
        where: { userId: session.userId as string },
        include: {
            logs: { orderBy: { date: 'asc' } }
        }
    });

    if (format === 'markdown') {
      const markdown = generateMarkdown(days);
      return new NextResponse(markdown, {
        headers: {
          'Content-Type': 'text/markdown',
          'Content-Disposition': 'attachment; filename="productivity-log.md"',
        },
      });
    }

    // JSON format (LLM-friendly structure) - includes ALL data
    const jsonData = {
      habits: habits.map((h: { name: string; type: string; goalFrequency: number; logs: { date: string; value: number }[] }) => ({
        name: h.name,
        type: h.type,
        goal_frequency: h.goalFrequency,
        logs: h.logs.map((l: { date: string; value: number }) => ({ date: l.date, value: l.value }))
      })),
      days: days.map((day: { date: string; startTime: string; endTime: string; completed: boolean; sleepTime?: string; wakeTime?: string; sleepDuration?: number; sleepQuality?: string; timeBlocks: { startTime: string; endTime: string; done: boolean; skipped: boolean; activity: string; rating?: string }[] }) => ({
      date: day.date,
      day_window: `${day.startTime}-${day.endTime}`,
      completed: day.completed,
      // Sleep tracking data
      sleep: {
        bedTime: day.sleepTime || null,
        wakeTime: day.wakeTime || null,
        duration: day.sleepDuration || null,
        quality: day.sleepQuality || null,
      },
      intervals: day.timeBlocks.map((block: { startTime: string; endTime: string; done: boolean; skipped: boolean; activity: string; rating: string }) => ({
        start: block.startTime,
        end: block.endTime,
        done: block.done,
        skipped: block.skipped,
        activity: block.activity,
        rating: block.rating,
      })),
    }))
    };

    return new NextResponse(JSON.stringify(jsonData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="productivity-log.json"',
      },
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}

interface DayWithBlocks {
  date: string;
  startTime: string;
  endTime: string;
  completed: boolean;
  sleepTime: string | null;
  wakeTime: string | null;
  sleepDuration: number | null;
  sleepQuality: string | null;
  timeBlocks: {
    startTime: string;
    endTime: string;
    done: boolean;
    skipped: boolean;
    activity: string;
    rating?: string | null;
  }[];
}

function generateMarkdown(days: DayWithBlocks[]): string {
  let markdown = '# Productivity Log\n\n';

  // Helper map for rating formatting
  const RATING_MAP: Record<string, string> = {
    'PRODUCTIVE': '🟢 Productive',
    'MODERATE': '🟡 Moderate',
    'DISTRACTED': '🔴 Distracted'
  };

  for (const day of days) {
    markdown += `## Date: ${day.date}\n\n`;
    markdown += `- Day Window: ${day.startTime}–${day.endTime}\n`;
    markdown += `- Day Completed: ${day.completed ? 'Yes' : 'No'}\n`;
    
    // Sleep data
    if (day.sleepTime || day.wakeTime || day.sleepDuration || day.sleepQuality) {
      markdown += `\n### 😴 Sleep Data\n\n`;
      if (day.sleepTime) markdown += `- Bedtime: ${day.sleepTime}\n`;
      if (day.wakeTime) markdown += `- Wake Time: ${day.wakeTime}\n`;
      if (day.sleepDuration) markdown += `- Duration: ${day.sleepDuration} hours\n`;
      if (day.sleepQuality) markdown += `- Quality: ${day.sleepQuality}\n`;
    }
    
    markdown += `\n### Time Blocks\n\n`;

    // Table Header
    markdown += `| Time | Status | Rating | Activity |\n`;
    markdown += `|------|--------|--------|----------|\n`;

    for (const block of day.timeBlocks) {
      const status = block.done ? '✅ Done' : block.skipped ? '⏭️ Skipped' : '⬜ Pending';
      // Format rating with emoji or empty dash
      const rating = block.rating ? (RATING_MAP[block.rating] || block.rating) : '-';
      const activity = block.activity ? block.activity.replace(/\|/g, '-') : ''; // Escape pipe chars in activity

      markdown += `| ${block.startTime}–${block.endTime} | ${status} | ${rating} | ${activity} |\n`;
    }

    markdown += '\n---\n\n';
  }

  return markdown;
}
