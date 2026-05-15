import type { Contact, ScoreEvent } from '../../types'
import { MOCK_SCORE_EVENTS } from '../mock/data'
import { updateContact } from './contacts'
import { addActivity } from './activities'
import { handleStageChange } from './lifecycle'

let scoreStore: ScoreEvent[] = [...MOCK_SCORE_EVENTS]

// Predefined scoring events — used as seed for ScoringRules localStorage.
// The UI reads from getScoringRules() in scoringRules.ts, not directly from here.
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

  // Persist score event
  const event: ScoreEvent = {
    id: `se${Date.now()}`,
    contactId: contact.id,
    delta,
    reason,
    createdAt: now,
  }
  scoreStore = [event, ...scoreStore]

  // Log score change activity
  await addActivity({
    contactId: contact.id,
    type: 'score_change',
    description: `Punteggio ${delta >= 0 ? '+' : ''}${delta} — ${reason}.`,
    userId,
  })

  // Update score on the contact
  let updatedContact = await updateContact(contact.id, { score: newScore })

  // SQL threshold: was below 100, now at or above
  const wasSQL = contact.lifecycleStage === 'sql' || contact.lifecycleStage === 'customer'
  const nowSQL = newScore >= 100

  if (!wasSQL && nowSQL) {
    // Delegate everything (stage update, sales assign, notification, task) to lifecycle
    updatedContact = await handleStageChange(updatedContact, 'sql', 'system')
  }

  return updatedContact
}
