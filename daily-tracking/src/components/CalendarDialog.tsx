'use client'

import React, { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { getLocalToday, isSameLocalDay, normalizeToLocalMidnight } from '@/utils/dateUtils'

interface Task {
  id: string
  text: string
  completed: boolean
}

interface TaskGroup {
  id: string
  name: string
  color: string
  duration: number // in days
  startDate: Date
  tasks: Task[]
  createdAt: Date
}

interface CalendarDialogProps {
  isOpen: boolean
  onClose: () => void
  taskGroups: TaskGroup[]
  onDateSelect: (date: Date) => void
  taskCompletionState: {[key: string]: boolean}
  calendarCompletionData: {[key: string]: {[key: string]: boolean}}
  getTasksForDate: (date: Date) => Task[]
  selectedDate: Date
  loadCalendarCompletionData: (currentMonth: Date, forceReload?: boolean) => Promise<void>
  loadedDateRange: {start: Date | null, end: Date | null}
  onEditTaskGroup?: (taskGroupId: string) => void
}

export default function CalendarDialog({ 
  isOpen, 
  onClose, 
  taskGroups, 
  onDateSelect, 
  taskCompletionState, 
  calendarCompletionData, 
  getTasksForDate, 
  selectedDate, 
  loadCalendarCompletionData,
  loadedDateRange,
  onEditTaskGroup
}: CalendarDialogProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  
  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalStyle
      }
    }
  }, [isOpen])
  
  // Swipe functionality with preloaded adjacent months
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null)
  const [dragOffset, setDragOffset] = useState(0)

  // Preloaded adjacent months
  const getPrevMonth = () => {
    const prev = new Date(currentMonth)
    prev.setMonth(prev.getMonth() - 1)
    return prev
  }

  const getNextMonth = () => {
    const next = new Date(currentMonth)
    next.setMonth(next.getMonth() + 1)
    return next
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isAnimating) return
    e.preventDefault()
    e.stopPropagation()
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
    setDragOffset(0)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || isAnimating) return
    e.preventDefault()
    e.stopPropagation()
    const currentX = e.targetTouches[0].clientX
    setTouchEnd(currentX)
    const offset = currentX - touchStart
    // Allow drag but limit extreme movements (full width drag for smooth carousel)
    setDragOffset(Math.max(-300, Math.min(300, offset)))
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd || isAnimating) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe) {
      animateToNextMonth('next')
    } else if (isRightSwipe) {
      animateToNextMonth('prev')
    } else {
      // Snap back to center if swipe wasn't far enough
      setDragOffset(0)
    }
  }

  const animateToNextMonth = async (direction: 'prev' | 'next') => {
    setIsAnimating(true)
    setSlideDirection(direction === 'next' ? 'left' : 'right')
    
    // Complete the slide animation
    setTimeout(async () => {
      // Update the month
      const newMonth = new Date(currentMonth)
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1)
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1)
      }
      
      // Only load data if this month is outside the loaded range
      const needsLoading = !loadedDateRange.start || !loadedDateRange.end ||
        new Date(newMonth.getFullYear(), newMonth.getMonth(), 1) < loadedDateRange.start ||
        new Date(newMonth.getFullYear(), newMonth.getMonth() + 1, 0) > loadedDateRange.end
      
      if (needsLoading) {
        console.log('📅 Loading new calendar data for month outside loaded range:', newMonth.toISOString().split('T')[0])
        await loadCalendarCompletionData(newMonth)
      } else {
        console.log('📅 Using cached calendar data for month:', newMonth.toISOString().split('T')[0])
      }
      
      setCurrentMonth(newMonth)
      
      // Reset states
      setSlideDirection(null)
      setDragOffset(0)
      setIsAnimating(false)
    }, 300)
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Get calendar days for any month
  const getCalendarDaysForMonth = (month: Date) => {
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1)
    const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay()) // Start from Sunday

    const days = []
    const endDate = new Date(lastDay)
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay())) // End on Saturday

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      days.push(new Date(date))
    }

    return days
  }

  // Check if a date has active task groups
  const getActiveGroupsForDate = (date: Date) => {
    const targetDate = normalizeToLocalMidnight(date)

    return taskGroups.filter(group => {
      const startDate = normalizeToLocalMidnight(group.startDate)
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + group.duration - 1)

      return targetDate >= startDate && targetDate <= endDate
    })
  }

  // Check if all tasks for a given date are completed
  const isDayComplete = (date: Date) => {
    const dateString = normalizeToLocalMidnight(date).toISOString().split('T')[0]
    const selectedDateString = normalizeToLocalMidnight(selectedDate).toISOString().split('T')[0]
    
    // Get tasks for this date
    const tasksForDate = getTasksForDate(date)
    if (tasksForDate.length === 0) {
      return false // No tasks means day is not complete
    }
    
    // If this is the currently selected date, use the real-time completion state
    if (dateString === selectedDateString) {
      return tasksForDate.every(task => taskCompletionState[task.id] || false)
    }
    
    // For other dates, use the calendar completion data
    const completionData = calendarCompletionData[dateString]
    if (!completionData) {
      return false // No completion data means not complete
    }
    
    // Check if all tasks for this date are completed
    return tasksForDate.every(task => completionData[task.id] || false)
  }

  // Check if a day is incomplete and in the past (should be greyed out)
  const isDayIncompleteAndPast = (date: Date) => {
    const today = getLocalToday()
    const dateToCheck = normalizeToLocalMidnight(date)
    
    // Only grey out past days (not today or future)
    if (dateToCheck >= today) {
      return false
    }
    
    // Get tasks for this date
    const tasksForDate = getTasksForDate(date)
    if (tasksForDate.length === 0) {
      return false // No tasks means no incomplete state to show
    }
    
    // If the day is complete, don't grey it out
    if (isDayComplete(date)) {
      return false
    }
    
    // Day has tasks but is not complete and is in the past
    return true
  }

  const navigateMonth = async (direction: 'prev' | 'next') => {
    if (isAnimating) return
    await animateToNextMonth(direction)
  }

  const handleDateClick = (date: Date, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }
    onDateSelect(date)
    onClose()
  }

  const handleTodayClick = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    const today = getLocalToday()
    onDateSelect(today)
    onClose()
  }

  const isToday = (date: Date) => {
    return isSameLocalDay(date, getLocalToday())
  }

  // Render a calendar month grid
  const renderMonthGrid = (month: Date) => {
    const monthDays = getCalendarDaysForMonth(month)
    
    return (
      <div className="grid grid-cols-7 gap-1">
        {monthDays.map((date, index) => {
          const activeGroups = getActiveGroupsForDate(date)
          const hasActiveGroups = activeGroups.length > 0
          const isComplete = isDayComplete(date)
          const isIncompleteAndPast = isDayIncompleteAndPast(date)
          const todayClass = isToday(date)
          const currentMonthClass = date.getMonth() === month.getMonth()

          return (
            <button
              key={index}
              onClick={(e) => handleDateClick(date, e)}
              data-date={normalizeToLocalMidnight(date).toISOString().split('T')[0]}
              className={`
                relative p-2 h-12 text-sm rounded-lg transition-colors
                ${currentMonthClass 
                  ? 'text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700' 
                  : 'text-gray-400 dark:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-750'
                }
                ${todayClass ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100' : ''}
                ${isComplete ? 'bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100' : ''}
                ${isIncompleteAndPast ? 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 opacity-60' : ''}
                ${!hasActiveGroups ? 'opacity-50' : ''}
              `}
            >
              <div className="flex flex-col items-center justify-start h-full pt-1">
                <span>{date.getDate()}</span>
                {hasActiveGroups && (
                  <div className="flex space-x-1 mt-1 absolute bottom-1">
                    {activeGroups.slice(0, 3).map((group) => (
                      <div
                        key={group.id}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: group.color }}
                        title={group.name}
                      />
                    ))}
                    {activeGroups.length > 3 && (
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400" title={`+${activeGroups.length - 3} more`} />
                    )}
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          e.stopPropagation()
          onClose()
        }
      }}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto" 
        data-testid="calendar-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Calendar View</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-end">
          <button
            onClick={handleTodayClick}
            className="px-3 py-1.5 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded border transition-colors dark:bg-blue-900 dark:hover:bg-blue-800 dark:text-blue-200 dark:border-blue-700"
          >
            Today
          </button>
        </div>

        <div className="p-6">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              data-testid="prev-month"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              data-testid="next-month"
            >
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div 
            className="select-none overflow-hidden relative"
            style={{ touchAction: 'none' }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2 relative z-10">
              {daysOfWeek.map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                  {day}
                </div>
              ))}
            </div>

            {/* Three-month carousel container */}
            <div 
              className={`flex w-[300%] ${isAnimating ? 'transition-transform duration-300 ease-out' : ''}`}
              style={{
                transform: `translateX(calc(-33.33% + ${
                  slideDirection === 'left' ? '-33.33%' : 
                  slideDirection === 'right' ? '33.33%' : 
                  `${dragOffset}px`
                }))`
              }}
            >
              {/* Previous month */}
              <div className="w-1/3 flex-shrink-0">
                {renderMonthGrid(getPrevMonth())}
              </div>
              
              {/* Current month */}
              <div className="w-1/3 flex-shrink-0">
                {renderMonthGrid(currentMonth)}
              </div>
              
              {/* Next month */}
              <div className="w-1/3 flex-shrink-0">
                {renderMonthGrid(getNextMonth())}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            {/* Day Status Legend */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Day Status:</p>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded bg-green-100 border border-green-200 dark:bg-green-900 dark:border-green-800"></div>
                  <span className="text-gray-700 dark:text-gray-300">All tasks completed</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded bg-gray-200 border border-gray-300 dark:bg-gray-700 dark:border-gray-600 opacity-60"></div>
                  <span className="text-gray-700 dark:text-gray-300">Incomplete (past)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded bg-blue-100 border border-blue-200 dark:bg-blue-900 dark:border-blue-800"></div>
                  <span className="text-gray-700 dark:text-gray-300">Today</span>
                </div>
              </div>
            </div>

            {/* Task Groups Legend */}
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Active Task Groups:</p>
              <div className="flex flex-wrap gap-2">
                {taskGroups.map(group => (
                  <button
                    key={group.id}
                    onClick={() => {
                      onEditTaskGroup?.(group.id)
                      onClose() // Close the calendar dialog
                    }}
                    className="flex items-center space-x-2 text-sm p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: group.color }}
                    />
                    <span className="text-gray-700 dark:text-gray-300">{group.name}</span>
                    <span className="text-gray-500 dark:text-gray-400">
                      ({group.duration} days)
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
