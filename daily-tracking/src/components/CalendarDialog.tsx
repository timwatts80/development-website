'use client'

import React, { useState } from 'react'
import { X, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface Task {
  id: string
  text: string
  completed: boolean
  type: 'habit' | 'task'
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
}

export default function CalendarDialog({ isOpen, onClose, taskGroups, onDateSelect }: CalendarDialogProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Get the first day of the month and calculate calendar grid
  const getCalendarDays = () => {
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
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
    const targetDate = new Date(date)
    targetDate.setHours(0, 0, 0, 0)

    return taskGroups.filter(group => {
      const startDate = new Date(group.startDate)
      startDate.setHours(0, 0, 0, 0)
      
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + group.duration - 1)
      endDate.setHours(23, 59, 59, 999)

      return targetDate >= startDate && targetDate <= endDate
    })
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth)
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1)
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1)
    }
    setCurrentMonth(newMonth)
  }

  const handleDateClick = (date: Date) => {
    onDateSelect(date)
    onClose()
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth()
  }

  if (!isOpen) return null

  const calendarDays = getCalendarDays()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Calendar View</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {daysOfWeek.map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date, index) => {
              const activeGroups = getActiveGroupsForDate(date)
              const hasActiveGroups = activeGroups.length > 0
              const todayClass = isToday(date)
              const currentMonthClass = isCurrentMonth(date)

              return (
                <button
                  key={index}
                  onClick={() => handleDateClick(date)}
                  className={`
                    relative p-2 h-12 text-sm rounded-lg transition-colors
                    ${currentMonthClass 
                      ? 'text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700' 
                      : 'text-gray-400 dark:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-750'
                    }
                    ${todayClass ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100' : ''}
                    ${hasActiveGroups ? 'font-semibold' : ''}
                  `}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <span>{date.getDate()}</span>
                    {hasActiveGroups && (
                      <div className="flex space-x-1 mt-1">
                        {activeGroups.slice(0, 3).map((group, groupIndex) => (
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

          {/* Legend */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Active Task Groups:</p>
            <div className="flex flex-wrap gap-2">
              {taskGroups.map(group => (
                <div key={group.id} className="flex items-center space-x-2 text-sm">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: group.color }}
                  />
                  <span className="text-gray-700 dark:text-gray-300">{group.name}</span>
                  <span className="text-gray-500 dark:text-gray-400">
                    ({group.duration} days)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
