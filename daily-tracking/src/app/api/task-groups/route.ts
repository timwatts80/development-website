import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { taskGroups, tasks } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { parseLocalDate, localDateToUTC, utcDateToLocal } from '@/utils/dateUtils'

export const dynamic = 'force-dynamic'

export async function GET() {

  try {
    const groups = await db
      .select()
      .from(taskGroups)
      .orderBy(taskGroups.createdAt)

    // Fetch tasks for each group and convert UTC dates back to local dates
    const groupsWithTasks = await Promise.all(
      groups.map(async (group) => {
        const groupTasks = await db
          .select()
          .from(tasks)
          .where(eq(tasks.groupId, group.id))
          .orderBy(tasks.createdAt)

        return {
          ...group,
          // Convert UTC startDate back to local date for client
          startDate: utcDateToLocal(group.startDate),
          tasks: groupTasks
        }
      })
    )

    return NextResponse.json(groupsWithTasks)
  } catch (error) {
    console.error('Error fetching task groups:', error)
    return NextResponse.json({ error: 'Failed to fetch task groups' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, color, duration, startDate, tasks: taskList } = body

    // Parse the startDate as a local date, then convert to UTC for database storage
    const localStartDate = typeof startDate === 'string' ? parseLocalDate(startDate) : new Date(startDate)
    const utcStartDate = localDateToUTC(localStartDate)

    console.log('📅 API: Creating task group with startDate:', {
      rawStartDate: startDate,
      localStartDate: localStartDate.toISOString(),
      utcStartDate: utcStartDate.toISOString()
    })

    // Create task group
    const [newGroup] = await db
      .insert(taskGroups)
      .values({
        name,
        color,
        duration,
        startDate: utcStartDate
      })
      .returning()

    // Create tasks for the group
    const newTasks = []
    if (taskList && taskList.length > 0) {
      const insertedTasks = await db
        .insert(tasks)
        .values(
          taskList.map((task: { text: string; completed?: boolean }) => ({
            groupId: newGroup.id,
            text: task.text,
            completed: task.completed || false
          }))
        )
        .returning()
      
      newTasks.push(...insertedTasks)
    }

    return NextResponse.json({
      ...newGroup,
      // Convert UTC startDate back to local date for client
      startDate: utcDateToLocal(newGroup.startDate),
      tasks: newTasks
    })
  } catch (error) {
    console.error('Error creating task group:', error)
    return NextResponse.json({ error: 'Failed to create task group' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, color, duration, startDate, tasks: taskList } = body

    // Parse the startDate as a local date, then convert to UTC for database storage
    const localStartDate = typeof startDate === 'string' ? parseLocalDate(startDate) : new Date(startDate)
    const utcStartDate = localDateToUTC(localStartDate)

    // Update task group
    const [updatedGroup] = await db
      .update(taskGroups)
      .set({
        name,
        color,
        duration,
        startDate: utcStartDate,
        updatedAt: new Date()
      })
      .where(eq(taskGroups.id, id))
      .returning()

    // Delete existing tasks and create new ones
    await db.delete(tasks).where(eq(tasks.groupId, id))
    
    const newTasks = []
    if (taskList && taskList.length > 0) {
      const insertedTasks = await db
        .insert(tasks)
        .values(
          taskList.map((task: { text: string; completed?: boolean }) => ({
            groupId: id,
            text: task.text,
            completed: task.completed || false
          }))
        )
        .returning()
      
      newTasks.push(...insertedTasks)
    }

    return NextResponse.json({
      ...updatedGroup,
      // Convert UTC startDate back to local date for client
      startDate: utcDateToLocal(updatedGroup.startDate),
      tasks: newTasks
    })
  } catch (error) {
    console.error('Error updating task group:', error)
    return NextResponse.json({ error: 'Failed to update task group' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Task group ID is required' }, { status: 400 })
    }

    // Delete task group (tasks will be deleted automatically due to cascade)
    await db.delete(taskGroups).where(eq(taskGroups.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting task group:', error)
    return NextResponse.json({ error: 'Failed to delete task group' }, { status: 500 })
  }
}
