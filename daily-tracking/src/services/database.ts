interface Task {
  id: string
  text: string
  completed: boolean
  type: 'habit' | 'task'
}

interface TaskGroup {
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

  // Task Groups
  static async getTaskGroups(): Promise<TaskGroup[]> {
    const response = await fetch(`${this.apiBaseUrl}/task-groups`)
    if (!response.ok) {
      throw new Error('Failed to fetch task groups')
    }
    const groups = await response.json()
    
    // Convert date strings back to Date objects
    return groups.map((group: any) => ({
      ...group,
      startDate: new Date(group.startDate),
      createdAt: new Date(group.createdAt)
    }))
  }

  static async createTaskGroup(groupData: Omit<TaskGroup, 'id' | 'createdAt'>): Promise<TaskGroup> {
    const response = await fetch(`${this.apiBaseUrl}/task-groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(groupData)
    })
    
    if (!response.ok) {
      throw new Error('Failed to create task group')
    }
    
    const group = await response.json()
    return {
      ...group,
      startDate: new Date(group.startDate),
      createdAt: new Date(group.createdAt)
    }
  }

  static async updateTaskGroup(groupData: TaskGroup): Promise<TaskGroup> {
    const response = await fetch(`${this.apiBaseUrl}/task-groups`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(groupData)
    })
    
    if (!response.ok) {
      throw new Error('Failed to update task group')
    }
    
    const group = await response.json()
    return {
      ...group,
      startDate: new Date(group.startDate),
      createdAt: new Date(group.createdAt)
    }
  }

  static async deleteTaskGroup(id: string): Promise<void> {
    const response = await fetch(`${this.apiBaseUrl}/task-groups?id=${id}`, {
      method: 'DELETE'
    })
    
    if (!response.ok) {
      throw new Error('Failed to delete task group')
    }
  }

  // Task Completions
  static async getTaskCompletions(date?: Date): Promise<TaskCompletion[]> {
    const url = date 
      ? `${this.apiBaseUrl}/task-completions?date=${date.toISOString()}`
      : `${this.apiBaseUrl}/task-completions`
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Failed to fetch task completions')
    }
    
    const completions = await response.json()
    return completions.map((completion: any) => ({
      ...completion,
      completedDate: new Date(completion.completedDate),
      createdAt: new Date(completion.createdAt)
    }))
  }

  static async updateTaskCompletion(
    taskId: string, 
    completed: boolean, 
    date?: Date
  ): Promise<TaskCompletion> {
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
      throw new Error('Failed to update task completion')
    }
    
    const completion = await response.json()
    return {
      ...completion,
      completedDate: new Date(completion.completedDate),
      createdAt: new Date(completion.createdAt)
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
}

export type { Task, TaskGroup, TaskCompletion }
