import React from 'react'
import { getHeatLevel } from '../types'

interface Props {
  score: number
}

const styles = {
  hot:  'bg-red-100 text-red-700 border-red-200',
  warm: 'bg-amber-100 text-amber-700 border-amber-200',
  cold: 'bg-blue-100 text-blue-600 border-blue-200',
}

const labels = { hot: '🔥', warm: '〜', cold: '❄' }

export default function ScoreBadge({ score }: Props): React.JSX.Element {
  const heat = getHeatLevel(score)
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${styles[heat]}`}>
      {labels[heat]} {score}
    </span>
  )
}
