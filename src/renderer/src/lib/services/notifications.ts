import type { Notification } from '../../types'
import { MOCK_NOTIFICATIONS } from '../mock/data'

let store: Notification[] = [...MOCK_NOTIFICATIONS]
type Listener = () => void
const listeners: Set<Listener> = new Set()

function notify(): void {
  listeners.forEach((l) => l())
}

export function subscribeNotifications(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export async function getNotifications(): Promise<Notification[]> {
  return [...store].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function getUnreadCount(): number {
  return store.filter((n) => !n.read).length
}

export async function addNotification(data: Omit<Notification, 'id' | 'read' | 'createdAt'>): Promise<Notification> {
  const n: Notification = {
    ...data,
    id: `n${Date.now()}`,
    read: false,
    createdAt: new Date().toISOString(),
  }
  store = [n, ...store]
  notify()
  return n
}

export async function markAllRead(): Promise<void> {
  store = store.map((n) => ({ ...n, read: true }))
  notify()
}
