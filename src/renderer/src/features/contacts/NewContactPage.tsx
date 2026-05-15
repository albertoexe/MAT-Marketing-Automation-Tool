import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { LifecycleStage, LeadSource } from '../../types'
import { STAGE_LABELS, LEAD_SOURCE_LABELS } from '../../types'
import { getContacts, createContact } from '../../lib/services/contacts'
import { MOCK_USERS } from '../../lib/mock/data'

interface FormState {
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

const EMPTY: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  company: '',
  jobTitle: '',
  linkedinUrl: '',
  leadSource: 'manual',
  lifecycleStage: 'lead',
  ownerId: MOCK_USERS[0]?.id ?? '',
  notes: '',
}

export default function NewContactPage(): React.JSX.Element {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [saving, setSaving] = useState(false)

  function set(field: keyof FormState, value: string): void {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  async function validate(): Promise<boolean> {
    const next: Partial<Record<keyof FormState, string>> = {}

    if (!form.firstName.trim()) next.firstName = 'Campo obbligatorio'
    if (!form.lastName.trim()) next.lastName = 'Campo obbligatorio'
    if (!form.email.trim()) {
      next.email = 'Campo obbligatorio'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = 'Formato email non valido'
    } else {
      // Duplicate check
      const existing = await getContacts()
      if (existing.some((c) => c.email.toLowerCase() === form.email.toLowerCase())) {
        next.email = 'Email già presente in un altro contatto'
      }
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    if (!(await validate())) return

    setSaving(true)
    try {
      const contact = await createContact({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || undefined,
        company: form.company.trim() || undefined,
        jobTitle: form.jobTitle.trim() || undefined,
        linkedinUrl: form.linkedinUrl.trim() || undefined,
        leadSource: form.leadSource,
        lifecycleStage: form.lifecycleStage,
        ownerId: form.ownerId,
        notes: form.notes.trim() || undefined,
        score: 0,
      })
      navigate(`/contatti/${contact.id}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Intestazione */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <button
          type="button"
          onClick={() => navigate('/contatti')}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          ← Contatti
        </button>
        <h1 className="mt-2 text-lg font-semibold text-gray-900">Nuovo contatto</h1>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <form onSubmit={handleSubmit} noValidate>
          <div className="mx-auto max-w-2xl space-y-6">

            {/* Dati anagrafici */}
            <Card title="Dati anagrafici">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Nome *" error={errors.firstName}>
                  <input
                    autoFocus
                    type="text"
                    value={form.firstName}
                    onChange={(e) => set('firstName', e.target.value)}
                    className={input(!!errors.firstName)}
                    placeholder="Mario"
                  />
                </Field>
                <Field label="Cognome *" error={errors.lastName}>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => set('lastName', e.target.value)}
                    className={input(!!errors.lastName)}
                    placeholder="Rossi"
                  />
                </Field>
                <Field label="Email *" error={errors.email} className="col-span-2">
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    className={input(!!errors.email)}
                    placeholder="mario.rossi@azienda.it"
                  />
                </Field>
                <Field label="Telefono">
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => set('phone', e.target.value)}
                    className={input(false)}
                    placeholder="+39 02 1234567"
                  />
                </Field>
                <Field label="LinkedIn URL">
                  <input
                    type="url"
                    value={form.linkedinUrl}
                    onChange={(e) => set('linkedinUrl', e.target.value)}
                    className={input(false)}
                    placeholder="https://linkedin.com/in/…"
                  />
                </Field>
              </div>
            </Card>

            {/* Azienda */}
            <Card title="Azienda">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Azienda">
                  <input
                    type="text"
                    value={form.company}
                    onChange={(e) => set('company', e.target.value)}
                    className={input(false)}
                    placeholder="Acme S.r.l."
                  />
                </Field>
                <Field label="Ruolo">
                  <input
                    type="text"
                    value={form.jobTitle}
                    onChange={(e) => set('jobTitle', e.target.value)}
                    className={input(false)}
                    placeholder="CEO"
                  />
                </Field>
              </div>
            </Card>

            {/* CRM */}
            <Card title="CRM">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Fonte">
                  <select
                    value={form.leadSource}
                    onChange={(e) => set('leadSource', e.target.value as LeadSource)}
                    className={input(false)}
                  >
                    {(Object.entries(LEAD_SOURCE_LABELS) as [LeadSource, string][]).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Fase">
                  <select
                    value={form.lifecycleStage}
                    onChange={(e) => set('lifecycleStage', e.target.value as LifecycleStage)}
                    className={input(false)}
                  >
                    {(Object.entries(STAGE_LABELS) as [LifecycleStage, string][]).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Responsabile" className="col-span-2">
                  <select
                    value={form.ownerId}
                    onChange={(e) => set('ownerId', e.target.value)}
                    className={input(false)}
                  >
                    {MOCK_USERS.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </Field>
              </div>
            </Card>

            {/* Note */}
            <Card title="Note">
              <textarea
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                className={`${input(false)} min-h-24 resize-y`}
                placeholder="Note aggiuntive sul contatto…"
              />
            </Card>

            {/* Azioni */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/contatti')}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {saving ? 'Salvataggio…' : 'Crea contatto'}
              </button>
            </div>

          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function input(hasError: boolean): string {
  return `w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
    hasError ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white text-gray-900'
  }`
}

function Card({ title, children }: { title: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-400">{title}</h2>
      {children}
    </div>
  )
}

function Field({
  label,
  error,
  className,
  children,
}: {
  label: string
  error?: string
  className?: string
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-medium text-gray-600">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
