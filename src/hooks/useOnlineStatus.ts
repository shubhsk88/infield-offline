import { useEffect, useState } from 'react'
import { offline } from '../sync/offlineTransactions'

/**
 * The single source of truth for "are we online" across the app — backed by
 * the same `OnlineDetector` the sync executor itself uses (real
 * `navigator.onLine` AND the DebugPanel's "Simulate offline" toggle), so the
 * UI and the executor never disagree. Event-driven (no polling).
 */
export function useOnlineStatus(): boolean {
  const detector = offline.getOnlineDetector()
  const [online, setOnline] = useState(detector.isOnline())

  useEffect(() => {
    const update = () => setOnline(detector.isOnline())
    update()
    return detector.subscribe(update)
  }, [detector])

  return online
}
