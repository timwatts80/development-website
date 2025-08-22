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
            type: 'task', // Add the required type field
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

    console.log('🔧 PUT: Received update request:', {
      id,
      name,
      color,
      duration,
      startDate,
      taskCount: taskList?.length || 0,
      tasks: taskList?.map((t: any) => ({ id: t.id, text: t.text, hasId: !!t.id })) || []
    })

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

    // Smart task updating to preserve task IDs and completion states
    console.log('🔧 PUT: Starting smart task update for group:', id)
    
    // Get existing tasks for this group
    const existingTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.groupId, id))
    
    console.log('🔧 PUT: Found existing tasks:', existingTasks.length)
    console.log('🔧 PUT: Incoming tasks:', taskList?.length || 0)
    
    const finalTasks = []
    const tasksToDelete = [...existingTasks] // Copy for tracking deletions
    const tasksToCreate = []
    const tasksToUpdate = []
    
    if (taskList && taskList.length > 0) {
      // Process each incoming task
      for (const incomingTask of taskList) {
        // Check if this task has an ID (preserved from client)
        if (incomingTask.id) {
          // Find existing task by ID
          const existingTask = existingTasks.find(t => t.id === incomingTask.id)
          
          if (existingTask) {
            // Task exists - update it if text changed
            if (existingTask.text !== incomingTask.text) {
              tasksToUpdate.push({
                id: existingTask.id,
                text: incomingTask.text
              })
              console.log('🔧 PUT: Will update task:', { id: existingTask.id, oldText: existingTask.text, newText: incomingTask.text })
            } else {
              console.log('🔧 PUT: Task unchanged:', { id: existingTask.id, text: existingTask.text })
            }
            
            // Remove from deletion list (it's being kept)
            const deleteIndex = tasksToDelete.findIndex(t => t.id === existingTask.id)
            if (deleteIndex > -1) {
              tasksToDelete.splice(deleteIndex, 1)
            }
            
            finalTasks.push({
              ...existingTask,
              text: incomingTask.text // Use updated text
            })
          } else {
            // Task has ID but doesn't exist in DB - treat as new task
            tasksToCreate.push({
              groupId: id,
              text: incomingTask.text,
              type: 'task',
              completed: false
            })
            console.log('🔧 PUT: Will create task with specific ID (shouldn\'t happen):', incomingTask.id)
          }
        } else {
          // No ID - this is a new task
          tasksToCreate.push({
            groupId: id,
            text: incomingTask.text,
            type: 'task',
            completed: false
          })
          console.log('🔧 PUT: Will create new task:', incomingTask.text)
        }
      }
    }
    
    console.log('🔧 PUT: Task update summary:', {
      toDelete: tasksToDelete.length,
      toUpdate: tasksToUpdate.length,
      toCreate: tasksToCreate.length
    })
    
    // Execute database operations
    
    // 1. Delete removed tasks
    if (tasksToDelete.length > 0) {
      for (const taskToDelete of tasksToDelete) {
        await db.delete(tasks).where(eq(tasks.id, taskToDelete.id))
        console.log('🔧 PUT: Deleted task:', { id: taskToDelete.id, text: taskToDelete.text })
      }
    }
    
    // 2. Update existing tasks
    if (tasksToUpdate.length > 0) {
      for (const taskUpdate of tasksToUpdate) {
        const [updatedTask] = await db
          .update(tasks)
          .set({ text: taskUpdate.text })
          .where(eq(tasks.id, taskUpdate.id))
          .returning()
        
        console.log('🔧 PUT: Updated task:', updatedTask)
        
        // Update finalTasks with the actual updated task
        const finalIndex: number = finalTasks.findIndex(t => t.id === taskUpdate.id)
        if (finalIndex > -1) {
          finalTasks[finalIndex] = updatedTask
        }
      }
    }
    
    // 3. Create new tasks
    if (tasksToCreate.length > 0) {
      const createdTasks = await db
        .insert(tasks)
        .values(tasksToCreate)
        .returning()
      
      console.log('🔧 PUT: Created tasks:', createdTasks.length)
      finalTasks.push(...createdTasks)
    }
    
    const newTasks = finalTasks

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
