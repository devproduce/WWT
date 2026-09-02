import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(scriptDir, '../..')
const envPath = path.join(repoRoot, '.env')
const outputPath = path.join(scriptDir, '../public/firebase-messaging-sw.js')

function readEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing ${filePath}. Copy .env.example and fill Firebase values.`)
  }

  const values = {}
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const separator = trimmed.indexOf('=')
    if (separator === -1) continue
    values[trimmed.slice(0, separator).trim()] = trimmed.slice(separator + 1).trim()
  }
  return values
}

const env = readEnv(envPath)
const config = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
}

const missing = Object.entries(config)
  .filter(([, value]) => !value)
  .map(([key]) => key)

if (missing.length > 0) {
  throw new Error(`Missing Firebase env values in .env: ${missing.join(', ')}`)
}

const contents = `importScripts('https://www.gstatic.com/firebasejs/12.18.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging-compat.js')

firebase.initializeApp(${JSON.stringify(config, null, 2)})

const messaging = firebase.messaging()

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? payload.data?.title ?? 'WeWorkTogether'
  const body = payload.notification?.body ?? payload.data?.body ?? ''
  const data = payload.data ?? {}
  // Only the service worker should display the OS notification (data-only FCM payloads).
  // Showing here again when payload.notification exists would create duplicates.
  if (payload.notification) {
    return
  }
  self.registration.showNotification(title, {
    body,
    data,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    requireInteraction: true,
    tag: data.notificationId || data.taskId || 'wwt-push',
    renotify: true,
  })
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const data = event.notification.data || {}
  const taskId = data.taskId
  const projectId = data.projectId
  const targetUrl = data.url
    || (taskId ? \`/app/tasks/\${taskId}\` : projectId ? \`/app/projects/\${projectId}\` : '/app')

  event.waitUntil((async () => {
    const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const client of allClients) {
      if ('focus' in client) {
        await client.focus()
        if ('navigate' in client && typeof client.navigate === 'function') {
          try {
            await client.navigate(targetUrl)
            return
          } catch (_) {
            // fall through to openWindow
          }
        }
        return
      }
    }
    await clients.openWindow(targetUrl)
  })())
})
`

fs.writeFileSync(outputPath, contents)
console.info(`[firebase-sw] wrote ${outputPath}`)
