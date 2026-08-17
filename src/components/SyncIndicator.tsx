import { useSyncQueue } from '../hooks/useSyncQueue'
import { useOnlineStatus } from '../hooks/useOnlineStatus'

export default function SyncIndicator() {
  const online = useOnlineStatus()
  const { pendingCount, runningCount, failedCount } = useSyncQueue()

  let summary = 'All synced'
  if (runningCount > 0) summary = `Syncing ${runningCount}…`
  else if (pendingCount > 0) summary = `${pendingCount} pending sync`
  if (failedCount > 0) summary += ` · ${failedCount} failed`

  return (
    <div className="sync-indicator">
      <span className={`online-dot ${online ? 'online' : 'offline'}`} title={online ? 'Online' : 'Offline'} />
      <span>{online ? 'Online' : 'Offline'}</span>
      <span>·</span>
      <span>{summary}</span>
    </div>
  )
}
