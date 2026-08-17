import { useEffect, useState } from 'react'
import ObservationForm, { type ObservationFormValue } from './ObservationForm'
import { fetchAssetPool } from '../api/mockApi'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { savePhoto } from '../db/photoStore'
import { saveObservation } from '../sync/offlineTransactions'
import type { Asset, Observation } from '../types'

/**
 * Entry point for observations that aren't tied to any checklist. Per
 * InField decision #4, these can be created fully offline — but a new
 * asset can only be linked while online, so the picker is only populated
 * when connectivity is available.
 */
export default function NewStandaloneObservation({ onSaved }: { onSaved: () => void }) {
  const online = useOnlineStatus()
  const [assets, setAssets] = useState<Asset[]>([])

  useEffect(() => {
    if (!online) {
      setAssets([])
      return
    }
    fetchAssetPool().then(setAssets).catch(() => setAssets([]))
  }, [online])

  function handleSubmit(value: ObservationFormValue) {
    const id = crypto.randomUUID()
    const observation: Observation = {
      id,
      note: value.note,
      assetId: value.assetId,
      needsAssetLink: !value.assetId,
      photoBlobKey: value.photoBlob ? id : undefined,
      createdAt: new Date().toISOString(),
    }
    if (value.photoBlob) savePhoto(id, value.photoBlob)
    saveObservation(observation)
    onSaved()
  }

  return (
    <ObservationForm
      availableAssets={assets}
      assetPickerHint={
        online
          ? 'No assets available.'
          : "You're offline — this observation will save without an asset. You'll be prompted to link one once you're back online."
      }
      onSubmit={handleSubmit}
      onCancel={onSaved}
    />
  )
}
