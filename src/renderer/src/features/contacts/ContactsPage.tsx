import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Contact, LifecycleStage } from '../../types'
import { fullName, STAGE_LABELS, LEAD_SOURCE_LABELS } from '../../types'
import { getContacts } from '../../lib/services/contacts'
import { MOCK_USERS } from '../../lib/mock/data'
import ScoreBadge from '../../components/ScoreBadge'
import StageBadge from '../../components/StageBadge'

const STAGE_FILTERS: { value: LifecycleStage | 'all'; label: string }[] = [
  { value: 'all', label: 'Tutti' },
  { value: 'lead', label: STAGE_LABELS.lead },
  { value: 'mql', label: STAGE_LABELS.mql },
  { value: 'sql', label: STAGE_LABELS.sql },
  { value: 'customer', label: STAGE_LABELS.customer },
  { value: 'lost', label: STAGE_LABELS.lost },
]

export default function ContactsPage(): React.JSX.Element {
  const navigate = useNavigate()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState<LifecycleStage | 'all'>('all')

  useEffect(() => {
    getContacts().then(setContacts)
  }, [])

  const filtered = contacts
    .filter((c) => {
      const q = search.toLowerCase()
      return (
        (!q ||
          fullName(c).toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          (c.company ?? '').toLowerCase().includes(q)) &&
        (stageFilter === 'all' || c.lifecycleStage === stageFilter)
      )
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
          <button
            onClick={() => navigate('/contatti/nuovo')}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + Nuovo contatto
          </button>
        </div>

        {/* Filtri */}
        <div className="mt-3 flex items-center gap-3">
          <input
            type="text"
            placeholder="Cerca per nome, email, azienda…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-72 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <div className="flex gap-1">
            {STAGE_FILTERS.map((s) => (
              <button
                key={s.value}
                onClick={() => setStageFilter(s.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  stageFilter === s.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <span className="ml-auto text-xs text-gray-400">{filtered.length} contatti</span>
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
