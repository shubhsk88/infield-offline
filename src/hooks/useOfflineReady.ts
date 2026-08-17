import { useEffect, useState } from 'react'

/**
 * Whether the app shell is actually cached and ready to run with no
 * network — checked directly (a controlling service worker + a populated
 * precache), not inferred from a one-time "just installed" event. Unlike
 * `PWABadge`'s toast (which only fires the first time the SW installs and
 * is easy to miss/dismiss), this is a persistent, always-checkable status.
 */
export function useOfflineReady(): boolean {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    let cancelled = false

    async function check() {
      const hasController = Boolean(navigator.serviceWorker.controller)
      if (!hasController) {
        if (!cancelled) setReady(false)
        return
      }
      const cacheNames = await caches.keys()
      const precacheName = cacheNames.find((n) => n.includes('precache'))
      const populated = precacheName ? (await (await caches.open(precacheName)).keys()).length > 0 : false
      if (!cancelled) setReady(populated)
    }

    check()
    const interval = setInterval(check, 2000)
    navigator.serviceWorker.addEventListener('controllerchange', check)
    return () => {
      cancelled = true
      clearInterval(interval)
      navigator.serviceWorker.removeEventListener('controllerchange', check)
    }
  }, [])

  return ready
}
