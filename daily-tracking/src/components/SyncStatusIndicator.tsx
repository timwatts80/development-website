/**
 * Sync Status Indicator - Shows current offline/sync status
 */

'use client';

import React from 'react';
import { useOfflineData } from '@/contexts/OfflineDataContext';

export function SyncStatusIndicator() {
  const { isOnline, syncStatus, forcSync } = useOfflineData();

  const getStatusInfo = () => {
    if (!isOnline) {
      return {
        icon: '📡',
        text: 'Offline',
        color: 'text-gray-500',
        bgColor: 'bg-gray-100',
        description: 'Working offline. Changes will sync when connected.'
      };
    }

    switch (syncStatus) {
      case 'syncing':
        return {
          icon: '🔄',
          text: 'Syncing',
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          description: 'Syncing your data...',
          animate: true
        };
      case 'synced':
        return {
          icon: '✅',
          text: 'Synced',
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          description: 'All changes saved and synced.'
        };
      case 'error':
        return {
          icon: '⚠️',
          text: 'Sync Error',
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          description: 'Unable to sync. Tap to retry.',
          clickable: true
        };
      default:
        return {
          icon: '🌐',
          text: 'Online',
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          description: 'Connected and ready.'
        };
    }
  };

  const statusInfo = getStatusInfo();

  const handleClick = () => {
    if (statusInfo.clickable) {
      forcSync().catch(console.error);
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <div
        className={`
          flex items-center gap-2 px-3 py-2 rounded-full shadow-lg border
          ${statusInfo.bgColor} ${statusInfo.color}
          ${statusInfo.clickable ? 'cursor-pointer hover:opacity-80' : ''}
          transition-all duration-200
        `}
        onClick={handleClick}
        title={statusInfo.description}
      >
        <span 
          className={`
            text-sm
            ${statusInfo.animate ? 'animate-spin' : ''}
          `} 
        >
          {statusInfo.icon}
        </span>
        <span className="text-sm font-medium">
          {statusInfo.text}
        </span>
      </div>
    </div>
  );
}

// Compact version for mobile/smaller screens
export function CompactSyncIndicator() {
  const { isOnline, syncStatus } = useOfflineData();

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
