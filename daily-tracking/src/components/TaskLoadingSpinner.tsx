import React from 'react'
import { CheckCircle, Calendar, Target } from 'lucide-react'

interface LoadingProps {
  stage: 'task-groups' | 'completions' | 'synchronizing'
}

export default function TaskLoadingSpinner({ stage }: LoadingProps) {
  const getLoadingMessage = () => {
    switch (stage) {
      case 'task-groups':
        return {
          title: 'Loading task groups...',
          description: 'Fetching your task categories and schedules'
        }
      case 'completions':
        return {
          title: 'Loading completion states...',
          description: 'Synchronizing your task progress'
        }
      case 'synchronizing':
        return {
          title: 'Synchronizing data...',
          description: 'Ensuring everything is up to date'
        }
      default:
        return {
          title: 'Loading your tasks...',
          description: 'Getting everything ready'
        }
    }
  }

  const { title, description } = getLoadingMessage()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-6">
        {/* Animated Icons */}
        <div className="relative mb-8">
          <div className="flex justify-center space-x-4 mb-4">
            <div className={`p-3 rounded-full ${stage === 'task-groups' ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-100 dark:bg-gray-800'} transition-colors duration-500`}>
              <Target className={`w-6 h-6 ${stage === 'task-groups' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
            </div>
            <div className={`p-3 rounded-full ${stage === 'completions' ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-800'} transition-colors duration-500`}>
              <CheckCircle className={`w-6 h-6 ${stage === 'completions' ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} />
            </div>
            <div className={`p-3 rounded-full ${stage === 'synchronizing' ? 'bg-purple-100 dark:bg-purple-900' : 'bg-gray-100 dark:bg-gray-800'} transition-colors duration-500`}>
              <Calendar className={`w-6 h-6 ${stage === 'synchronizing' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'}`} />
            </div>
          </div>
          
          {/* Main Spinner */}
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>

        {/* Loading Text */}
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {title}
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {description}
        </p>

        {/* Progress Dots */}
        <div className="flex justify-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${stage === 'task-groups' ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'} transition-colors duration-500`}></div>
          <div className={`w-2 h-2 rounded-full ${stage === 'completions' ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'} transition-colors duration-500`}></div>
          <div className={`w-2 h-2 rounded-full ${stage === 'synchronizing' ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'} transition-colors duration-500`}></div>
        </div>

        {/* Subtle animation hint */}
        <div className="mt-8 text-xs text-gray-500 dark:text-gray-400">
          This ensures your task states are 100% accurate
        </div>
      </div>
    </div>
  )
}
