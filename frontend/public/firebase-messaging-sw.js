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
  self.registration.showNotification(title, {
    body,
    data: payload.data ?? {},
    icon: '/favicon.svg',
  })
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const taskId = event.notification.data?.taskId
  const projectId = event.notification.data?.projectId
  const url = taskId ? `/app/tasks/${taskId}` : projectId ? `/app/projects/${projectId}` : '/app'
  event.waitUntil(clients.openWindow(url))
})
