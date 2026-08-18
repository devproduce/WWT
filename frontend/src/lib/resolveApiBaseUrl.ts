const HOSTED_DEFAULT = 'https://api.weworktogether.me'
const LOCAL_DEFAULT = 'http://localhost:8080'

function trimSlash(url: string) {
  return url.replace(/\/$/, '')
}

/**
 * yes/true/1 → hosted API
 * no/false/0 → http://localhost:8080
 * unset → VITE_API_BASE_URL if present (Docker/production builds)
 */
export function resolveApiBaseUrl(useHosted: string | undefined, hostedUrl: string | undefined) {
  const hosted = trimSlash((hostedUrl || HOSTED_DEFAULT).trim() || HOSTED_DEFAULT)
  const flag = (useHosted ?? '').trim().toLowerCase()
  if (['yes', 'true', '1'].includes(flag)) {
    return hosted
  }
  if (['no', 'false', '0'].includes(flag)) {
    return LOCAL_DEFAULT
  }
  return hostedUrl?.trim() ? trimSlash(hostedUrl.trim()) : LOCAL_DEFAULT
}
