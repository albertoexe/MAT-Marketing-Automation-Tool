import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { Contact, Activity, LifecycleStage, LeadSource } from '../../types'
import { fullName, LEAD_SOURCE_LABELS, STAGE_LABELS } from '../../types'
import { getContact, updateContact } from '../../lib/services/contacts'
import { getActivities } from '../../lib/services/activities'
import { applyScoreEvent } from '../../lib/services/scoring'
import { getScoringRules } from '../../lib/services/scoringRules'
import { handleStageChange } from '../../lib/services/lifecycle'
import { MOCK_USERS } from '../../lib/mock/data'
import { useAuth } from '../auth/AuthContext'
import type { ScoringRule } from '../../types'
import ScoreBadge from '../../components/ScoreBadge'
import StageBadge from '../../components/StageBadge'

const ACTIVITY_ICONS: Record<string, string> = {
  email_sent: '📤',
  email_received: '📥',
  call: '📞',
  meeting: '🗓',
  note: '📝',
  score_change: '📊',
  stage_change: '🔄',
  linkedin: '💼',
  task_completed: '✅',
}

// ─── Edit form state ───────────────────────────────────────────────────────────

interface EditForm {
  firstName: string
  lastName: string
  email: string
  phone: string
  company: string
  jobTitle: string
  linkedinUrl: string
  leadSource: LeadSource
  lifecycleStage: LifecycleStage
  ownerId: string
  notes: string
}

