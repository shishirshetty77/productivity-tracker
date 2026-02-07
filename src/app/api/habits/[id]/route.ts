import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const habit = await prisma.habit.findUnique({ where: { id } });
    
    if (!habit || habit.userId !== session.userId) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }

    await prisma.habit.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete habit' }, { status: 500 });
  }
}
