import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { AppLayout } from '@/layouts/AppLayout'
import { HomePage } from '@/pages/HomePage'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { MembersPage } from '@/pages/MembersPage'
import { OrganizationDetailPage, SuperAdminOrganizations } from '@/pages/OrganizationsPage'
import { ForgotPasswordPage, ResetPasswordPage, SetupPasswordPage } from '@/pages/PasswordPages'
import { ProjectBoardPage } from '@/pages/ProjectBoardPage'
import { ProjectsPage } from '@/pages/ProjectsPage'
import { ReviewInboxPage } from '@/pages/ReviewInboxPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { TaskDetailPage } from '@/pages/TaskDetailPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<GuestOnly><LandingPage /></GuestOnly>} />
      <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
      <Route path="/setup-password" element={<SetupPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route
        path="/app"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="organizations" element={<SuperAdminOrganizations />} />
        <Route path="organizations/:id" element={<OrganizationDetailPage />} />
        <Route path="members" element={<MembersPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:id" element={<ProjectBoardPage />} />
        <Route path="review" element={<ReviewInboxPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="tasks/:id" element={<TaskDetailPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="grid min-h-screen place-items-center bg-canvas text-sm text-muted">Loading WeWorkTogether…</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

function GuestOnly({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="grid min-h-screen place-items-center bg-canvas text-sm text-muted">Loading…</div>
  if (user) return <Navigate to="/app" replace />
  return children
}
