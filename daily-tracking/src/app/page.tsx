'use client'

import React, { useState, useEffect } from 'react'
import { CheckCircle, Circle, Target, Calendar, TrendingUp, Users, Edit2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import TaskGroupDialog from '@/components/TaskGroupDialog'
import CalendarDialog from '@/components/CalendarDialog'
import TaskLoadingSpinner from '@/components/TaskLoadingSpinner'
import { DatabaseService, TaskGroup, Task } from '@/services/database'

export default function DailyTracker() {
  const [taskGroups, setTaskGroups] = useState<TaskGroup[]>([])
  const [isTaskGroupDialogOpen, setIsTaskGroupDialogOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<TaskGroup | null>(null)
  const [taskCompletionState, setTaskCompletionState] = useState<{[key: string]: boolean}>({})
  const [isCalendarDialogOpen, setIsCalendarDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingCompletions, setIsLoadingCompletions] = useState(true)
  const [migrationCompleted, setMigrationCompleted] = useState(false)
  const [dataFullyLoaded, setDataFullyLoaded] = useState(false)

  // Global error handler for unhandled promise rejections
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason)
      event.preventDefault()
    }

    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error)
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', handleUnhandledRejection)
      window.addEventListener('error', handleError)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('unhandledrejection', handleUnhandledRejection)
        window.removeEventListener('error', handleError)
      }
    }
  }, [])

  // Load data from database on component mount
  useEffect(() => {
    const loadData = async () => {
      console.log('🔄 Starting data load...', {
        selectedDate: selectedDate.toISOString(),
        migrationCompleted,
        isLoading,
        isLoadingCompletions,
        dataFullyLoaded
      })
      
      const timeoutController = new AbortController()
      const timeoutId = setTimeout(() => timeoutController.abort(), 10000) // 10 second timeout
      
      try {
        setIsLoading(true)
        setIsLoadingCompletions(true)
        setDataFullyLoaded(false)
        
        console.log('📊 Loading states set to true')
        
        // Check if we need to migrate from localStorage
        const hasLocalData = localStorage.getItem('dailyTracker_taskGroups')
        if (hasLocalData && !migrationCompleted) {
          console.log('🔄 Migrating data from localStorage to database...')
          await Promise.race([
            DatabaseService.migrateFromLocalStorage(),
            new Promise((_, reject) => 
              timeoutController.signal.addEventListener('abort', () => 
                reject(new Error('Migration timeout'))
              )
            )
          ])
          setMigrationCompleted(true)
          // Clear localStorage after successful migration
          localStorage.removeItem('dailyTracker_taskGroups')
          localStorage.removeItem('dailyTracker_completionState')
          console.log('✅ Migration completed')
        }

        console.log('🔄 Loading task groups and completions in parallel...')
        
        // Load both task groups and completions in parallel, but wait for both
        const [groups, completions] = await Promise.all([
          Promise.race([
            DatabaseService.getTaskGroups(),
            new Promise((_, reject) => 
              timeoutController.signal.addEventListener('abort', () => 
                reject(new Error('Task groups loading timeout'))
              )
            )
          ]) as Promise<TaskGroup[]>,
          Promise.race([
            fetch(`/api/task-completions/?date=${encodeURIComponent(selectedDate.toISOString())}`).then(res => res.json()),
            new Promise<never>((_, reject) => 
              timeoutController.signal.addEventListener('abort', () => 
                reject(new Error('Task completions loading timeout'))
              )
            )
          ]) as Promise<Array<{taskId: string, completed: boolean}>>
        ])

        console.log('📊 Data loaded:', {
          groupsCount: groups.length,
          completionsCount: completions.length,
          completions: completions
        })

        // Process the data
        setTaskGroups(groups)
        console.log('✅ Task groups set:', groups.length)
        
        const completionMap: {[key: string]: boolean} = {}
        completions.forEach(completion => {
          completionMap[completion.taskId] = completion.completed
        })
        setTaskCompletionState(completionMap)
        console.log('✅ Completion state set:', completionMap)
        
        // Only after both are processed, mark as fully loaded
        setIsLoading(false)
        setIsLoadingCompletions(false)
        setDataFullyLoaded(true)
        console.log('🎉 All data fully loaded!')
        clearTimeout(timeoutId)
        
      } catch (error) {
        console.error('❌ Failed to load data:', error)
        clearTimeout(timeoutId) // Clean up timeout
        
        // Fallback to localStorage if database fails or times out
        const savedGroups = localStorage.getItem('dailyTracker_taskGroups')
        const savedCompletionState = localStorage.getItem('dailyTracker_completionState')
        
        console.log('🔄 Falling back to localStorage...', {
          hasGroups: !!savedGroups,
          hasCompletionState: !!savedCompletionState
        })
        
        if (savedGroups) {
          try {
            const parsedGroups = JSON.parse(savedGroups)
            const groupsWithDates = parsedGroups.map((group: {
              id: string;
              name: string;
              color: string;
              duration: number;
              startDate: string;
              createdAt: string;
              tasks: Task[];
            }) => ({
              ...group,
              startDate: new Date(group.startDate),
              createdAt: new Date(group.createdAt)
            }))
            setTaskGroups(groupsWithDates)
            console.log('✅ Restored groups from localStorage:', groupsWithDates.length)
          } catch (error) {
            console.error('❌ Failed to parse saved task groups:', error)
          }
        }
        
        if (savedCompletionState) {
          try {
            const parsedState = JSON.parse(savedCompletionState)
            setTaskCompletionState(parsedState)
            console.log('✅ Restored completion state from localStorage:', parsedState)
          } catch (error) {
            console.error('❌ Failed to parse saved completion state:', error)
          }
        }
        
        // Even on error, mark as loaded so UI doesn't hang
        setIsLoading(false)
        setIsLoadingCompletions(false)
        setDataFullyLoaded(true)
        console.log('⚠️ Data loading completed with errors, but UI unlocked')
      } finally {
        // Ensure loading states are always cleared
        setIsLoading(false)
        setIsLoadingCompletions(false)
      }
    }

    loadData()
    // Only depend on migrationCompleted, not selectedDate
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [migrationCompleted])

  // Separate effect for loading completions when date changes
  useEffect(() => {
    const loadCompletionsForDate = async () => {
      // Skip if still loading initial data
      if (isLoading || !dataFullyLoaded) {
        console.log('⏳ Skipping completion reload - initial data still loading')
        return
      }
      
      console.log('📅 Date changed, reloading completions for:', selectedDate.toISOString())
      setIsLoadingCompletions(true)
      
      try {
        const completions = await fetch(`/api/task-completions/?date=${encodeURIComponent(selectedDate.toISOString())}`).then(res => res.json())
        
        const completionMap: {[key: string]: boolean} = {}
        completions.forEach((completion: {taskId: string, completed: boolean}) => {
          completionMap[completion.taskId] = completion.completed
        })
        setTaskCompletionState(completionMap)
        console.log('📅 Completions updated for date change:', completionMap)
      } catch (error) {
        console.error('❌ Failed to load completions for date:', error)
      } finally {
        setIsLoadingCompletions(false)
      }
    }

    loadCompletionsForDate()
  }, [selectedDate, isLoading, dataFullyLoaded])

  // Load completions when date changes
  useEffect(() => {
    const loadCompletions = async () => {
      try {
        setIsLoadingCompletions(true)
        setDataFullyLoaded(false)
        const completions = await DatabaseService.getTaskCompletions(selectedDate)
        const completionMap: {[key: string]: boolean} = {}
        completions.forEach(completion => {
          completionMap[completion.taskId] = completion.completed
        })
        setTaskCompletionState(completionMap)
        setDataFullyLoaded(true)
      } catch (error) {
        console.error('Failed to load completions:', error)
        // Even on error, mark as loaded so UI doesn't hang
        setDataFullyLoaded(true)
      } finally {
        setIsLoadingCompletions(false)
      }
    }

    // Load completions whenever we have task groups OR when date changes
    // This ensures completions are always loaded, even if no task groups exist
    if (taskGroups.length > 0 || !isLoading) {
      loadCompletions()
    }
  }, [selectedDate, taskGroups.length, isLoading])

  // Get selected date formatted
  const getSelectedDateFormatted = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }
    return selectedDate.toLocaleDateString('en-US', options)
  }

  // Get tasks from active task groups for a specific date
  const getTasksForDate = (targetDate: Date) => {
    const dateToCheck = new Date(targetDate)
    dateToCheck.setHours(0, 0, 0, 0) // Start of target date

    const activeTasks: Task[] = []

    taskGroups.forEach(group => {
      const startDate = new Date(group.startDate)
      startDate.setHours(0, 0, 0, 0) // Start of start date
      
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + group.duration - 1) // End date of the group
      endDate.setHours(23, 59, 59, 999) // End of end date

      // Check if target date falls within the group's active period
      if (dateToCheck >= startDate && dateToCheck <= endDate) {
        activeTasks.push(...group.tasks)
      }
    })

    return activeTasks
  }

  // Get today's tasks from active task groups
  const getTodaysTasks = () => {
    return getTasksForDate(selectedDate)
  }

  const toggleTask = async (id: string) => {
    const newState = !taskCompletionState[id]
    
    // Update local state immediately for responsiveness
    setTaskCompletionState(prev => ({
      ...prev,
      [id]: newState
    }))
    
    // Update database
    try {
      await DatabaseService.updateTaskCompletion(id, newState, selectedDate)
    } catch (error) {
      console.error('Failed to update task completion:', error)
      // Revert local state on error
      setTaskCompletionState(prev => ({
        ...prev,
        [id]: !newState
      }))
    }
  }

  const handleCreateTaskGroup = async (groupData: {
    name: string
    color: string
    duration: number
    startDate: Date
    tasks: Task[]
  }) => {
    try {
      if (editingGroup) {
        // Update existing group
        const updatedGroup = await DatabaseService.updateTaskGroup({
          ...editingGroup,
          ...groupData
        })
        setTaskGroups(prev => prev.map(group => 
          group.id === editingGroup.id ? updatedGroup : group
        ))
        setEditingGroup(null)
      } else {
        // Create new group
        const newGroup = await DatabaseService.createTaskGroup(groupData)
        setTaskGroups(prev => [...prev, newGroup])
      }
      setIsTaskGroupDialogOpen(false)
    } catch (error) {
      console.error('Failed to save task group:', error)
      // Fallback to localStorage for offline support
      if (editingGroup) {
        setTaskGroups(prev => prev.map(group => 
          group.id === editingGroup.id 
            ? { ...group, ...groupData }
            : group
        ))
        setEditingGroup(null)
      } else {
        const newGroup: TaskGroup = {
          id: Date.now().toString(),
          name: groupData.name,
          color: groupData.color,
          duration: groupData.duration,
          startDate: groupData.startDate,
          tasks: groupData.tasks,
          createdAt: new Date()
        }
        setTaskGroups(prev => [...prev, newGroup])
      }
      setIsTaskGroupDialogOpen(false)
    }
  }

  const handleEditTaskGroup = (group: TaskGroup) => {
    setEditingGroup(group)
    setIsTaskGroupDialogOpen(true)
  }

  const handleDeleteTaskGroup = async (groupId: string) => {
    try {
      await DatabaseService.deleteTaskGroup(groupId)
      setTaskGroups(prev => prev.filter(group => group.id !== groupId))
    } catch (error) {
      console.error('Failed to delete task group:', error)
      // Fallback to local state update
      setTaskGroups(prev => prev.filter(group => group.id !== groupId))
    }
  }

  const handleCloseDialog = () => {
    setIsTaskGroupDialogOpen(false)
    setEditingGroup(null)
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
  }

  const getSelectedDateDisplay = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const selected = new Date(selectedDate)
    selected.setHours(0, 0, 0, 0)
    
    if (selected.getTime() === today.getTime()) {
      return "Today's Tasks"
    } else {
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      }
      return `Tasks for ${selectedDate.toLocaleDateString('en-US', options)}`
    }
  }

  // Show loading state - wait for ALL data to be fully loaded
  if (!dataFullyLoaded || isLoading || isLoadingCompletions) {
    const stage = !dataFullyLoaded && isLoading ? 'task-groups' : 
                  !dataFullyLoaded && isLoadingCompletions ? 'completions' : 
                  'synchronizing'
    
    console.log('⏳ Showing loading spinner:', {
      stage,
      dataFullyLoaded,
      isLoading,
      isLoadingCompletions
    })
    
    return <TaskLoadingSpinner stage={stage} />
  }

  console.log('🎉 Rendering main UI:', {
    taskGroupsCount: taskGroups.length,
    completionStateKeys: Object.keys(taskCompletionState).length,
    completionState: taskCompletionState
  })

  // Get today's tasks from active task groups
  const todaysTasks = getTodaysTasks()
  const completedTasks = todaysTasks.filter(task => taskCompletionState[task.id] || false).length
  const totalTasks = todaysTasks.length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Daily Tracker</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Track your habits, tasks, and goals with ease</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsCalendarDialogOpen(true)} variant="outline" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Calendar
            </Button>
            <Button onClick={() => setIsTaskGroupDialogOpen(true)} className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Create Task Group
            </Button>
          </div>
        </div>

        {/* Top Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:mb-8 md:gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4 md:p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center">
              <Target className="mr-2 md:mr-3 h-6 w-6 md:h-8 md:w-8 text-blue-500" />
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-300">Today&apos;s Progress</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">{completionRate}%</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 md:p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center">
              <Calendar className="mr-2 md:mr-3 h-6 w-6 md:h-8 md:w-8 text-green-500" />
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-300">Completed Tasks</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">{completedTasks}/{totalTasks}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 md:p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center">
              <TrendingUp className="mr-2 md:mr-3 h-6 w-6 md:h-8 md:w-8 text-purple-500" />
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-300">Task Groups</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">{taskGroups.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task list */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{getSelectedDateDisplay()}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{getSelectedDateFormatted()}</p>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-300">{completedTasks}/{totalTasks} completed</span>
              </div>

              {todaysTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-gray-500 dark:text-gray-400">
                  <Target className="h-10 w-10 text-gray-300 dark:text-gray-600" />
                  <p>No active task groups for today. Create a task group to get started.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todaysTasks.map((task) => {
                    const isCompleted = taskCompletionState[task.id] || false
                    return (
                    <div
                      key={task.id}
                      className="flex items-center rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                      <button
                        type="button"
                        aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                        onClick={() => toggleTask(task.id)}
                        className="mr-3 flex-shrink-0"
                      >
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-400 hover:text-green-500" />
                        )}
                      </button>

                      <div className="flex-1">
                        <p className={`font-medium ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                          {task.text}
                        </p>
                        <div className="mt-1 flex items-center">
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              task.type === 'habit'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                            }`}
                          >
                            {task.type}
                          </span>
                        </div>
                      </div>
                    </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Groups */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Task Groups</h3>
                <button
                  onClick={() => setIsTaskGroupDialogOpen(true)}
                  className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <Users className="h-4 w-4" />
                  <span>New</span>
                </button>
              </div>
              {taskGroups.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No groups yet. Click &ldquo;New&rdquo; above to create your first group.</p>
              ) : (
                <div className="space-y-4">
                  {taskGroups.map((group) => (
                    <div key={group.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-600">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="mr-2 h-3 w-3 rounded-full" style={{ backgroundColor: group.color }} />
                          <p className="font-medium text-gray-900 dark:text-white">{group.name}</p>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleEditTaskGroup(group)}
                            className="p-1 text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTaskGroup(group.id)}
                            className="p-1 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">Duration: {group.duration} days</p>
                      <div className="space-y-1">
                        {group.tasks.slice(0, 3).map((task) => (
                          <div key={task.id} className="flex items-center text-sm">
                            {task.completed ? (
                              <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                            ) : (
                              <Circle className="mr-2 h-4 w-4 text-gray-400" />
                            )}
                            <span className={task.completed ? 'line-through text-gray-500' : 'text-gray-700 dark:text-gray-300'}>
                              {task.text}
                            </span>
                          </div>
                        ))}
                        {group.tasks.length > 3 && (
                          <p className="text-xs text-gray-500">+{group.tasks.length - 3} more tasks</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dialog */}
        <TaskGroupDialog
          isOpen={isTaskGroupDialogOpen}
          onClose={handleCloseDialog}
          onSave={handleCreateTaskGroup}
          editingGroup={editingGroup}
        />

        <CalendarDialog
          isOpen={isCalendarDialogOpen}
          onClose={() => setIsCalendarDialogOpen(false)}
          taskGroups={taskGroups}
          onDateSelect={handleDateSelect}
        />
      </div>
    </div>
  )
}
