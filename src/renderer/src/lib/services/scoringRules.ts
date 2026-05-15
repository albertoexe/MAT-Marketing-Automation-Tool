import type { ScoringRule } from '../../types'
import { SCORE_PRESETS } from './scoring'

const STORAGE_KEY = 'crm_scoring_rules'

function seed(): ScoringRule[] {
  return SCORE_PRESETS.map((p, i) => ({
    id: `sr_default_${i}`,
    label: p.label,
    delta: p.delta,
    enabled: true,
  }))
}

export function getScoringRules(): ScoringRule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const defaults = seed()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults))
      return defaults
    }
    return JSON.parse(raw) as ScoringRule[]
  } catch {
    return seed()
  }
}

export function saveScoringRules(rules: ScoringRule[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rules))
}

export function addScoringRule(label: string, delta: number): ScoringRule {
  const rules = getScoringRules()
  const rule: ScoringRule = {
    id: `sr_${Date.now()}`,
    label,
    delta,
    enabled: true,
  }
  saveScoringRules([...rules, rule])
  return rule
}

export function updateScoringRule(id: string, patch: Partial<ScoringRule>): void {
  const rules = getScoringRules().map((r) => (r.id === id ? { ...r, ...patch } : r))
  saveScoringRules(rules)
}

export function deleteScoringRule(id: string): void {
  saveScoringRules(getScoringRules().filter((r) => r.id !== id))
}
