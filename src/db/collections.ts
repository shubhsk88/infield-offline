import { createCollection, localStorageCollectionOptions } from '@tanstack/db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { QueryClient } from '@tanstack/query-core'
import type { ChecklistInstance, ChecklistTemplate, Observation } from '../types'
import { fetchCatalog } from '../api/mockApi'
import { createIndexedDbStorage, noopStorageEventApi } from './indexedDbStorage'

export const queryClient = new QueryClient()

/**
 * The full list of checklists available today (per role/discipline, mocked).
 * Read-only, online-in-spirit: browsing/downloading assumes connectivity
 * (InField decision #2). A stale cached copy lingering offline is harmless.
 */
export const catalogCollection = createCollection(
  queryCollectionOptions<ChecklistTemplate>({
    queryKey: ['catalog'],
    queryClient,
    queryFn: () => fetchCatalog(),
    getKey: (item) => item.id,
  }),
)

// Real localStorage is too small (~5-10MB) and blocks the main thread on
// every write — not viable for a field app accumulating data over days
// offline. These collections persist to IndexedDB instead, via a
// StorageApi-shaped adapter (see indexedDbStorage.ts for why this shape,
// and the OPFS/SQLite-WASM alternative that was considered and skipped).
const [checklistsStorage, observationsStorage] = await Promise.all([
  createIndexedDbStorage('infield-downloaded-checklists'),
  createIndexedDbStorage('infield-standalone-observations'),
])

/**
 * Checklists the user has explicitly downloaded for offline use — the only
 * checklists usable offline (InField decision #1/#2). The full record set
 * (not just pending outbox mutations) survives reload regardless of sync
 * status.
 */
export const downloadedChecklistsCollection = createCollection(
  localStorageCollectionOptions<ChecklistInstance>({
    storageKey: 'checklists',
    storage: checklistsStorage,
    storageEventApi: noopStorageEventApi,
    getKey: (item) => item.id,
  }),
)

/**
 * Observations created outside any checklist context. Can be created fully
 * offline (InField decision #4); asset linking is deferred until online.
 */
export const standaloneObservationsCollection = createCollection(
  localStorageCollectionOptions<Observation>({
    storageKey: 'observations',
    storage: observationsStorage,
    storageEventApi: noopStorageEventApi,
    getKey: (item) => item.id,
  }),
)
