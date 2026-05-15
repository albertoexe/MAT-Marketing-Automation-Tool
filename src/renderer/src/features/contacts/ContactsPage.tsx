import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Contact, LifecycleStage, LeadSource } from '../../types'
import { fullName, STAGE_LABELS, LEAD_SOURCE_LABELS } from '../../types'
import { getContacts } from '../../lib/services/contacts'
import { MOCK_USERS } from '../../lib/mock/data'
import ScoreBadge from '../../components/ScoreBadge'
import StageBadge from '../../components/StageBadge'

const ALL_STAGES: LifecycleStage[] = ['lead', 'mql', 'sql', 'customer', 'lost']
const ALL_SOURCES: LeadSource[] = ['manual', 'csv_import', 'form', 'event', 'linkedin']

export default function ContactsPage(): React.JSX.Element {
  const navigate = useNavigate()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [search, setSearch] = useState('')

  // Multi-select stage filter — empty set = "tutti"
  const [selectedStages, setSelectedStages] = useState<Set<LifecycleStage>>(new Set())

  // Single source filter
  const [sourceFilter, setSourceFilter] = useState<LeadSource | 'all'>('all')

  useEffect(() => {
    getContacts().then(setContacts)
  }, [])

  function toggleStage(stage: LifecycleStage): void {
    setSelectedStages((prev) => {
      const next = new Set(prev)
      if (next.has(stage)) next.delete(stage)
      else next.add(stage)
      return next
    })
  }

  function clearStages(): void {
    setSelectedStages(new Set())
  }

  const filtered = contacts
    .filter((c) => {
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        fullName(c).toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.company ?? '').toLowerCase().includes(q)

      const matchStage = selectedStages.size === 0 || selectedStages.has(c.lifecycleStage)
      const matchSource = sourceFilter === 'all' || c.leadSource === sourceFilter

      return matchSearch && matchStage && matchSource
    })
    .sort((a, b) => b.score - a.score)

  function ownerName(ownerId: string): string {
    return MOCK_USERS.find((u) => u.id === ownerId)?.name ?? '—'
  }

  return (
    <div className="flex h-full flex-col">
      {/* Intestazione */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">Contatti</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/contatti/importa')}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              ↑ Importa CSV
            </button>
            <button
              onClick={() => navigate('/contatti/nuovo')}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              + Nuovo contatto
            </button>
          </div>
        </div>

        {/* Riga 1: ricerca + filtro fonte */}
        <div className="mt-3 flex items-center gap-3">
          <input
            type="text"
            placeholder="Cerca per nome, email, azienda…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-72 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value as LeadSource | 'all')}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">Tutte le fonti</option>
            {ALL_SOURCES.map((s) => (
              <option key={s} value={s}>{LEAD_SOURCE_LABELS[s]}</option>
            ))}
          </select>
          <span className="ml-auto text-xs text-gray-400">{filtered.length} contatti</span>
        </div>

        {/* Riga 2: filtro fase multi-select */}
        <div className="mt-2 flex items-center gap-1.5">
          <button
            onClick={clearStages}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              selectedStages.size === 0
                ? 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Tutti
          </button>
          {ALL_STAGES.map((stage) => {
            const active = selectedStages.has(stage)
            return (
              <button
                key={stage}
                onClick={() => toggleStage(stage)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  active
                    ? stagePillActive(stage)
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {STAGE_LABELS[stage]}
                {active && (
                  <span className="ml-1 opacity-70">✕</span>
                )}
              </button>
            )
          })}
          {selectedStages.size > 0 && (
            <span className="ml-1 text-xs text-gray-400">
              {selectedStages.size === 1
                ? '1 fase selezionata'
                : `${selectedStages.size} fasi selezionate`}
            </span>
          )}
        </div>
      </div>

      {/* Tabella */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Nome</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Azienda</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Fase</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Punteggio</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Fonte</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Responsabile</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Aggiornato</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {filtered.map((c) => (
              <tr
                key={c.id}
                onClick={() => navigate(`/contatti/${c.id}`)}
                className="cursor-pointer hover:bg-gray-50"
              >
                <td className="px-6 py-3">
                  <div className="font-medium text-gray-900">{fullName(c)}</div>
                  <div className="text-xs text-gray-400">{c.email}</div>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  <div>{c.company ?? '—'}</div>
                  {c.jobTitle && <div className="text-xs text-gray-400">{c.jobTitle}</div>}
                </td>
                <td className="px-4 py-3">
                  <StageBadge stage={c.lifecycleStage} />
                </td>
                <td className="px-4 py-3">
                  <ScoreBadge score={c.score} />
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{LEAD_SOURCE_LABELS[c.leadSource]}</td>
                <td className="px-4 py-3 text-gray-600">{ownerName(c.ownerId)}</td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {new Date(c.updatedAt).toLocaleDateString('it-IT')}
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-16 text-center text-sm text-gray-400">
                  Nessun contatto trovato.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Stage pill colours (active state) ───────────────────────────────────────

function stagePillActive(stage: LifecycleStage): string {
  const map: Record<LifecycleStage, string> = {
    lead:     'bg-gray-700 text-white',
    mql:      'bg-blue-600 text-white',
    sql:      'bg-indigo-600 text-white',
    customer: 'bg-green-600 text-white',
    lost:     'bg-red-500 text-white',
  }
  return map[stage]
}
