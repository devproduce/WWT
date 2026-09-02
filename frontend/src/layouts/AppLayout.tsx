import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Bell,
  Building2,
  ClipboardList,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  UserRound,
  Users,
} from 'lucide-react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/features/auth/AuthContext'
import { api } from '@/services/api'
import { PushToastCard } from '@/components/PushToastCard'
import { listenForForegroundMessages } from '@/services/pushNotifications'
import type { NotificationItem } from '@/types'
import { formatDate, greetingFor } from '@/lib/utils'
import { WwtMark } from '@/components/WwtMark'
import { useEffect, useRef, useState } from 'react'

export function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
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

  const cancelSidebarClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }

  const openSidebar = () => {
    cancelSidebarClose()
    setSidebarOpen(true)
  }

  const closeSidebar = () => {
    cancelSidebarClose()
    setSidebarOpen(false)
  }

  const scheduleSidebarClose = () => {
    cancelSidebarClose()
    closeTimer.current = setTimeout(() => {
      setSidebarOpen(false)
      closeTimer.current = null
    }, 300)
  }

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!user) return
    let unsubscribe: (() => void) | undefined
    void listenForForegroundMessages((payload) => {
      const title = payload.notification?.title ?? payload.data?.title ?? 'Notification'
      const body = payload.notification?.body ?? payload.data?.body
      const taskId = payload.data?.taskId
      toast.custom(
        (id) => (
          <PushToastCard
            title={title}
            body={body}
            onOpen={taskId ? () => navigate(`/app/tasks/${taskId}`) : undefined}
            onDismiss={() => toast.dismiss(id)}
          />
        ),
        {
          duration: 12000,
          unstyled: true,
          className: 'push-toast-host',
        },
      )
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }).then((unsub) => {
      unsubscribe = unsub
    })
    return () => unsubscribe?.()
  }, [user, navigate, queryClient])

  if (!user) return null

  const isPm = user.managedProjectIds.length > 0
  const links = navFor(user.role, isPm)

  return (
    <div className="app-canvas relative h-screen overflow-hidden p-3">
      <div className="app-orb pointer-events-none absolute -top-24 left-10 h-72 w-72 rounded-full bg-teal-300/30 blur-3xl" />
      <div className="app-orb pointer-events-none absolute top-1/3 -right-16 h-80 w-80 rounded-full bg-amber-200/25 blur-3xl" style={{ animationDelay: '4s' }} />
      <div
        className={`relative z-10 flex h-full transition-[gap] duration-300 [transition-timing-function:var(--ease-app)] ${
          sidebarOpen ? 'gap-3' : 'gap-0'
        }`}
      >
        {!sidebarOpen && (
          <div aria-hidden className="absolute inset-y-0 left-0 z-20 w-3" onMouseEnter={openSidebar} />
        )}
        <div
          className={`h-full shrink-0 overflow-hidden transition-[width] duration-300 [transition-timing-function:var(--ease-app)] ${
            sidebarOpen ? 'w-64' : 'w-0'
          }`}
        >
          <aside
            className="flex h-full w-64 flex-col rounded-[28px] bg-[#0f3d38] text-teal-50 shadow-[0_24px_60px_rgb(15_61_56_/_0.28)]"
            onMouseEnter={cancelSidebarClose}
            onMouseLeave={scheduleSidebarClose}
            aria-hidden={!sidebarOpen}
          >
          <div className="px-5 py-6">
            <div className="flex items-center gap-2.5">
              <WwtMark />
              <div>
                <div className="text-sm font-semibold tracking-[0.22em] text-white">WWT</div>
                <div className="text-[11px] text-teal-200/70">Work together, stay aligned</div>
              </div>
            </div>
          </div>
          <nav className="flex-1 space-y-1 px-3">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/app'}
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `app-nav-pill flex items-center gap-2.5 rounded-full px-3.5 py-2.5 text-sm ${
                    isActive
                      ? 'bg-teal-300 text-teal-950 shadow-[0_10px_24px_rgb(45_212_191_/_0.28)]'
                      : 'text-teal-100/75 hover:bg-white/8 hover:text-white'
                  }`
                }
              >
                {link.icon}
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="space-y-1 px-3 pb-4">
            <NavLink
              to="/app/profile"
              onClick={closeSidebar}
              className={({ isActive }) =>
                `app-nav-pill flex items-center gap-2.5 rounded-full px-3.5 py-2.5 text-sm ${
                  isActive
                    ? 'bg-teal-300 text-teal-950 shadow-[0_10px_24px_rgb(45_212_191_/_0.28)]'
                    : 'text-teal-100/75 hover:bg-white/8 hover:text-white'
                }`
              }
            >
              <UserRound className="h-4 w-4" />
              Profile
            </NavLink>
            <button
              type="button"
              className="app-nav-pill flex w-full items-center gap-2.5 rounded-full px-3.5 py-2.5 text-left text-sm text-teal-100/75 hover:bg-white/8 hover:text-white"
              onClick={async () => {
                await logout()
                navigate('/login')
              }}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </aside>
        </div>
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto rounded-[28px] border border-white/50 bg-white/45 shadow-[0_24px_60px_rgb(15_61_56_/_0.08)] backdrop-blur-xl">
          <header className="flex items-center justify-between gap-4 px-6 py-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="shrink-0 rounded-full border border-teal-900/10 bg-white/70 p-2.5 hover:bg-white"
                onMouseEnter={cancelSidebarClose}
                onClick={() => (sidebarOpen ? closeSidebar() : openSidebar())}
                aria-label={sidebarOpen ? 'Close navigation' : 'Open navigation'}
                aria-expanded={sidebarOpen}
              >
                {sidebarOpen ? (
                  <PanelLeftClose className="h-5 w-5 text-teal-800" />
                ) : (
                  <Menu className="h-5 w-5 text-teal-800" />
                )}
              </button>
              <div>
                <div className="text-lg font-semibold tracking-tight text-teal-950">
                  {greetingFor(user.firstName)}
                </div>
                <div className="font-serif text-sm italic text-teal-900/55">
                  {user.organizationName ?? 'Platform console'}
                </div>
              </div>
            </div>
            <div className="relative">
              <button
                type="button"
                className="relative rounded-full border border-teal-900/10 bg-white/70 p-2.5 hover:bg-white"
                onClick={() => setNotificationsOpen((v) => !v)}
              >
                <Bell className="h-5 w-5 text-teal-800" />
                {(notifications.data?.unreadCount ?? 0) > 0 && (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 landing-pulse" />
                )}
              </button>
              {notificationsOpen && (
                <div className="app-card absolute right-0 z-20 mt-2 w-80 rounded-[24px] p-3 shadow-[0_24px_60px_rgb(15_61_56_/_0.18)]">
                  <div className="mb-2 flex items-center justify-between px-2">
                    <span className="text-sm font-medium text-teal-950">Notifications</span>
                    <button className="text-xs text-teal-700" onClick={() => markAll.mutate()} type="button">
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-80 overflow-auto">
                    {(notifications.data?.items ?? []).length === 0 && (
                      <div className="px-2 py-6 text-center text-sm text-teal-900/50">No notifications yet</div>
                    )}
                    {(notifications.data?.items ?? []).map((item) => {
                      const href = item.taskId
                        ? `/app/tasks/${item.taskId}`
                        : item.projectId
                          ? `/app/projects/${item.projectId}`
                          : null
                      const mentioned = item.type === 'COMMENT_MENTIONED'
                      const body = (
                        <>
                          {mentioned && (
                            <div className="mb-0.5 font-mono text-[10px] tracking-[0.18em] text-violet-700 uppercase">
                              Mentioned you
                            </div>
                          )}
                          <div className="font-medium">{item.title}</div>
                          <div>{item.message}</div>
                          <div className="text-xs text-teal-900/40">{formatDate(item.createdAt)}</div>
                        </>
                      )
                      const className = `block rounded-2xl px-3 py-2 text-sm ${
                        mentioned
                          ? item.read
                            ? 'text-violet-900/60'
                            : 'bg-violet-50 text-violet-950'
                          : item.read
                            ? 'text-teal-900/55'
                            : 'bg-teal-50 text-teal-950'
                      }`
                      return href ? (
                        <Link
                          key={item.id}
                          to={href}
                          className={`${className} ${mentioned ? 'hover:bg-violet-100' : 'hover:bg-teal-50'}`}
                          onClick={() => setNotificationsOpen(false)}
                        >
                          {body}
                        </Link>
                      ) : (
                        <div key={item.id} className={className}>
                          {body}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </header>
          <main className="px-6 pb-6" onMouseEnter={scheduleSidebarClose} onPointerDown={closeSidebar}>
            <div className="mx-auto max-w-7xl">
              <Outlet />
            </div>
          </main>
        </div>
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
      { to: '/app/review', label: 'Reviews', icon: <Inbox className="h-4 w-4" /> },
      { to: '/app/members', label: 'Members', icon: <Users className="h-4 w-4" /> },
      { to: '/app/projects', label: 'Projects', icon: <FolderKanban className="h-4 w-4" /> },
    ]
  }
  return [
    { to: '/app', label: 'My work', icon: <ClipboardList className="h-4 w-4" /> },
    ...(isPm ? [{ to: '/app/review', label: 'Review inbox', icon: <Inbox className="h-4 w-4" /> }] : []),
    { to: '/app/projects', label: isPm ? 'Projects' : 'My projects', icon: <FolderKanban className="h-4 w-4" /> },
  ]
}
