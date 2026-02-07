import { NextRequest, NextResponse } from 'next/server';
// NextRequest used only in POST
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const habits = await prisma.habit.findMany({
      where: { userId: session.userId as string },
      include: {
        logs: {
            orderBy: { date: 'desc' },
            take: 365 // Get last year of logs
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(habits);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch habits' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { name, description, color, icon, goalFrequency } = await req.json();
    
    const habit = await prisma.habit.create({
      data: {
        name,
        description,
        color: color || '#3b82f6',
        icon: icon || '📝',
        goalFrequency: goalFrequency || 7,
        userId: session.userId as string
      }
    });
    
    return NextResponse.json(habit);
  } catch {
    return NextResponse.json({ error: 'Failed to create habit' }, { status: 500 });
  }
}
