import { FirebaseError } from 'firebase/app'
import { getToken, isSupported, onMessage, type MessagePayload } from 'firebase/messaging'
import {
  ensurePushMessagingReady,
  getVapidKey,
  PushReloadRequiredError,
  resetPushMessagingState,
} from '@/lib/firebase'
import { api, apiError } from '@/services/api'
import type { NotificationPrefs } from '@/types'

const FCM_TOKEN_KEY = 'wwt_fcm_token'

export type PushPermissionState = 'unsupported' | 'default' | 'granted' | 'denied'

export type BrowserPushFamily = 'brave' | 'chromium' | 'other'

export async function isPushSupported() {
  return typeof window !== 'undefined' && 'Notification' in window && (await isSupported())
}

export function getPermissionState(): PushPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported'
  }
  return Notification.permission as PushPermissionState
}

export function getStoredFcmToken() {
  try {
    return sessionStorage.getItem(FCM_TOKEN_KEY)
  } catch {
    return null
  }
}

function storeFcmToken(token: string) {
  try {
    sessionStorage.setItem(FCM_TOKEN_KEY, token)
  } catch {
    // ignore private-mode storage errors
  }
}

function clearStoredFcmToken() {
  try {
    sessionStorage.removeItem(FCM_TOKEN_KEY)
  } catch {
    // ignore private-mode storage errors
  }
}

export async function detectBraveBrowser() {
  try {
    const brave = (navigator as Navigator & { brave?: { isBrave?: () => Promise<boolean> } }).brave
    return Boolean(brave && (await brave.isBrave?.()))
  } catch {
    return false
  }
}

/** Chromium family browsers use Google’s push transport; Brave disables it by default. */
export async function detectBrowserPushFamily(): Promise<BrowserPushFamily> {
  if (await detectBraveBrowser()) {
    return 'brave'
  }
  const ua = navigator.userAgent
  if (/Chrome|Chromium|Edg|OPR|Opera/i.test(ua) && !/Firefox|FxiOS/i.test(ua)) {
    return 'chromium'
  }
  return 'other'
}

export function isPushServiceBlockedError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  return (
    (error instanceof DOMException || (error instanceof Error && error.name === 'AbortError')) &&
    message.toLowerCase().includes('push service')
  )
}

async function requestFcmToken() {
  const ready = await ensurePushMessagingReady()
  if (!ready) {
    throw new Error('Push messaging is not available in this browser')
  }
  if (ready.needsReload) {
    throw new PushReloadRequiredError()
  }

  return getToken(ready.messaging, {
    vapidKey: getVapidKey(),
    serviceWorkerRegistration: ready.registration,
  })
}

export async function registerWebPush(): Promise<string | null> {
  if (!(await isPushSupported())) {
    return null
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    return null
  }

  let token: string | undefined
  try {
    token = await requestFcmToken()
  } catch (firstError) {
    if (firstError instanceof PushReloadRequiredError || isPushServiceBlockedError(firstError)) {
      throw firstError
    }
    resetPushMessagingState()
    await new Promise((r) => window.setTimeout(r, 400))
    token = await requestFcmToken()
  }

  if (!token) {
    throw new Error('Firebase did not return a device token')
  }

  await api.post('/me/device-tokens', {
    token,
    platform: 'WEB',
    userAgent: navigator.userAgent,
  })

  storeFcmToken(token)
  return token
}

export async function fetchPushRegistrationStatus() {
  const { data } = await api.get<{ registered: boolean; count: number }>('/me/device-tokens/status')
  return data
}

export async function ensurePushTokenRegistered() {
  if (!(await isPushSupported()) || getPermissionState() !== 'granted') {
    return false
  }
  try {
    const status = await fetchPushRegistrationStatus()
    if (status.registered) {
      return true
    }
    const token = await registerWebPush()
    return Boolean(token)
  } catch {
    return false
  }
}

export function formatPushError(error: unknown) {
  if (error instanceof PushReloadRequiredError) {
    return error.message
  }
  if (isPushServiceBlockedError(error)) {
    return 'This browser is blocking Google push messaging.'
  }
  if (error instanceof FirebaseError) {
    return error.message
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return apiError(error, 'Could not enable notifications')
}

export async function unregisterWebPush() {
  // Server-only unregister. Avoid Firebase deleteToken — repeated delete/get
  // cycles can break Chrome/Brave push registration permanently.
  const token = getStoredFcmToken()
  resetPushMessagingState()
  if (!token) {
    return
  }
  try {
    await api.delete('/me/device-tokens', { data: { token } })
  } finally {
    clearStoredFcmToken()
  }
}

export async function syncWebPushRegistration() {
  if (!(await isPushSupported()) || getPermissionState() !== 'granted') {
    return
  }
  try {
    const { data: prefs } = await api.get<NotificationPrefs>('/me/notification-preferences')
    if (!prefs.pushEnabled) {
      return
    }
    await ensurePushTokenRegistered()
  } catch {
    // background sync should stay silent
  }
}

export async function listenForForegroundMessages(
  onMessageReceived: (payload: MessagePayload) => void,
) {
  const ready = await ensurePushMessagingReady()
  if (!ready) {
    return () => {}
  }
  return onMessage(ready.messaging, onMessageReceived)
}

export { PushReloadRequiredError }
