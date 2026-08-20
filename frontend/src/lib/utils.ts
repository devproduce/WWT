import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(value?: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

export function formatDay(value?: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString()
}

export function utilization(used: number, max: number) {
  if (!max) return 0
  return Math.min(100, Math.round((used / max) * 100))
}

export function bytes(value: number) {
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`
  return `${(value / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

export function num(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function str(value: unknown, fallback = '') {
  return value == null ? fallback : String(value)
}

export function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function greetingFor(name: string) {
  const hour = new Date().getHours()
  const part = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  return `${part}, ${name}`
}

export function localIsoDate(value = new Date()) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function waitHours(value?: string | null, now = new Date()) {
  if (!value) return 0
  return Math.max(0, (now.getTime() - new Date(value).getTime()) / 3_600_000)
}

export function formatWait(value?: string | null, now = new Date()) {
  const hours = waitHours(value, now)
  if (hours < 1 / 60) return 'Just in'
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}m waiting`
  if (hours < 24) return `${Math.round(hours)}h waiting`
  const days = Math.round(hours / 24)
  return days === 1 ? '1 day waiting' : `${days} days waiting`
}
