'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { Plus, CheckCircle, Circle, Calendar, Target } from 'lucide-react'

export default function Home() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Daily Tracker</h1>
          <p className="text-gray-600 mb-6">Track your habits and tasks to build a better you.</p>
          <button
            onClick={() => signIn()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
          >
            Sign In to Get Started
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Daily Tracker</h1>
          <p className="text-gray-600">Welcome back, {session.user?.name}</p>
        </div>
        <button
          onClick={() => signOut()}
          className="text-gray-600 hover:text-gray-900 transition-colors"
        >
          Sign Out
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Habits Today</p>
              <p className="text-2xl font-bold text-green-600">3/5</p>
            </div>
            <Target className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tasks Completed</p>
              <p className="text-2xl font-bold text-blue-600">8/12</p>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Streak</p>
              <p className="text-2xl font-bold text-orange-600">7 days</p>
            </div>
            <Calendar className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Habits Section */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Today's Habits</h2>
              <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
                <Plus className="w-4 h-4" />
                Add Habit
              </button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {/* Sample habits - replace with real data */}
            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
              <Circle className="w-6 h-6 text-gray-400 hover:text-green-600 cursor-pointer" />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Morning Exercise</h3>
                <p className="text-sm text-gray-600">30 minutes workout</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Read 20 pages</h3>
                <p className="text-sm text-gray-600">Daily reading goal</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
            </div>
          </div>
        </div>

        {/* Tasks Section */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Today's Tasks</h2>
              <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
                <Plus className="w-4 h-4" />
                Add Task
              </button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {/* Sample tasks - replace with real data */}
            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
              <Circle className="w-6 h-6 text-gray-400 hover:text-green-600 cursor-pointer" />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Review project proposal</h3>
                <p className="text-sm text-gray-600">High priority</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 line-through">Call client about updates</h3>
                <p className="text-sm text-gray-600">Medium priority</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
