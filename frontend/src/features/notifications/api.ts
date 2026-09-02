import { api } from '@/services/api'
import type { NotificationItem } from '@/types'

export const NOTIFICATIONS_QUERY_KEY = ['notifications'] as const

export type NotificationsResponse = {
  unreadCount: number
  items: NotificationItem[]
}

export async function fetchNotifications() {
  const { data } = await api.get<NotificationsResponse>('/notifications')
  return data
}

export async function markNotificationRead(id: string) {
  await api.post(`/notifications/${id}/read`)
}

export async function markAllNotificationsRead() {
  await api.post('/notifications/read-all')
}

export function notificationHref(item: NotificationItem) {
  if (item.taskId) return `/app/tasks/${item.taskId}`
  if (item.projectId) return `/app/projects/${item.projectId}`
  return null
}

export function unreadItems(items: NotificationItem[] | undefined) {
  return (items ?? []).filter((item) => !item.read)
}

export function readItems(items: NotificationItem[] | undefined, limit = 20) {
  return (items ?? []).filter((item) => item.read).slice(0, limit)
}

export function formatNotificationTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const diffMs = Date.now() - date.getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}
