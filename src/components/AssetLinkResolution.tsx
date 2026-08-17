import { useEffect, useState } from 'react'
import { usePendingAssetLinks } from '../sync/pendingAssetLinks'
import { downloadedChecklistsCollection, standaloneObservationsCollection } from '../db/collections'
import { fetchAssetPool, linkAssetToObservation } from '../api/mockApi'
import { saveChecklist, saveObservation } from '../sync/offlineTransactions'
import type { Asset } from '../types'

export default function AssetLinkResolution({ onDone }: { onDone: () => void }) {
  const pending = usePendingAssetLinks()
  const [assets, setAssets] = useState<Asset[]>([])
  const [selection, setSelection] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchAssetPool().then(setAssets).catch(() => setAssets([]))
  }, [])

  async function resolve(observationId: string) {
    const assetId = selection[observationId]
    if (!assetId) return

    const checklist = downloadedChecklistsCollection.toArray.find((c) =>
      c.observations.some((o) => o.id === observationId),
    )

    if (checklist) {
      const observations = checklist.observations.map((o) =>
        o.id === observationId ? { ...o, assetId, needsAssetLink: false } : o,
      )
      saveChecklist({ ...checklist, observations, updatedAt: new Date().toISOString() })
    } else if (standaloneObservationsCollection.has(observationId)) {
      const observation = standaloneObservationsCollection.get(observationId)
      if (observation) {
        saveObservation({ ...observation, assetId, needsAssetLink: false })
      }
    }

    await linkAssetToObservation(observationId, assetId).catch(() => undefined)
  }

  if (pending.length === 0) {
    return (
      <div>
        <p>Nothing to resolve — all observations have an asset linked.</p>
        <button onClick={onDone}>Back</button>
      </div>
    )
  }

  return (
    <div>
      <h2>Link outstanding assets</h2>
      <div className="card-list">
        {pending.map(({ observation, checklistTitle }) => (
          <div key={observation.id} className="form-section">
            <p>
              {observation.note}
              {checklistTitle && <span className="tag"> {checklistTitle}</span>}
            </p>
            <div className="form-row" style={{ flexDirection: 'row', gap: '0.5rem' }}>
              <select
                value={selection[observation.id] ?? ''}
                onChange={(e) => setSelection((prev) => ({ ...prev, [observation.id]: e.target.value }))}
              >
                <option value="">— choose an asset —</option>
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name}
                  </option>
                ))}
              </select>
              <button disabled={!selection[observation.id]} onClick={() => resolve(observation.id)}>
                Link
              </button>
            </div>
          </div>
        ))}
      </div>
      <button onClick={onDone}>Back</button>
    </div>
  )
}
