import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Opportunity, PipelineStage } from '../types'
import { PIPELINE_STAGE_LABELS, PIPELINE_STAGE_ORDER, fullName } from '../types'
import { getOpportunities, moveOpportunity } from '../lib/services/opportunities'
import { MOCK_CONTACTS, MOCK_USERS } from '../lib/mock/data'
import ScoreBadge from '../components/ScoreBadge'

export default function PipelinePage(): React.JSX.Element {
  const navigate = useNavigate()
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])

  useEffect(() => {
    getOpportunities().then(setOpportunities)
  }, [])

  async function handleMove(id: string, stage: PipelineStage): Promise<void> {
    const updated = await moveOpportunity(id, stage)
    setOpportunities((prev) => prev.map((op) => (op.id === id ? updated : op)))
  }

  const totalValue = opportunities
    .filter((op) => op.stage !== 'perso')
    .reduce((sum, op) => sum + (op.dealValue ?? 0), 0)

  const wonValue = opportunities
    .filter((op) => op.stage === 'vinto')
    .reduce((sum, op) => sum + (op.dealValue ?? 0), 0)

  return (
    <div className="flex h-full flex-col">
      {/* Intestazione */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">Pipeline</h1>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <span>Valore totale: <strong className="text-gray-900">{formatEur(totalValue)}</strong></span>
            <span>Vinto: <strong className="text-green-600">{formatEur(wonValue)}</strong></span>
            <span className="text-gray-300">|</span>
            <span className="text-xs text-gray-400">{opportunities.length} opportunità</span>
          </div>
        </div>
      </div>

      {/* Kanban */}
      <div className="flex flex-1 gap-0 overflow-x-auto">
        {PIPELINE_STAGE_ORDER.map((stage) => {
          const cards = opportunities.filter((op) => op.stage === stage)
          const stageValue = cards.reduce((sum, op) => sum + (op.dealValue ?? 0), 0)
          const isWon = stage === 'vinto'
          const isLost = stage === 'perso'

          return (
            <div key={stage} className="flex w-60 shrink-0 flex-col border-r border-gray-200 bg-gray-50 last:border-0">
              {/* Intestazione colonna */}
              <div className={`border-b border-gray-200 px-3 py-2.5 ${isWon ? 'bg-green-50' : isLost ? 'bg-red-50' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${isWon ? 'text-green-700' : isLost ? 'text-red-500' : 'text-gray-600'}`}>
                    {PIPELINE_STAGE_LABELS[stage]}
                  </span>
                  <span className="rounded-full bg-white px-1.5 py-0.5 text-xs font-medium text-gray-500 border border-gray-200">
                    {cards.length}
                  </span>
                </div>
                {stageValue > 0 && (
                  <p className="mt-0.5 text-xs text-gray-400">{formatEur(stageValue)}</p>
                )}
              </div>

              {/* Cards */}
              <div className="flex-1 space-y-2 overflow-y-auto p-2">
                {cards.map((op) => (
                  <OpportunityCard
                    key={op.id}
                    opportunity={op}
                    currentStage={stage}
                    onMove={handleMove}
                    onContactClick={(cid) => navigate(`/contatti/${cid}`)}
                  />
                ))}
                {cards.length === 0 && (
                  <p className="pt-4 text-center text-xs text-gray-300">Vuoto</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Card opportunità ─────────────────────────────────────────────────────────

function OpportunityCard({
  opportunity,
  currentStage,
  onMove,
  onContactClick,
}: {
  opportunity: Opportunity
  currentStage: PipelineStage
  onMove: (id: string, stage: PipelineStage) => Promise<void>
  onContactClick: (contactId: string) => void
}): React.JSX.Element {
  const contact = MOCK_CONTACTS.find((c) => c.id === opportunity.contactId)
  const owner = MOCK_USERS.find((u) => u.id === opportunity.ownerId)

  const currentIndex = PIPELINE_STAGE_ORDER.indexOf(currentStage)
  const nextStage = PIPELINE_STAGE_ORDER[currentIndex + 1] as PipelineStage | undefined
  const prevStage = PIPELINE_STAGE_ORDER[currentIndex - 1] as PipelineStage | undefined

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      {/* Nome contatto */}
      <button
        onClick={() => onContactClick(opportunity.contactId)}
        className="text-sm font-medium text-indigo-600 hover:underline text-left leading-tight"
      >
        {contact ? fullName(contact) : '—'}
      </button>
      {contact?.company && (
        <p className="text-xs text-gray-400 mt-0.5">{contact.company}</p>
      )}

      {/* Score */}
      {contact && (
        <div className="mt-2">
          <ScoreBadge score={contact.score} />
        </div>
      )}

      {/* Valore deal */}
      {opportunity.dealValue && (
        <p className="mt-2 text-sm font-semibold text-gray-800">{formatEur(opportunity.dealValue)}</p>
      )}

      {/* Scadenza */}
      {opportunity.expectedCloseDate && (
        <p className="text-xs text-gray-400">
          Chiusura: {new Date(opportunity.expectedCloseDate).toLocaleDateString('it-IT')}
        </p>
      )}

      {/* Note */}
      {opportunity.notes && (
        <p className="mt-1.5 text-xs text-gray-500 leading-snug line-clamp-2">{opportunity.notes}</p>
      )}

      {/* Responsabile */}
      <p className="mt-2 text-xs text-gray-300">{owner?.name}</p>

      {/* Sposta */}
      <div className="mt-2.5 flex gap-1.5">
        {prevStage && (
          <button
            onClick={() => onMove(opportunity.id, prevStage)}
            className="flex-1 rounded border border-gray-200 py-1 text-xs text-gray-400 hover:bg-gray-50"
          >
            ← Indietro
          </button>
        )}
        {nextStage && (
          <button
            onClick={() => onMove(opportunity.id, nextStage)}
            className="flex-1 rounded border border-indigo-200 bg-indigo-50 py-1 text-xs text-indigo-600 hover:bg-indigo-100"
          >
            Avanti →
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function formatEur(value: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
}
