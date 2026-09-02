import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type RefObject } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  formatNotificationTime,
  markAllNotificationsRead,
  markNotificationRead,
  notificationHref,
  NOTIFICATIONS_QUERY_KEY,
  readItems,
  unreadItems,
  type NotificationsResponse,
} from '@/features/notifications/api'
import { notificationTypeMeta } from '@/features/notifications/meta'
import type { NotificationItem } from '@/types'
import { cn } from '@/lib/utils'

type NotificationPanelProps = {
  open: boolean
  onClose: () => void
  data?: NotificationsResponse
  anchorRef: RefObject<HTMLButtonElement | null>
}

export function NotificationPanel({ open, onClose, data, anchorRef }: NotificationPanelProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const panelRef = useRef<HTMLDivElement>(null)
  const [showEarlier, setShowEarlier] = useState(false)

  const unread = unreadItems(data?.items)
  const earlier = readItems(data?.items, 12)
  const unreadCount = data?.unreadCount ?? unread.length

  const invalidate = () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY })

  const markOne = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: invalidate,
  })
  const clearAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      setShowEarlier(false)
      invalidate()
    },
  })

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    const onPointer = (event: globalThis.MouseEvent) => {
      const target = event.target as Node
      if (panelRef.current?.contains(target)) return
      if (anchorRef.current?.contains(target)) return
      onClose()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointer)
    }
  }, [open, onClose, anchorRef])

  useEffect(() => {
    if (!open) setShowEarlier(false)
  }, [open])

  if (!open) return null

  const openItem = async (item: NotificationItem) => {
    if (!item.read) {
      try {
        await markOne.mutateAsync(item.id)
      } catch {
        // still navigate
      }
    }
    const href = notificationHref(item)
    onClose()
    if (href) navigate(href)
  }

  const dismissItem = async (event: ReactMouseEvent, item: NotificationItem) => {
    event.stopPropagation()
    if (!item.read) {
      await markOne.mutateAsync(item.id)
    }
  }

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Notifications"
      className="app-card absolute right-0 z-30 mt-2 w-[min(100vw-2rem,24rem)] overflow-hidden rounded-[28px] border border-teal-900/10 p-0 shadow-[0_28px_70px_rgb(15_61_56_/_0.22)]"
    >
      <div className="flex items-start justify-between gap-3 border-b border-teal-900/8 px-4 py-3.5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-teal-950">Notifications</h2>
            {unreadCount > 0 && (
              <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                {unreadCount}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-teal-900/50">
            {unreadCount > 0 ? 'New updates waiting for you' : 'You’re all caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            type="button"
            variant="ghost"
            className="h-auto px-2 py-1 text-xs text-teal-800"
            disabled={clearAll.isPending}
            onClick={() => clearAll.mutate()}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Clear all
          </Button>
        )}
      </div>

      <div className="max-h-[min(70vh,28rem)] overflow-y-auto p-2">
        {unread.length === 0 && !showEarlier && (
          <div className="px-3 py-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-teal-900/10 bg-teal-50 text-teal-700">
              <Bell className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-teal-950">No new notifications</p>
            <p className="mt-1 text-xs text-teal-900/50">Mentions, assignments, and reviews will show up here.</p>
            {earlier.length > 0 && (
              <button
                type="button"
                className="mt-4 text-xs font-medium text-teal-800 hover:underline"
                onClick={() => setShowEarlier(true)}
              >
                Show earlier
              </button>
            )}
          </div>
        )}

        {unread.length > 0 && (
          <div className="space-y-2">
            {unread.map((item) => (
              <NotificationRow
                key={item.id}
                item={item}
                unread
                onOpen={() => void openItem(item)}
                onDismiss={(event) => void dismissItem(event, item)}
              />
            ))}
          </div>
        )}

        {(showEarlier || (unread.length > 0 && earlier.length > 0)) && earlier.length > 0 && (
          <div className={cn('space-y-2', unread.length > 0 && 'mt-3 border-t border-teal-900/8 pt-3')}>
            <div className="flex items-center justify-between px-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-900/40">
                Earlier
              </span>
              {unread.length === 0 && (
                <button
                  type="button"
                  className="text-[11px] font-medium text-teal-800 hover:underline"
                  onClick={() => setShowEarlier(false)}
                >
                  Hide
                </button>
              )}
            </div>
            {earlier.map((item) => (
              <NotificationRow
                key={item.id}
                item={item}
                unread={false}
                onOpen={() => void openItem(item)}
                onDismiss={(event) => void dismissItem(event, item)}
              />
            ))}
          </div>
        )}

        {unread.length > 0 && earlier.length > 0 && !showEarlier && (
          <button
            type="button"
            className="mt-2 w-full rounded-2xl px-3 py-2 text-center text-xs font-medium text-teal-800 hover:bg-teal-50"
            onClick={() => setShowEarlier(true)}
          >
            Show earlier
          </button>
        )}
      </div>
    </div>
  )
}

function NotificationRow({
  item,
  unread,
  onOpen,
  onDismiss,
}: {
  item: NotificationItem
  unread: boolean
  onOpen: () => void
  onDismiss: (event: ReactMouseEvent) => void
}) {
  const meta = notificationTypeMeta(item.type)
  const Icon = meta.Icon

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpen()
        }
      }}
      className={cn(
        'group relative flex cursor-pointer gap-3 overflow-hidden rounded-2xl border p-3 text-left transition',
        unread ? meta.rowClass : 'border-teal-900/8 bg-white/70 text-teal-900/60 hover:bg-white',
      )}
    >
      {unread && <span className={cn('absolute inset-y-0 left-0 w-1', meta.barClass)} />}
      <div
        className={cn(
          'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border',
          unread ? meta.chipClass : 'border-teal-900/10 bg-teal-50/80 text-teal-700/70',
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <span
            className={cn(
              'rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]',
              unread ? meta.chipClass : 'border-teal-900/10 bg-teal-50/50 text-teal-900/45',
            )}
          >
            {meta.label}
          </span>
          <span className="shrink-0 text-[11px] text-teal-900/40">{formatNotificationTime(item.createdAt)}</span>
        </div>
        <div className={cn('mt-1.5 text-sm font-semibold leading-snug', unread ? 'text-teal-950' : 'text-teal-900/70')}>
          {item.title}
        </div>
        <div className={cn('mt-0.5 line-clamp-2 text-sm leading-relaxed', unread ? 'text-teal-900/65' : 'text-teal-900/45')}>
          {item.message}
        </div>
      </div>
      {unread && (
        <button
          type="button"
          aria-label="Dismiss notification"
          className="absolute right-2 top-2 rounded-full p-1 text-teal-900/30 opacity-0 transition hover:bg-white/80 hover:text-teal-900/70 group-hover:opacity-100"
          onClick={onDismiss}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