function contactToForm(c: Contact): EditForm {
  return {
    firstName: c.firstName,
    lastName: c.lastName,
    email: c.email,
    phone: c.phone ?? '',
    company: c.company ?? '',
    jobTitle: c.jobTitle ?? '',
    linkedinUrl: c.linkedinUrl ?? '',
    leadSource: c.leadSource,
    lifecycleStage: c.lifecycleStage,
    ownerId: c.ownerId,
    notes: c.notes ?? '',
  }
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ContactDetailPage(): React.JSX.Element {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [contact, setContact] = useState<Contact | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [scoring, setScoring] = useState(false)
  const [customDelta, setCustomDelta] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [scoringRules, setScoringRules] = useState<ScoringRule[]>([])

  // Edit mode
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<EditForm | null>(null)
  const [saving, setSaving] = useState(false)
  const [editErrors, setEditErrors] = useState<Partial<Record<keyof EditForm, string>>>({})

  async function load(): Promise<void> {
    if (!id) return
    const [c, acts] = await Promise.all([getContact(id), getActivities(id)])
    setContact(c ?? null)
    setActivities(acts)
  }

  useEffect(() => { load() }, [id])
  useEffect(() => { setScoringRules(getScoringRules().filter((r) => r.enabled)) }, [])

  // ── Scoring ──────────────────────────────────────────────────────────────────

  async function handlePreset(delta: number, reason: string): Promise<void> {
    if (!contact || !user) return
    const updated = await applyScoreEvent(contact, delta, reason, user.id)
    setContact(updated)
    setActivities(await getActivities(contact.id))
  }

  async function handleCustomScore(): Promise<void> {
    const d = parseInt(customDelta)
    if (!contact || !user || isNaN(d) || !customReason.trim()) return
    const updated = await applyScoreEvent(contact, d, customReason.trim(), user.id)
    setContact(updated)
    setCustomDelta('')
    setCustomReason('')
    setActivities(await getActivities(contact.id))
  }

  // ── Edit mode ─────────────────────────────────────────────────────────────────

  function startEditing(): void {
    if (!contact) return
    setEditForm(contactToForm(contact))
    setEditErrors({})
    setEditing(true)
    setScoring(false)
  }

  function cancelEditing(): void {
    setEditing(false)
    setEditForm(null)
    setEditErrors({})
  }

  function setField(field: keyof EditForm, value: string): void {
    setEditForm((prev) => prev ? { ...prev, [field]: value } : prev)
    if (editErrors[field]) setEditErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  function validateEdit(): boolean {
    if (!editForm) return false
    const errs: Partial<Record<keyof EditForm, string>> = {}
    if (!editForm.firstName.trim()) errs.firstName = 'Campo obbligatorio'
    if (!editForm.lastName.trim()) errs.lastName = 'Campo obbligatorio'
    if (!editForm.email.trim()) {
      errs.email = 'Campo obbligatorio'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) {
      errs.email = 'Formato non valido'
    }
    setEditErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function saveEdits(): Promise<void> {
    if (!contact || !editForm || !user || !validateEdit()) return
    setSaving(true)
    try {
      const stageChanged = editForm.lifecycleStage !== contact.lifecycleStage

      // Save all non-stage fields first
      let updated = await updateContact(contact.id, {
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        email: editForm.email.trim().toLowerCase(),
        phone: editForm.phone.trim() || undefined,
        company: editForm.company.trim() || undefined,
        jobTitle: editForm.jobTitle.trim() || undefined,
        linkedinUrl: editForm.linkedinUrl.trim() || undefined,
        leadSource: editForm.leadSource,
        ownerId: editForm.ownerId,
        notes: editForm.notes.trim() || undefined,
      })

      // If stage changed, go through lifecycle (notifications + automation)
      if (stageChanged) {
        updated = await handleStageChange(updated, editForm.lifecycleStage, user.id)
      }

      setContact(updated)
      setEditing(false)
      setEditForm(null)
      setActivities(await getActivities(contact.id))
    } finally {
      setSaving(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  if (!contact) {
    return <div className="flex h-full items-center justify-center text-sm text-gray-400">Caricamento…</div>
  }

  const owner = MOCK_USERS.find((u) => u.id === contact.ownerId)

  return (
    <div className="flex h-full flex-col">
      {/* Intestazione */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <button onClick={() => navigate('/contatti')} className="text-sm text-gray-400 hover:text-gray-600">
          ← Contatti
        </button>
        <div className="mt-3 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{fullName(contact)}</h1>
            <p className="text-sm text-gray-500">
              {contact.jobTitle ?? ''}
              {contact.jobTitle && contact.company ? ' · ' : ''}
              {contact.company ?? ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StageBadge stage={contact.lifecycleStage} />
            <ScoreBadge score={contact.score} />
            {!editing ? (
              <button
                onClick={startEditing}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                ✏ Modifica
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={cancelEditing}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  Annulla
                </button>
                <button
                  onClick={saveEdits}
                  disabled={saving}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {saving ? 'Salvataggio…' : 'Salva'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Pannello sinistro */}
        <div className="w-72 shrink-0 overflow-y-auto border-r border-gray-200 bg-white p-5">
          <div className="space-y-5 text-sm">

            {editing && editForm ? (
              // ── Edit mode ──────────────────────────────────────────────────
              <>
                <EditSection title="Contatto">
                  <EditField label="Nome *" error={editErrors.firstName}>
                    <input value={editForm.firstName} onChange={(e) => setField('firstName', e.target.value)}
                      className={inp(!!editErrors.firstName)} placeholder="Nome" />
                  </EditField>
                  <EditField label="Cognome *" error={editErrors.lastName}>
                    <input value={editForm.lastName} onChange={(e) => setField('lastName', e.target.value)}
                      className={inp(!!editErrors.lastName)} placeholder="Cognome" />
                  </EditField>
                  <EditField label="Email *" error={editErrors.email}>
                    <input type="email" value={editForm.email} onChange={(e) => setField('email', e.target.value)}
                      className={inp(!!editErrors.email)} placeholder="email@azienda.it" />
                  </EditField>
                  <EditField label="Telefono">
                    <input value={editForm.phone} onChange={(e) => setField('phone', e.target.value)}
                      className={inp(false)} placeholder="+39…" />
                  </EditField>
                  <EditField label="LinkedIn">
                    <input value={editForm.linkedinUrl} onChange={(e) => setField('linkedinUrl', e.target.value)}
                      className={inp(false)} placeholder="https://linkedin.com/in/…" />
                  </EditField>
                </EditSection>

                <EditSection title="Azienda">
                  <EditField label="Azienda">
                    <input value={editForm.company} onChange={(e) => setField('company', e.target.value)}
                      className={inp(false)} placeholder="Azienda" />
                  </EditField>
                  <EditField label="Ruolo">
                    <input value={editForm.jobTitle} onChange={(e) => setField('jobTitle', e.target.value)}
                      className={inp(false)} placeholder="CEO" />
                  </EditField>
                </EditSection>

                <EditSection title="CRM">
                  <EditField label="Fonte">
                    <select value={editForm.leadSource} onChange={(e) => setField('leadSource', e.target.value as LeadSource)}
                      className={inp(false)}>
                      {(Object.entries(LEAD_SOURCE_LABELS) as [LeadSource, string][]).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </EditField>
                  <EditField label="Fase">
                    <select value={editForm.lifecycleStage} onChange={(e) => setField('lifecycleStage', e.target.value as LifecycleStage)}
                      className={inp(false)}>
                      {(Object.entries(STAGE_LABELS) as [LifecycleStage, string][]).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </EditField>
                  <EditField label="Responsabile">
                    <select value={editForm.ownerId} onChange={(e) => setField('ownerId', e.target.value)}
                      className={inp(false)}>
                      {MOCK_USERS.map((u) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </EditField>
                </EditSection>

                <EditSection title="Note">
                  <textarea value={editForm.notes} onChange={(e) => setField('notes', e.target.value)}
                    className={`${inp(false)} min-h-20 resize-y`} placeholder="Note aggiuntive…" />
                </EditSection>
              </>
            ) : (
              // ── Read mode ──────────────────────────────────────────────────
              <>
                <Section title="Contatto">
                  <Field label="Email" value={contact.email} />
                  <Field label="Telefono" value={contact.phone} />
                  {contact.linkedinUrl && (
                    <Field label="LinkedIn">
                      <a href={contact.linkedinUrl} target="_blank" rel="noreferrer"
                        className="text-indigo-600 hover:underline">
                        Vedi profilo ↗
                      </a>
                    </Field>
                  )}
                </Section>

                <Section title="Lead">
                  <Field label="Fonte" value={LEAD_SOURCE_LABELS[contact.leadSource]} />
                  <Field label="Fase" value={STAGE_LABELS[contact.lifecycleStage]} />
                  <Field label="Responsabile" value={owner?.name} />
                  <Field label="Creato" value={new Date(contact.createdAt).toLocaleDateString('it-IT')} />
                </Section>

                {contact.notes && (
                  <Section title="Note">
                    <p className="text-gray-600 leading-relaxed">{contact.notes}</p>
                  </Section>
                )}

                {/* Azioni rapide */}
                <Section title="Azioni rapide">
                  <div className="space-y-2">
                    <button onClick={() => window.open(`mailto:${contact.email}`)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50">
                      📤 Invia email
                    </button>
                    {contact.linkedinUrl && (
                      <button onClick={() => window.open(contact.linkedinUrl!, '_blank')}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50">
                        💼 Apri LinkedIn
                      </button>
                    )}
                    <button onClick={() => setScoring((v) => !v)}
                      className="w-full rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-left text-xs font-medium text-indigo-700 hover:bg-indigo-100">
                      📊 Aggiorna punteggio
                    </button>
                  </div>
                </Section>

                {/* Pannello punteggio */}
                {scoring && (
                  <Section title="Aggiorna punteggio">
                    <div className="space-y-1.5">
                      {scoringRules.map((p) => (
                        <button key={p.id} onClick={() => handlePreset(p.delta, p.label)}
                          className="flex w-full items-center justify-between rounded-lg border border-gray-100 px-2.5 py-1.5 text-xs hover:bg-gray-50">
                          <span className="text-gray-700">{p.label}</span>
                          <span className={`font-semibold ${p.delta >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {p.delta >= 0 ? '+' : ''}{p.delta}
                          </span>
                        </button>
                      ))}
                      {/* Manuale */}
                      <div className="mt-2 space-y-1.5 border-t border-gray-100 pt-2">
                        <p className="text-xs font-medium text-gray-400">Manuale</p>
                        <input type="number" placeholder="Punti (es. +15 o -10)" value={customDelta}
                          onChange={(e) => setCustomDelta(e.target.value)}
                          className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                        <input type="text" placeholder="Motivo" value={customReason}
                          onChange={(e) => setCustomReason(e.target.value)}
                          className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                        <button onClick={handleCustomScore}
                          className="w-full rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700">
                          Applica
                        </button>
                      </div>
                    </div>
                  </Section>
                )}
              </>
            )}
          </div>
        </div>

        {/* Cronologia attività */}
        <div className="flex-1 overflow-y-auto p-6">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Cronologia attività
          </h2>
          {activities.length === 0 ? (
            <p className="text-sm text-gray-400">Nessuna attività registrata.</p>
          ) : (
            <ol className="space-y-3">
              {activities.map((a) => (
                <li key={a.id} className="flex gap-3">
                  <span className="mt-0.5 text-base">{ACTIVITY_ICONS[a.type] ?? '•'}</span>
                  <div className="flex-1 rounded-lg border border-gray-100 bg-white p-3">
                    <p className="text-sm text-gray-700">{a.description}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      {new Date(a.createdAt).toLocaleString('it-IT', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Read-mode helpers ────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function Field({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }): React.JSX.Element {
  return (
    <div className="flex items-start gap-2">
      <span className="w-20 shrink-0 text-xs text-gray-400">{label}</span>
      {children ?? <span className="text-gray-700">{value ?? '—'}</span>}
    </div>
  )
}

// ─── Edit-mode helpers ────────────────────────────────────────────────────────

function inp(hasError: boolean): string {
  return `w-full rounded-md border px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
    hasError ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white text-gray-900'
  }`
}

function EditSection({ title, children }: { title: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function EditField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <div>
      <label className="mb-0.5 block text-xs text-gray-500">{label}</label>
      {children}
      {error && <p className="mt-0.5 text-xs text-red-500">{error}</p>}
    </div>
  )
}
