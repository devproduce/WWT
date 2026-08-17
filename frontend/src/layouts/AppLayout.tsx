import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, Building2, ClipboardList, FolderKanban, LayoutDashboard, LogOut, Users } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { api } from '@/services/api'
import type { NotificationItem } from '@/types'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { useState } from 'react'

export function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const notifications = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await api.get<{ unreadCount: number; items: NotificationItem[] }>('/notifications')).data,
    refetchInterval: 30000,
  })
  const markAll = useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  if (!user) return null

  const links = navFor(user.role, user.managedProjectIds.length > 0)

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 flex-col bg-slate-950 text-slate-200">
        <div className="px-5 py-6">
          <div className="text-lg font-semibold tracking-tight text-white">WeWorkTogether</div>
          <div className="text-xs text-slate-400">Work together, stay aligned</div>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-teal-700 text-white' : 'hover:bg-slate-800'}`
              }
            >
              {link.icon}
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-800 p-4 text-sm">
          <div className="font-medium text-white">
            {user.firstName} {user.lastName}
          </div>
          <div className="text-xs text-slate-400">{user.email}</div>
          <div className="mt-1 text-xs uppercase tracking-wide text-teal-400">{user.role.replace('_', ' ')}</div>
          <Button
            variant="ghost"
            className="mt-3 w-full justify-start text-slate-300 hover:bg-slate-800 hover:text-white"
            onClick={async () => {
              await logout()
              navigate('/login')
            }}
          >
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <div className="text-sm text-slate-500">{user.organizationName ?? 'Platform console'}</div>
          <div className="relative">
            <button
              type="button"
              className="relative rounded-lg p-2 hover:bg-slate-100"
              onClick={() => setOpen((v) => !v)}
            >
              <Bell className="h-5 w-5 text-slate-600" />
              {(notifications.data?.unreadCount ?? 0) > 0 && (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
              )}
            </button>
            {open && (
              <div className="absolute right-0 z-20 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                <div className="mb-2 flex items-center justify-between px-2">
                  <span className="text-sm font-medium">Notifications</span>
                  <button className="text-xs text-teal-700" onClick={() => markAll.mutate()} type="button">
                    Mark all read
                  </button>
                </div>
                <div className="max-h-80 overflow-auto">
                  {(notifications.data?.items ?? []).length === 0 && (
                    <div className="px-2 py-6 text-center text-sm text-slate-500">No notifications yet</div>
                  )}
                  {(notifications.data?.items ?? []).map((item) => (
                    <div key={item.id} className={`rounded-lg px-2 py-2 text-sm ${item.read ? 'text-slate-500' : 'bg-teal-50'}`}>
                      <div className="font-medium text-slate-800">{item.title}</div>
                      <div>{item.message}</div>
                      <div className="text-xs text-slate-400">{formatDate(item.createdAt)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function navFor(role: string, isPm: boolean) {
  if (role === 'SUPER_ADMIN') {
    return [
      { to: '/app', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
      { to: '/app/organizations', label: 'Organizations', icon: <Building2 className="h-4 w-4" /> },
    ]
  }
  if (role === 'ADMIN') {
    return [
      { to: '/app', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
      { to: '/app/members', label: 'Members', icon: <Users className="h-4 w-4" /> },
      { to: '/app/projects', label: 'Projects', icon: <FolderKanban className="h-4 w-4" /> },
    ]
  }
  const links = [
    { to: '/app', label: 'My work', icon: <ClipboardList className="h-4 w-4" /> },
    { to: '/app/projects', label: isPm ? 'Projects' : 'My projects', icon: <FolderKanban className="h-4 w-4" /> },
  ]
  return links
}
