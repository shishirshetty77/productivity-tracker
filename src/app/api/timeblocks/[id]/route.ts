import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT /api/timeblocks/[id] - Update a time block
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { done, skipped, activity } = body;

    // Verify ownership by checking if the block belongs to a day owned by the user
    const existingBlock = await prisma.timeBlock.findFirst({
      where: { 
        id,
        day: {
            userId: session.userId
        }
      },
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
