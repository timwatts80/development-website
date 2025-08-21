import { getLocalDateString } from '@/utils/dateUtils'

export interface Task {
  id: string
  text: string
  completed: boolean
}

export interface TaskGroup {
  id: string
  name: string
  color: string
  duration: number
  startDate: Date
  tasks: Task[]
  createdAt: Date
}

interface TaskCompletion {
  id: string
  taskId: string
  completedDate: Date
  completed: boolean
  createdAt: Date
}

export class DatabaseService {
  private static apiBaseUrl = '/api'
  private static isStaticExport = typeof window !== 'undefined' && !window.location.pathname.startsWith('/api')

  // Check if we're in a static export environment
  private static async checkApiAvailability(): Promise<boolean> {
    if (typeof window === 'undefined') return true // Server-side, assume API is available
    
    try {
      const response = await fetch(`${this.apiBaseUrl}/task-groups`)
      return response.ok
    } catch {
      return false
    }
  }

  // Task Groups
  static async getTaskGroups(): Promise<TaskGroup[]> {
    // Try API first, fallback to localStorage
    try {
      const response = await fetch(`${this.apiBaseUrl}/task-groups`)
      if (!response.ok) {
        throw new Error('API not available')
      }
      
      // API is available, try to sync any pending changes
      try {
        await this.syncPendingChanges()
      } catch (syncError) {
        console.warn('Failed to sync pending changes:', syncError)
      }
      
      const groups = await response.json()
      
      // Convert date strings back to Date objects
      return groups.map((group: {
        id: string;
        name: string;
        color: string;
        duration: number;
        startDate: string;
        createdAt: string;
        tasks: Task[];
      }) => ({
        ...group,
        startDate: new Date(group.startDate),
        createdAt: new Date(group.createdAt)
      }))
    } catch {
      console.log('Using localStorage fallback for task groups')
      return this.getTaskGroupsFromLocalStorage()
    }
  }

  private static getTaskGroupsFromLocalStorage(): TaskGroup[] {
    try {
      const saved = localStorage.getItem('dailyTracker_taskGroups')
      if (!saved) return []
      
      const groups = JSON.parse(saved)
      return groups.map((group: {
        id: string;
        name: string;
        color: string;
        duration: number;
        startDate: string;
        createdAt: string;
        tasks: Task[];
      }) => ({
        ...group,
        startDate: new Date(group.startDate),
        createdAt: new Date(group.createdAt)
      }))
    } catch {
      return []
    }
  }

