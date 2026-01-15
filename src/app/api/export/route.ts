import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/export - Export all data in JSON or Markdown format
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    const days = await prisma.day.findMany({
      include: {
        timeBlocks: {
          orderBy: { startTime: 'asc' },
        },
      },
      orderBy: { date: 'asc' },
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

    // JSON format (LLM-friendly structure)
    const jsonData = days.map((day) => ({
      date: day.date,
      day_window: `${day.startTime}-${day.endTime}`,
      completed: day.completed,
      intervals: day.timeBlocks.map((block) => ({
        start: block.startTime,
        end: block.endTime,
        done: block.done,
        activity: block.activity,
      })),
    }));

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
  timeBlocks: {
    startTime: string;
    endTime: string;
    done: boolean;
    activity: string;
  }[];
}

function generateMarkdown(days: DayWithBlocks[]): string {
  let markdown = '# Productivity Log\n\n';

  for (const day of days) {
    markdown += `## Date: ${day.date}\n\n`;
    markdown += `- Day Window: ${day.startTime}–${day.endTime}\n`;
    markdown += `- Day Completed: ${day.completed ? 'Yes' : 'No'}\n\n`;
    markdown += '### Time Blocks\n\n';

    for (const block of day.timeBlocks) {
      const status = block.done ? '✅ Done' : '⬜ Pending';
      const activity = block.activity || '(no activity logged)';
      markdown += `- ${block.startTime}–${block.endTime} | ${status} | ${activity}\n`;
    }

    markdown += '\n---\n\n';
  }

  return markdown;
}
