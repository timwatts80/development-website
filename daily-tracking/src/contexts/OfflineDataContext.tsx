/**
 * Offline-first data context for Daily Tracker
 * Manages both local IndexedDB and server synchronization
 */

'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { offlineDB, OfflineEntry, OfflineCategory } from '@/lib/offline-db';
import { syncManager } from '@/lib/sync-manager';

interface OfflineDataContextType {
  // Data
  entries: OfflineEntry[];
  categories: OfflineCategory[];
  
  // Status
  isOnline: boolean;
  syncStatus: 'syncing' | 'synced' | 'offline' | 'error';
  
  // Operations
  addEntry: (entry: Omit<OfflineEntry, 'id' | 'createdAt' | 'updatedAt' | 'sync'>) => Promise<void>;
  updateEntry: (id: string, updates: Partial<OfflineEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  getEntriesForDate: (date: string) => OfflineEntry[];
  
  // Sync
  forcSync: () => Promise<void>;
  resolveConflict: (entryId: string, useLocal: boolean) => Promise<void>;
}

const OfflineDataContext = createContext<OfflineDataContextType | undefined>(undefined);

interface OfflineDataProviderProps {
  children: ReactNode;
}

export function OfflineDataProvider({ children }: OfflineDataProviderProps) {
  const [entries, setEntries] = useState<OfflineEntry[]>([]);
  const [categories, setCategories] = useState<OfflineCategory[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'syncing' | 'synced' | 'offline' | 'error'>('synced');

  // Initialize IndexedDB and load data
  useEffect(() => {
    const initializeOfflineData = async () => {
      try {
        await offlineDB.init();
        await loadLocalData();
        
        // Set up sync status listener
        const unsubscribe = syncManager.onSyncStatusChange((status) => {
          setSyncStatus(status);
        });

        // Start syncing if online
        if (navigator.onLine) {
          await syncManager.startSync();
        }

        return unsubscribe;
      } catch (error) {
        console.error('Failed to initialize offline data:', error);
      }
    };

    initializeOfflineData();

    // Monitor online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      syncManager.startSync();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadLocalData = async () => {
    try {
      const localEntries = await offlineDB.getEntries();
      const localCategories = await offlineDB.getCategories();
      
      setEntries(localEntries);
      setCategories(localCategories);
    } catch (error) {
      console.error('Failed to load local data:', error);
    }
  };

  const addEntry = async (entryData: Omit<OfflineEntry, 'id' | 'createdAt' | 'updatedAt' | 'sync'>) => {
    const now = Date.now();
    const entry: OfflineEntry = {
      ...entryData,
      id: `local_${now}_${Math.random()}`,
      createdAt: now,
      updatedAt: now,
      sync: {
        lastModified: now,
        syncStatus: 'pending',
        localId: `local_${now}_${Math.random()}`
      }
    };

    try {
      // Save to local DB
      await offlineDB.saveEntry(entry);
      
      // Update state
      setEntries(prev => [...prev, entry]);
      
      // Queue for sync
      await syncManager.queueOperation({
        operation: 'create',
        entityType: 'entry',
        entityId: entry.id,
        data: entryData,
        maxRetries: 3
      });
      
    } catch (error) {
      console.error('Failed to add entry:', error);
      throw error;
    }
  };

  const updateEntry = async (id: string, updates: Partial<OfflineEntry>) => {
    try {
      const existingEntry = entries.find(e => e.id === id);
      if (!existingEntry) throw new Error('Entry not found');

      const updatedEntry: OfflineEntry = {
        ...existingEntry,
        ...updates,
        updatedAt: Date.now(),
        sync: {
          ...existingEntry.sync,
          lastModified: Date.now(),
          syncStatus: 'pending'
        }
      };

      // Save to local DB
      await offlineDB.saveEntry(updatedEntry);
      
      // Update state
      setEntries(prev => prev.map(e => e.id === id ? updatedEntry : e));
      
      // Queue for sync
      await syncManager.queueOperation({
        operation: 'update',
        entityType: 'entry',
        entityId: id,
        data: updates,
        maxRetries: 3
      });
      
    } catch (error) {
      console.error('Failed to update entry:', error);
      throw error;
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      // Remove from local DB
      await offlineDB.deleteEntry(id);
      
      // Update state
      setEntries(prev => prev.filter(e => e.id !== id));
      
      // Queue for sync
      await syncManager.queueOperation({
        operation: 'delete',
        entityType: 'entry',
        entityId: id,
        maxRetries: 3
      });
      
    } catch (error) {
      console.error('Failed to delete entry:', error);
      throw error;
    }
  };

  const getEntriesForDate = (date: string): OfflineEntry[] => {
    return entries.filter(entry => entry.date === date);
  };

  const forcSync = async () => {
    try {
      await syncManager.startSync();
    } catch (error) {
      console.error('Force sync failed:', error);
      throw error;
    }
  };

  const resolveConflict = async (entryId: string, useLocal: boolean) => {
    try {
      const entry = entries.find(e => e.id === entryId);
      if (!entry) throw new Error('Entry not found');

      await syncManager.resolveConflict(entry, useLocal);
      await loadLocalData(); // Refresh data
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      throw error;
    }
  };

  const value: OfflineDataContextType = {
    entries,
    categories,
    isOnline,
    syncStatus,
    addEntry,
    updateEntry,
    deleteEntry,
    getEntriesForDate,
    forcSync,
    resolveConflict
  };

  return (
    <OfflineDataContext.Provider value={value}>
      {children}
    </OfflineDataContext.Provider>
  );
}

export function useOfflineData() {
  const context = useContext(OfflineDataContext);
  if (context === undefined) {
    throw new Error('useOfflineData must be used within an OfflineDataProvider');
  }
  return context;
}