  static async createTaskGroup(groupData: Omit<TaskGroup, 'id' | 'createdAt'>): Promise<TaskGroup> {
    try {
      // Send startDate as a local date string (YYYY-MM-DD) to avoid timezone issues
      const dataToSend = {
        ...groupData,
        startDate: getLocalDateString(groupData.startDate)
      }
      
      console.log('🌐 Client: Sending task group data:', {
        originalStartDate: groupData.startDate,
        localDateString: dataToSend.startDate
      })

      const response = await fetch(`${this.apiBaseUrl}/task-groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      })
      
      if (!response.ok) {
        throw new Error('API not available')
      }
      
      const group = await response.json()
      return {
        ...group,
        startDate: new Date(group.startDate),
        createdAt: new Date(group.createdAt)
      }
    } catch {
      console.log('Using localStorage fallback for creating task group')
      return this.createTaskGroupInLocalStorage(groupData)
    }
  }

  private static createTaskGroupInLocalStorage(groupData: Omit<TaskGroup, 'id' | 'createdAt'>): TaskGroup {
    const newGroup: TaskGroup = {
      ...groupData,
      id: Date.now().toString(),
      createdAt: new Date()
    }
    
    const existing = this.getTaskGroupsFromLocalStorage()
    const updated = [...existing, newGroup]
    localStorage.setItem('dailyTracker_taskGroups', JSON.stringify(updated))
    
    return newGroup
  }

  static async updateTaskGroup(groupData: TaskGroup): Promise<TaskGroup> {
    try {
      // Transform the data to match API expectations and use consistent date format
      const apiData = {
        id: groupData.id,
        name: groupData.name,
        color: groupData.color,
        duration: groupData.duration,
        startDate: getLocalDateString(groupData.startDate), // Use same date format as create
        tasks: groupData.tasks // API expects 'tasks', not 'tasks: taskList'
      }

      console.log('🌐 Client: Updating task group data:', {
        originalStartDate: groupData.startDate,
        localDateString: apiData.startDate,
        groupId: groupData.id,
        groupName: groupData.name,
        apiData: apiData
      })

      const response = await fetch(`${this.apiBaseUrl}/task-groups`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData)
      })
      
      console.log('🌐 Client: PUT response status:', response.status)
      
      if (!response.ok) {
        console.error('🌐 Client: PUT request failed:', response.status, response.statusText)
        throw new Error('API not available')
      }
      
      const group = await response.json()
      console.log('🌐 Client: Received updated group from server:', group)
      
      // Clear any pending sync for this group since it succeeded
      this.clearPendingSync(groupData.id)
      
      return {
        ...group,
        startDate: new Date(group.startDate),
        createdAt: new Date(group.createdAt)
      }
    } catch (error) {
      console.log('🌐 Client: Using localStorage fallback for updating task group, error:', error)
      
      // Mark this group for sync when server becomes available
      this.markGroupForSync(groupData)
      
      return this.updateTaskGroupInLocalStorage(groupData)
    }
  }

  private static updateTaskGroupInLocalStorage(groupData: TaskGroup): TaskGroup {
    const existing = this.getTaskGroupsFromLocalStorage()
    const updated = existing.map(group => 
      group.id === groupData.id ? groupData : group
    )
    localStorage.setItem('dailyTracker_taskGroups', JSON.stringify(updated))
    return groupData
  }

  static async deleteTaskGroup(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/task-groups?id=${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('API not available')
      }
    } catch {
      console.log('Using localStorage fallback for deleting task group')
      this.deleteTaskGroupFromLocalStorage(id)
    }
  }

  private static deleteTaskGroupFromLocalStorage(id: string): void {
    const existing = this.getTaskGroupsFromLocalStorage()
    const updated = existing.filter(group => group.id !== id)
    localStorage.setItem('dailyTracker_taskGroups', JSON.stringify(updated))
  }

  // Task Completions
  static async getTaskCompletions(date?: Date): Promise<TaskCompletion[]> {
    try {
      const url = date 
        ? `${this.apiBaseUrl}/task-completions?date=${date.toISOString()}`
        : `${this.apiBaseUrl}/task-completions`
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('API not available')
      }
      
      const completions = await response.json()
      return completions.map((completion: {
        id: string;
        taskId: string;
        completedDate: string;
        completed: boolean;
        createdAt: string;
      }) => ({
        ...completion,
        completedDate: new Date(completion.completedDate),
        createdAt: new Date(completion.createdAt)
      }))
    } catch {
      console.log('Using localStorage fallback for task completions')
      return this.getTaskCompletionsFromLocalStorage(date)
    }
  }

  private static getTaskCompletionsFromLocalStorage(date?: Date): TaskCompletion[] {
    try {
      const saved = localStorage.getItem('dailyTracker_completionState')
      if (!saved) return []
      
      const completionState = JSON.parse(saved)
      const targetDate = date || new Date()
      
      // Convert completion state to TaskCompletion format
      return Object.entries(completionState)
        .filter(([, completed]) => completed)
        .map(([taskId]) => ({
          id: `local-${taskId}-${targetDate.toISOString().split('T')[0]}`,
          taskId,
          completedDate: targetDate,
          completed: true,
          createdAt: new Date()
        }))
    } catch (error) {
      console.error('Failed to load completions from localStorage:', error)
      return []
    }
  }

  static async updateTaskCompletion(
    taskId: string, 
    completed: boolean, 
    date?: Date
  ): Promise<TaskCompletion> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/task-completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          completed,
          date: date?.toISOString()
        })
      })
      
      if (!response.ok) {
        throw new Error('API not available')
      }
      
      const completion = await response.json()
      return {
        ...completion,
        completedDate: new Date(completion.completedDate),
        createdAt: new Date(completion.createdAt)
      }
    } catch {
      console.log('Using localStorage fallback for task completion')
      return this.updateTaskCompletionInLocalStorage(taskId, completed, date)
    }
  }

  private static updateTaskCompletionInLocalStorage(
    taskId: string, 
    completed: boolean, 
    date?: Date
  ): TaskCompletion {
    try {
      const saved = localStorage.getItem('dailyTracker_completionState') || '{}'
      const completionState = JSON.parse(saved)
      
      completionState[taskId] = completed
      localStorage.setItem('dailyTracker_completionState', JSON.stringify(completionState))
      
      const targetDate = date || new Date()
      return {
        id: `local-${taskId}-${targetDate.toISOString().split('T')[0]}`,
        taskId,
        completedDate: targetDate,
        completed,
        createdAt: new Date()
      }
    } catch (error) {
      console.error('Failed to update localStorage completion:', error)
      throw error
    }
  }

  // Migration from localStorage
  static async migrateFromLocalStorage() {
    try {
      const localGroups = localStorage.getItem('dailyTracker_taskGroups')
      const localCompletions = localStorage.getItem('dailyTracker_completionState')
      
      if (localGroups) {
        const groups = JSON.parse(localGroups)
        
        for (const group of groups) {
          try {
            await this.createTaskGroup({
              name: group.name,
              color: group.color,
              duration: group.duration,
              startDate: new Date(group.startDate),
              tasks: group.tasks
            })
          } catch (error) {
            console.warn('Failed to migrate group:', group.name, error)
          }
        }
        
        console.log('Successfully migrated task groups from localStorage')
      }
      
      if (localCompletions) {
        const completions = JSON.parse(localCompletions)
        
        for (const [taskId, completed] of Object.entries(completions)) {
          if (completed) {
            try {
              await this.updateTaskCompletion(taskId, true, new Date())
            } catch (error) {
              console.warn('Failed to migrate completion for task:', taskId, error)
            }
          }
        }
        
        console.log('Successfully migrated task completions from localStorage')
      }
      
      return true
    } catch (error) {
      console.error('Migration failed:', error)
      return false
    }
  }

  // Sync tracking methods for offline changes
  private static PENDING_SYNC_KEY = 'dailyTracker_pendingSync'

  private static markGroupForSync(groupData: TaskGroup): void {
    try {
      const pending = JSON.parse(localStorage.getItem(this.PENDING_SYNC_KEY) || '{}')
      pending[groupData.id] = {
        ...groupData,
        startDate: groupData.startDate.toISOString(),
        syncType: 'update',
        timestamp: new Date().toISOString()
      }
      localStorage.setItem(this.PENDING_SYNC_KEY, JSON.stringify(pending))
      console.log('🔄 Marked group for sync:', groupData.id)
    } catch (error) {
      console.error('Failed to mark group for sync:', error)
    }
  }

  private static clearPendingSync(groupId: string): void {
    try {
      const pending = JSON.parse(localStorage.getItem(this.PENDING_SYNC_KEY) || '{}')
      delete pending[groupId]
      localStorage.setItem(this.PENDING_SYNC_KEY, JSON.stringify(pending))
      console.log('🔄 Cleared pending sync for group:', groupId)
    } catch (error) {
      console.error('Failed to clear pending sync:', error)
    }
  }

  static async syncPendingChanges(): Promise<void> {
    try {
      const pending = JSON.parse(localStorage.getItem(this.PENDING_SYNC_KEY) || '{}')
      const pendingIds = Object.keys(pending)
      
      if (pendingIds.length === 0) {
        console.log('🔄 No pending changes to sync')
        return
      }

      console.log('🔄 Syncing pending changes for groups:', pendingIds)

      for (const groupId of pendingIds) {
        try {
          const groupData = pending[groupId]
          // Reconstruct the TaskGroup object
          const taskGroup: TaskGroup = {
            ...groupData,
            startDate: new Date(groupData.startDate)
          }
          
          // Try to sync with server
          await this.updateTaskGroup(taskGroup)
          console.log('🔄 Successfully synced group:', groupId)
        } catch (error) {
          console.warn('🔄 Failed to sync group:', groupId, error)
          // Keep in pending list for next attempt
        }
      }
    } catch (error) {
      console.error('Failed to sync pending changes:', error)
    }
  }
}
