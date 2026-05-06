import React from 'react'
import { MOCK_CONTACTS } from '../lib/mock/data'
import { getHeatLevel, fullName } from '../types'
import ScoreBadge from '../components/ScoreBadge'
import StageBadge from '../components/StageBadge'
import { useNavigate } from 'react-router-dom'

export default function DashboardPage(): React.JSX.Element {
  const navigate = useNavigate()

  const total = MOCK_CONTACTS.length
  const sql = MOCK_CONTACTS.filter((c) => c.lifecycleStage === 'sql').length
  const hot = MOCK_CONTACTS.filter((c) => getHeatLevel(c.score) === 'hot').length
  const customers = MOCK_CONTACTS.filter((c) => c.lifecycleStage === 'customer').length

  const topContacts = [...MOCK_CONTACTS].sort((a, b) => b.score - a.score).slice(0, 5)

  return (
    <div className="p-6">
      <h1 className="mb-6 text-lg font-semibold text-gray-900">Dashboard</h1>

      {/* KPI */}
      <div className="mb-8 grid grid-cols-4 gap-4">
        <KpiCard label="Contatti totali" value={total} />
        <KpiCard label="Lead caldi 🔥" value={hot} color="red" />
        <KpiCard label="SQL" value={sql} color="indigo" />
        <KpiCard label="Clienti" value={customers} color="green" />
      </div>

      {/* Top contatti per punteggio */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-gray-700">Top contatti per punteggio</h2>
        </div>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-gray-50">
            {topContacts.map((c) => (
              <tr
                key={c.id}
                onClick={() => navigate(`/contatti/${c.id}`)}
                className="cursor-pointer hover:bg-gray-50"
              >
                <td className="px-5 py-3 font-medium text-gray-900">{fullName(c)}</td>
                <td className="px-4 py-3 text-gray-500">{c.company ?? '—'}</td>
                <td className="px-4 py-3"><StageBadge stage={c.lifecycleStage} /></td>
                <td className="px-4 py-3"><ScoreBadge score={c.score} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function KpiCard({ label, value, color = 'gray' }: { label: string; value: number; color?: string }): React.JSX.Element {
  const colors: Record<string, string> = {
    gray: 'text-gray-900',
    red: 'text-red-600',
    indigo: 'text-indigo-600',
    green: 'text-green-600',
  }
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <p className="text-xs font-medium text-gray-400">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${colors[color]}`}>{value}</p>
    </div>
  )
}
