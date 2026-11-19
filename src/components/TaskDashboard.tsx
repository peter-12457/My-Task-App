import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError } from '../services/api'
import {
  createTask,
  deleteTask,
  getTasks,
  tasksFromResponse,
  updateTask,
} from '../services/taskService'
import type { Task, TaskInput, TaskPriority, TaskStatus, PaginatedTasks } from '../types/task'
import { useAuth } from '../context/AuthContext'

export function TaskDashboard() {
  const { session, logout } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [assigneeFilter, setAssigneeFilter] = useState('')
  const [dueBefore, setDueBefore] = useState('')
  const [dueAfter, setDueAfter] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<PaginatedTasks>({
    tasks: [],
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

  const loadTasks = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError('')
    try {
      const response = await getTasks({
        search: debouncedSearch,
        status: statusFilter,
        priority: priorityFilter,
        assignee: assigneeFilter,
        dueBefore,
        dueAfter,
        page,
        limit: 10,
      }, signal)
      setTasks(tasksFromResponse(response))
      if (Array.isArray(response)) {
        setPagination({ tasks: response, page: 1, limit: response.length, total: response.length, totalPages: 1 })
      } else {
        setPagination(response)
        if (response.totalPages > 0 && page > response.totalPages) {
          setPage(response.totalPages)
        }
      }
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === 'AbortError') return
      setError(requestError instanceof Error ? requestError.message : 'Unable to load tasks.')
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [assigneeFilter, debouncedSearch, dueAfter, dueBefore, page, priorityFilter, statusFilter])

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 350)
    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      void loadTasks(controller.signal)
    }, 0)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [loadTasks])

  async function handleSave(input: TaskInput) {
    if (editingTask) {
      const changes: Partial<TaskInput> = {}
      if (input.title !== editingTask.title) changes.title = input.title
      if ((input.description || '') !== (editingTask.description || '')) changes.description = input.description
      if ((input.assignee || '') !== (editingTask.assignee || '')) changes.assignee = input.assignee
      if ((input.category || '') !== (editingTask.category || '')) changes.category = input.category
      if (input.priority !== editingTask.priority) changes.priority = input.priority
      if (input.status !== editingTask.status) changes.status = input.status
      if ((input.dueDate || '') !== (editingTask.dueDate || '')) changes.dueDate = input.dueDate

      if (Object.keys(changes).length === 0) {
        throw new ApiError(400, 'Change at least one task field.')
      }

      const updated = await updateTask(editingTask.id, changes)
      setTasks((current) => current.map((task) => task.id === updated.id ? updated : task))
      setMessage('Task updated.')
    } else {
      const created = await createTask(input)
      setTasks((current) => [created, ...current])
      setMessage('Task created.')
      setPage(1)
    }

    setEditingTask(null)
    setShowForm(false)
    if (!editingTask) {
      setPage(1)
      await loadTasks()
    } else {
      await loadTasks()
    }
  }

  async function handleDelete(task: Task) {
    if (!window.confirm(`Delete "${task.title}"?`)) return
    setError('')
    setMessage('')
    try {
      await deleteTask(task.id)
      setTasks((current) => current.filter((item) => item.id !== task.id))
      setMessage('Task deleted.')
      if (tasks.length === 1 && page > 1) {
        setPage((current) => current - 1)
      } else {
        await loadTasks()
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to delete task.')
    }
  }

  function openCreate() {
    setEditingTask(null)
    setShowForm(true)
    setMessage('')
  }

  function openEdit(task: Task) {
    setEditingTask(task)
    setShowForm(true)
    setMessage('')
  }

  async function handleLogout() {
    if (signingOut) return
    setSigningOut(true)
    try {
      await logout()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Logout failed.')
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <main className="task-layout">
      <header className="task-header">
        <div>
          <h1>TaskFlow</h1>
          <p>{session?.user?.name || session?.user?.email}</p>
        </div>
        <div className="header-actions">
          <button type="button" onClick={openCreate}>Add task</button>
          <button type="button" className="secondary-button" onClick={handleLogout} disabled={signingOut}>
            {signingOut ? 'Signing out...' : 'Sign out'}
          </button>
        </div>
      </header>

      <section className="task-controls" aria-label="Search and filter tasks">
        <div className="search-row">
          <label htmlFor="task-search">Search</label>
          <input
            id="task-search"
            type="search"
            value={search}
            placeholder="Search titles and descriptions"
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
          />
        </div>
        <div className="filter-grid">
          <div>
            <label htmlFor="status-filter">Status</label>
            <select id="status-filter" value={statusFilter} onChange={(event) => {
              setStatusFilter(event.target.value)
              setPage(1)
            }}>
              <option value="">All statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <div>
            <label htmlFor="priority-filter">Priority</label>
            <select id="priority-filter" value={priorityFilter} onChange={(event) => {
              setPriorityFilter(event.target.value)
              setPage(1)
            }}>
              <option value="">All priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
          <div>
            <label htmlFor="assignee-filter">Assignee</label>
            <input
              id="assignee-filter"
              value={assigneeFilter}
              placeholder="Assignee"
              onChange={(event) => {
                setAssigneeFilter(event.target.value)
                setPage(1)
              }}
            />
          </div>
          <div>
            <label htmlFor="due-after">Due after</label>
            <input id="due-after" type="date" value={dueAfter} onChange={(event) => {
              setDueAfter(event.target.value)
              setPage(1)
            }} />
          </div>
          <div>
            <label htmlFor="due-before">Due before</label>
            <input id="due-before" type="date" value={dueBefore} onChange={(event) => {
              setDueBefore(event.target.value)
              setPage(1)
            }} />
          </div>
          <button
            type="button"
            className="secondary-button clear-button"
            onClick={() => {
              setSearch('')
              setDebouncedSearch('')
              setStatusFilter('')
              setPriorityFilter('')
              setAssigneeFilter('')
              setDueBefore('')
              setDueAfter('')
              setPage(1)
            }}
          >
            Clear filters
          </button>
        </div>
      </section>

      {message && <p className="form-message success" role="status">{message}</p>}
      {error && (
        <div className="error-banner" role="alert">
          <span>{error}</span>
          <button type="button" className="link-button" onClick={() => void loadTasks()}>Retry</button>
        </div>
      )}

      {showForm && (
        <TaskForm
          task={editingTask}
          onSave={handleSave}
          onCancel={() => {
            setEditingTask(null)
            setShowForm(false)
          }}
        />
      )}

      {loading ? (
        <p role="status">Loading tasks...</p>
      ) : tasks.length === 0 ? (
        <section className="empty-state">
          <h2>{search || debouncedSearch || statusFilter || priorityFilter || assigneeFilter || dueBefore || dueAfter ? 'No matching tasks' : 'No tasks yet'}</h2>
          <p>{search || debouncedSearch || statusFilter || priorityFilter || assigneeFilter || dueBefore || dueAfter
            ? 'Try changing or clearing the search and filters.'
            : 'Create your first task to get started.'}</p>
          {!search && !statusFilter && !priorityFilter && !assigneeFilter && !dueBefore && !dueAfter && (
            <button type="button" onClick={openCreate}>Add task</button>
          )}
        </section>
      ) : (
        <section className="task-grid" aria-label="Tasks">
          {tasks.map((task) => (
            <article className="task-card" key={task.id}>
              <div className="task-card-header">
                <h2>{task.title}</h2>
                <span className={`status status-${task.status.toLowerCase().replaceAll(' ', '-')}`}>
                  {task.status}
                </span>
              </div>
              {task.description && <p>{task.description}</p>}
              <dl>
                {task.assignee && <><dt>Assignee</dt><dd>{task.assignee}</dd></>}
                {task.category && <><dt>Category</dt><dd>{task.category}</dd></>}
                <dt>Priority</dt><dd>{task.priority}</dd>
                {task.dueDate && <><dt>Due</dt><dd>{task.dueDate}</dd></>}
              </dl>
              <div className="task-actions">
                <button type="button" onClick={() => openEdit(task)}>Edit</button>
                <button type="button" className="danger-button" onClick={() => void handleDelete(task)}>Delete</button>
              </div>
            </article>
          ))}
        </section>
      )}

      <nav className="pagination" aria-label="Task pagination">
        <button
          type="button"
          className="secondary-button"
          disabled={loading || page <= 1}
          onClick={() => setPage((current) => Math.max(1, current - 1))}
        >
          Previous
        </button>
        <p>
          Page {pagination.totalPages > 0 ? page : 1} of {Math.max(1, pagination.totalPages)}
          {pagination.total > 0 ? ` · ${pagination.total} task${pagination.total === 1 ? '' : 's'}` : ''}
        </p>
        <button
          type="button"
          className="secondary-button"
          disabled={loading || page >= pagination.totalPages}
          onClick={() => setPage((current) => current + 1)}
        >
          Next
        </button>
      </nav>
    </main>
  )
}

interface TaskFormProps {
  task: Task | null
  onSave: (input: TaskInput) => Promise<void>
  onCancel: () => void
}

function TaskForm({ task, onSave, onCancel }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title || '')
  const [description, setDescription] = useState(task?.description || '')
  const [assignee, setAssignee] = useState(task?.assignee || '')
  const [category, setCategory] = useState(task?.category || '')
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || 'Medium')
  const [status, setStatus] = useState<TaskStatus>(task?.status || 'Pending')
  const [dueDate, setDueDate] = useState(task?.dueDate || '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    if (title.trim().length === 0) {
      setError('Enter a task title.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        assignee: assignee.trim(),
        category: category.trim(),
        priority,
        status,
        dueDate,
      })
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to save task.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <h2>{task ? 'Edit task' : 'Add task'}</h2>
      <label htmlFor="task-title">Title</label>
      <input id="task-title" value={title} maxLength={200} required onChange={(event) => setTitle(event.target.value)} />

      <label htmlFor="task-description">Description</label>
      <textarea id="task-description" value={description} maxLength={5000} onChange={(event) => setDescription(event.target.value)} />

      <div className="task-form-grid">
        <div>
          <label htmlFor="task-assignee">Assignee</label>
          <input id="task-assignee" value={assignee} maxLength={120} onChange={(event) => setAssignee(event.target.value)} />
        </div>
        <div>
          <label htmlFor="task-category">Category</label>
          <input id="task-category" value={category} maxLength={100} onChange={(event) => setCategory(event.target.value)} />
        </div>
      </div>

      <div className="task-form-grid">
        <div>
          <label htmlFor="task-priority">Priority</label>
          <select id="task-priority" value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority)}>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>
        <div>
          <label htmlFor="task-status">Status</label>
          <select id="task-status" value={status} onChange={(event) => setStatus(event.target.value as TaskStatus)}>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      <label htmlFor="task-due-date">Due date</label>
      <input id="task-due-date" type="date" value={dueDate || ''} onChange={(event) => setDueDate(event.target.value)} />

      {error && <p className="form-message error" role="alert">{error}</p>}
      <div className="task-actions">
        <button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save task'}</button>
        <button type="button" className="secondary-button" onClick={onCancel} disabled={submitting}>Cancel</button>
      </div>
    </form>
  )
}
