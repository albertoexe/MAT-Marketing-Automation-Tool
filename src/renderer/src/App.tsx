import React from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './features/auth/AuthContext'
import LoginPage from './features/auth/LoginPage'
import AppShell from './components/AppShell'
import DashboardPage from './pages/DashboardPage'
import ContactsPage from './features/contacts/ContactsPage'
import ContactDetailPage from './features/contacts/ContactDetailPage'
import NewContactPage from './features/contacts/NewContactPage'
import ImportPage from './features/contacts/ImportPage'
import ScoringRulesPage from './features/scoring/ScoringRulesPage'
import AutomationRulesPage from './features/scoring/AutomationRulesPage'
import PipelinePage from './pages/PipelinePage'
import TasksPage from './pages/TasksPage'

function AppRoutes(): React.JSX.Element {
  const { user } = useAuth()

  if (!user) return <LoginPage />

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/contatti" element={<ContactsPage />} />
        <Route path="/contatti/nuovo" element={<NewContactPage />} />
        <Route path="/contatti/importa" element={<ImportPage />} />
        <Route path="/contatti/:id" element={<ContactDetailPage />} />
        <Route path="/pipeline" element={<PipelinePage />} />
        <Route path="/attivita" element={<TasksPage />} />
        <Route path="/scoring" element={<ScoringRulesPage />} />
        <Route path="/automazioni" element={<AutomationRulesPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App(): React.JSX.Element {
  return (
    <HashRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </HashRouter>
  )
}
