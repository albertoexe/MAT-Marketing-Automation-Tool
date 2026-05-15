import React, { useEffect, useState } from 'react'
import type { AutomationRule, LifecycleStage } from '../../types'
import { STAGE_LABELS } from '../../types'
import {
  getAutomationRules,
  addAutomationRule,
  updateAutomationRule,
  deleteAutomationRule,
} from '../../lib/services/automationRules'

const TRIGGER_STAGES: LifecycleStage[] = ['lead', 'mql', 'sql', 'customer', 'lost']

export default function AutomationRulesPage(): React.JSX.Element {
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<AutomationRule>>({})
  const [newForm, setNewForm] = useState({
    triggerStage: 'mql' as LifecycleStage,
    taskTitle: '',
    dueDaysFromNow: '1',
    assignTo: 'owner' as 'owner' | 'sales',
  })
  const [newError, setNewError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  function reload(): void {
    setRules(getAutomationRules())
  }

  useEffect(() => { reload() }, [])

  // ── Add ───────────────────────────────────────────────────────────────────────

  function handleAdd(): void {
    setNewError('')
    const days = parseInt(newForm.dueDaysFromNow)
    if (!newForm.taskTitle.trim()) { setNewError('Il titolo del task è obbligatorio.'); return }
    if (isNaN(days) || days < 1) { setNewError('I giorni devono essere almeno 1.'); return }
    addAutomationRule(newForm.triggerStage, newForm.taskTitle.trim(), days, newForm.assignTo)
    setNewForm({ triggerStage: 'mql', taskTitle: '', dueDaysFromNow: '1', assignTo: 'owner' })
    reload()
  }

  // ── Edit inline ───────────────────────────────────────────────────────────────

  function startEdit(rule: AutomationRule): void {
    setEditingId(rule.id)
    setEditForm({ ...rule })
  }

  function saveEdit(id: string): void {
    const days = Number(editForm.dueDaysFromNow)
    if (!editForm.taskTitle?.trim() || isNaN(days) || days < 1) return
    updateAutomationRule(id, {
      triggerStage: editForm.triggerStage,
      taskTitle: editForm.taskTitle.trim(),
      dueDaysFromNow: days,
      assignTo: editForm.assignTo,
    })
    setEditingId(null)
    reload()
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <h1 className="text-lg font-semibold text-gray-900">Regole automazione</h1>
        <p className="mt-0.5 text-xs text-gray-500">
          Quando un contatto cambia fase, crea automaticamente un task di follow-up. Usa{' '}
          <code className="rounded bg-gray-100 px-1">{'{{firstName}}'}</code> e{' '}
          <code className="rounded bg-gray-100 px-1">{'{{lastName}}'}</code> nel titolo.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="mx-auto max-w-3xl space-y-6">

          {/* Rules table */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {rules.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-gray-400">Nessuna regola configurata.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500">Trigger</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Task creato</th>
                    <th className="w-20 px-4 py-2.5 text-center text-xs font-medium text-gray-500">Scadenza</th>
                    <th className="w-24 px-4 py-2.5 text-center text-xs font-medium text-gray-500">Assegna a</th>
                    <th className="w-20 px-4 py-2.5 text-center text-xs font-medium text-gray-500">Attiva</th>
                    <th className="w-28 px-4 py-2.5 text-right text-xs font-medium text-gray-500">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rules.map((rule) => {
                    const isEditing = editingId === rule.id
                    const isDeleting = confirmDelete === rule.id

                    if (isDeleting) {
                      return (
                        <tr key={rule.id} className="bg-red-50">
                          <td colSpan={6} className="px-5 py-3">
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-red-700">
                                Eliminare la regola per <strong>{STAGE_LABELS[rule.triggerStage]}</strong>?
                              </p>
                              <div className="flex gap-2">
                                <button onClick={() => setConfirmDelete(null)}
                                  className="rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50">
                                  Annulla
                                </button>
                                <button onClick={() => { deleteAutomationRule(rule.id); setConfirmDelete(null); reload() }}
                                  className="rounded-md bg-red-500 px-3 py-1 text-xs font-medium text-white hover:bg-red-600">
                                  Elimina
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )
                    }

                    if (isEditing) {
                      return (
                        <tr key={rule.id} className="bg-indigo-50">
                          <td className="px-4 py-2">
                            <select
                              value={editForm.triggerStage}
                              onChange={(e) => setEditForm((f) => ({ ...f, triggerStage: e.target.value as LifecycleStage }))}
                              className="w-full rounded-md border border-indigo-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                              {TRIGGER_STAGES.map((s) => (
                                <option key={s} value={s}>{STAGE_LABELS[s]}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-2">
                            <input
                              autoFocus
                              value={editForm.taskTitle ?? ''}
                              onChange={(e) => setEditForm((f) => ({ ...f, taskTitle: e.target.value }))}
                              className="w-full rounded-md border border-indigo-300 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              min={1}
                              value={editForm.dueDaysFromNow ?? 1}
                              onChange={(e) => setEditForm((f) => ({ ...f, dueDaysFromNow: Number(e.target.value) }))}
                              className="w-full rounded-md border border-indigo-300 px-2 py-1.5 text-center text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <select
                              value={editForm.assignTo ?? 'owner'}
                              onChange={(e) => setEditForm((f) => ({ ...f, assignTo: e.target.value as 'owner' | 'sales' }))}
                              className="w-full rounded-md border border-indigo-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                              <option value="owner">Responsabile</option>
                              <option value="sales">Vendite</option>
                            </select>
                          </td>
                          <td />
                          <td className="px-4 py-2 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => setEditingId(null)}
                                className="text-xs text-gray-400 hover:text-gray-600">Annulla</button>
                              <button onClick={() => saveEdit(rule.id)}
                                className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700">
                                Salva
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    }

                    return (
                      <tr key={rule.id} className={`hover:bg-gray-50 ${!rule.enabled ? 'opacity-40' : ''}`}>
                        <td className="px-5 py-3">
                          <StagePill stage={rule.triggerStage} />
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          <span className="font-medium">{rule.taskTitle}</span>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-500">
                          {rule.dueDaysFromNow === 1 ? 'Domani' : `+${rule.dueDaysFromNow}gg`}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-500">
                          {rule.assignTo === 'sales' ? 'Vendite' : 'Responsabile'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => { updateAutomationRule(rule.id, { enabled: !rule.enabled }); reload() }}
                            className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors ${
                              rule.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                            }`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                              rule.enabled ? 'translate-x-4' : 'translate-x-0'
                            }`} />
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-3">
                            <button onClick={() => startEdit(rule)}
                              className="text-xs text-gray-400 hover:text-indigo-600">Modifica</button>
                            <button onClick={() => setConfirmDelete(rule.id)}
                              className="text-xs text-gray-400 hover:text-red-500">Elimina</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Add new rule */}
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-400">Aggiungi regola</h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Quando la fase diventa</label>
                <select
                  value={newForm.triggerStage}
                  onChange={(e) => setNewForm((f) => ({ ...f, triggerStage: e.target.value as LifecycleStage }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {TRIGGER_STAGES.map((s) => (
                    <option key={s} value={s}>{STAGE_LABELS[s]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Assegna task a</label>
                <select
                  value={newForm.assignTo}
                  onChange={(e) => setNewForm((f) => ({ ...f, assignTo: e.target.value as 'owner' | 'sales' }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="owner">Responsabile contatto</option>
                  <option value="sales">Team Vendite</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Titolo del task{' '}
                  <span className="font-normal text-gray-400">
                    (usa <code className="rounded bg-gray-100 px-1">{'{{firstName}}'}</code>{' '}
                    <code className="rounded bg-gray-100 px-1">{'{{lastName}}'}</code>)
                  </span>
                </label>
                <input
                  type="text"
                  value={newForm.taskTitle}
                  onChange={(e) => setNewForm((f) => ({ ...f, taskTitle: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="es. Contattare {{firstName}} dopo diventato MQL"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Scadenza (giorni da oggi)</label>
                <input
                  type="number"
                  min={1}
                  value={newForm.dueDaysFromNow}
                  onChange={(e) => setNewForm((f) => ({ ...f, dueDaysFromNow: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleAdd}
                  className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Aggiungi regola
                </button>
              </div>
            </div>

            {newError && <p className="mt-2 text-xs text-red-500">{newError}</p>}
          </div>

        </div>
      </div>
    </div>
  )
}

// ─── StagePill ────────────────────────────────────────────────────────────────

function StagePill({ stage }: { stage: LifecycleStage }): React.JSX.Element {
  const styles: Record<LifecycleStage, string> = {
    lead:     'bg-gray-100 text-gray-700',
    mql:      'bg-blue-100 text-blue-700',
    sql:      'bg-indigo-100 text-indigo-700',
    customer: 'bg-green-100 text-green-700',
    lost:     'bg-red-100 text-red-600',
  }
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[stage]}`}>
      {STAGE_LABELS[stage]}
    </span>
  )
}
