import type { Contact, ScoreEvent } from '../../types'
import { MOCK_SCORE_EVENTS, MOCK_USERS } from '../mock/data'
import { updateContact } from './contacts'
import { addActivity } from './activities'
import { addNotification } from './notifications'
import { createTask } from './tasks'

let scoreStore: ScoreEvent[] = [...MOCK_SCORE_EVENTS]

// Predefined scoring events for the UI
export const SCORE_PRESETS = [
  { label: 'Registrazione evento', delta: 20 },
  { label: 'Partecipazione evento', delta: 30 },
  { label: 'Email aperta', delta: 5 },
  { label: 'Link cliccato', delta: 10 },
  { label: 'Download contenuto', delta: 15 },
  { label: 'Visita pagina prezzi', delta: 25 },
  { label: 'Risposta email', delta: 30 },
  { label: 'Collegamento LinkedIn accettato', delta: 10 },
  { label: 'Richiesta demo', delta: 50 },
  { label: 'Nessuna interazione 14gg', delta: -10 },
  { label: 'Nessuna interazione 30gg', delta: -20 },
  { label: 'Disiscrizione newsletter', delta: -50 },
]

export async function getScoreEvents(contactId: string): Promise<ScoreEvent[]> {
  return scoreStore
    .filter((s) => s.contactId === contactId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function applyScoreEvent(
  contact: Contact,
  delta: number,
  reason: string,
  userId: string
): Promise<Contact> {
  const newScore = Math.max(0, contact.score + delta)
  const now = new Date().toISOString()

  // Save score event
  const event: ScoreEvent = {
    id: `se${Date.now()}`,
    contactId: contact.id,
    delta,
    reason,
    createdAt: now,
  }
  scoreStore = [event, ...scoreStore]

  // Log activity
  await addActivity({
    contactId: contact.id,
    type: 'score_change',
    description: `Punteggio ${delta >= 0 ? '+' : ''}${delta} — ${reason}.`,
    userId,
  })

  // Check SQL threshold: was below 100, now at or above
  const wasSQL = contact.lifecycleStage === 'sql' || contact.lifecycleStage === 'customer'
  const nowSQL = newScore >= 100

  let newStage = contact.lifecycleStage
  let updatedContact = await updateContact(contact.id, { score: newScore })

  if (!wasSQL && nowSQL) {
    // Auto-promote to SQL
    newStage = 'sql'

    // Assign to first available sales user
    const salesUser = MOCK_USERS.find((u) => u.role === 'sales')
    const assignedOwner = salesUser?.id ?? contact.ownerId

    updatedContact = await updateContact(contact.id, {
      score: newScore,
      lifecycleStage: 'sql',
      ownerId: assignedOwner,
    })

    // Log stage change
    await addActivity({
      contactId: contact.id,
      type: 'stage_change',
      description: `Promosso a SQL automaticamente — punteggio ${newScore} ≥ 100.`,
      userId: 'system',
    })

    // Create follow-up task
    const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    await createTask({
      contactId: contact.id,
      title: `Contattare ${contact.firstName} ${contact.lastName} — nuovo SQL`,
      dueDate,
      completed: false,
      assignedTo: assignedOwner,
    })

    // Send notification
    await addNotification({
      title: 'Nuovo SQL assegnato',
      message: `${contact.firstName} ${contact.lastName} ha raggiunto ${newScore} punti ed è stato promosso a SQL.`,
      contactId: contact.id,
    })
  }

  return updatedContact
}
