import React, { useState } from 'react'
import { useAuth } from './AuthContext'

const DEMO_USERS = [
  { name: 'Alice Rossi', email: 'alice@company.com', role: 'Marketing' },
  { name: 'Carlo Bianchi', email: 'carlo@company.com', role: 'Vendite' },
]

export default function LoginPage(): React.JSX.Element {
  const { signIn, loading, error } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    await signIn(email, password)
  }

  async function handleDemoLogin(demoEmail: string): Promise<void> {
    await signIn(demoEmail, 'password123')
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600">
            <span className="text-xl font-bold text-white">C</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">CRM</h1>
          <p className="mt-1 text-sm text-gray-500">Piattaforma Marketing & Vendite</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="text"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="tu@azienda.com"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Accesso in corso…' : 'Accedi'}
            </button>
          </div>

          <div className="mt-5 border-t border-gray-100 pt-4">
            <p className="mb-2 text-center text-xs font-medium text-gray-400">Accesso rapido demo</p>
            <div className="flex gap-2">
              {DEMO_USERS.map((u) => (
                <button
                  key={u.email}
                  type="button"
                  disabled={loading}
                  onClick={() => handleDemoLogin(u.email)}
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-left hover:bg-gray-50 disabled:opacity-50"
                >
                  <p className="text-xs font-medium text-gray-700">{u.name}</p>
                  <p className="text-xs text-gray-400">{u.role}</p>
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
