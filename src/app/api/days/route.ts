import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateTimeBlocks } from '@/lib/utils';
import { getSession } from '@/lib/session';

// GET /api/days - Get all days for the logged-in user
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const days = await prisma.day.findMany({
      where: {
        userId: session.userId as string
      },
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
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { date, startTime, endTime } = body;

    if (!date || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'date, startTime, and endTime are required' },
        { status: 400 }
      );
    }

    // Check if day already exists for THIS user
    const existingDay = await prisma.day.findFirst({
      where: { 
        date,
        userId: session.userId as string
      },
    });

    if (existingDay) {
      return NextResponse.json(
        { error: 'A day with this date already exists' },
        { status: 409 }
      );
    }

    // Generate time blocks
    const blocks = generateTimeBlocks(startTime, endTime);

    // Create day with time blocks linked to user
    const day = await prisma.day.create({
      data: {
        date,
        startTime,
        endTime,
        userId: session.userId as string,
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
