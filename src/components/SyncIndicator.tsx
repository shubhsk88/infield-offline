import { useSyncQueue } from '../hooks/useSyncQueue'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { useOfflineReady } from '../hooks/useOfflineReady'

export default function SyncIndicator() {
  const online = useOnlineStatus()
  const offlineReady = useOfflineReady()
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
      <span>·</span>
      <span
        className={`offline-ready-pill ${offlineReady ? 'ready' : 'not-ready'}`}
        title={offlineReady ? 'The app shell is cached and will work with no network' : 'Still preparing offline support'}
      >
        {offlineReady ? '✓ Offline-ready' : 'Preparing offline support…'}
      </span>
    </div>
  )
}
