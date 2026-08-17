import { useLiveQuery } from '@tanstack/react-db'
import { eq } from '@tanstack/db'
import { downloadedChecklistsCollection } from '../db/collections'

/** All checklists downloaded for offline use. Works fully offline. */
export function useDownloadedChecklists() {
  const { data, isLoading } = useLiveQuery((q) => q.from({ checklist: downloadedChecklistsCollection }))
  return { checklists: data, isLoading }
}

/** A single downloaded checklist by id. */
export function useChecklistInstance(id: string | undefined) {
  const { data } = useLiveQuery(
    (q) =>
      q
        .from({ checklist: downloadedChecklistsCollection })
        .where(({ checklist }) => eq(checklist.id, id ?? '')),
    [id],
  )
  return data?.[0]
}
