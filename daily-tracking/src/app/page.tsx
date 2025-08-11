'use client'

import { Plus, CheckCircle, Circle, Calendar, Target, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import ThemeToggle from '@/components/ThemeToggle'

interface Task {
  id: string
  title: string
  completed: boolean
  category: 'habit' | 'task'
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Morning meditation', completed: false, category: 'habit' },
    { id: '2', title: 'Drink 8 glasses of water', completed: true, category: 'habit' },
    { id: '3', title: 'Review project proposal', completed: false, category: 'task' },
    { id: '4', title: 'Call dentist for appointment', completed: true, category: 'task' },
  ])
  
  const [newTask, setNewTask] = useState('')

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ))
  }

  const addTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (newTask.trim()) {
      const task: Task = {
        id: Date.now().toString(),
        title: newTask.trim(),
        completed: false,
        category: 'task'
      }
      setTasks(prev => [...prev, task])
      setNewTask('')
    }
  }

  const completedTasks = tasks.filter(t => t.completed).length
  const totalTasks = tasks.length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Today's Progress</h1>
          <p className="text-gray-600 dark:text-gray-400">{new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
        </div>
        <ThemeToggle />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{completedTasks}/{totalTasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{completionRate}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Streak</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">7 days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add New Task */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Add New Task</h2>
        <form onSubmit={addTask} className="flex gap-4">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="What would you like to track today?"
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <Button type="submit">
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </form>
      </div>

      {/* Tasks List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Today's Tasks & Habits</h2>
          
          {tasks.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No tasks yet. Add one above to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center p-3 rounded-lg border transition-colors ${
                    task.completed 
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                      : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <button
                    onClick={() => toggleTask(task.id)}
                    className="mr-3 focus:outline-none"
                  >
                    {task.completed ? (
                      <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                    ) : (
                      <Circle className="h-6 w-6 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400" />
                    )}
                  </button>
                  
                  <div className="flex-1">
                    <p className={`font-medium ${
                      task.completed 
                        ? 'text-green-800 dark:text-green-300 line-through' 
                        : 'text-gray-900 dark:text-gray-100'
                    }`}>
                      {task.title}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                      {task.category}
                    </p>
                  </div>
                  
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    task.category === 'habit' 
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                  }`}>
                    {task.category}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Motivational Message */}
      {completionRate >= 80 && (
        <div className="mt-8 bg-gradient-to-r from-green-400 to-blue-500 text-white p-6 rounded-lg shadow-lg">
          <div className="text-center">
            <h3 className="text-xl font-bold mb-2">🎉 Great job!</h3>
            <p>You've completed {completionRate}% of your tasks today. Keep up the excellent work!</p>
          </div>
        </div>
      )}
    </div>
  )
}
