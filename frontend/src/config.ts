import { resolveApiBaseUrl } from '@/lib/resolveApiBaseUrl'

export const API_BASE_URL = resolveApiBaseUrl(
  import.meta.env.VITE_USE_HOSTED_API,
  import.meta.env.VITE_API_BASE_URL,
)
