import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Task } from '../types'
import { fullName } from '../types'
import { getTasks, completeTask } from '../lib/services/tasks'
import { getContacts } from '../lib/services/contacts'
import { MOCK_USERS } from '../lib/mock/data'
import { useAuth } from '../features/auth/AuthContext'
import type { Contact } from '../types'

// ─── Date bucketing ───────────────────────────────────────────────────────────

type DateBucket = 'overdue' | 'today' | 'tomorrow' | 'this_week' | 'later'

const BUCKET_LABELS: Record<DateBucket, string> = {
  overdue:   '⚠ Scaduti',
  today:     'Oggi',
  tomorrow:  'Domani',
  this_week: 'Questa settimana',
  later:     'Più avanti',
}

const BUCKET_ORDER: DateBucket[] = ['overdue', 'today', 'tomorrow', 'this_week', 'later']

function getBucket(dueDate: string): DateBucket {
  const now   = new Date()
  const due   = new Date(dueDate)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate())

  const diffDays = Math.round((dueDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'overdue'
  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'tomorrow'
  if (diffDays <= 7) return 'this_week'
  return 'later'
}

function groupTasks(tasks: Task[]): Partial<Record<DateBucket, Task[]>> {
  const groups: Partial<Record<DateBucket, Task[]>> = {}
  for (const task of tasks) {
    const bucket = getBucket(task.dueDate)
    if (!groups[bucket]) groups[bucket] = []
    groups[bucket]!.push(task)
  }
  // Sort each bucket by dueDate ascending
  for (const bucket of BUCKET_ORDER) {
    groups[bucket]?.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
  }
  return groups
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function TasksPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [tasks, setTasks] = useState<Task[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [myTasksOnly, setMyTasksOnly] = useState(true)
  const [showCompleted, setShowCompleted] = useState(false)
  const [completing, setCompleting] = useState<string | null>(null)

  async function load(): Promise<void> {
    const [t, c] = await Promise.all([getTasks(), getContacts()])
    setTasks(t)
    setContacts(c)
  }

  useEffect(() => { load() }, [])

  async function handleComplete(taskId: string): Promise<void> {
    setCompleting(taskId)
    await completeTask(taskId)
    await load()
    setCompleting(null)
  }

  // ── Filtering ─────────────────────────────────────────────────────────────────

  const filtered = tasks.filter((t) => {
    if (!showCompleted && t.completed) return false
    if (myTasksOnly && user && t.assignedTo !== user.id) return false
    return true
  })

  const pendingCount = filtered.filter((t) => !t.completed).length
  const groups = groupTasks(filtered.filter((t) => !t.completed))
  const todayCount = groups.today?.length ?? 0

  // ── Helpers ───────────────────────────────────────────────────────────────────

  function contactFor(contactId: string): Contact | undefined {
    return contacts.find((c) => c.id === contactId)
  }

  function assigneeName(assignedTo: string): string {
    return MOCK_USERS.find((u) => u.id === assignedTo)?.name ?? '—'
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col">
      {/* Intestazione */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Attività</h1>
            <p className="text-xs text-gray-400">{pendingCount} attività in sospeso</p>
          </div>
          {/* Filtro utente */}
          <div className="flex items-center gap-1 rounded-lg border border-gray-200 p-1">
            <button
              onClick={() => setMyTasksOnly(true)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                myTasksOnly ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Le mie
            </button>
            <button
              onClick={() => setMyTasksOnly(false)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                !myTasksOnly ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Tutte
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50">
        {/* Alert banner — oggi */}
        {todayCount > 0 && (
          <div className="mx-4 mt-4 flex items-center gap-3 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3">
            <span className="text-xl">🔔</span>
            <p className="text-sm font-medium text-yellow-800">
              {todayCount === 1
                ? 'Hai 1 attività in scadenza oggi'
                : `Hai ${todayCount} attività in scadenza oggi`}
            </p>
          </div>
        )}

        <div className="p-4 space-y-6">
          {BUCKET_ORDER.map((bucket) => {
            const bucketTasks = groups[bucket]
            if (!bucketTasks || bucketTasks.length === 0) return null

            return (
              <BucketSection
                key={bucket}
                bucket={bucket}
                tasks={bucketTasks}
                contactFor={contactFor}
                assigneeName={assigneeName}
                completing={completing}
                onComplete={handleComplete}
                onNavigate={(id) => navigate(`/contatti/${id}`)}
                showAssignee={!myTasksOnly}
              />
            )
          })}

          {pendingCount === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="text-4xl">✓</span>
              <p className="mt-3 text-sm font-medium text-gray-600">
                {myTasksOnly ? 'Tutte le tue attività completate!' : 'Nessuna attività in sospeso.'}
              </p>
            </div>
          )}

          {/* Mostra completate */}
          <div className="flex justify-center pt-2">
            <button
              onClick={() => setShowCompleted((v) => !v)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              {showCompleted ? '↑ Nascondi completate' : '↓ Mostra completate'}
            </button>
          </div>

          {/* Completate */}
          {showCompleted && (
            <CompletedSection
              tasks={filtered.filter((t) => t.completed)}
              contactFor={contactFor}
              assigneeName={assigneeName}
              onNavigate={(id) => navigate(`/contatti/${id}`)}
              showAssignee={!myTasksOnly}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── BucketSection ────────────────────────────────────────────────────────────

interface BucketSectionProps {
  bucket: DateBucket
  tasks: Task[]
  contactFor: (id: string) => Contact | undefined
  assigneeName: (id: string) => string
  completing: string | null
  onComplete: (id: string) => void
  onNavigate: (contactId: string) => void
  showAssignee: boolean
}

function BucketSection({
  bucket,
  tasks,
  contactFor,
  assigneeName,
  completing,
  onComplete,
  onNavigate,
  showAssignee,
}: BucketSectionProps): React.JSX.Element {
  const isUrgent = bucket === 'overdue' || bucket === 'today'

  return (
    <div>
      {/* Section header */}
      <div className="mb-2 flex items-center gap-2">
        <h2 className={`text-xs font-semibold uppercase tracking-wide ${
          bucket === 'overdue' ? 'text-red-500' :
          bucket === 'today'   ? 'text-yellow-600' :
          'text-gray-400'
        }`}>
          {BUCKET_LABELS[bucket]}
        </h2>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
          bucket === 'overdue' ? 'bg-red-100 text-red-600' :
          bucket === 'today'   ? 'bg-yellow-100 text-yellow-700' :
          'bg-gray-100 text-gray-500'
        }`}>
          {tasks.length}
        </span>
      </div>

      {/* Task cards */}
      <div className={`space-y-2 rounded-xl p-3 ${
        isUrgent ? 'bg-white border border-gray-200' : ''
      }`}>
        {tasks.map((task) => {
          const contact = contactFor(task.contactId)
          const isCompleting = completing === task.id

          return (
            <div
              key={task.id}
              className={`flex items-center gap-3 rounded-lg border bg-white px-4 py-3 ${
                bucket === 'overdue' ? 'border-red-100' :
                bucket === 'today'   ? 'border-yellow-100' :
                'border-gray-200'
              }`}
            >
              {/* Complete button */}
              <button
                onClick={() => onComplete(task.id)}
                disabled={isCompleting}
                title="Segna come completata"
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  isCompleting
                    ? 'border-indigo-300 bg-indigo-100'
                    : 'border-gray-300 hover:border-indigo-500 hover:bg-indigo-50'
                }`}
              >
                {isCompleting && <span className="text-xs text-indigo-500">✓</span>}
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                <div className="mt-0.5 flex items-center gap-2">
                  {contact && (
                    <button
                      onClick={() => onNavigate(contact.id)}
                      className="text-xs text-indigo-600 hover:underline truncate"
                    >
                      {fullName(contact)}
                    </button>
                  )}
                  {showAssignee && (
                    <>
                      {contact && <span className="text-gray-300">·</span>}
                      <span className="text-xs text-gray-400">{assigneeName(task.assignedTo)}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Due date */}
              <div className="shrink-0 text-right">
                <p className={`text-xs font-medium ${
                  bucket === 'overdue' ? 'text-red-500' :
                  bucket === 'today'   ? 'text-yellow-600' :
                  'text-gray-400'
                }`}>
                  {bucket === 'overdue' && '⚠ '}
                  {formatDueDate(task.dueDate, bucket)}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── CompletedSection ─────────────────────────────────────────────────────────

interface CompletedSectionProps {
  tasks: Task[]
  contactFor: (id: string) => Contact | undefined
  assigneeName: (id: string) => string
  onNavigate: (contactId: string) => void
  showAssignee: boolean
}

function CompletedSection({ tasks, contactFor, assigneeName, onNavigate, showAssignee }: CompletedSectionProps): React.JSX.Element {
  if (tasks.length === 0) return <p className="text-center text-xs text-gray-400">Nessuna attività completata.</p>

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-300">Completate</h2>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-400">{tasks.length}</span>
      </div>
      <div className="space-y-1.5">
        {tasks.map((task) => {
          const contact = contactFor(task.contactId)
          return (
            <div key={task.id} className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white px-4 py-2.5 opacity-60">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs text-green-600">✓</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-500 line-through truncate">{task.title}</p>
                {contact && (
                  <button onClick={() => onNavigate(contact.id)} className="text-xs text-indigo-400 hover:underline">
                    {fullName(contact)}
                  </button>
                )}
              </div>
              {showAssignee && <span className="text-xs text-gray-300">{assigneeName(task.assignedTo)}</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDueDate(dueDate: string, bucket: DateBucket): string {
  const d = new Date(dueDate)
  if (bucket === 'today') {
    return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
  }
  if (bucket === 'tomorrow') {
    return `Domani ${d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`
  }
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })
}
