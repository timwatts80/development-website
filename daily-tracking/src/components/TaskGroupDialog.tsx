'use client'

import React, { useState } from 'react'
import { X, Plus, Minus, Trash2, Palette } from 'lucide-react'
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

interface TaskGroupDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (taskGroup: Omit<TaskGroup, 'id' | 'createdAt'>) => void
  existingTasks?: Task[]
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

export default function TaskGroupDialog({ isOpen, onClose, onSave, existingTasks = [], editingGroup }: TaskGroupDialogProps) {
  const [groupName, setGroupName] = useState('')
  const [selectedColor, setSelectedColor] = useState(colorOptions[0].value)
  const [duration, setDuration] = useState(7)
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]) // Today's date in YYYY-MM-DD format
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])
  const [newTasks, setNewTasks] = useState<string[]>([''])
  const [newTaskTypes, setNewTaskTypes] = useState<('task' | 'habit')[]>(['task'])
  const dialogContentRef = React.useRef<HTMLDivElement>(null)

  // Initialize form when editing
  React.useEffect(() => {
    if (editingGroup) {
      setGroupName(editingGroup.name)
      setSelectedColor(editingGroup.color)
      setDuration(editingGroup.duration)
      setStartDate(editingGroup.startDate.toISOString().split('T')[0])
      
      // Set selected existing tasks
      const existingTaskIds = editingGroup.tasks
        .filter(task => existingTasks.some(et => et.id === task.id))
        .map(task => task.id)
      setSelectedTasks(existingTaskIds)
      
      // Set new tasks (tasks not in existing tasks)
      const newTaskTexts = editingGroup.tasks
        .filter(task => !existingTasks.some(et => et.id === task.id))
        .map(task => task.text)
      const newTaskTypesArray = editingGroup.tasks
        .filter(task => !existingTasks.some(et => et.id === task.id))
        .map(task => task.type)
      setNewTasks(newTaskTexts.length > 0 ? newTaskTexts : [''])
      setNewTaskTypes(newTaskTypesArray.length > 0 ? newTaskTypesArray : ['task'])
    } else {
      // Reset form for new group
      setGroupName('')
      setSelectedColor(colorOptions[0].value)
      setDuration(7)
      setStartDate(new Date().toISOString().split('T')[0])
      setSelectedTasks([])
      setNewTasks([''])
      setNewTaskTypes(['task'])
    }
  }, [editingGroup, existingTasks])

  const handleSave = () => {
    if (!groupName.trim()) return

    const existingSelectedTasks = existingTasks.filter(task => selectedTasks.includes(task.id))
    
    const newTaskObjects = newTasks
      .filter(taskText => taskText.trim())
      .map((taskText, index) => ({
        id: `${Date.now()}-${index}`,
        text: taskText.trim(),
        completed: false,
        type: newTaskTypes[index] || 'task'
      }))

    const allTasks = [...existingSelectedTasks, ...newTaskObjects]

    onSave({
      name: groupName,
      color: selectedColor,
      duration,
      startDate: new Date(startDate),
      tasks: allTasks
    })

    // Reset form
    setGroupName('')
    setSelectedColor(colorOptions[0].value)
    setDuration(7)
    setSelectedTasks([])
    setNewTasks([''])
    setNewTaskTypes(['task'])
    onClose()
  }

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    )
  }

  const addNewTaskField = () => {
    setNewTasks(prev => [...prev, ''])
    setNewTaskTypes(prev => [...prev, 'task'])
    
    // Scroll to bottom after the new field is rendered
    setTimeout(() => {
      if (dialogContentRef.current) {
        dialogContentRef.current.scrollTop = dialogContentRef.current.scrollHeight
      }
    }, 100)
  }

  const removeNewTaskField = (index: number) => {
    setNewTasks(prev => prev.filter((_, i) => i !== index))
    setNewTaskTypes(prev => prev.filter((_, i) => i !== index))
  }

  const updateNewTask = (index: number, value: string) => {
    setNewTasks(prev => prev.map((task, i) => i === index ? value : task))
  }

  const updateNewTaskType = (index: number, type: 'task' | 'habit') => {
    setNewTaskTypes(prev => prev.map((taskType, i) => i === index ? type : taskType))
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
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
                  className="p-1 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  value={duration}
                  onChange={handleDurationChange}
                  min="1"
                  className="w-20 px-3 py-2 text-center border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={() => setDuration(duration + 1)}
                  className="p-1 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Task Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Add Tasks to Group
            </label>
            
            {/* Existing Tasks */}
            {existingTasks.length > 0 && (
              <div className="mb-3">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Select from common tasks:</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {existingTasks.map((task) => (
                    <label
                      key={task.id}
                      className="flex items-center space-x-3 cursor-pointer p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={selectedTasks.includes(task.id)}
                          onChange={() => toggleTaskSelection(task.id)}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded border-2 transition-colors flex items-center justify-center ${
                          selectedTasks.includes(task.id)
                            ? 'bg-blue-600 border-blue-600 dark:bg-blue-500 dark:border-blue-500'
                            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
                        }`}>
                          {selectedTasks.includes(task.id) && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-gray-900 dark:text-gray-100 flex-1">{task.text}</span>
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

            {/* New Tasks */}
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Add new tasks:</p>
              <div className="space-y-2">
                {newTasks.map((task, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={task}
                      onChange={(e) => updateNewTask(index, e.target.value)}
                      placeholder={`Task ${index + 1}...`}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    />
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => updateNewTaskType(index, 'task')}
                        className={`px-3 py-2 h-10 rounded text-xs font-medium transition-colors ${
                          newTaskTypes[index] === 'task'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-2 border-blue-300 dark:border-blue-700'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 border-2 border-gray-200 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/50'
                        }`}
                      >
                        Task
                      </button>
                      <button
                        type="button"
                        onClick={() => updateNewTaskType(index, 'habit')}
                        className={`px-3 py-2 h-10 rounded text-xs font-medium transition-colors ${
                          newTaskTypes[index] === 'habit'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-2 border-purple-300 dark:border-purple-700'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 border-2 border-gray-200 dark:border-gray-600 hover:bg-purple-50 dark:hover:bg-purple-900/50'
                        }`}
                      >
                        Habit
                      </button>
                    </div>
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
