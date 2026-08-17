import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from '@tanstack/react-db'
import { offline } from '../sync/offlineTransactions'
import { downloadedChecklistsCollection, standaloneObservationsCollection } from '../db/collections'
import type { SyncStatus } from '../types'

interface RecordStatus {
  status: SyncStatus
  error?: string
  retryCount: number
}

interface OutboxSnapshot {
  pendingCount: number
  runningCount: number
  failedCount: number
  /** id (record key) -> derived status, for records currently in the outbox */
  statusByKey: Map<string, RecordStatus>
}

const EMPTY: OutboxSnapshot = { pendingCount: 0, runningCount: 0, failedCount: 0, statusByKey: new Map() }

async function readOutbox(): Promise<OutboxSnapshot> {
  const [transactions, pendingCount, runningCount] = await Promise.all([
    offline.peekOutbox(),
    Promise.resolve(offline.getPendingCount()),
    Promise.resolve(offline.getRunningCount()),
  ])

  const statusByKey = new Map<string, RecordStatus>()
  let failedCount = 0
  for (const tx of transactions) {
    const failed = tx.retryCount > 0 && Boolean(tx.lastError)
    const status: SyncStatus = failed ? 'failed' : 'pending'
    if (failed) failedCount += 1
    for (const mutation of tx.mutations) {
      const key = String(mutation.key)
      statusByKey.set(key, { status, error: tx.lastError?.message, retryCount: tx.retryCount })
    }
  }

  return { pendingCount, runningCount, failedCount, statusByKey }
}

/**
 * Polls the offline-transactions outbox to derive live sync status.
 * There's no push-based "outbox changed" event exposed by the library, so a
 * short interval is the pragmatic choice for a POC — cheap, and responsive
 * enough to visibly demo pending -> syncing -> synced within a few seconds.
 */
export function useSyncQueue() {
  const [snapshot, setSnapshot] = useState<OutboxSnapshot>(EMPTY)

  useEffect(() => {
    let cancelled = false
    const tick = () => {
      readOutbox().then((s) => {
        if (!cancelled) setSnapshot(s)
      })
    }
    tick()
    const interval = setInterval(tick, 1000)
    window.addEventListener('online', tick)
    window.addEventListener('offline', tick)
    return () => {
      cancelled = true
      clearInterval(interval)
      window.removeEventListener('online', tick)
      window.removeEventListener('offline', tick)
    }
  }, [])

  return snapshot
}

/** Sync status for a single record, given its collection key (usually `id`). */
export function useRecordSyncStatus(id: string | undefined): SyncStatus {
  const { statusByKey } = useSyncQueue()
  if (!id) return 'synced'
  return statusByKey.get(id)?.status ?? 'synced'
}

export interface SyncFailure {
  key: string
  title: string
  error: string
  retryCount: number
}

/** Human-readable list of everything currently failing to sync, for a global banner. */
export function useSyncFailures(): SyncFailure[] {
  const { statusByKey } = useSyncQueue()

  return useMemo(() => {
    const failures: SyncFailure[] = []
    for (const [key, info] of statusByKey) {
      if (info.status !== 'failed') continue
      const checklist = downloadedChecklistsCollection.get(key)
      const observation = checklist ? undefined : standaloneObservationsCollection.get(key)
      const title = checklist?.title ?? (observation ? `Observation: ${observation.note.slice(0, 40)}` : key)
      failures.push({ key, title, error: info.error ?? 'Unknown error', retryCount: info.retryCount })
    }
    return failures
  }, [statusByKey])
}

export interface SyncOverviewItem {
  key: string
  title: string
  kind: 'checklist' | 'observation'
}

/**
 * Full visibility into every downloaded checklist/observation: which ones
 * are still sitting "in transaction" (present in the offline-transactions
 * outbox — added locally but not yet confirmed by the mock API) versus
 * "synced" (no outbox entry for them, so they're confirmed and only
 * reachable through the query/collection state, not the transaction queue).
 */
export function useSyncOverview() {
  const { statusByKey } = useSyncQueue()
  const { data: checklists } = useLiveQuery((q) => q.from({ checklist: downloadedChecklistsCollection }))
  const { data: observations } = useLiveQuery((q) => q.from({ observation: standaloneObservationsCollection }))

  return useMemo(() => {
    const all: SyncOverviewItem[] = [
      ...(checklists ?? []).map((c) => ({ key: c.id, title: c.title, kind: 'checklist' as const })),
      ...(observations ?? []).map((o) => ({ key: o.id, title: o.note.slice(0, 40) || '(no note)', kind: 'observation' as const })),
    ]
    const inTransaction = all.filter((item) => statusByKey.has(item.key))
    const synced = all.filter((item) => !statusByKey.has(item.key))
    return { inTransaction, synced }
  }, [checklists, observations, statusByKey])
}
