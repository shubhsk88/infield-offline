import { useSyncOverview } from '../hooks/useSyncQueue'

/**
 * Dev/demo visibility into the two places a record can live: still "in
 * transaction" (an entry in the offline-transactions outbox — added
 * locally, not yet confirmed) or "synced" (no outbox entry, so it's
 * confirmed and only backed by the collection/query state). Useful for
 * showing the team exactly what the outbox is doing during a demo, without
 * digging through DevTools → IndexedDB.
 */
export default function SyncDebugPanel() {
  const { inTransaction, synced } = useSyncOverview()

  return (
    <div className="sync-debug-panel">
      <div className="sync-debug-column">
        <strong>In transaction ({inTransaction.length})</strong>
        <ul>
          {inTransaction.length === 0 && <li className="disabled-hint">none</li>}
          {inTransaction.map((item) => (
            <li key={item.key}>
              <span className="tag">{item.kind}</span> {item.title}
            </li>
          ))}
        </ul>
      </div>
      <div className="sync-debug-column">
        <strong>Synced ({synced.length})</strong>
        <ul>
          {synced.length === 0 && <li className="disabled-hint">none</li>}
          {synced.map((item) => (
            <li key={item.key}>
              <span className="tag">{item.kind}</span> {item.title}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
