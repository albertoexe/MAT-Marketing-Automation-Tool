import React, { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Papa from 'papaparse'
import type { LeadSource, LifecycleStage } from '../../types'
import { LEAD_SOURCE_LABELS, STAGE_LABELS } from '../../types'
import { getContacts, createContact } from '../../lib/services/contacts'
import { MOCK_USERS } from '../../lib/mock/data'

// ─── Types ────────────────────────────────────────────────────────────────────

type ContactField =
  | 'firstName' | 'lastName' | 'email' | 'phone'
  | 'company' | 'jobTitle' | 'linkedinUrl' | 'leadSource'
  | 'lifecycleStage' | 'ownerId' | 'notes' | '__skip'

const CONTACT_FIELD_LABELS: Record<ContactField, string> = {
  firstName:      'Nome',
  lastName:       'Cognome',
  email:          'Email',
  phone:          'Telefono',
  company:        'Azienda',
  jobTitle:       'Ruolo',
  linkedinUrl:    'LinkedIn URL',
  leadSource:     'Fonte',
  lifecycleStage: 'Fase',
  ownerId:        'Responsabile',
  notes:          'Note',
  __skip:         '— Ignora colonna —',
}

const REQUIRED_FIELDS: ContactField[] = ['firstName', 'lastName', 'email']

interface ParsedRow {
  [key: string]: string
}

type ImportStep = 'upload' | 'map' | 'preview' | 'done'

interface ImportResult {
  imported: number
  skipped: number
  skippedReasons: string[]
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ImportPage(): React.JSX.Element {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<ImportStep>('upload')
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [csvRows, setCsvRows] = useState<ParsedRow[]>([])
  const [columnMap, setColumnMap] = useState<Record<string, ContactField>>({})
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [dragOver, setDragOver] = useState(false)

  // ── File parsing ─────────────────────────────────────────────────────────────

  function parseFile(file: File): void {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      alert('Seleziona un file CSV valido.')
      return
    }

    Papa.parse<ParsedRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const headers = result.meta.fields ?? []
        const rows = result.data as ParsedRow[]

        setCsvHeaders(headers)
        setCsvRows(rows)

        // Auto-map columns with exact or close label match
        const autoMap: Record<string, ContactField> = {}
        headers.forEach((h) => {
          const lower = h.toLowerCase().trim()
          const match = autoDetectField(lower)
          autoMap[h] = match
        })
        setColumnMap(autoMap)
        setStep('map')
      },
      error: () => {
        alert('Errore durante la lettura del file. Controlla che sia un CSV valido.')
      },
    })
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>): void {
    const file = e.target.files?.[0]
    if (file) parseFile(file)
  }

  function handleDrop(e: React.DragEvent): void {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) parseFile(file)
  }

  // ── Mapping ──────────────────────────────────────────────────────────────────

  function setMapping(csvCol: string, field: ContactField): void {
    setColumnMap((prev) => ({ ...prev, [csvCol]: field }))
  }

  function mappedFields(): ContactField[] {
    return Object.values(columnMap).filter((f) => f !== '__skip')
  }

  function missingRequired(): ContactField[] {
    return REQUIRED_FIELDS.filter((f) => !mappedFields().includes(f))
  }

  // ── Import ───────────────────────────────────────────────────────────────────

  async function runImport(): Promise<void> {
    setImporting(true)
    const missing = missingRequired()
    if (missing.length > 0) {
      alert(`Associa i campi obbligatori: ${missing.map((f) => CONTACT_FIELD_LABELS[f]).join(', ')}`)
      setImporting(false)
      return
    }

    const existing = await getContacts()
    const existingEmails = new Set(existing.map((c) => c.email.toLowerCase()))

    let imported = 0
    const skippedReasons: string[] = []

    for (const row of csvRows) {
      // Map CSV row → contact fields
      const mapped: Record<string, string> = {}
      for (const [csvCol, field] of Object.entries(columnMap)) {
        if (field !== '__skip') {
          mapped[field] = (row[csvCol] ?? '').trim()
        }
      }

      const email = mapped.email?.toLowerCase()
      const firstName = mapped.firstName?.trim()
      const lastName = mapped.lastName?.trim()

      // Skip if missing required fields
      if (!firstName || !lastName || !email) {
        skippedReasons.push(`Riga ignorata: dati obbligatori mancanti (${[!firstName && 'nome', !lastName && 'cognome', !email && 'email'].filter(Boolean).join(', ')})`)
        continue
      }

      // Skip if email format invalid
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        skippedReasons.push(`${email} — formato email non valido`)
        continue
      }

      // Skip duplicate
      if (existingEmails.has(email)) {
        skippedReasons.push(`${email} — già presente (duplicato)`)
        continue
      }

      // Normalise lead source
      const rawSource = mapped.leadSource?.toLowerCase()
      const leadSource: LeadSource = normaliseSource(rawSource)

      // Normalise lifecycle stage
      const rawStage = mapped.lifecycleStage?.toLowerCase()
      const lifecycleStage: LifecycleStage = normaliseStage(rawStage)

      // Resolve owner
      const ownerMatch = MOCK_USERS.find(
        (u) => u.name.toLowerCase() === mapped.ownerId?.toLowerCase() ||
               u.email.toLowerCase() === mapped.ownerId?.toLowerCase()
      )
      const ownerId = ownerMatch?.id ?? MOCK_USERS[0].id

      await createContact({
        firstName,
        lastName,
        email,
        phone: mapped.phone || undefined,
        company: mapped.company || undefined,
        jobTitle: mapped.jobTitle || undefined,
        linkedinUrl: mapped.linkedinUrl || undefined,
        leadSource,
        lifecycleStage,
        ownerId,
        notes: mapped.notes || undefined,
        score: 0,
      })

      existingEmails.add(email)
      imported++
    }

    setResult({ imported, skipped: skippedReasons.length, skippedReasons })
    setStep('done')
    setImporting(false)
  }

  // ── Render ────────────────────────────────────────────────────────────────────

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
        <div className="mt-2 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">Importa contatti</h1>
          <Steps current={step} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="mx-auto max-w-3xl">

          {/* ── Step 1: upload ── */}
          {step === 'upload' && (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
              <p className="mb-2 text-base font-medium text-gray-900">Carica il tuo file CSV</p>
              <p className="mb-6 text-sm text-gray-500">
                Il file deve contenere intestazioni di colonna nella prima riga.
              </p>

              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`mx-auto mb-4 flex h-36 w-full max-w-md cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
                  dragOver
                    ? 'border-indigo-400 bg-indigo-50'
                    : 'border-gray-300 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50'
                }`}
              >
                <span className="mb-2 text-3xl">📂</span>
                <p className="text-sm font-medium text-gray-700">Trascina qui il file CSV</p>
                <p className="text-xs text-gray-400">oppure clicca per sfogliare</p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={handleFileInput}
              />

              {/* Format hint */}
              <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4 text-left">
                <p className="mb-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">Formato consigliato</p>
                <code className="text-xs text-gray-600">
                  firstName,lastName,email,phone,company,jobTitle,leadSource
                </code>
                <p className="mt-2 text-xs text-gray-400">
                  Campi obbligatori: <strong>firstName</strong>, <strong>lastName</strong>, <strong>email</strong>.
                  Le colonne vengono riconosciute automaticamente ma puoi rimappare nel passo successivo.
                </p>
              </div>
            </div>
          )}

          {/* ── Step 2: map columns ── */}
          {step === 'map' && (
            <div className="space-y-5">
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <p className="mb-1 text-sm font-medium text-gray-900">
                  {csvRows.length} righe trovate · {csvHeaders.length} colonne
                </p>
                <p className="mb-5 text-xs text-gray-500">
                  Associa ogni colonna CSV al campo corrispondente. Le colonne con <span className="text-red-500">*</span> sono obbligatorie.
                </p>

                <div className="space-y-3">
                  {csvHeaders.map((header) => {
                    const mapped = columnMap[header] ?? '__skip'
                    const isRequired = REQUIRED_FIELDS.includes(mapped)
                    return (
                      <div key={header} className="flex items-center gap-4">
                        <div className="w-48 shrink-0">
                          <p className="text-sm font-medium text-gray-800">{header}</p>
                          <p className="text-xs text-gray-400 truncate">
                            es: {csvRows[0]?.[header] ?? '—'}
                          </p>
                        </div>
                        <span className="text-gray-400">→</span>
                        <select
                          value={mapped}
                          onChange={(e) => setMapping(header, e.target.value as ContactField)}
                          className={`flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                            isRequired ? 'border-indigo-300 bg-indigo-50' : 'border-gray-300 bg-white'
                          }`}
                        >
                          {(Object.entries(CONTACT_FIELD_LABELS) as [ContactField, string][]).map(([k, v]) => (
                            <option key={k} value={k}>{v}{REQUIRED_FIELDS.includes(k) ? ' *' : ''}</option>
                          ))}
                        </select>
                      </div>
                    )
                  })}
                </div>

                {missingRequired().length > 0 && (
                  <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-xs text-red-600">
                    ⚠ Campi obbligatori mancanti: {missingRequired().map((f) => CONTACT_FIELD_LABELS[f]).join(', ')}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => { setStep('upload'); setCsvHeaders([]); setCsvRows([]) }}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  ← Ricarica file
                </button>
                <button
                  onClick={() => setStep('preview')}
                  disabled={missingRequired().length > 0}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  Avanti — Anteprima →
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: preview ── */}
          {step === 'preview' && (
            <div className="space-y-5">
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-900">
                    Anteprima — prime {Math.min(csvRows.length, 10)} di {csvRows.length} righe
                  </p>
                  <p className="text-xs text-gray-500">Verifica che i dati siano corretti prima di importare.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {Object.entries(columnMap)
                          .filter(([, f]) => f !== '__skip')
                          .map(([col, field]) => (
                            <th key={col} className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wide">
                              {CONTACT_FIELD_LABELS[field]}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {csvRows.slice(0, 10).map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          {Object.entries(columnMap)
                            .filter(([, f]) => f !== '__skip')
                            .map(([col]) => (
                              <td key={col} className="px-4 py-2 text-gray-700 max-w-36 truncate">
                                {row[col] || <span className="text-gray-300">—</span>}
                              </td>
                            ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setStep('map')}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  ← Modifica mapping
                </button>
                <button
                  onClick={runImport}
                  disabled={importing}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {importing ? 'Importazione in corso…' : `Importa ${csvRows.length} contatti`}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 4: done ── */}
          {step === 'done' && result && (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
              <span className="text-5xl">{result.imported > 0 ? '✅' : '⚠️'}</span>
              <h2 className="mt-4 text-xl font-semibold text-gray-900">
                Importazione completata
              </h2>

              <div className="mt-6 flex justify-center gap-8">
                <Stat label="Importati" value={result.imported} color="text-green-600" />
                <Stat label="Ignorati" value={result.skipped} color="text-orange-500" />
              </div>

              {result.skippedReasons.length > 0 && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
                    Visualizza righe ignorate ({result.skipped})
                  </summary>
                  <ul className="mt-2 space-y-1 rounded-lg border border-gray-200 bg-gray-50 p-4">
                    {result.skippedReasons.map((r, i) => (
                      <li key={i} className="text-xs text-gray-600">• {r}</li>
                    ))}
                  </ul>
                </details>
              )}

              <button
                onClick={() => navigate('/contatti')}
                className="mt-8 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Vai ai contatti
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Steps({ current }: { current: ImportStep }): React.JSX.Element {
  const steps: { key: ImportStep; label: string }[] = [
    { key: 'upload', label: 'Carica' },
    { key: 'map',    label: 'Mappa' },
    { key: 'preview', label: 'Anteprima' },
    { key: 'done',   label: 'Fatto' },
  ]
  const order: ImportStep[] = ['upload', 'map', 'preview', 'done']
  const currentIdx = order.indexOf(current)

  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => {
        const done = i < currentIdx
        const active = s.key === current
        return (
          <React.Fragment key={s.key}>
            {i > 0 && <span className="text-gray-300 text-xs">→</span>}
            <span className={`text-xs font-medium ${
              active ? 'text-indigo-600' : done ? 'text-gray-400' : 'text-gray-300'
            }`}>
              {s.label}
            </span>
          </React.Fragment>
        )
      })}
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color: string }): React.JSX.Element {
  return (
    <div className="text-center">
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  )
}

function autoDetectField(lower: string): ContactField {
  if (lower.includes('firstname') || lower === 'nome' || lower === 'first_name' || lower === 'first name') return 'firstName'
  if (lower.includes('lastname') || lower === 'cognome' || lower === 'last_name' || lower === 'last name') return 'lastName'
  if (lower === 'email' || lower === 'e-mail' || lower.includes('email')) return 'email'
  if (lower === 'phone' || lower === 'telefono' || lower === 'tel' || lower.includes('phone')) return 'phone'
  if (lower === 'company' || lower === 'azienda' || lower === 'società') return 'company'
  if (lower === 'jobtitle' || lower === 'ruolo' || lower === 'job_title' || lower === 'title' || lower === 'role') return 'jobTitle'
  if (lower.includes('linkedin')) return 'linkedinUrl'
  if (lower === 'source' || lower === 'fonte' || lower === 'leadsource') return 'leadSource'
  if (lower.includes('stage') || lower === 'fase') return 'lifecycleStage'
  if (lower === 'owner' || lower === 'responsabile' || lower === 'ownerid') return 'ownerId'
  if (lower === 'notes' || lower === 'note' || lower === 'nota') return 'notes'
  return '__skip'
}

function normaliseSource(raw: string): LeadSource {
  if (!raw) return 'csv_import'
  if (raw.includes('form')) return 'form'
  if (raw.includes('event') || raw.includes('evento')) return 'event'
  if (raw.includes('linkedin')) return 'linkedin'
  if (raw.includes('manual') || raw.includes('manuale')) return 'manual'
  return 'csv_import'
}

function normaliseStage(raw: string): LifecycleStage {
  if (!raw) return 'lead'
  if (raw === 'mql') return 'mql'
  if (raw === 'sql') return 'sql'
  if (raw === 'customer' || raw === 'cliente') return 'customer'
  if (raw === 'lost' || raw === 'perso') return 'lost'
  return 'lead'
}
