import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateTimeBlocks } from '@/lib/utils';
import { getSession } from '@/lib/session';

interface RouteParams {
  params: Promise<{ date: string }>;
}

// GET /api/days/[date] - Get a specific day
export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { date } = await params;
    
    // Check ownership
    const day = await prisma.day.findFirst({
      where: { 
        date,
        userId: session.userId as string
      },
      include: {
        timeBlocks: {
          orderBy: { startTime: 'asc' },
        },
      },
    });

    if (!day) {
      return NextResponse.json({ error: 'Day not found' }, { status: 404 });
    }

    return NextResponse.json(day);
  } catch (error) {
    console.error('Error fetching day:', error);
    return NextResponse.json({ error: 'Failed to fetch day' }, { status: 500 });
  }
}

// PUT /api/days/[date] - Update a day
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { date } = await params;
    const body = await request.json();
    const { startTime, endTime, completed, sleepTime, wakeTime, sleepDuration, sleepQuality, weight, calories } = body;

    const existingDay = await prisma.day.findFirst({
      where: { 
        date,
        userId: session.userId as string
      },
      include: { timeBlocks: true },
    });

    if (!existingDay) {
      return NextResponse.json({ error: 'Day not found' }, { status: 404 });
    }

    // Build sleep data update object (only include if explicitly provided)
    const sleepDataUpdate: Record<string, string | number | null | undefined> = {};
    if (sleepTime !== undefined) sleepDataUpdate.sleepTime = sleepTime;
    if (wakeTime !== undefined) sleepDataUpdate.wakeTime = wakeTime;
    if (sleepDuration !== undefined) sleepDataUpdate.sleepDuration = sleepDuration;
    if (sleepQuality !== undefined) sleepDataUpdate.sleepQuality = sleepQuality;
    if (weight !== undefined) sleepDataUpdate.weight = weight != null ? parseFloat(weight) : null;
    if (calories !== undefined) sleepDataUpdate.calories = calories != null ? parseInt(String(calories)) : null;

    // If time window changed, regenerate time blocks
    const timeWindowChanged =
      (startTime && startTime !== existingDay.startTime) ||
      (endTime && endTime !== existingDay.endTime);

    if (timeWindowChanged) {
      const newStartTime = startTime || existingDay.startTime;
      const newEndTime = endTime || existingDay.endTime;
      const blocks = generateTimeBlocks(newStartTime, newEndTime);

      // Delete existing blocks and create new ones
      await prisma.timeBlock.deleteMany({
        where: { dayId: existingDay.id },
      });

      const day = await prisma.day.update({
        where: { id: existingDay.id }, // Use ID for update safety
        data: {
          startTime: newStartTime,
          endTime: newEndTime,
          completed: completed ?? existingDay.completed,
          ...sleepDataUpdate,
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

      return NextResponse.json(day);
    }

    // Just update completed status and/or sleep data
    const day = await prisma.day.update({
      where: { id: existingDay.id },
      data: {
        completed: completed ?? existingDay.completed,
        ...sleepDataUpdate,
      },
      include: {
        timeBlocks: {
          orderBy: { startTime: 'asc' },
        },
      },
    });

    return NextResponse.json(day);
  } catch (error) {
    console.error('Error updating day:', error);
    return NextResponse.json({ error: 'Failed to update day' }, { status: 500 });
  }
}

// DELETE /api/days/[date] - Delete a day
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { date } = await params;

    const existingDay = await prisma.day.findFirst({
      where: { 
        date,
        userId: session.userId as string
      },
    });

    if (!existingDay) {
      return NextResponse.json({ error: 'Day not found' }, { status: 404 });
    }

    await prisma.day.delete({
      where: { id: existingDay.id },
    });

    return NextResponse.json({ message: 'Day deleted successfully' });
  } catch (error) {
    console.error('Error deleting day:', error);
    return NextResponse.json({ error: 'Failed to delete day' }, { status: 500 });
  }
}
