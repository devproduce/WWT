import type { LucideIcon } from 'lucide-react'
import {
  AlertTriangle,
  AtSign,
  Bell,
  CalendarClock,
  CheckCircle2,
  FolderKanban,
  Inbox,
  MessageSquare,
  RotateCcw,
  UserPlus,
} from 'lucide-react'
import type { NotificationType } from '@/types'

export type NotificationTypeMeta = {
  label: string
  Icon: LucideIcon
  chipClass: string
  rowClass: string
  barClass: string
}

const DEFAULT_META: NotificationTypeMeta = {
  label: 'Update',
  Icon: Bell,
  chipClass: 'bg-teal-100 text-teal-800 border-teal-200',
  rowClass: 'border-teal-900/10 bg-white/90 hover:bg-teal-50/80',
  barClass: 'bg-teal-500',
}

const META: Record<string, NotificationTypeMeta> = {
  COMMENT_MENTIONED: {
    label: 'Mention',
    Icon: AtSign,
    chipClass: 'bg-violet-100 text-violet-800 border-violet-200',
    rowClass: 'border-violet-200/80 bg-violet-50/70 hover:bg-violet-50',
    barClass: 'bg-violet-500',
  },
  COMMENT_ADDED: {
    label: 'Comment',
    Icon: MessageSquare,
    chipClass: 'bg-sky-100 text-sky-800 border-sky-200',
    rowClass: 'border-sky-200/70 bg-sky-50/60 hover:bg-sky-50',
    barClass: 'bg-sky-500',
  },
  TASK_ASSIGNED: {
    label: 'Assigned',
    Icon: UserPlus,
    chipClass: 'bg-teal-100 text-teal-800 border-teal-200',
    rowClass: 'border-teal-200/80 bg-teal-50/70 hover:bg-teal-50',
    barClass: 'bg-teal-600',
  },
  TASK_READY_FOR_REVIEW: {
    label: 'Review',
    Icon: Inbox,
    chipClass: 'bg-violet-100 text-violet-800 border-violet-200',
    rowClass: 'border-violet-200/80 bg-violet-50/70 hover:bg-violet-50',
    barClass: 'bg-violet-600',
  },
  TASK_APPROVED: {
    label: 'Approved',
    Icon: CheckCircle2,
    chipClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    rowClass: 'border-emerald-200/80 bg-emerald-50/60 hover:bg-emerald-50',
    barClass: 'bg-emerald-500',
  },
  TASK_RETURNED: {
    label: 'Returned',
    Icon: RotateCcw,
    chipClass: 'bg-amber-100 text-amber-900 border-amber-200',
    rowClass: 'border-amber-200/80 bg-amber-50/70 hover:bg-amber-50',
    barClass: 'bg-amber-500',
  },
  TASK_BLOCKED: {
    label: 'Blocked',
    Icon: AlertTriangle,
    chipClass: 'bg-rose-100 text-rose-800 border-rose-200',
    rowClass: 'border-rose-200/80 bg-rose-50/70 hover:bg-rose-50',
    barClass: 'bg-rose-500',
  },
  DEADLINE_APPROACHING: {
    label: 'Deadline',
    Icon: CalendarClock,
    chipClass: 'bg-amber-100 text-amber-900 border-amber-200',
    rowClass: 'border-amber-200/80 bg-amber-50/60 hover:bg-amber-50',
    barClass: 'bg-amber-500',
  },
  TASK_OVERDUE: {
    label: 'Overdue',
    Icon: CalendarClock,
    chipClass: 'bg-rose-100 text-rose-800 border-rose-200',
    rowClass: 'border-rose-200/80 bg-rose-50/70 hover:bg-rose-50',
    barClass: 'bg-rose-600',
  },
  PROJECT_ASSIGNMENT: {
    label: 'Project',
    Icon: FolderKanban,
    chipClass: 'bg-teal-100 text-teal-800 border-teal-200',
    rowClass: 'border-teal-200/80 bg-teal-50/60 hover:bg-teal-50',
    barClass: 'bg-teal-500',
  },
  ACCOUNT_EVENT: {
    label: 'Account',
    Icon: Bell,
    chipClass: 'bg-stone-100 text-stone-700 border-stone-200',
    rowClass: 'border-stone-200/80 bg-stone-50/70 hover:bg-stone-50',
    barClass: 'bg-stone-400',
  },
}

export function notificationTypeMeta(type: NotificationType | string): NotificationTypeMeta {
  return META[type] ?? DEFAULT_META
}
