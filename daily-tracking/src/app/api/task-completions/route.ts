import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { taskCompletions } from '@/db/schema'
import { eq, and, gte, lte, lt } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {

  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    console.log('📅 API: Received completion request:', {
      singleDate: date,
      dateRange: startDate && endDate ? { startDate, endDate } : null
    })

    let completions
    if (startDate && endDate) {
      // Handle date range query for calendar view
      const start = new Date(startDate)
      start.setUTCHours(0, 0, 0, 0)
      const end = new Date(endDate)
      end.setUTCHours(23, 59, 59, 999)

      console.log('📅 API: Querying database for date range:', {
        startDate: start.toISOString(),
        endDate: end.toISOString()
      })

      completions = await db
        .select()
        .from(taskCompletions)
        .where(
          and(
            gte(taskCompletions.completedDate, start),
            lte(taskCompletions.completedDate, end)
          )
        )

      console.log('📅 API: Found range completions:', {
        count: completions.length,
        dateRange: { start: start.toISOString(), end: end.toISOString() }
      })
    } else if (date) {
      // Handle single date query for daily view
      const targetDate = new Date(date)
      targetDate.setUTCHours(0, 0, 0, 0)
      const nextDay = new Date(targetDate)
      nextDay.setUTCDate(nextDay.getUTCDate() + 1)

      console.log('📅 API: Querying database for single date:', {
        targetDate: targetDate.toISOString(),
        nextDay: nextDay.toISOString()
      })

      completions = await db
        .select()
        .from(taskCompletions)
        .where(
          and(
            gte(taskCompletions.completedDate, targetDate),
            lt(taskCompletions.completedDate, nextDay)
          )
        )

      console.log('📅 API: Found single date completions:', {
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

    // If a date is provided, use it as-is (already converted to UTC by frontend)
    // If no date is provided, create a new UTC date for "today"
    let completedDate: Date
    if (date) {
      completedDate = new Date(date)
    } else {
      completedDate = new Date()
      completedDate.setUTCHours(0, 0, 0, 0)
    }

    console.log('📅 API: Task completion POST request:', {
      taskId,
      completed,
      providedDate: date,
      finalCompletedDate: completedDate.toISOString()
    })

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
