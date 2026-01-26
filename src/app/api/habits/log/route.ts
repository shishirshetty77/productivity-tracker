import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { habitId, date, value } = await req.json();
    
    // Check ownership
    const habit = await prisma.habit.findUnique({ where: { id: habitId } });
    if (!habit || habit.userId !== session.userId) {
        return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }

    // Upsert log (if exists update, else create)
    const log = await prisma.habitLog.upsert({
      where: {
        habitId_date: {
          habitId,
          date
        }
      },
      update: {
        value: value || 1
      },
      create: {
        habitId,
        date,
        value: value || 1
      }
    });
    
    return NextResponse.json(log);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to log habit' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
    const session = await getSession();
    if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
    try {
      const { searchParams } = new URL(req.url);
      const habitId = searchParams.get('habitId');
      const date = searchParams.get('date');

      if (!habitId || !date) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

      // Check ownership handled by where clause matching habit.userId? 
      // Actually easier to query log first or use deleteMany with habit ownership check
      
      const count = await prisma.habitLog.deleteMany({
        where: {
            habitId,
            date,
            habit: {
                userId: session.userId as string
            }
        }
      });
      
      return NextResponse.json({ success: true, count });
    } catch (error) {
      return NextResponse.json({ error: 'Failed to remove log' }, { status: 500 });
    }
  }
