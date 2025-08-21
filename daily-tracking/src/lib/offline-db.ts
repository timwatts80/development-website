/**
 * IndexedDB client-side database for offline functionality
 * Mirrors server database structure with sync metadata
 */

export interface SyncMetadata {
  lastModified: number;
  syncStatus: 'pending' | 'synced' | 'conflict';
  serverId?: string;
  localId: string;
}

export interface OfflineEntry {
  id: string;
  date: string;
  category: string;
  notes?: string;
  completed: boolean;
  createdAt: number;
  updatedAt: number;
  sync: SyncMetadata;
}

export interface OfflineCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
  createdAt: number;
  updatedAt: number;
  sync: SyncMetadata;
}

class OfflineDatabase {
  private dbName = 'DailyTrackerDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Entries store
        if (!db.objectStoreNames.contains('entries')) {
          const entriesStore = db.createObjectStore('entries', { keyPath: 'id' });
          entriesStore.createIndex('date', 'date');
          entriesStore.createIndex('category', 'category');
          entriesStore.createIndex('syncStatus', 'sync.syncStatus');
        }

        // Categories store
        if (!db.objectStoreNames.contains('categories')) {
          const categoriesStore = db.createObjectStore('categories', { keyPath: 'id' });
          categoriesStore.createIndex('name', 'name');
          categoriesStore.createIndex('syncStatus', 'sync.syncStatus');
        }

        // Sync queue store for pending operations
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncQueueStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
          syncQueueStore.createIndex('timestamp', 'timestamp');
          syncQueueStore.createIndex('operation', 'operation');
        }
      };
    });
  }

  // Entry operations
  async getEntries(date?: string): Promise<OfflineEntry[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['entries'], 'readonly');
      const store = transaction.objectStore('entries');
      
      let request: IDBRequest;
      if (date) {
        const index = store.index('date');
        request = index.getAll(date);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveEntry(entry: OfflineEntry): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['entries'], 'readwrite');
      const store = transaction.objectStore('entries');
      const request = store.put(entry);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteEntry(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['entries'], 'readwrite');
      const store = transaction.objectStore('entries');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Category operations
  async getCategories(): Promise<OfflineCategory[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['categories'], 'readonly');
      const store = transaction.objectStore('categories');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveCategory(category: OfflineCategory): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['categories'], 'readwrite');
      const store = transaction.objectStore('categories');
      const request = store.put(category);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Sync operations
  async getPendingSync(): Promise<OfflineEntry[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['entries'], 'readonly');
      const store = transaction.objectStore('entries');
      const index = store.index('syncStatus');
      const request = index.getAll('pending');

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async markSynced(id: string, serverId?: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const entry = await this.getEntry(id);
    if (!entry) return;

    entry.sync.syncStatus = 'synced';
    entry.sync.lastModified = Date.now();
    if (serverId) entry.sync.serverId = serverId;

    await this.saveEntry(entry);
  }

  private async getEntry(id: string): Promise<OfflineEntry | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['entries'], 'readonly');
      const store = transaction.objectStore('entries');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }
}

export const offlineDB = new OfflineDatabase();
