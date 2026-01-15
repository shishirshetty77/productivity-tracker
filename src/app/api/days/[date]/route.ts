import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateTimeBlocks } from '@/lib/utils';

interface RouteParams {
  params: Promise<{ date: string }>;
}

// GET /api/days/[date] - Get a specific day
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { date } = await params;
    
    const day = await prisma.day.findUnique({
      where: { date },
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
  try {
    const { date } = await params;
    const body = await request.json();
    const { startTime, endTime, completed } = body;

    const existingDay = await prisma.day.findUnique({
      where: { date },
      include: { timeBlocks: true },
    });

    if (!existingDay) {
      return NextResponse.json({ error: 'Day not found' }, { status: 404 });
    }

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
        where: { date },
        data: {
          startTime: newStartTime,
          endTime: newEndTime,
          completed: completed ?? existingDay.completed,
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

    // Just update completed status
    const day = await prisma.day.update({
      where: { date },
      data: {
        completed: completed ?? existingDay.completed,
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
  try {
    const { date } = await params;

    const existingDay = await prisma.day.findUnique({
      where: { date },
    });

    if (!existingDay) {
      return NextResponse.json({ error: 'Day not found' }, { status: 404 });
    }

    await prisma.day.delete({
      where: { date },
    });

    return NextResponse.json({ message: 'Day deleted successfully' });
  } catch (error) {
    console.error('Error deleting day:', error);
    return NextResponse.json({ error: 'Failed to delete day' }, { status: 500 });
  }
}
