'use client'

import React, { useState, useEffect } from 'react'
import { CheckCircle, Circle, Target, Calendar, TrendingUp, Users, Edit2, Trash2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import TaskGroupDialog from '@/components/TaskGroupDialog'
import CalendarDialog from '@/components/CalendarDialog'
import TaskLoadingSpinner from '@/components/TaskLoadingSpinner'
import { DatabaseService, TaskGroup, Task } from '@/services/database'
import { 
  getLocalToday, 
  normalizeToLocalMidnight, 
  localDateToUTC, 
  utcDateToLocal,
  getLocalMonthRange,
  isSameLocalDay 
} from '@/utils/dateUtils'

export default function DailyTracker() {
  const [taskGroups, setTaskGroups] = useState<TaskGroup[]>([])
  const [isTaskGroupDialogOpen, setIsTaskGroupDialogOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<TaskGroup | null>(null)
  const [taskCompletionState, setTaskCompletionState] = useState<{[key: string]: boolean}>({})
  const [calendarCompletionData, setCalendarCompletionData] = useState<{[key: string]: {[key: string]: boolean}}>({})
  const [loadedDateRange, setLoadedDateRange] = useState<{start: Date | null, end: Date | null}>({start: null, end: null})
  const [completionCache, setCompletionCache] = useState<{[key: string]: {[key: string]: boolean}}>({})
  const [isCalendarDialogOpen, setIsCalendarDialogOpen] = useState(false)
  const [isTaskListCollapsed, setIsTaskListCollapsed] = useState(false)
  // Initialize selectedDate to today in local timezone at midnight
  const [selectedDate, setSelectedDate] = useState<Date>(() => getLocalToday())
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
        
        // Convert the selected local date to UTC for API query
        const utcDate = localDateToUTC(selectedDate)
        console.log('📅 Query date conversion:', {
          localDate: selectedDate.toISOString(),
          utcDate: utcDate.toISOString(),
          queryString: `/api/task-completions/?date=${encodeURIComponent(utcDate.toISOString())}`
        })
        
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
            fetch(`/api/task-completions/?date=${encodeURIComponent(utcDate.toISOString())}`).then(res => res.json()),
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
      
      // Convert the selected local date to UTC for API query
      const utcDate = localDateToUTC(selectedDate)
      
      console.log('📅 Date changed, reloading completions for:', {
        localDate: selectedDate.toISOString(),
        utcDate: utcDate.toISOString()
      })
      setIsLoadingCompletions(true)
      
      try {
        const completions = await fetch(`/api/task-completions/?date=${encodeURIComponent(utcDate.toISOString())}`).then(res => res.json())
        
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
    const loadCompletions = async (date: Date) => {
      const dateString = date.toISOString().split('T')[0]
      
      // Check cache first
      if (completionCache[dateString]) {
        return completionCache[dateString]
      }
      
      try {
        const completions = await DatabaseService.getTaskCompletions(date)
        const completionMap: {[key: string]: boolean} = {}
        completions.forEach(completion => {
          completionMap[completion.taskId] = completion.completed
        })
        
        // Cache the result
        setCompletionCache(prev => ({
          ...prev,
          [dateString]: completionMap
        }))
        
        return completionMap
      } catch (error) {
        console.error('Failed to load completions:', error)
        return {}
      }
    }

    const loadCurrentAndAdjacentDays = async () => {
      if (!dataFullyLoaded) return
      
      const currentDateString = selectedDate.toISOString().split('T')[0]
      
      // Load current day (priority)
      const currentCompletions = await loadCompletions(selectedDate)
      setTaskCompletionState(currentCompletions)
      
      // Preload adjacent days in background
      const prevDay = new Date(selectedDate)
      prevDay.setDate(prevDay.getDate() - 1)
      const nextDay = new Date(selectedDate)
      nextDay.setDate(nextDay.getDate() + 1)
      
      // Load adjacent days without blocking UI
      loadCompletions(prevDay)
      loadCompletions(nextDay)
    }

    loadCurrentAndAdjacentDays()
  }, [selectedDate, dataFullyLoaded, completionCache])

  // Update task completion state when navigating to cached data
  useEffect(() => {
    const dateString = selectedDate.toISOString().split('T')[0]
    if (completionCache[dateString] && dataFullyLoaded) {
      setTaskCompletionState(completionCache[dateString])
    }
  }, [selectedDate, completionCache, dataFullyLoaded])

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
    const dateToCheck = normalizeToLocalMidnight(targetDate)
    const activeTasks: Task[] = []

    taskGroups.forEach(group => {
      const startDate = normalizeToLocalMidnight(group.startDate)
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + group.duration - 1) // End date of the group

      // Check if target date falls within the group's active period (using date comparison)
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

  // Load completion data for calendar view (optimized for wider range)
  const loadCalendarCompletionData = async (currentMonth: Date, forceReload: boolean = false) => {
    try {
      // Check if we already have data for this month (unless forced reload)
      if (!forceReload && loadedDateRange.start && loadedDateRange.end) {
        const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
        const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
        
        // If current month is within loaded range, no need to reload
        if (monthStart >= loadedDateRange.start && monthEnd <= loadedDateRange.end) {
          console.log('📅 Calendar data already loaded for this month, skipping reload')
          return
        }
      }

      // Load 3 months: previous, current, and next
      const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
      const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
      
      // Get the 3-month range in local timezone
      const { start: startOfRange } = getLocalMonthRange(prevMonth)
      const { end: endOfRange } = getLocalMonthRange(nextMonth)
      
      // Convert to UTC for API query
      const startUTC = localDateToUTC(startOfRange)
      const endUTC = localDateToUTC(endOfRange)

      console.log('📅 Loading calendar completion data for 3-month range:', {
        localStart: startOfRange.toISOString(),
        localEnd: endOfRange.toISOString(),
        utcStart: startUTC.toISOString(),
        utcEnd: endUTC.toISOString(),
        months: [prevMonth.toISOString().split('T')[0], currentMonth.toISOString().split('T')[0], nextMonth.toISOString().split('T')[0]]
      })

      const response = await fetch(
        `/api/task-completions/?startDate=${encodeURIComponent(startUTC.toISOString())}&endDate=${encodeURIComponent(endUTC.toISOString())}`
      )
      const completions = await response.json()

      console.log('📅 Calendar completion data loaded:', {
        count: completions.length,
        completions: completions.slice(0, 3) // Log first 3 for debugging
      })

      // Organize completion data by date (convert UTC dates back to local date strings)
      const completionsByDate: {[key: string]: {[key: string]: boolean}} = {}
      
      completions.forEach((completion: {taskId: string, completed: boolean, completedDate: string}) => {
        const utcDate = new Date(completion.completedDate)
        const localDate = utcDateToLocal(utcDate)
        const dateKey = localDate.toISOString().split('T')[0]
        if (!completionsByDate[dateKey]) {
          completionsByDate[dateKey] = {}
        }
        completionsByDate[dateKey][completion.taskId] = completion.completed
      })

      // Update the calendar data (merge with existing data to preserve any real-time updates)
      setCalendarCompletionData(prev => ({
        ...prev,
        ...completionsByDate
      }))
      
      // Track the loaded date range
      setLoadedDateRange({ start: startOfRange, end: endOfRange })
      
      console.log('📅 Calendar completion data organized by date:', completionsByDate)
      console.log('📅 Loaded date range updated:', { start: startOfRange.toISOString(), end: endOfRange.toISOString() })
    } catch (error) {
      console.error('❌ Failed to load calendar completion data:', error)
    }
  }

  const toggleTask = async (id: string) => {
    const newState = !taskCompletionState[id]
    
    // Update local state immediately for responsiveness
    setTaskCompletionState(prev => ({
      ...prev,
      [id]: newState
    }))
    
    // Update calendar completion data immediately for the current date
    const dateKey = selectedDate.toISOString().split('T')[0]
    setCalendarCompletionData(prev => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        [id]: newState
      }
    }))
    
    // Convert selected date to UTC for database storage
    const utcDate = localDateToUTC(selectedDate)
    
    console.log('🔄 Toggling task:', {
      taskId: id,
      newState,
      localDate: selectedDate.toISOString(),
      utcDate: utcDate.toISOString()
    })
    
    // Update database
    try {
      await DatabaseService.updateTaskCompletion(id, newState, utcDate)
    } catch (error) {
      console.error('Failed to update task completion:', error)
      // Revert local state on error
      setTaskCompletionState(prev => ({
        ...prev,
        [id]: !newState
      }))
      // Also revert calendar completion data
      setCalendarCompletionData(prev => ({
        ...prev,
        [dateKey]: {
          ...prev[dateKey],
          [id]: !newState
        }
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

  const handleEditTaskGroupById = (taskGroupId: string) => {
    const group = taskGroups.find(g => g.id === taskGroupId)
    if (group) {
      handleEditTaskGroup(group)
    }
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
    // Normalize selected date to midnight for consistency
    const normalizedDate = new Date(date)
    normalizedDate.setHours(0, 0, 0, 0)
    console.log('📅 Date selected:', {
      originalDate: date.toISOString(),
      normalizedDate: normalizedDate.toISOString()
    })
    setSelectedDate(normalizedDate)
  }

  const handlePreviousDay = () => {
    const previousDay = new Date(selectedDate)
    previousDay.setDate(previousDay.getDate() - 1)
    handleDateSelect(previousDay)
  }

  const handleNextDay = () => {
    const nextDay = new Date(selectedDate)
    nextDay.setDate(nextDay.getDate() + 1)
    handleDateSelect(nextDay)
  }

  const getSelectedDateDisplay = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const selected = new Date(selectedDate)
    selected.setHours(0, 0, 0, 0)
    
    if (selected.getTime() === today.getTime()) {
      return "Today's Tasks"
    } else {
      return "Tasks"
    }
  }

  // Get progressive day count for the selected date
  const getProgressiveDayInfo = () => {
    const dateToCheck = normalizeToLocalMidnight(selectedDate)
    const activeGroups: TaskGroup[] = []

    taskGroups.forEach(group => {
      const startDate = normalizeToLocalMidnight(group.startDate)
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + group.duration - 1) // End date of the group

      // Check if selected date falls within the group's active period
      if (dateToCheck >= startDate && dateToCheck <= endDate) {
        activeGroups.push(group)
      }
    })

    if (activeGroups.length === 0) return null
    
    // Use the first (primary) group for the count
    const primaryGroup = activeGroups[0]
    const groupStartDate = normalizeToLocalMidnight(new Date(primaryGroup.startDate))
    const currentDate = normalizeToLocalMidnight(selectedDate)
    
    // Calculate days since start of group (1-indexed)
    const daysDiff = Math.floor((currentDate.getTime() - groupStartDate.getTime()) / (1000 * 60 * 60 * 24))
    const currentDay = daysDiff + 1 // 1-indexed (day 1, day 2, etc.)
    
    return {
      currentDay,
      totalDays: primaryGroup.duration,
      groupName: primaryGroup.name
    }
  }

  // Show loading state only for initial app load
  if (!dataFullyLoaded && (isLoading || taskGroups.length === 0)) {
    console.log('⏳ Showing initial loading spinner')
    return <TaskLoadingSpinner stage="task-groups" />
  }

  console.log('🎉 Rendering main UI:', {
    taskGroupsCount: taskGroups.length,
    completionStateKeys: Object.keys(taskCompletionState).length,
    completionState: taskCompletionState
  })

  // Get today's tasks from active task groups
  const todaysTasks = getTodaysTasks()
  // Handle calendar dialog opening with data loading
  const handleCalendarOpen = async () => {
    setIsCalendarDialogOpen(true)
    // Load completion data for the current month
    await loadCalendarCompletionData(selectedDate)
  }

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
          <div className="flex gap-2 self-end sm:self-auto">
            <Button onClick={() => setIsTaskGroupDialogOpen(true)} className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Create Task Group
            </Button>
            <Button onClick={handleCalendarOpen} variant="outline" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Calendar</span>
            </Button>
          </div>
        </div>

        {/* Date Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{getSelectedDateDisplay()}</h1>
            <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 mt-1">{getSelectedDateFormatted()}</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePreviousDay}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Previous day"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNextDay}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Next day"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 md:mb-8 md:gap-6">
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
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task list */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800" data-testid="task-list">
              {/* Fixed height header section */}
              <div className="h-[80px] md:h-[100px] p-4 md:p-6 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tasks</h3>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600 dark:text-gray-300">{completedTasks}/{totalTasks} completed</span>
                  <button
                    onClick={() => setIsTaskListCollapsed(!isTaskListCollapsed)}
                    className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                    aria-label={isTaskListCollapsed ? 'Expand task list' : 'Collapse task list'}
                  >
                    {isTaskListCollapsed ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronUp className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expandable content section */}
              {!isTaskListCollapsed && (
                <div className="px-4 md:px-6 pb-4 md:pb-6">
                  {todaysTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      <Target className="h-10 w-10 text-gray-300 dark:text-gray-600" />
                      <p>No active task groups for today. Create a task group to get started.</p>
                      <button
                        onClick={() => setIsTaskGroupDialogOpen(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                      >
                        <Users className="h-4 w-4" />
                        <span>Create Task Group</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {todaysTasks.map((task) => {
                        const isCompleted = taskCompletionState[task.id] || false
                        return (
                        <div
                          key={task.id}
                          className="flex items-center rounded-lg border border-gray-200 p-5 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 cursor-pointer"
                          onClick={() => toggleTask(task.id)}
                        >
                          <div
                            className="mr-3 flex-shrink-0"
                            data-testid="task-checkbox"
                          >
                            {isCompleted ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <Circle className="h-5 w-5 text-gray-400 hover:text-green-500" />
                            )}
                          </div>

                          <div className="flex-1">
                            <p className={`font-medium ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                              {task.text}
                            </p>
                          </div>
                        </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Groups - only show if there are tasks for the selected date */}
            {getTodaysTasks().length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Task Groups</h3>
                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm px-2 py-1 rounded-md">
                      {taskGroups.length}
                    </span>
                  </div>
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
            )}
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
          taskCompletionState={taskCompletionState}
          calendarCompletionData={calendarCompletionData}
          getTasksForDate={getTasksForDate}
          selectedDate={selectedDate}
          loadCalendarCompletionData={loadCalendarCompletionData}
          loadedDateRange={loadedDateRange}
          onEditTaskGroup={handleEditTaskGroupById}
        />
      </div>
    </div>
  )
}
