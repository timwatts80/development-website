'use client'

import React, { useState, useRef, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: React.ReactNode
  threshold?: number
}

export default function PullToRefresh({ 
  onRefresh, 
  children, 
  threshold = 80 
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isPulling, setIsPulling] = useState(false)
  const startY = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = (e: TouchEvent) => {
    // Only trigger if we're at the top of the page
    if (window.scrollY > 0) return
    
    startY.current = e.touches[0].clientY
    setIsPulling(true)
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!isPulling || window.scrollY > 0) return

    const currentY = e.touches[0].clientY
    const distance = Math.max(0, currentY - startY.current)
    
    // Prevent default behavior when pulling down
    if (distance > 10) {
      e.preventDefault()
    }
    
    // Add some resistance to the pull
    const resistance = Math.pow(distance / threshold, 0.8) * threshold
    setPullDistance(Math.min(resistance, threshold * 1.5))
  }

  const handleTouchEnd = async () => {
    if (!isPulling) return

    setIsPulling(false)

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } catch (error) {
        console.error('Refresh failed:', error)
      }
      setIsRefreshing(false)
    }

    setPullDistance(0)
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: false }) // Changed to false to allow preventDefault
    container.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)  
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isPulling, pullDistance, threshold, isRefreshing])

  const shouldShowIndicator = isPulling && pullDistance > 20
  const isTriggered = pullDistance >= threshold

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      {/* Pull to refresh indicator */}
      <div 
        className={`absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200 ease-out ${
          shouldShowIndicator ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ 
          transform: `translateY(${Math.max(0, pullDistance - 40)}px)`,
          height: '60px'
        }}
      >
        <div className={`flex items-center space-x-2 px-4 py-2 rounded-full backdrop-blur-sm transition-all duration-200 ${
          isTriggered 
            ? 'bg-green-500/20 text-green-700 dark:text-green-300' 
            : 'bg-gray-500/20 text-gray-600 dark:text-gray-400'
        }`}>
          <RefreshCw 
            className={`w-4 h-4 transition-transform duration-200 ${
              isRefreshing ? 'animate-spin' : isTriggered ? 'rotate-180' : ''
            }`} 
          />
          <span className="text-sm font-medium">
            {isRefreshing 
              ? 'Refreshing...' 
              : isTriggered 
                ? 'Release to refresh' 
                : 'Pull to refresh'
            }
          </span>
        </div>
      </div>

      {/* Content with pull transform */}
      <div 
        className="transition-transform duration-200 ease-out"
        style={{ 
          transform: `translateY(${isPulling ? pullDistance * 0.5 : 0}px)` 
        }}
      >
        {children}
      </div>
    </div>
  )
}
