export type TaskPriority = 'Low' | 'Medium' | 'High'
export type TaskStatus = 'Pending' | 'In Progress' | 'Completed'

export interface Task {
  id: string
  title: string
  description?: string | null
  assignee?: string | null
  category?: string | null
  priority: TaskPriority
  status: TaskStatus
  dueDate?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface TaskInput {
  title: string
  description?: string
  assignee?: string
  category?: string
  priority: TaskPriority
  status: TaskStatus
  dueDate?: string
}

export interface PaginatedTasks {
  tasks: Task[]
  page: number
  limit: number
  total: number
  totalPages: number
}
