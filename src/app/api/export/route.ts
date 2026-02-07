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

    // Compute aggregate metrics for LLM-friendly summary
    const totalDays = days.length;
    const completedDays = days.filter((d: { completed: boolean }) => d.completed).length;

    const allBlocks = days.flatMap((d: { timeBlocks: { done: boolean; skipped: boolean; rating: string | null }[] }) => d.timeBlocks);
    const totalBlocks = allBlocks.length;
    const doneBlocks = allBlocks.filter((b: { done: boolean }) => b.done).length;
    const skippedBlocks = allBlocks.filter((b: { skipped: boolean }) => b.skipped).length;
    const productiveBlocks = allBlocks.filter((b: { rating: string | null }) => b.rating === 'PRODUCTIVE').length;
    const distractedBlocks = allBlocks.filter((b: { rating: string | null }) => b.rating === 'DISTRACTED').length;

    const sleepDays = days.filter((d: { sleepDuration: number | null }) => d.sleepDuration != null && d.sleepDuration > 0);
    const avgSleep = sleepDays.length > 0
      ? Math.round((sleepDays.reduce((sum: number, d: { sleepDuration: number | null }) => sum + (d.sleepDuration ?? 0), 0) / sleepDays.length) * 10) / 10
      : null;

    const weightDays = days.filter((d: { weight: number | null }) => d.weight != null && d.weight > 0);
    const weightValues = weightDays.map((d: { weight: number | null }) => d.weight as number);
    const weightSummary = weightValues.length > 0 ? {
      current: weightValues[weightValues.length - 1],
      start: weightValues[0],
      min: Math.min(...weightValues),
      max: Math.max(...weightValues),
      average: Math.round((weightValues.reduce((a: number, b: number) => a + b, 0) / weightValues.length) * 10) / 10,
      total_change: Math.round((weightValues[weightValues.length - 1] - weightValues[0]) * 10) / 10,
      entries: weightValues.length,
      unit: 'kg',
    } : null;

    // JSON format (LLM-friendly structure) - includes ALL data + summary
    const jsonData = {
      summary: {
        exported_at: new Date().toISOString(),
        total_days_tracked: totalDays,
        days_completed: completedDays,
        completion_rate: totalDays > 0 ? `${Math.round((completedDays / totalDays) * 100)}%` : '0%',
        total_time_blocks: totalBlocks,
        blocks_done: doneBlocks,
        blocks_skipped: skippedBlocks,
        productivity_rate: totalBlocks > 0 ? `${Math.round((doneBlocks / totalBlocks) * 100)}%` : '0%',
        productive_blocks: productiveBlocks,
        distracted_blocks: distractedBlocks,
        avg_sleep_hours: avgSleep,
        weight: weightSummary,
        total_habits: habits.length,
      },
      habits: habits.map((h: { name: string; description: string | null; color: string; icon: string; type: string; goalFrequency: number; createdAt: Date; logs: { date: string; value: number }[] }) => ({
        name: h.name,
        description: h.description,
        color: h.color,
        icon: h.icon,
        type: h.type,
        goal_frequency: h.goalFrequency,
        created_at: h.createdAt,
        logs: h.logs.map((l: { date: string; value: number }) => ({ date: l.date, value: l.value }))
      })),
      days: days.map((day: { date: string; startTime: string; endTime: string; completed: boolean; sleepTime: string | null; wakeTime: string | null; sleepDuration: number | null; sleepQuality: string | null; weight: number | null; timeBlocks: { startTime: string; endTime: string; done: boolean; skipped: boolean; activity: string; rating: string | null }[] }) => ({
      date: day.date,
      day_window: `${day.startTime}-${day.endTime}`,
      completed: day.completed,
      sleep: {
        bedTime: day.sleepTime ?? null,
        wakeTime: day.wakeTime ?? null,
        duration: day.sleepDuration ?? null,
        quality: day.sleepQuality ?? null,
      },
      weight_kg: day.weight ?? null,
      intervals: day.timeBlocks.map((block: { startTime: string; endTime: string; done: boolean; skipped: boolean; activity: string; rating: string | null }) => ({
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
  weight: number | null;
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

    // Weight data
    if (day.weight) {
      markdown += `\n### ⚖️ Weight\n\n`;
      markdown += `- Weight: ${day.weight} kg\n`;
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
