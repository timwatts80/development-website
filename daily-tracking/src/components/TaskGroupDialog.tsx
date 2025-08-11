'use client'

import React, { useState } from 'react'
import { X, Plus, Minus, Palette } from 'lucide-react'
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
  tasks: Task[]
  createdAt: Date
}

interface TaskGroupDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (taskGroup: Omit<TaskGroup, 'id' | 'createdAt'>) => void
  existingTasks?: Task[]
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

export default function TaskGroupDialog({ isOpen, onClose, onSave, existingTasks = [] }: TaskGroupDialogProps) {
  const [groupName, setGroupName] = useState('')
  const [selectedColor, setSelectedColor] = useState(colorOptions[0].value)
  const [duration, setDuration] = useState(7)
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])
  const [newTaskText, setNewTaskText] = useState('')

  const handleSave = () => {
    if (!groupName.trim()) return

    const groupTasks = existingTasks
      .filter(task => selectedTasks.includes(task.id))
      .concat(
        newTaskText.trim() 
          ? [{
              id: Date.now().toString(),
              text: newTaskText.trim(),
              completed: false,
              type: 'task' as const
            }]
          : []
      )

    onSave({
      name: groupName,
      color: selectedColor,
      duration,
      tasks: groupTasks
    })

    // Reset form
    setGroupName('')
    setSelectedColor(colorOptions[0].value)
    setDuration(7)
    setSelectedTasks([])
    setNewTaskText('')
    onClose()
  }

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Create Task Group</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
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
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
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

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Duration (days)
            </label>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setDuration(Math.max(1, duration - 1))}
                className="p-1 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-lg font-medium text-gray-900 dark:text-gray-100 min-w-[3rem] text-center">
                {duration}
              </span>
              <button
                onClick={() => setDuration(duration + 1)}
                className="p-1 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Task Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Add Tasks to Group
            </label>
            
            {/* Existing Tasks */}
            {existingTasks.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Select from existing tasks:</p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {existingTasks.map((task) => (
                    <label
                      key={task.id}
                      className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTasks.includes(task.id)}
                        onChange={() => toggleTaskSelection(task.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-900 dark:text-gray-100">{task.text}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        task.type === 'habit' 
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' 
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {task.type}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* New Task */}
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Or add a new task:</p>
              <input
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder="Enter a new task..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!groupName.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Create Group
          </Button>
        </div>
      </div>
    </div>
  )
}
