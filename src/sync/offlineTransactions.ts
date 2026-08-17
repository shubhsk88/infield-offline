import { startOfflineExecutor } from '@tanstack/offline-transactions'
import { downloadedChecklistsCollection, standaloneObservationsCollection } from '../db/collections'
import { submitChecklist, submitObservation } from '../api/mockApi'
import { createAppOnlineDetector } from './onlineDetector'
import type { ChecklistInstance, Observation } from '../types'

/**
 * The durable outbox + retry engine. Every checklist save and observation
 * save goes through here: `acceptMutations` flushes the edit into the
 * localStorage-backed collection immediately (unconditional local
 * durability, regardless of connectivity), then the mock API call is
 * attempted — if it throws (including our simulated OfflineError), the
 * mutation stays in the IndexedDB-backed outbox and is retried with
 * backoff+jitter once back online. No hand-written queue/retry code needed.
 */
export const offline = startOfflineExecutor({
  collections: {
    checklists: downloadedChecklistsCollection as never,
    observations: standaloneObservationsCollection as never,
  },
  mutationFns: {
    syncChecklist: async ({ transaction }) => {
      downloadedChecklistsCollection.utils.acceptMutations(transaction)
      const mutation = transaction.mutations[transaction.mutations.length - 1]
      await submitChecklist(mutation.modified as unknown as ChecklistInstance)
    },
    syncObservation: async ({ transaction }) => {
      standaloneObservationsCollection.utils.acceptMutations(transaction)
      const mutation = transaction.mutations[transaction.mutations.length - 1]
      await submitObservation(mutation.modified as unknown as Observation)
    },
  },
  onLeadershipChange: (isLeader) => {
    if (!isLeader) {
      console.warn('[offline] another tab is the sync leader; running in online-only mode here')
    }
  },
  // The library's default detector only reads real navigator.onLine, so it
  // never knew about the DebugPanel's "Simulate offline" toggle. This one
  // combines both, so toggling it actually pauses/resumes the executor.
  onlineDetector: createAppOnlineDetector(),
})

function upsert<T extends { id: string }>(
  collection: { has: (id: string) => boolean; insert: (item: T) => unknown; update: (id: string, cb: (draft: T) => void) => unknown },
  item: T,
) {
  if (collection.has(item.id)) {
    collection.update(item.id, (draft) => {
      Object.assign(draft as object, item)
    })
  } else {
    collection.insert(item)
  }
}

/** Save (create or update) a downloaded checklist instance. */
export const saveChecklist = offline.createOfflineAction<ChecklistInstance>({
  mutationFnName: 'syncChecklist',
  onMutate: (checklist) => {
    upsert(downloadedChecklistsCollection as never, checklist)
  },
})

/** Save (create or update) an observation — checklist-scoped or standalone. */
export const saveObservation = offline.createOfflineAction<Observation>({
  mutationFnName: 'syncObservation',
  onMutate: (observation) => {
    upsert(standaloneObservationsCollection as never, observation)
  },
})
