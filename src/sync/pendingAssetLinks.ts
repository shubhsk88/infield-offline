import { useMemo } from 'react'
import { useLiveQuery } from '@tanstack/react-db'
import { downloadedChecklistsCollection, standaloneObservationsCollection } from '../db/collections'
import type { Observation } from '../types'

export interface PendingAssetLink {
  observation: Observation
  /** Where the "resolve" flow should look up context, e.g. the checklist title. */
  checklistTitle?: string
}

/**
 * Derived worklist of observations that still need an asset linked
 * (InField decisions #3/#4 — linking a new asset requires connectivity, so
 * this is a manual worklist for the user to resolve once back online, not
 * something the sync queue retries automatically).
 */
export function usePendingAssetLinks() {
  const { data: checklists } = useLiveQuery((q) => q.from({ checklist: downloadedChecklistsCollection }))
  const { data: standalone } = useLiveQuery((q) => q.from({ observation: standaloneObservationsCollection }))

  return useMemo<PendingAssetLink[]>(() => {
    const fromChecklists = (checklists ?? []).flatMap((checklist) =>
      checklist.observations
        .filter((o) => o.needsAssetLink)
        .map((observation) => ({ observation, checklistTitle: checklist.title })),
    )
    const fromStandalone = (standalone ?? [])
      .filter((o) => o.needsAssetLink)
      .map((observation) => ({ observation }))
    return [...fromChecklists, ...fromStandalone]
  }, [checklists, standalone])
}
