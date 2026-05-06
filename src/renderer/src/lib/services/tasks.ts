import type { Task } from '../../types'
import { MOCK_TASKS } from '../mock/data'

let store: Task[] = [...MOCK_TASKS]

export async function getTasks(): Promise<Task[]> {
  return store
}

export async function createTask(data: Omit<Task, 'id'>): Promise<Task> {
  const task: Task = { ...data, id: `t${Date.now()}` }
  store = [task, ...store]
  return task
}

export async function completeTask(id: string): Promise<void> {
  store = store.map((t) => (t.id === id ? { ...t, completed: true } : t))
}
