import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
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
  Bell,
} from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/features/auth/AuthContext'
import { PushToastCard } from '@/components/PushToastCard'
import { NotificationPanel } from '@/components/NotificationPanel'
import { listenForForegroundMessages } from '@/services/pushNotifications'
import {
  fetchNotifications,
  NOTIFICATIONS_QUERY_KEY,
} from '@/features/notifications/api'
import { greetingFor } from '@/lib/utils'
import { WwtMark } from '@/components/WwtMark'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useEffect, useRef, useState, type ReactNode } from 'react'

type NavItem = {
  to: string
  label: string
  icon: ReactNode
}

export function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const bellRef = useRef<HTMLButtonElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const queryClient = useQueryClient()
  const notifications = useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: fetchNotifications,
    refetchInterval: 30000,
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
      void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY })
    }).then((unsub) => {
      unsubscribe = unsub
    })
    return () => unsubscribe?.()
  }, [user, navigate, queryClient])

  if (!user) return null

  const isPm = user.managedProjectIds.length > 0
  const links = navFor(user.role, isPm)
  const unreadCount = notifications.data?.unreadCount ?? 0

  return (
    <div className="app-canvas relative h-screen overflow-hidden p-3">
      <div className="app-orb pointer-events-none absolute -top-24 left-10 h-72 w-72 rounded-full bg-teal-300/30 blur-3xl dark:bg-teal-300/12" />
      <div className="app-orb pointer-events-none absolute top-1/3 -right-16 h-80 w-80 rounded-full bg-amber-200/25 blur-3xl dark:bg-amber-200/10" style={{ animationDelay: '4s' }} />
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
            className="flex h-full w-64 flex-col rounded-[28px] bg-sidebar text-teal-50 shadow-[0_24px_60px_rgb(15_61_56_/_0.28)] dark:shadow-[0_24px_60px_rgb(0_0_0_/_0.45)]"
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
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto rounded-[28px] border border-white/50 bg-white/45 shadow-[0_24px_60px_rgb(15_61_56_/_0.08)] backdrop-blur-xl dark:border-teal-200/12 dark:bg-[#0f3d38]/55 dark:shadow-[0_24px_60px_rgb(0_0_0_/_0.4)]">
          <header className="flex items-center justify-between gap-4 px-6 py-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="shrink-0 rounded-full border border-teal-900/10 bg-white/70 p-2.5 hover:bg-white dark:border-teal-200/15 dark:bg-teal-700/40 dark:hover:bg-teal-600/45"
                onMouseEnter={cancelSidebarClose}
                onClick={() => (sidebarOpen ? closeSidebar() : openSidebar())}
                aria-label={sidebarOpen ? 'Close navigation' : 'Open navigation'}
                aria-expanded={sidebarOpen}
              >
                {sidebarOpen ? (
                  <PanelLeftClose className="h-5 w-5 text-teal-800 dark:text-teal-200" />
                ) : (
                  <Menu className="h-5 w-5 text-teal-800 dark:text-teal-200" />
                )}
              </button>
              <div>
                <div className="text-lg font-semibold tracking-tight text-ink">
                  {greetingFor(user.firstName)}
                </div>
                <div className="font-serif text-sm italic text-muted">
                  {user.organizationName ?? 'Platform console'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle compact />
              <div className="relative">
              <button
                ref={bellRef}
                type="button"
                className="relative rounded-full border border-teal-900/10 bg-white/70 p-2.5 hover:bg-white dark:border-teal-200/15 dark:bg-teal-700/40 dark:hover:bg-teal-600/45"
                aria-label="Open notifications"
                aria-expanded={notificationsOpen}
                onClick={() => setNotificationsOpen((v) => !v)}
              >
                <Bell className="h-5 w-5 text-teal-800 dark:text-teal-200" />
                {unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 landing-pulse" />
                )}
              </button>
              <NotificationPanel
                open={notificationsOpen}
                onClose={() => setNotificationsOpen(false)}
                data={notifications.data}
                anchorRef={bellRef}
              />
              </div>
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

function navFor(role: string, isPm: boolean): NavItem[] {
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
    {
      to: '/app/projects',
      label: isPm ? 'Projects' : 'My projects',
      icon: <FolderKanban className="h-4 w-4" />,
    },
  ]
}
