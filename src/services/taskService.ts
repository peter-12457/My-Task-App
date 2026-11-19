import { apiRequest } from './api'
import type { PaginatedTasks, Task, TaskInput } from '../types/task'

export type TaskListResponse = Task[] | PaginatedTasks

export interface TaskQuery {
  search?: string
  status?: string
  priority?: string
  assignee?: string
  dueBefore?: string
  dueAfter?: string
  page?: number
  limit?: number
  sortBy?: string
  order?: 'asc' | 'desc'
}

export async function getTasks(query: TaskQuery = {}, signal?: AbortSignal): Promise<TaskListResponse> {
  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.set(key, String(value))
    }
  })
  const suffix = params.toString() ? `?${params.toString()}` : ''
  return apiRequest<TaskListResponse>(`/tasks${suffix}`, { signal })
}

export async function getTaskById(id: string, signal?: AbortSignal): Promise<Task> {
  return apiRequest<Task>(`/tasks/${encodeURIComponent(id)}`, { signal })
}

export async function createTask(input: TaskInput): Promise<Task> {
  return apiRequest<Task>('/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export async function updateTask(id: string, input: Partial<TaskInput>): Promise<Task> {
  return apiRequest<Task>(`/tasks/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export async function deleteTask(id: string): Promise<void> {
  return apiRequest<void>(`/tasks/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export function tasksFromResponse(response: TaskListResponse): Task[] {
  return Array.isArray(response) ? response : response.tasks
}
