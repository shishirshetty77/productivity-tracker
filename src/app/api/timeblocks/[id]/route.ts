import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT /api/timeblocks/[id] - Update a time block
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { done, skipped, activity } = body;

    const existingBlock = await prisma.timeBlock.findUnique({
      where: { id },
    });

    if (!existingBlock) {
      return NextResponse.json({ error: 'Time block not found' }, { status: 404 });
    }

    const updatedBlock = await prisma.timeBlock.update({
      where: { id },
      data: {
        done: done ?? existingBlock.done,
        skipped: skipped ?? existingBlock.skipped,
        activity: activity ?? existingBlock.activity,
      },
    });

    return NextResponse.json(updatedBlock);
  } catch (error) {
    console.error('Error updating time block:', error);
    return NextResponse.json({ error: 'Failed to update time block' }, { status: 500 });
  }
}
