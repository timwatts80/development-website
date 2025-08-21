/**
 * Sync Status Indicator - Shows temporary toast notifications for sync status
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useOfflineData } from '@/contexts/OfflineDataContext';

export function SyncStatusIndicator() {
  const { isOnline, syncStatus, forcSync } = useOfflineData();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'syncing'>('success');

  useEffect(() => {
    // Show toast for different sync states
    if (syncStatus === 'syncing') {
      setToastMessage('Syncing your data...');
      setToastType('syncing');
      setShowToast(true);
    } else if (syncStatus === 'synced') {
      setToastMessage('All changes synced');
      setToastType('success');
      setShowToast(true);
      // Hide success toast after 2 seconds
      const timer = setTimeout(() => setShowToast(false), 2000);
      return () => clearTimeout(timer);
    } else if (syncStatus === 'error') {
      setToastMessage('Sync failed - tap to retry');
      setToastType('error');
      setShowToast(true);
      // Keep error visible longer (5 seconds)
      const timer = setTimeout(() => setShowToast(false), 5000);
      return () => clearTimeout(timer);
    } else if (!isOnline) {
      setToastMessage('Working offline');
      setToastType('error');
      setShowToast(true);
      // Hide offline message after 3 seconds (user probably knows they're offline)
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [syncStatus, isOnline]);

  const getToastStyles = () => {
    switch (toastType) {
      case 'syncing':
        return {
          icon: '🔄',
          bgColor: 'bg-blue-100 border-blue-200',
          textColor: 'text-blue-700',
          animate: true
        };
      case 'success':
        return {
          icon: '✅',
          bgColor: 'bg-green-100 border-green-200',
          textColor: 'text-green-700',
          animate: false
        };
      case 'error':
        return {
          icon: '⚠️',
          bgColor: 'bg-red-100 border-red-200',
          textColor: 'text-red-700',
          animate: false
        };
      default:
        return {
          icon: '🌐',
          bgColor: 'bg-gray-100 border-gray-200',
          textColor: 'text-gray-700',
          animate: false
        };
    }
  };

  const handleClick = () => {
    if (toastType === 'error' && isOnline) {
      forcSync().catch(console.error);
    }
  };

  if (!showToast) return null;

  const styles = getToastStyles();

  return (
    <div 
      className={`
        fixed top-4 left-1/2 transform -translate-x-1/2 z-50 
        transition-all duration-500 ease-out
        ${showToast ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-full opacity-0 scale-95'}
      `}
    >
      <div
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg border
          ${styles.bgColor} ${styles.textColor}
          ${toastType === 'error' && isOnline ? 'cursor-pointer hover:opacity-80' : ''}
          transition-all duration-200 min-w-[140px]
          ${showToast ? 'animate-bounce-once' : ''}
        `}
        onClick={handleClick}
        title={toastType === 'error' && isOnline ? 'Tap to retry sync' : toastMessage}
      >
        <span 
          className={`
            text-sm
            ${styles.animate ? 'animate-spin' : ''}
          `} 
        >
          {styles.icon}
        </span>
        <span className="text-xs font-medium whitespace-nowrap">
          {toastMessage}
        </span>
      </div>
    </div>
  );
}

// Compact version for mobile/smaller screens - also toast-style
export function CompactSyncIndicator() {
  const { isOnline, syncStatus } = useOfflineData();
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    // Only show during syncing or errors
    if (syncStatus === 'syncing' || syncStatus === 'error' || !isOnline) {
      setShowIndicator(true);
    } else {
      // Hide after successful sync
      const timer = setTimeout(() => setShowIndicator(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [syncStatus, isOnline]);

  if (!showIndicator) return null;

  const getStatusInfo = () => {
    if (!isOnline) return { color: 'bg-gray-400', text: 'Offline', icon: '📡' };
    
    switch (syncStatus) {
      case 'syncing': return { color: 'bg-blue-500 animate-pulse', text: 'Syncing...', icon: '🔄' };
      case 'synced': return { color: 'bg-green-500', text: 'Synced', icon: '✅' };
      case 'error': return { color: 'bg-red-500', text: 'Error', icon: '⚠️' };
      default: return { color: 'bg-green-500', text: 'Online', icon: '🌐' };
    }
  };

  const status = getStatusInfo();

  return (
    <div className="flex items-center gap-2">
      <div 
        className={`
          w-2 h-2 rounded-full 
          ${status.color}
        `}
        title={`Status: ${status.text}`}
      />
      <span className="text-xs text-gray-600">
        {status.text}
      </span>
    </div>
  );
}
