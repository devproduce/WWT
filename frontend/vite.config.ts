import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, dir, 'VITE_')
  const backend = env.VITE_API_BASE_URL
  if (!backend) {
    throw new Error('VITE_API_BASE_URL is not set. Add it to frontend/.env')
  }

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(dir, './src'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': { target: backend, changeOrigin: true },
        '/actuator': { target: backend, changeOrigin: true },
      },
    },
  }
})
