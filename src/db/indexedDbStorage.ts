import type { StorageApi, StorageEventApi } from '@tanstack/db'

/**
 * A `StorageApi`-compatible (i.e. `localStorage`-shaped) adapter backed by
 * IndexedDB instead of real `localStorage`.
 *
 * Why: `localStorageCollectionOptions` only accepts a synchronous
 * getItem/setItem/removeItem interface (real `localStorage`'s shape), but
 * real `localStorage` caps out around 5–10MB and blocks the main thread on
 * every write — too small/risky for a field app accumulating checklists and
 * observations over days offline. IndexedDB has a much larger quota (typically
 * hundreds of MB+, browser-dependent) and is non-blocking.
 *
 * The trick: IndexedDB itself is async, but the interface this collection
 * needs is sync. So we hydrate an in-memory cache from IndexedDB once at
 * startup (awaited before the collection is created), then serve
 * getItem/setItem/removeItem synchronously from that cache — writes update
 * the cache immediately (so the collection's own read-after-write behavior
 * is correct) and are flushed to IndexedDB in the background.
 *
 * Trade-off accepted for this POC: cross-tab sync (real `storage` events)
 * doesn't fire automatically the way it does for real `localStorage`, so
 * multi-tab usage isn't kept in sync. Not a concern for a single-tablet
 * field app; a `BroadcastChannel` could be added later if needed.
 *
 * Considered and rejected as overkill here: OPFS + SQLite-WASM
 * (`@tanstack/browser-db-sqlite-persistence`) — real SQL storage with even
 * higher ceilings, but requires a dedicated Web Worker (OPFS sync access
 * handles are worker-only), WASM asset bundling, and its own schema/migration
 * model. This IndexedDB shim gets the "not localStorage" win with far less
 * moving parts, reusing `localStorageCollectionOptions`'s already-correct
 * optimistic-mutation logic.
 */

const DB_VERSION = 1
const STORE_NAME = 'kv'

function openDb(dbName: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(dbName, DB_VERSION)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE_NAME)) {
        req.result.createObjectStore(STORE_NAME)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function loadAll(db: IDBDatabase): Promise<Map<string, string>> {
  return new Promise((resolve, reject) => {
    const cache = new Map<string, string>()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const cursorReq = store.openCursor()
    cursorReq.onsuccess = () => {
      const cursor = cursorReq.result
      if (cursor) {
        cache.set(String(cursor.key), cursor.value as string)
        cursor.continue()
      }
    }
    tx.oncomplete = () => resolve(cache)
    tx.onerror = () => reject(tx.error)
  })
}

function writeThrough(db: IDBDatabase, key: string, value: string | null) {
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  if (value === null) store.delete(key)
  else store.put(value, key)
  tx.onerror = () => console.error('[indexedDbStorage] write-behind flush failed', tx.error)
}

/** A `StorageEventApi` that never fires — see the multi-tab trade-off note above. */
export const noopStorageEventApi: StorageEventApi = {
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
}

export async function createIndexedDbStorage(dbName: string): Promise<StorageApi> {
  const db = await openDb(dbName)
  const cache = await loadAll(db)

  return {
    getItem: (key: string) => cache.get(key) ?? null,
    setItem: (key: string, value: string) => {
      cache.set(key, value)
      writeThrough(db, key, value)
    },
    removeItem: (key: string) => {
      cache.delete(key)
      writeThrough(db, key, null)
    },
  }
}
