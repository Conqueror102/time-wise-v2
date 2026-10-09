/**
 * Fetch wrapper for dashboard pages: adds the access token and turns error
 * responses into thrown Errors carrying the server's message.
 */
export async function apiFetch<T = any>(url: string, init: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`)
  }
  return data as T
}
