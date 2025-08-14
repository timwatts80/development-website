import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { taskCompletions } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {

  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    console.log('📅 API: Received completion request for date:', {
      rawDate: date,
      parsedDate: date ? new Date(date).toISOString() : null
    })

    let completions
    if (date) {
      const targetDate = new Date(date)
      targetDate.setHours(0, 0, 0, 0)
      const nextDay = new Date(targetDate)
      nextDay.setDate(nextDay.getDate() + 1)

      console.log('📅 API: Querying database for date range:', {
        targetDate: targetDate.toISOString(),
        nextDay: nextDay.toISOString()
      })

      completions = await db
        .select()
        .from(taskCompletions)
        .where(
          and(
            eq(taskCompletions.completedDate, targetDate)
          )
        )

      console.log('📅 API: Found completions:', {
        count: completions.length,
        completions: completions.map(c => ({
          id: c.id,
          taskId: c.taskId,
          completed: c.completed,
          completedDate: c.completedDate.toISOString()
        }))
      })
    } else {
      completions = await db.select().from(taskCompletions)
    }

    return NextResponse.json(completions)
  } catch (error) {
    console.error('Error fetching task completions:', error)
    return NextResponse.json({ error: 'Failed to fetch task completions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { taskId, completed, date } = body

    const completedDate = new Date(date || new Date())
    completedDate.setHours(0, 0, 0, 0)

    // Check if completion record already exists for this task and date
    const existing = await db
      .select()
      .from(taskCompletions)
      .where(
        and(
          eq(taskCompletions.taskId, taskId),
          eq(taskCompletions.completedDate, completedDate)
        )
      )

    if (existing.length > 0) {
      // Update existing record
      const [updated] = await db
        .update(taskCompletions)
        .set({
          completed,
          createdAt: new Date()
        })
        .where(eq(taskCompletions.id, existing[0].id))
        .returning()

      return NextResponse.json(updated)
    } else {
      // Create new record
      const [newCompletion] = await db
        .insert(taskCompletions)
        .values({
          taskId,
          completed,
          completedDate
        })
        .returning()

      return NextResponse.json(newCompletion)
    }
  } catch (error) {
    console.error('Error updating task completion:', error)
    return NextResponse.json({ error: 'Failed to update task completion' }, { status: 500 })
  }
}
