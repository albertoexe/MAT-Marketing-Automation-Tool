import type { Contact, LifecycleStage } from '../../types'
import { fullName, STAGE_LABELS } from '../../types'
import { MOCK_USERS } from '../mock/data'
import { updateContact } from './contacts'
import { addActivity } from './activities'
import { addNotification } from './notifications'
import { createTask } from './tasks'
import { getAutomationRules } from './automationRules'

// ─── Stage change handler ─────────────────────────────────────────────────────

/**
 * Central handler for all lifecycle stage transitions.
 * Updates the contact, logs an activity, sends notifications,
 * and runs any matching automation rules.
 *
 * Call this instead of manually updating lifecycleStage on the contact.
 */
export async function handleStageChange(
  contact: Contact,
  newStage: LifecycleStage,
  triggeredBy: string
): Promise<Contact> {
  const oldStage = contact.lifecycleStage
  if (oldStage === newStage) return contact

  const name = fullName(contact)
  const actor = MOCK_USERS.find((u) => u.id === triggeredBy)?.name ?? 'sistema'

  // Build update payload — SQL auto-assigns to first available sales user
  const patch: Partial<Contact> = { lifecycleStage: newStage }
  if (newStage === 'sql') {
    const salesUser = MOCK_USERS.find((u) => u.role === 'sales')
    if (salesUser) patch.ownerId = salesUser.id
  }

  // 1. Persist stage change
  const updated = await updateContact(contact.id, patch)

  // 2. Log activity on the contact timeline
  await addActivity({
    contactId: contact.id,
    type: 'stage_change',
    description: buildActivityDescription(oldStage, newStage, actor),
    userId: triggeredBy,
  })

  // 3. Send notifications
  await sendStageNotifications(updated, oldStage, newStage, name)

  // 4. Run automation rules
  await runAutomationRules(updated, newStage)

  return updated
}

// ─── Notification logic ───────────────────────────────────────────────────────

async function sendStageNotifications(
  contact: Contact,
  from: LifecycleStage,
  to: LifecycleStage,
  name: string
): Promise<void> {
  // Lead → MQL — notify Marketing
  if (from === 'lead' && to === 'mql') {
    await addNotification({
      title: 'Nuovo MQL',
      message: `${name} è diventato MQL. Gestito dal team Marketing.`,
      contactId: contact.id,
    })
    return
  }

  // Any → SQL — notify Sales
  if (to === 'sql') {
    const salesOwner = MOCK_USERS.find((u) => u.id === contact.ownerId)
    await addNotification({
      title: 'Nuovo SQL assegnato',
      message: `${name} è stato qualificato come SQL${salesOwner ? ` — assegnato a ${salesOwner.name}` : ''}.`,
      contactId: contact.id,
    })
    return
  }

  // SQL → Customer — notify everyone
  if (to === 'customer') {
    await addNotification({
      title: '🎉 Nuovo Cliente',
      message: `${name} è diventato Cliente!`,
      contactId: contact.id,
    })
    return
  }

  // Any → Lost — notify owner
  if (to === 'lost') {
    await addNotification({
      title: 'Opportunità persa',
      message: `${name} è stato segnato come Perso.`,
      contactId: contact.id,
    })
  }
}

// ─── Automation rules runner ──────────────────────────────────────────────────

async function runAutomationRules(contact: Contact, newStage: LifecycleStage): Promise<void> {
  const rules = getAutomationRules().filter(
    (r) => r.enabled && r.triggerStage === newStage
  )

  for (const rule of rules) {
    const title = rule.taskTitle
      .replace(/\{\{firstName\}\}/g, contact.firstName)
      .replace(/\{\{lastName\}\}/g, contact.lastName)

    const dueDate = new Date(
      Date.now() + rule.dueDaysFromNow * 24 * 60 * 60 * 1000
    ).toISOString()

    const salesUser = MOCK_USERS.find((u) => u.role === 'sales')
    const assignedTo =
      rule.assignTo === 'sales' ? (salesUser?.id ?? contact.ownerId) : contact.ownerId

    await createTask({
      contactId: contact.id,
      title,
      dueDate,
      completed: false,
      assignedTo,
    })
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildActivityDescription(
  from: LifecycleStage,
  to: LifecycleStage,
  actor: string
): string {
  const fromLabel = STAGE_LABELS[from]
  const toLabel = STAGE_LABELS[to]

  if (actor === 'sistema') {
    if (to === 'sql') {
      return `Promosso automaticamente a ${toLabel} (punteggio ≥ 100).`
    }
    return `Fase cambiata automaticamente: ${fromLabel} → ${toLabel}.`
  }

  return `Fase cambiata da ${fromLabel} a ${toLabel} da ${actor}.`
}
