import { useSyncQueue } from '../hooks/useSyncQueue'

const LABEL: Record<string, string> = {
  pending: 'Pending',
  syncing: 'Syncing…',
  synced: 'Synced',
  failed: 'Failed — retrying',
}

export default function SyncStatusBadge({ id }: { id: string }) {
  const { statusByKey } = useSyncQueue()
  const info = statusByKey.get(id)
  const status = info?.status ?? 'synced'
  const title = status === 'failed' ? `${info?.error} (retried ${info?.retryCount}×)` : undefined
  return (
    <span className={`sync-badge ${status}`} title={title}>
      {LABEL[status]}
    </span>
  )
}
