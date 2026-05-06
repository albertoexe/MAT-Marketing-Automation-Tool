import type { Opportunity, PipelineStage } from '../../types'
import { MOCK_OPPORTUNITIES } from '../mock/data'

let store: Opportunity[] = [...MOCK_OPPORTUNITIES]

export async function getOpportunities(): Promise<Opportunity[]> {
  return store
}

export async function moveOpportunity(id: string, stage: PipelineStage): Promise<Opportunity> {
  store = store.map((op) =>
    op.id === id ? { ...op, stage, updatedAt: new Date().toISOString() } : op
  )
  return store.find((op) => op.id === id)!
}

export async function createOpportunity(data: Omit<Opportunity, 'id' | 'createdAt' | 'updatedAt'>): Promise<Opportunity> {
  const now = new Date().toISOString()
  const op: Opportunity = { ...data, id: `op${Date.now()}`, createdAt: now, updatedAt: now }
  store = [op, ...store]
  return op
}
