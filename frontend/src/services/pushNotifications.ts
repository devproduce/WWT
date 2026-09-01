import { getToken, isSupported, onMessage, type MessagePayload } from 'firebase/messaging'
import { getMessagingInstance, getVapidKey } from '@/lib/firebase'
import { api, apiError } from '@/services/api'
import type { NotificationPrefs } from '@/types'

const FCM_TOKEN_KEY = 'wwt_fcm_token'

export type PushPermissionState = 'unsupported' | 'default' | 'granted' | 'denied'

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

export async function registerWebPush(): Promise<string | null> {
  if (!(await isPushSupported())) {
    return null
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    return null
  }

  const vapidKey = getVapidKey()
  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' })
  await navigator.serviceWorker.ready

  const messaging = await getMessagingInstance()
  if (!messaging) {
    throw new Error('Push messaging is not available in this browser')
  }

  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration,
  })

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

export function formatPushError(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message
  }
  return apiError(error, 'Could not enable notifications')
}

export async function unregisterWebPush() {
  const token = getStoredFcmToken()
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
    await registerWebPush()
  } catch {
    // ignore registration errors during background sync
  }
}

export async function listenForForegroundMessages(
  onMessageReceived: (payload: MessagePayload) => void,
) {
  const messaging = await getMessagingInstance()
  if (!messaging) {
    return () => {}
  }
  return onMessage(messaging, onMessageReceived)
}
