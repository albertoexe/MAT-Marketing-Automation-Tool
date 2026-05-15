// ─── Enums ───────────────────────────────────────────────────────────────────

export type Role = 'marketing' | 'sales'

export type LifecycleStage = 'lead' | 'mql' | 'sql' | 'customer' | 'lost'

export type LeadSource = 'manual' | 'csv_import' | 'form' | 'event' | 'linkedin'

export type ActivityType =
  | 'email_sent'
  | 'email_received'
  | 'call'
  | 'meeting'
  | 'note'
  | 'score_change'
  | 'stage_change'
  | 'linkedin'
  | 'task_completed'

export type PipelineStage =
  | 'nuovo_lead'
  | 'contattato'
  | 'appuntamento_fissato'
  | 'proposta_inviata'
  | 'vinto'
  | 'perso'

// ─── Entities ────────────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  name: string
  role: Role
}

export interface Contact {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  company?: string
  jobTitle?: string
  linkedinUrl?: string
  leadSource: LeadSource
  notes?: string
  ownerId: string
  lifecycleStage: LifecycleStage
  score: number
  createdAt: string
  updatedAt: string
}

export interface Activity {
  id: string
  contactId: string
  type: ActivityType
  description: string
  createdAt: string
  userId: string
}

export interface ScoreEvent {
  id: string
  contactId: string
  delta: number
  reason: string
  createdAt: string
}

export interface Task {
  id: string
  contactId: string
  title: string
  dueDate: string
  completed: boolean
  assignedTo: string
}

export interface Notification {
  id: string
  title: string
  message: string
  contactId?: string
  read: boolean
  createdAt: string
}

export interface Opportunity {
  id: string
  contactId: string
  stage: PipelineStage
  dealValue?: number
  expectedCloseDate?: string
  notes?: string
  ownerId: string
  createdAt: string
  updatedAt: string
}

// ─── Config entities ─────────────────────────────────────────────────────────

export interface ScoringRule {
  id: string
  label: string    // e.g. "Visita pagina prezzi"
  delta: number    // positive or negative integer
  enabled: boolean
}

export interface AutomationRule {
  id: string
  triggerStage: LifecycleStage  // destination stage that fires the rule
  taskTitle: string             // supports {{firstName}} and {{lastName}}
  dueDaysFromNow: number        // e.g. 1 = due tomorrow
  assignTo: 'owner' | 'sales'  // who to assign the generated task to
  enabled: boolean
}

// ─── Derived helpers ─────────────────────────────────────────────────────────

export type HeatLevel = 'hot' | 'warm' | 'cold'

export function getHeatLevel(score: number): HeatLevel {
  if (score >= 100) return 'hot'
  if (score >= 50) return 'warm'
  return 'cold'
}

export function fullName(contact: Contact): string {
  return `${contact.firstName} ${contact.lastName}`
}

// ─── Italian labels ───────────────────────────────────────────────────────────

export const STAGE_LABELS: Record<LifecycleStage, string> = {
  lead: 'Lead',
  mql: 'MQL',
  sql: 'SQL',
  customer: 'Cliente',
  lost: 'Perso',
}

export const PIPELINE_STAGE_LABELS: Record<PipelineStage, string> = {
  nuovo_lead: 'Nuovo Lead',
  contattato: 'Contattato',
  appuntamento_fissato: 'Appuntamento Fissato',
  proposta_inviata: 'Proposta Inviata',
  vinto: 'Vinto',
  perso: 'Perso',
}

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  manual: 'Manuale',
  csv_import: 'Importazione CSV',
  form: 'Form',
  event: 'Evento',
  linkedin: 'LinkedIn',
}

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  email_sent: 'Email inviata',
  email_received: 'Email ricevuta',
  call: 'Chiamata',
  meeting: 'Riunione',
  note: 'Nota',
  score_change: 'Modifica punteggio',
  stage_change: 'Cambio fase',
  linkedin: 'LinkedIn',
  task_completed: 'Attività completata',
}

export const PIPELINE_STAGE_ORDER: PipelineStage[] = [
  'nuovo_lead',
  'contattato',
  'appuntamento_fissato',
  'proposta_inviata',
  'vinto',
  'perso',
]
