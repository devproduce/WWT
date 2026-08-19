export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'MEMBER'
export type UserStatus = 'ACTIVE' | 'DISABLED' | 'PENDING_SETUP'
export type OrganizationStatus = 'ACTIVE' | 'DISABLED'
export type ProjectStatus = 'PLANNED' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED'
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'BLOCKED' | 'DONE'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export interface Me {
  id: string
  email: string
  firstName: string
  lastName: string
  role: Role
  status: UserStatus
  organizationId: string | null
  organizationName: string | null
  organizationStatus: OrganizationStatus | null
  managedProjectIds: string[]
}

export interface AuthResponse {
  accessToken: string
  refreshToken?: string
  user: Me
}

export interface ResourceQuotas {
  maxMembers: number
  maxProjects: number
  maxStorageBytes: number
}

export interface FeatureEntitlements {
  kanban: boolean
  comments: boolean
  notifications: boolean
  fileAttachments: boolean
  advancedReporting: boolean
}

export interface Plan {
  id: string
  code: string
  name: string
  description: string
  quotas: ResourceQuotas
  entitlements: FeatureEntitlements
}

export interface OrganizationSummary {
  id: string
  name: string
  status: OrganizationStatus
  planId: string
  planName: string
  quotas: ResourceQuotas
  entitlements: FeatureEntitlements
  adminEmail: string
  adminName: string
  memberCount: number
  projectCount: number
  storageUsedBytes: number
  createdAt: string
  inviteToken?: string | null
}

export interface Member {
  id: string
  firstName: string
  lastName: string
  email: string
  role: Role
  status: UserStatus
  createdAt: string
  inviteToken?: string | null
}

export interface ProjectMember {
  id: string
  name: string
}

export interface Project {
  id: string
  organizationId: string
  name: string
  description: string
  managerId: string
  managerName: string
  memberIds: string[]
  members: ProjectMember[]
  status: ProjectStatus
  startDate: string | null
  targetDate: string | null
  createdBy: string
  createdAt: string
  totalTasks: number
  doneTasks: number
}

export interface TaskItem {
  id: string
  organizationId: string
  projectId: string
  title: string
  description: string
  assigneeId: string | null
  assigneeName: string | null
  createdBy: string
  priority: TaskPriority
  status: TaskStatus
  deadline: string | null
  createdAt: string
  updatedAt: string
  completedAt: string | null
  lastReturnNote: string | null
  lastReturnedAt: string | null
  blockedReason: string | null
  blockedWaitingOnUserId: string | null
  blockedWaitingOnName: string | null
  blockedAt: string | null
  allowedTransitions: TaskStatus[]
  canReview: boolean
}

export interface CommentItem {
  id: string
  taskId: string
  authorId: string
  authorName: string
  content: string
  deleted: boolean
  createdAt: string
}

export interface ActivityItem {
  id: string
  organizationId: string
  projectId: string
  taskId: string | null
  actorId: string
  actorName: string
  type: string
  message: string
  createdAt: string
}

export interface NotificationItem {
  id: string
  type: string
  title: string
  message: string
  taskId: string | null
  projectId: string | null
  read: boolean
  createdAt: string
}

export interface Dashboard {
  role: string
  organizationDisabled: boolean
  metrics: Record<string, unknown>
  items: Record<string, unknown>[]
}

export interface ProjectReport {
  projectId: string
  projectName: string
  totalTasks: number
  todo: number
  inProgress: number
  review: number
  blocked: number
  done: number
  completionPercent: number
  overdue: number
  tasksByPriority: Record<string, number>
  tasksByMember: { name: string; completed: number; assigned: number }[]
}

export interface AttachmentItem {
  id: string
  taskId: string
  originalName: string
  contentType: string
  sizeBytes: number
  uploadedBy: string
  createdAt: string
}

export type MyDayWhy =
  | 'PINNED'
  | 'IN_PROGRESS'
  | 'OVERDUE'
  | 'RETURNED'
  | 'DUE_TODAY'
  | 'DUE_SOON'
  | 'HIGH_PRIORITY'
  | 'REVIEW'
  | 'BLOCKED'

export interface MyDayItem {
  task: TaskItem
  projectName: string
  why: MyDayWhy | string
  score: number
  pinned: boolean
  overdue: boolean
  primaryAction: 'START' | 'SUBMIT_REVIEW' | 'OPEN' | string
}

export interface MyDayResponse {
  date: string
  focus: MyDayItem[]
  waiting: MyDayItem[]
  hiddenCount: number
  overflowCount: number
  pinnedTaskIds: string[]
  hiddenTaskIds: string[]
}

export interface ReviewQueueItem {
  task: TaskItem
  projectName: string
  waitingSince: string | null
}

export interface NotificationPrefs {
  emailComments: boolean
  emailAssignments: boolean
  emailReviews: boolean
  emailDeadlines: boolean
}

export const WHY_LABEL: Record<string, string> = {
  PINNED: 'Pinned',
  IN_PROGRESS: 'Going on now',
  OVERDUE: 'Overdue',
  RETURNED: 'Returned',
  DUE_TODAY: 'Due today',
  DUE_SOON: 'Due soon',
  HIGH_PRIORITY: 'High priority',
  REVIEW: 'In review',
  BLOCKED: 'Blocked',
}

export const TASK_COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'TODO', label: 'To do' },
  { id: 'IN_PROGRESS', label: 'In progress' },
  { id: 'REVIEW', label: 'Review' },
  { id: 'BLOCKED', label: 'Blocked' },
  { id: 'DONE', label: 'Done' },
]
