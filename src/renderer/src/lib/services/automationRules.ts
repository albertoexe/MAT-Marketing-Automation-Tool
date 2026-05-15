import type { AutomationRule, LifecycleStage } from '../../types'

const STORAGE_KEY = 'crm_automation_rules'

const DEFAULT_RULES: AutomationRule[] = [
  {
    id: 'ar_default_0',
    triggerStage: 'mql',
    taskTitle: 'Inviare email di nurturing a {{firstName}}',
    dueDaysFromNow: 2,
    assignTo: 'owner',
    enabled: true,
  },
  {
    id: 'ar_default_1',
    triggerStage: 'sql',
    taskTitle: 'Chiamare {{firstName}} {{lastName}} — nuovo SQL',
    dueDaysFromNow: 1,
    assignTo: 'sales',
    enabled: true,
  },
  {
    id: 'ar_default_2',
    triggerStage: 'customer',
    taskTitle: 'Inviare email di benvenuto a {{firstName}}',
    dueDaysFromNow: 1,
    assignTo: 'owner',
    enabled: true,
  },
]

export function getAutomationRules(): AutomationRule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_RULES))
      return DEFAULT_RULES
    }
    return JSON.parse(raw) as AutomationRule[]
  } catch {
    return DEFAULT_RULES
  }
}

export function saveAutomationRules(rules: AutomationRule[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rules))
}

export function addAutomationRule(
  triggerStage: LifecycleStage,
  taskTitle: string,
  dueDaysFromNow: number,
  assignTo: 'owner' | 'sales'
): AutomationRule {
  const rules = getAutomationRules()
  const rule: AutomationRule = {
    id: `ar_${Date.now()}`,
    triggerStage,
    taskTitle,
    dueDaysFromNow,
    assignTo,
    enabled: true,
  }
  saveAutomationRules([...rules, rule])
  return rule
}

export function updateAutomationRule(id: string, patch: Partial<AutomationRule>): void {
  const rules = getAutomationRules().map((r) => (r.id === id ? { ...r, ...patch } : r))
  saveAutomationRules(rules)
}

export function deleteAutomationRule(id: string): void {
  saveAutomationRules(getAutomationRules().filter((r) => r.id !== id))
}
