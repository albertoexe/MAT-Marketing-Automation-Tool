import type { User } from '../../types'
import { MOCK_USERS } from '../mock/data'

// Mock passwords: all users use "password123" for demo
const MOCK_PASSWORDS: Record<string, string> = {
  'alice@company.com': 'password123',
  'bob@company.com': 'password123',
  'carlo@company.com': 'password123',
  'diana@company.com': 'password123',
  'emilio@company.com': 'password123',
}

export async function signIn(email: string, password: string): Promise<User> {
  await new Promise((r) => setTimeout(r, 400)) // simulate network latency
  const user = MOCK_USERS.find((u) => u.email === email)
  if (!user || MOCK_PASSWORDS[email] !== password) {
    throw new Error('Invalid email or password.')
  }
  return user
}

export async function signOut(): Promise<void> {
  await new Promise((r) => setTimeout(r, 200))
}
