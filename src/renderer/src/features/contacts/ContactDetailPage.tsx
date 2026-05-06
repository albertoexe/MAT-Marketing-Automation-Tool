import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { Contact, Activity } from '../../types'
import { fullName, LEAD_SOURCE_LABELS, STAGE_LABELS } from '../../types'
import { getContact } from '../../lib/services/contacts'
import { getActivities } from '../../lib/services/activities'
import { applyScoreEvent, SCORE_PRESETS } from '../../lib/services/scoring'
import { MOCK_USERS } from '../../lib/mock/data'
import { useAuth } from '../auth/AuthContext'
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

export default function ContactDetailPage(): React.JSX.Element {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [contact, setContact] = useState<Contact | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [scoring, setScoring] = useState(false)
  const [customDelta, setCustomDelta] = useState('')
  const [customReason, setCustomReason] = useState('')

  async function load(): Promise<void> {
    if (!id) return
    const [c, acts] = await Promise.all([getContact(id), getActivities(id)])
    setContact(c ?? null)
    setActivities(acts)
  }

  useEffect(() => { load() }, [id])

  async function handlePreset(delta: number, reason: string): Promise<void> {
    if (!contact || !user) return
    const updated = await applyScoreEvent(contact, delta, reason, user.id)
    setContact(updated)
    const acts = await getActivities(contact.id)
    setActivities(acts)
  }

  async function handleCustomScore(): Promise<void> {
    const d = parseInt(customDelta)
    if (!contact || !user || isNaN(d) || !customReason.trim()) return
    const updated = await applyScoreEvent(contact, d, customReason.trim(), user.id)
    setContact(updated)
    setCustomDelta('')
    setCustomReason('')
    const acts = await getActivities(contact.id)
    setActivities(acts)
  }

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
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Pannello sinistro */}
        <div className="w-72 shrink-0 overflow-y-auto border-r border-gray-200 bg-white p-5">
          <div className="space-y-5 text-sm">

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
                  {SCORE_PRESETS.map((p) => (
                    <button key={p.label} onClick={() => handlePreset(p.delta, p.label)}
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
