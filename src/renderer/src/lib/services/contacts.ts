import type { Contact } from '../../types'
import { MOCK_CONTACTS } from '../mock/data'

// Swap this import for Supabase calls when ready.
// The function signatures stay identical.

let store: Contact[] = [...MOCK_CONTACTS]

export async function getContacts(): Promise<Contact[]> {
  return store
}

export async function getContact(id: string): Promise<Contact | undefined> {
  return store.find((c) => c.id === id)
}

export async function createContact(data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Promise<Contact> {
  const now = new Date().toISOString()
  const contact: Contact = {
    ...data,
    id: `c${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  }
  store = [contact, ...store]
  return contact
}

export async function updateContact(id: string, data: Partial<Contact>): Promise<Contact> {
  store = store.map((c) =>
    c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c
  )
  return store.find((c) => c.id === id)!
}

export async function deleteContact(id: string): Promise<void> {
  store = store.filter((c) => c.id !== id)
}
