import React from 'react'
import type { LifecycleStage } from '../types'
import { STAGE_LABELS } from '../types'

interface Props {
  stage: LifecycleStage
}

const config: Record<LifecycleStage, string> = {
  lead:     'bg-gray-100 text-gray-600 border-gray-200',
  mql:      'bg-purple-100 text-purple-700 border-purple-200',
  sql:      'bg-indigo-100 text-indigo-700 border-indigo-200',
  customer: 'bg-green-100 text-green-700 border-green-200',
  lost:     'bg-red-50 text-red-400 border-red-100',
}

export default function StageBadge({ stage }: Props): React.JSX.Element {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${config[stage]}`}>
      {STAGE_LABELS[stage]}
    </span>
  )
}
