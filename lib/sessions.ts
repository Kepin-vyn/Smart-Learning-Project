import type { SessionRecord } from './types'

const SESSIONS_KEY = 'smartstep_sessions'

export function getSessions(): SessionRecord[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(SESSIONS_KEY) ?? '[]') as SessionRecord[]
  } catch {
    return []
  }
}

export function saveSession(session: SessionRecord): void {
  if (typeof window === 'undefined') return
  const existing = getSessions()
  // Prepend new session so newest is first
  localStorage.setItem(SESSIONS_KEY, JSON.stringify([session, ...existing]))
}

export function deleteSession(id: string): void {
  if (typeof window === 'undefined') return
  const updated = getSessions().filter(s => s.id !== id)
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(updated))
}

export function clearAllSessions(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(SESSIONS_KEY)
}
