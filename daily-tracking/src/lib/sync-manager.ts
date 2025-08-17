/**
 * Data synchronization queue manager for offline functionality
 * Handles queueing CRUD operations and syncing when online
 */

import { offlineDB, OfflineEntry, OfflineCategory } from './offline-db';

export interface SyncOperation {
  id?: number;
  operation: 'create' | 'update' | 'delete';
  entityType: 'entry' | 'category';
  entityId: string;
  data?: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

class SyncManager {
  private isOnline: boolean = true;
  private syncInterval: NodeJS.Timeout | null = null;
  private listeners: Array<(status: 'syncing' | 'synced' | 'offline' | 'error') => void> = [];

  constructor() {
    // Monitor online/offline status
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.startSync();
      });
      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.notifyListeners('offline');
      });
    }
  }

  // Add sync status listener
  onSyncStatusChange(callback: (status: 'syncing' | 'synced' | 'offline' | 'error') => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyListeners(status: 'syncing' | 'synced' | 'offline' | 'error') {
    this.listeners.forEach(listener => listener(status));
  }

  // Queue operations for sync
  async queueOperation(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    const syncOp: SyncOperation = {
      ...operation,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 3
    };

    await this.addToSyncQueue(syncOp);

    // If online, try to sync immediately
    if (this.isOnline) {
      this.startSync();
    }
  }

  private async addToSyncQueue(operation: SyncOperation): Promise<void> {
    // This would typically go to IndexedDB sync queue
    // For now, we'll handle it directly
    console.log('Queued sync operation:', operation);
  }

  // Start syncing process
  async startSync(): Promise<void> {
    if (!this.isOnline) return;

    this.notifyListeners('syncing');

    try {
      // Get pending entries and sync them
      const pendingEntries = await offlineDB.getPendingSync();
      
      for (const entry of pendingEntries) {
        await this.syncEntry(entry);
      }

      // Start periodic sync
      if (!this.syncInterval) {
        this.syncInterval = setInterval(() => {
          if (this.isOnline) {
            this.periodicSync();
          }
        }, 30000); // Sync every 30 seconds
      }

      this.notifyListeners('synced');
    } catch (error) {
      console.error('Sync failed:', error);
      this.notifyListeners('error');
    }
  }

  private async syncEntry(entry: OfflineEntry): Promise<void> {
    try {
      if (entry.sync.serverId) {
        // Update existing entry
        await this.updateEntryOnServer(entry);
      } else {
        // Create new entry
        const serverId = await this.createEntryOnServer(entry);
        await offlineDB.markSynced(entry.id, serverId);
      }
    } catch (error) {
      console.error('Failed to sync entry:', entry.id, error);
      // Mark as conflict for manual resolution
      entry.sync.syncStatus = 'conflict';
      await offlineDB.saveEntry(entry);
    }
  }

  private async createEntryOnServer(entry: OfflineEntry): Promise<string> {
    const response = await fetch('/api/entries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        date: entry.date,
        category: entry.category,
        notes: entry.notes,
        completed: entry.completed
      }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const result = await response.json();
    return result.id;
  }

  private async updateEntryOnServer(entry: OfflineEntry): Promise<void> {
    const response = await fetch(`/api/entries/${entry.sync.serverId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        date: entry.date,
        category: entry.category,
        notes: entry.notes,
        completed: entry.completed
      }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    await offlineDB.markSynced(entry.id, entry.sync.serverId);
  }

  private async periodicSync(): Promise<void> {
    // Fetch latest data from server and check for conflicts
    try {
      const response = await fetch('/api/entries');
      if (response.ok) {
        const serverEntries = await response.json();
        await this.reconcileWithServer(serverEntries);
      }
    } catch (error) {
      console.error('Periodic sync failed:', error);
    }
  }

  private async reconcileWithServer(serverEntries: any[]): Promise<void> {
    // Simple reconciliation - server wins for now
    // In a more sophisticated implementation, we'd check timestamps
    // and implement proper conflict resolution
    
    for (const serverEntry of serverEntries) {
      const localEntries = await offlineDB.getEntries(serverEntry.date);
      const existingLocal = localEntries.find(e => e.sync.serverId === serverEntry.id);
      
      if (!existingLocal) {
        // New entry from server - add to local DB
        const localEntry: OfflineEntry = {
          id: `local_${Date.now()}_${Math.random()}`,
          date: serverEntry.date,
          category: serverEntry.categoryId,
          notes: serverEntry.notes,
          completed: serverEntry.completed,
          createdAt: new Date(serverEntry.createdAt).getTime(),
          updatedAt: new Date(serverEntry.updatedAt).getTime(),
          sync: {
            lastModified: Date.now(),
            syncStatus: 'synced',
            serverId: serverEntry.id,
            localId: `local_${Date.now()}_${Math.random()}`
          }
        };
        
        await offlineDB.saveEntry(localEntry);
      }
    }
  }

  // Manual conflict resolution
  async resolveConflict(localEntry: OfflineEntry, useLocal: boolean): Promise<void> {
    if (useLocal) {
      // Force update server with local data
      await this.updateEntryOnServer(localEntry);
      localEntry.sync.syncStatus = 'synced';
    } else {
      // Fetch and use server data (implement based on needs)
      localEntry.sync.syncStatus = 'synced';
    }
    
    await offlineDB.saveEntry(localEntry);
  }

  // Get current sync status
  getSyncStatus(): 'online' | 'offline' | 'syncing' | 'error' {
    if (!this.isOnline) return 'offline';
    // Add more sophisticated status tracking as needed
    return 'online';
  }
}

export const syncManager = new SyncManager();
