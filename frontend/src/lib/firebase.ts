import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getMessaging, isSupported, type Messaging } from 'firebase/messaging'

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
    throw new Error(`Missing Firebase config: ${missing.join(', ')}. Restart the frontend dev server after updating .env`)
  }
}

let app: FirebaseApp | null = null
let messaging: Messaging | null = null

function getFirebaseApp() {
  if (!app) {
    assertFirebaseConfig()
    app = initializeApp(firebaseConfig)
  }
  return app
}

export async function getMessagingInstance(): Promise<Messaging | null> {
  if (!(await isSupported())) {
    return null
  }
  if (!messaging) {
    messaging = getMessaging(getFirebaseApp())
  }
  return messaging
}

export function getVapidKey() {
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY
  if (!vapidKey) {
    throw new Error('Missing VITE_FIREBASE_VAPID_KEY. Restart the frontend dev server after updating .env')
  }
  return vapidKey
}
