importScripts('https://www.gstatic.com/firebasejs/12.18.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging-compat.js')

firebase.initializeApp({
  "apiKey": "AIzaSyDPM4TIElezE6CmLzSGw96zRqkpzs2JYaY",
  "authDomain": "weworktogether-b1d16.firebaseapp.com",
  "projectId": "weworktogether-b1d16",
  "messagingSenderId": "830885619499",
  "appId": "1:830885619499:web:c36174c0fca9103e3b476e"
})

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
    || (taskId ? `/app/tasks/${taskId}` : projectId ? `/app/projects/${projectId}` : '/app')

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
