import React, { useEffect, useState } from 'react'
import type { ScoringRule } from '../../types'
import {
  getScoringRules,
  addScoringRule,
  updateScoringRule,
  deleteScoringRule,
} from '../../lib/services/scoringRules'

export default function ScoringRulesPage(): React.JSX.Element {
  const [rules, setRules] = useState<ScoringRule[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editDelta, setEditDelta] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [newDelta, setNewDelta] = useState('')
  const [newError, setNewError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  function reload(): void {
    setRules(getScoringRules())
  }

  useEffect(() => { reload() }, [])

  // ── Add ───────────────────────────────────────────────────────────────────────

  function handleAdd(): void {
    setNewError('')
    const delta = parseInt(newDelta)
    if (!newLabel.trim()) { setNewError('Il nome è obbligatorio.'); return }
    if (isNaN(delta) || delta === 0) { setNewError('Il punteggio deve essere un numero diverso da 0.'); return }
    addScoringRule(newLabel.trim(), delta)
    setNewLabel('')
    setNewDelta('')
    reload()
  }

  // ── Edit inline ───────────────────────────────────────────────────────────────

  function startEdit(rule: ScoringRule): void {
    setEditingId(rule.id)
    setEditLabel(rule.label)
    setEditDelta(String(rule.delta))
  }

  function saveEdit(id: string): void {
    const delta = parseInt(editDelta)
    if (!editLabel.trim() || isNaN(delta) || delta === 0) return
    updateScoringRule(id, { label: editLabel.trim(), delta })
    setEditingId(null)
    reload()
  }

  function cancelEdit(): void {
    setEditingId(null)
  }

  // ── Toggle & delete ───────────────────────────────────────────────────────────

  function toggleEnabled(id: string, enabled: boolean): void {
    updateScoringRule(id, { enabled })
    reload()
  }

  function handleDelete(id: string): void {
    deleteScoringRule(id)
    setConfirmDelete(null)
    reload()
  }

  const positiveRules = rules.filter((r) => r.delta > 0)
  const negativeRules = rules.filter((r) => r.delta < 0)

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <h1 className="text-lg font-semibold text-gray-900">Regole punteggio</h1>
        <p className="mt-0.5 text-xs text-gray-500">
          Definisci quanti punti assegnare o sottrarre per ogni azione. Le regole disabilitate non appaiono nel pannello di aggiornamento punteggio.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="mx-auto max-w-2xl space-y-6">

          {/* Positive rules */}
          <RulesCard
            title="Azioni positive"
            rules={positiveRules}
            editingId={editingId}
            editLabel={editLabel}
            editDelta={editDelta}
            confirmDelete={confirmDelete}
            onEditLabel={setEditLabel}
            onEditDelta={setEditDelta}
            onStartEdit={startEdit}
            onSaveEdit={saveEdit}
            onCancelEdit={cancelEdit}
            onToggle={toggleEnabled}
            onDeleteRequest={setConfirmDelete}
            onDeleteConfirm={handleDelete}
            onDeleteCancel={() => setConfirmDelete(null)}
          />

          {/* Negative rules */}
          <RulesCard
            title="Azioni negative / decadimento"
            rules={negativeRules}
            editingId={editingId}
            editLabel={editLabel}
            editDelta={editDelta}
            confirmDelete={confirmDelete}
            onEditLabel={setEditLabel}
            onEditDelta={setEditDelta}
            onStartEdit={startEdit}
            onSaveEdit={saveEdit}
            onCancelEdit={cancelEdit}
            onToggle={toggleEnabled}
            onDeleteRequest={setConfirmDelete}
            onDeleteConfirm={handleDelete}
            onDeleteCancel={() => setConfirmDelete(null)}
          />

          {/* Add new rule */}
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Aggiungi regola
            </h2>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-gray-600">Nome azione</label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="es. Webinar completato"
                />
              </div>
              <div className="w-28">
                <label className="mb-1 block text-xs font-medium text-gray-600">Punti</label>
                <input
                  type="number"
                  value={newDelta}
                  onChange={(e) => setNewDelta(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="+20 o -10"
                />
              </div>
              <button
                onClick={handleAdd}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Aggiungi
              </button>
            </div>
            {newError && <p className="mt-2 text-xs text-red-500">{newError}</p>}
          </div>

        </div>
      </div>
    </div>
  )
}

// ─── RulesCard ────────────────────────────────────────────────────────────────

interface RulesCardProps {
  title: string
  rules: ScoringRule[]
  editingId: string | null
  editLabel: string
  editDelta: string
  confirmDelete: string | null
  onEditLabel: (v: string) => void
  onEditDelta: (v: string) => void
  onStartEdit: (r: ScoringRule) => void
  onSaveEdit: (id: string) => void
  onCancelEdit: () => void
  onToggle: (id: string, enabled: boolean) => void
  onDeleteRequest: (id: string) => void
  onDeleteConfirm: (id: string) => void
  onDeleteCancel: () => void
}

function RulesCard({
  title, rules,
  editingId, editLabel, editDelta, confirmDelete,
  onEditLabel, onEditDelta, onStartEdit, onSaveEdit, onCancelEdit,
  onToggle, onDeleteRequest, onDeleteConfirm, onDeleteCancel,
}: RulesCardProps): React.JSX.Element {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-gray-100 px-5 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">{title}</h2>
      </div>

      {rules.length === 0 ? (
        <p className="px-5 py-6 text-sm text-gray-400 text-center">Nessuna regola.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500">Azione</th>
              <th className="w-24 px-4 py-2.5 text-center text-xs font-medium text-gray-500">Punti</th>
              <th className="w-20 px-4 py-2.5 text-center text-xs font-medium text-gray-500">Attiva</th>
              <th className="w-24 px-4 py-2.5 text-right text-xs font-medium text-gray-500">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rules.map((rule) => {
              const isEditing = editingId === rule.id
              const isDeleting = confirmDelete === rule.id

              if (isDeleting) {
                return (
                  <tr key={rule.id} className="bg-red-50">
                    <td colSpan={4} className="px-5 py-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-red-700">
                          Eliminare "<strong>{rule.label}</strong>"?
                        </p>
                        <div className="flex gap-2">
                          <button onClick={onDeleteCancel}
                            className="rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50">
                            Annulla
                          </button>
                          <button onClick={() => onDeleteConfirm(rule.id)}
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
                      <input
                        autoFocus
                        value={editLabel}
                        onChange={(e) => onEditLabel(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && onSaveEdit(rule.id)}
                        className="w-full rounded-md border border-indigo-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={editDelta}
                        onChange={(e) => onEditDelta(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && onSaveEdit(rule.id)}
                        className="w-full rounded-md border border-indigo-300 px-2.5 py-1.5 text-center text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>
                    <td />
                    <td className="px-4 py-2 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={onCancelEdit}
                          className="text-xs text-gray-400 hover:text-gray-600">Annulla</button>
                        <button onClick={() => onSaveEdit(rule.id)}
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
                  <td className="px-5 py-3 text-gray-800">{rule.label}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-semibold ${rule.delta > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {rule.delta > 0 ? '+' : ''}{rule.delta}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => onToggle(rule.id, !rule.enabled)}
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
                      <button onClick={() => onStartEdit(rule)}
                        className="text-xs text-gray-400 hover:text-indigo-600">
                        Modifica
                      </button>
                      <button onClick={() => onDeleteRequest(rule.id)}
                        className="text-xs text-gray-400 hover:text-red-500">
                        Elimina
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
