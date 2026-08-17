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
  refreshToken: string
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
  allowedTransitions: TaskStatus[]
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
  tasksByMember: Record<string, number>
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

export const TASK_COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'TODO', label: 'To do' },
  { id: 'IN_PROGRESS', label: 'In progress' },
  { id: 'REVIEW', label: 'Review' },
  { id: 'BLOCKED', label: 'Blocked' },
  { id: 'DONE', label: 'Done' },
]
