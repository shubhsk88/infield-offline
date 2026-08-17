import { useSyncFailures } from '../hooks/useSyncQueue'
import { offline } from '../sync/offlineTransactions'

/**
 * Surfaces sync failures that would otherwise only show as a small per-record
 * badge — a checklist/observation stuck retrying in the background is easy
 * to miss otherwise. `offline-transactions` retries with backoff on its own,
 * but "Retry now" nudges its online detector so the crew doesn't have to
 * wait out the backoff window during a demo (or in the field, once they
 * realize connectivity is back).
 */
export default function SyncFailureBanner() {
  const failures = useSyncFailures()

  if (failures.length === 0) return null

  return (
    <div className="sync-failure-banner">
      <div className="sync-failure-header">
        <strong>
          {failures.length} item{failures.length > 1 ? 's' : ''} failed to sync
        </strong>
        <button onClick={() => offline.getOnlineDetector().notifyOnline()}>Retry now</button>
      </div>
      <ul>
        {failures.map((f) => (
          <li key={f.key}>
            <span className="sync-failure-title">{f.title}</span>
            <span className="sync-failure-detail">
              {f.error} · retried {f.retryCount}×
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
