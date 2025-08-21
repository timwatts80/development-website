'use client'

import React, { useState } from 'react'
import { X, Plus, Minus, Trash2, Palette } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { getLocalDateString, parseLocalDate, getLocalToday } from '@/utils/dateUtils'

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

interface TaskGroupDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (taskGroup: Omit<TaskGroup, 'id' | 'createdAt'>) => void
  editingGroup?: TaskGroup | null
}

const colorOptions = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Orange', value: '#F59E0B' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Teal', value: '#14B8A6' }
]

export default function TaskGroupDialog({ isOpen, onClose, onSave, editingGroup }: TaskGroupDialogProps) {
  const [groupName, setGroupName] = useState('')
  const [selectedColor, setSelectedColor] = useState(colorOptions[0].value)
  const [duration, setDuration] = useState(7)
  const [startDate, setStartDate] = useState(getLocalDateString(getLocalToday())) // Today's date in local timezone
  const [newTasks, setNewTasks] = useState<string[]>([''])
  const dialogContentRef = React.useRef<HTMLDivElement>(null)

  // Initialize form when editing
  React.useEffect(() => {
    if (editingGroup) {
      setGroupName(editingGroup.name)
      setSelectedColor(editingGroup.color)
      setDuration(editingGroup.duration)
      setStartDate(getLocalDateString(editingGroup.startDate))
      
      // For editing, show all existing tasks as new task fields
      if (editingGroup.tasks.length > 0) {
        setNewTasks(editingGroup.tasks.map(task => task.text))
      } else {
        setNewTasks([''])
      }
    } else {
      // Reset form for new group
      setGroupName('')
      setSelectedColor(colorOptions[0].value)
      setDuration(7)
      setStartDate(getLocalDateString(getLocalToday()))
      setNewTasks([''])
    }
  }, [editingGroup])

  const handleSave = () => {
    console.log('🔧 TaskGroupDialog handleSave called')
    console.log('🔧 editingGroup in dialog:', editingGroup)
    console.log('🔧 Form data:', { groupName, selectedColor, duration, startDate, newTasks })
    
    if (!groupName.trim()) return

    // Create all tasks from the new task fields
    const allTasks = newTasks
      .filter(taskText => taskText.trim())
      .map((taskText, index) => ({
        id: editingGroup ? 
          (editingGroup.tasks[index]?.id || `${Date.now()}-${index}`) : // Preserve existing task IDs when editing
          `${Date.now()}-${index}`, // Generate new IDs for new group
        text: taskText.trim(),
        completed: editingGroup ? (editingGroup.tasks[index]?.completed || false) : false, // Preserve completion state
      }))

    console.log('🔧 About to call onSave with:', {
      name: groupName,
      color: selectedColor,
      duration,
      startDate: parseLocalDate(startDate),
      tasks: allTasks
    })

    onSave({
      name: groupName,
      color: selectedColor,
      duration,
      startDate: parseLocalDate(startDate),
      tasks: allTasks
    })

    // Reset form
    setGroupName('')
    setSelectedColor(colorOptions[0].value)
    setDuration(7)
    setNewTasks([''])
    onClose()
  }

  const addNewTaskField = () => {
    setNewTasks(prev => [...prev, ''])
    
    // Scroll to bottom after the new field is rendered
    setTimeout(() => {
      if (dialogContentRef.current) {
        dialogContentRef.current.scrollTop = dialogContentRef.current.scrollHeight
      }
    }, 100)
  }

  const removeNewTaskField = (index: number) => {
    setNewTasks(prev => prev.filter((_, i) => i !== index))
  }

  const updateNewTask = (index: number, value: string) => {
    setNewTasks(prev => prev.map((task, i) => i === index ? value : task))
  }

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1
    setDuration(Math.max(1, value))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {editingGroup ? 'Edit Task Group' : 'Create Task Group'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div 
          ref={dialogContentRef}
          className="p-6 space-y-6 flex-1 overflow-y-auto"
        >
          {/* Group Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Group Name
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g., Morning Routine, Weekly Goals..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Group Color
            </label>
            <div className="grid grid-cols-4 gap-3">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setSelectedColor(color.value)}
                  className={`w-full h-10 rounded-md border-2 flex items-center justify-center ${
                    selectedColor === color.value 
                      ? 'border-gray-800 dark:border-gray-200' 
                      : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color.value }}
                >
                  {selectedColor === color.value && (
                    <Palette className="w-4 h-4 text-white" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Duration and Start Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duration (days)
              </label>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setDuration(Math.max(1, duration - 1))}
                  className="p-1 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  value={duration}
                  onChange={handleDurationChange}
                  min="1"
                  className="w-20 px-3 py-2 text-center border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 bg-white text-gray-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={() => setDuration(duration + 1)}
                  className="p-1 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Task Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tasks
            </label>
            
            {/* Tasks */}
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {editingGroup ? 'Edit tasks in this group:' : 'Add tasks to this group:'}
              </p>
              <div className="space-y-2">
                {newTasks.map((task, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={task}
                      onChange={(e) => updateNewTask(index, e.target.value)}
                      placeholder={`Task ${index + 1}...`}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    />
                    {newTasks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeNewTaskField(index)}
                        className="p-2 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addNewTaskField}
                  className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mt-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Task</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Actions - Pinned to bottom */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!groupName.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {editingGroup ? 'Update Group' : 'Create Group'}
          </Button>
        </div>
      </div>
    </div>
  )
}
