import { useLiveQuery } from '@tanstack/react-db'
import { catalogCollection } from '../db/collections'

/** Live view of the checklist catalog (available for download). Requires
 * connectivity to refresh — a stale cached copy is fine while offline. */
export function useCatalog() {
  const { data, isLoading, isError } = useLiveQuery((q) => q.from({ template: catalogCollection }))
  return { templates: data, isLoading, isError }
}
