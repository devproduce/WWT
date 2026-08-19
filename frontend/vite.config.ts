import { existsSync } from 'node:fs'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveApiBaseUrl } from './src/lib/resolveApiBaseUrl.ts'

const dir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(dir, '..')

function envDirFor(mode: string) {
  const names = ['.env', `.env.${mode}`, '.env.local', `.env.${mode}.local`]
  if (names.some((name) => existsSync(path.join(repoRoot, name)))) {
    return repoRoot
  }
  return dir
}

export default defineConfig(({ mode }) => {
  const envDir = envDirFor(mode)
  const env = loadEnv(mode, envDir, 'VITE_')
  const backend = resolveApiBaseUrl(
    env.VITE_USE_HOSTED_API || process.env.VITE_USE_HOSTED_API,
    env.VITE_API_BASE_URL || process.env.VITE_API_BASE_URL,
  )
  console.info(`[vite] API → ${backend}`)

  return {
    envDir,
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
