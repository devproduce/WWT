import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getMessaging, isSupported, type Messaging } from 'firebase/messaging'

const SW_PATH = '/firebase-messaging-sw.js'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

function assertFirebaseConfig() {
  const missing = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key)
  if (missing.length > 0) {
    throw new Error(`Missing Firebase config: ${missing.join(', ')}. Restart the frontend after updating .env`)
  }
}

let app: FirebaseApp | null = null
let messaging: Messaging | null = null
let serviceWorkerRegistration: ServiceWorkerRegistration | null = null

function getFirebaseApp() {
  if (!app) {
    assertFirebaseConfig()
    app = initializeApp(firebaseConfig)
  }
  return app
}

async function waitForServiceWorkerActivation(registration: ServiceWorkerRegistration) {
  if (registration.active?.state === 'activated') {
    return registration
  }

  const worker = registration.installing ?? registration.waiting ?? registration.active
  if (!worker) {
    await navigator.serviceWorker.ready
    return registration
  }

  if (worker.state === 'activated') {
    return registration
  }

  await new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new Error('Service worker activation timed out. Reload the page and try again.'))
    }, 15000)

    worker.addEventListener('statechange', () => {
      if (worker.state === 'activated') {
        window.clearTimeout(timeout)
        resolve()
      }
      if (worker.state === 'redundant') {
        window.clearTimeout(timeout)
        reject(new Error('Service worker failed to activate'))
      }
    })
  })

  return registration
}

async function waitForServiceWorkerController(timeoutMs = 8000) {
  if (navigator.serviceWorker.controller) {
    return
  }
  await new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new Error('Service worker did not take control of this page'))
    }, timeoutMs)
    navigator.serviceWorker.addEventListener(
      'controllerchange',
      () => {
        window.clearTimeout(timeout)
        resolve()
      },
      { once: true },
    )
  })
}

export async function registerPushServiceWorker(): Promise<{
  registration: ServiceWorkerRegistration
  needsReload: boolean
}> {
  if (serviceWorkerRegistration?.active) {
    return { registration: serviceWorkerRegistration, needsReload: false }
  }

  const existing = await navigator.serviceWorker.getRegistration('/')
  if (existing?.active?.scriptURL.includes('firebase-messaging-sw.js')) {
    serviceWorkerRegistration = existing
    if (!navigator.serviceWorker.controller) {
      try {
        await waitForServiceWorkerController()
      } catch {
        return { registration: existing, needsReload: true }
      }
    }
    return { registration: existing, needsReload: false }
  }

  serviceWorkerRegistration = await navigator.serviceWorker.register(SW_PATH, {
    scope: '/',
    updateViaCache: 'none',
  })
  await waitForServiceWorkerActivation(serviceWorkerRegistration)

  if (!navigator.serviceWorker.controller) {
    try {
      await waitForServiceWorkerController()
    } catch {
      return { registration: serviceWorkerRegistration, needsReload: true }
    }
  }

  return { registration: serviceWorkerRegistration, needsReload: false }
}

export async function ensurePushMessagingReady(): Promise<{
  messaging: Messaging
  registration: ServiceWorkerRegistration
  needsReload: boolean
} | null> {
  if (!(await isSupported())) {
    return null
  }
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
    return null
  }

  const { registration, needsReload } = await registerPushServiceWorker()
  if (!messaging) {
    messaging = getMessaging(getFirebaseApp())
  }
  return { messaging, registration, needsReload }
}

export function getVapidKey() {
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY?.trim()
  if (!vapidKey) {
    throw new Error('Missing VITE_FIREBASE_VAPID_KEY. Restart the frontend after updating .env')
  }
  return vapidKey
}

export function resetPushMessagingState() {
  serviceWorkerRegistration = null
  messaging = null
}

export class PushReloadRequiredError extends Error {
  constructor() {
    super('Reload this page once, then enable notifications again.')
    this.name = 'PushReloadRequiredError'
  }
}
