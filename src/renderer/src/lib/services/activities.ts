import type { Activity, ScoreEvent } from '../../types'
import { MOCK_ACTIVITIES, MOCK_SCORE_EVENTS } from '../mock/data'

let activityStore: Activity[] = [...MOCK_ACTIVITIES]
let scoreStore: ScoreEvent[] = [...MOCK_SCORE_EVENTS]

export async function getActivities(contactId: string): Promise<Activity[]> {
  return activityStore
    .filter((a) => a.contactId === contactId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function getScoreEvents(contactId: string): Promise<ScoreEvent[]> {
  return scoreStore
    .filter((s) => s.contactId === contactId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function addActivity(data: Omit<Activity, 'id' | 'createdAt'>): Promise<Activity> {
  const activity: Activity = {
    ...data,
    id: `a${Date.now()}`,
    createdAt: new Date().toISOString(),
  }
  activityStore = [activity, ...activityStore]
  return activity
}
