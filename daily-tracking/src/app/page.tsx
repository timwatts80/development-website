'use client'

import React, { useState } from 'react'
import { CheckCircle, Circle, Plus, Target, Calendar, TrendingUp, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import TaskGroupDialog from '@/components/TaskGroupDialog'

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
  duration: number
  tasks: Task[]
  createdAt: Date
}

export default function DailyTracker() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', text: 'Morning meditation', completed: false, type: 'habit' },
    { id: '2', text: 'Drink 8 glasses of water', completed: true, type: 'habit' },
    { id: '3', text: 'Review project proposal', completed: false, type: 'task' },
    { id: '4', text: 'Call dentist for appointment', completed: true, type: 'task' },
  ])
  
  const [taskGroups, setTaskGroups] = useState<TaskGroup[]>([])
  const [newTask, setNewTask] = useState('')
  const [isTaskGroupDialogOpen, setIsTaskGroupDialogOpen] = useState(false)

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
        text: newTask.trim(),
        completed: false,
        type: 'task'
      }
      setTasks(prev => [...prev, task])
      setNewTask('')
    }
  }

  const handleCreateTaskGroup = (groupData: {
    name: string
    color: string
    duration: number
    tasks: Task[]
  }) => {
    const newGroup: TaskGroup = {
      id: Date.now().toString(),
      name: groupData.name,
      color: groupData.color,
      duration: groupData.duration,
      tasks: groupData.tasks,
      createdAt: new Date()
    }
    setTaskGroups(prev => [...prev, newGroup])
    setIsTaskGroupDialogOpen(false)
  }

  const completedTasks = tasks.filter(t => t.completed).length
  const totalTasks = tasks.length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Daily Tracker
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Track your habits, tasks, and goals with ease
          </p>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Today&apos;s Progress</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{completionRate}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Completed Tasks</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedTasks}/{totalTasks}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Task Groups</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{taskGroups.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Task Groups Section */}
        {taskGroups.length > 0 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Task Groups</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {taskGroups.map((group) => (
                <div key={group.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center mb-3">
                    <div 
                      className="w-4 h-4 rounded-full mr-3"
                      style={{ backgroundColor: group.color }}
                    ></div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{group.name}</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    Duration: {group.duration} days
                  </p>
                  <div className="space-y-2">
                    {group.tasks.slice(0, 3).map((task) => (
                      <div key={task.id} className="flex items-center text-sm">
                        {task.completed ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        ) : (
                          <Circle className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
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
          </div>
        )}

        {/* Main Task List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Today&apos;s Tasks</h2>
            <Button 
              onClick={() => setIsTaskGroupDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Create Task Group
            </Button>
          
          {/* Add Task Form */}
          <form onSubmit={addTask} className="mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="Add a new task..."
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Button type="submit" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
          </form>

          {/* Task List */}
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <button
                  onClick={() => toggleTask(task.id)}
                  className="mr-3 flex-shrink-0"
                >
                  {task.completed ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-400 hover:text-green-500" />
                  )}
                </button>
                
                <div className="flex-1">
                  <p className={`font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                    {task.text}
                  </p>
                  <div className="flex items-center mt-1">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      task.type === 'habit' 
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                    }`}>
                      {task.type}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {tasks.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No tasks yet. Add one above to get started!
            </div>
          )}
        </div>
      </div>

      {/* Task Group Dialog */}
      <TaskGroupDialog
        isOpen={isTaskGroupDialogOpen}
        onClose={() => setIsTaskGroupDialogOpen(false)}
        onSave={handleCreateTaskGroup}
      />
      </div>
    </div>
  )
}
