/**
 * PWA Update Manager - Handles service worker updates
 * Shows update notifications and allows users to control when updates are applied
 */

'use client';

import React, { useState, useEffect } from 'react';

interface UpdateManagerProps {
  onUpdateAvailable?: () => void;
  onUpdateApplied?: () => void;
}

export function PWAUpdateManager({ onUpdateAvailable, onUpdateApplied }: UpdateManagerProps) {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const registerUpdateHandlers = async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration) return;

        // Check if there's already an update waiting
        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
          setUpdateAvailable(true);
          onUpdateAvailable?.();
        }

        // Listen for new service worker installation
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New update is available
              setWaitingWorker(newWorker);
              setUpdateAvailable(true);
              onUpdateAvailable?.();
              console.log('PWA update available');
            }
          });
        });

        // Listen for controlling service worker change
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('PWA updated successfully');
          setIsUpdating(false);
          setUpdateAvailable(false);
          onUpdateApplied?.();
          // Reload the page to get the latest content
          window.location.reload();
        });

      } catch (error) {
        console.error('Failed to setup update handlers:', error);
      }
    };

    registerUpdateHandlers();

    // Check for updates every 30 minutes
    const updateCheckInterval = setInterval(() => {
      navigator.serviceWorker.getRegistration().then(registration => {
        if (registration) {
          registration.update();
        }
      });
    }, 30 * 60 * 1000); // 30 minutes

    return () => clearInterval(updateCheckInterval);
  }, [onUpdateAvailable, onUpdateApplied]);

  const applyUpdate = () => {
    if (!waitingWorker) return;

    setIsUpdating(true);
    
    // Tell the waiting service worker to skip waiting and become active
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
  };

  const dismissUpdate = () => {
    setUpdateAvailable(false);
    setWaitingWorker(null);
  };

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-400 text-sm">🔄</span>
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              App Update Available
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              A new version of Daily Tracker is ready to install.
            </p>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={applyUpdate}
            disabled={isUpdating}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium py-2 px-3 rounded-md transition-colors"
          >
            {isUpdating ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin text-xs">🔄</span>
                Updating...
              </span>
            ) : (
              'Update Now'
            )}
          </button>
          
          <button
            onClick={dismissUpdate}
            disabled={isUpdating}
            className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook for using update status in other components
export function usePWAUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  return {
    updateAvailable,
    isUpdating,
    onUpdateAvailable: () => setUpdateAvailable(true),
    onUpdateApplied: () => {
      setUpdateAvailable(false);
      setIsUpdating(false);
    }
  };
}
