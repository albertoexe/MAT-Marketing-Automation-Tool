import React from 'react'
import { MOCK_TASKS, MOCK_CONTACTS, MOCK_USERS } from '../lib/mock/data'
import { fullName } from '../types'
import { useNavigate } from 'react-router-dom'

export default function TasksPage(): React.JSX.Element {
  const navigate = useNavigate()
  const pending = MOCK_TASKS.filter((t) => !t.completed)

  return (
    <div className="p-6">
      <h1 className="mb-6 text-lg font-semibold text-gray-900">Attività</h1>
      <div className="space-y-2">
        {pending.map((t) => {
          const contact = MOCK_CONTACTS.find((c) => c.id === t.contactId)
          const assignee = MOCK_USERS.find((u) => u.id === t.assignedTo)
          const overdue = new Date(t.dueDate) < new Date()
          return (
            <div
              key={t.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{t.title}</p>
                {contact && (
                  <button
                    onClick={() => navigate(`/contatti/${contact.id}`)}
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    {fullName(contact)}
                  </button>
                )}
              </div>
              <div className="text-right">
                <p className={`text-xs font-medium ${overdue ? 'text-red-500' : 'text-gray-400'}`}>
                  {overdue ? '⚠ Scaduto · ' : ''}
                  {new Date(t.dueDate).toLocaleDateString('it-IT')}
                </p>
                <p className="text-xs text-gray-400">{assignee?.name}</p>
              </div>
            </div>
          )
        })}
        {pending.length === 0 && (
          <p className="text-center text-sm text-gray-400">Tutte le attività completate ✓</p>
        )}
      </div>
    </div>
  )
}
