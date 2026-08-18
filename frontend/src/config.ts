const raw = import.meta.env.VITE_API_BASE_URL

if (!raw) {
  throw new Error('VITE_API_BASE_URL is not set. Add it to the project root .env')
}

export const API_BASE_URL = raw.replace(/\/$/, '')
