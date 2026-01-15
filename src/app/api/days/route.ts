import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateTimeBlocks } from '@/lib/utils';

// GET /api/days - Get all days
export async function GET() {
  try {
    const days = await prisma.day.findMany({
      include: {
        timeBlocks: {
          orderBy: { startTime: 'asc' },
        },
      },
      orderBy: { date: 'desc' },
    });
    return NextResponse.json(days);
  } catch (error) {
    console.error('Error fetching days:', error);
    return NextResponse.json({ error: 'Failed to fetch days' }, { status: 500 });
  }
}

// POST /api/days - Create a new day with time blocks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, startTime, endTime } = body;

    if (!date || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'date, startTime, and endTime are required' },
        { status: 400 }
      );
    }

    // Check if day already exists
    const existingDay = await prisma.day.findUnique({
      where: { date },
    });

    if (existingDay) {
      return NextResponse.json(
        { error: 'A day with this date already exists' },
        { status: 409 }
      );
    }

    // Generate time blocks
    const blocks = generateTimeBlocks(startTime, endTime);

    // Create day with time blocks
    const day = await prisma.day.create({
      data: {
        date,
        startTime,
        endTime,
        timeBlocks: {
          create: blocks.map((block) => ({
            startTime: block.startTime,
            endTime: block.endTime,
          })),
        },
      },
      include: {
        timeBlocks: {
          orderBy: { startTime: 'asc' },
        },
      },
    });

    return NextResponse.json(day, { status: 201 });
  } catch (error) {
    console.error('Error creating day:', error);
    return NextResponse.json({ error: 'Failed to create day' }, { status: 500 });
  }
}
