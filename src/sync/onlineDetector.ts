import type { OnlineDetector } from '@tanstack/offline-transactions'
import { getSimulatedOffline, subscribeSimulatedOffline } from '../api/mockApi'

/**
 * A custom `OnlineDetector` for the offline-transactions executor.
 *
 * The library's default `WebOnlineDetector` only reads real
 * `navigator.onLine` — it has no idea about the DebugPanel's "Simulate
 * offline" toggle, so toggling it did nothing to the executor's own
 * connectivity gating (it kept attempting syncs immediately, just letting
 * them fail inside the mock API). This detector combines both: online only
 * when the browser is online AND the debug toggle isn't forcing offline.
 */
export function createAppOnlineDetector(): OnlineDetector {
  const listeners = new Set<() => void>()
  const notify = () => listeners.forEach((l) => l())

  window.addEventListener('online', notify)
  window.addEventListener('offline', notify)
  const unsubscribeDebug = subscribeSimulatedOffline(notify)

  return {
    subscribe(callback) {
      listeners.add(callback)
      return () => listeners.delete(callback)
    },
    notifyOnline: notify,
    isOnline: () => navigator.onLine && !getSimulatedOffline(),
    dispose() {
      window.removeEventListener('online', notify)
      window.removeEventListener('offline', notify)
      unsubscribeDebug()
      listeners.clear()
    },
  }
}
