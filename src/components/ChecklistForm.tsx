import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useChecklistInstance } from '../hooks/useDownloadedChecklists'
import { saveChecklist } from '../sync/offlineTransactions'
import { getPhoto, savePhoto } from '../db/photoStore'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import ObservationForm, { type ObservationFormValue } from './ObservationForm'
import SyncStatusBadge from './SyncStatusBadge'
import ChecklistStatusBadge from './ChecklistStatusBadge'
import type { ChecklistInstance, ChecklistItemResult, Observation } from '../types'

type FormValues = Record<string, string | boolean>

function buildDefaults(checklist: ChecklistInstance): FormValues {
  const values: FormValues = {}
  for (const result of checklist.results) {
    values[result.itemTemplateId] = result.value === null || result.value === undefined ? '' : String(result.value)
  }
  return values
}

function buildResults(checklist: ChecklistInstance, values: FormValues): ChecklistItemResult[] {
  return checklist.items.map((item): ChecklistItemResult => {
    const raw = values[item.id]
    let value: ChecklistItemResult['value'] = null
    if (raw !== undefined && raw !== '') {
      if (item.inputType === 'boolean') value = raw === 'true'
      else if (item.inputType === 'number') value = Number(raw)
      else value = String(raw)
    }
    return { itemTemplateId: item.id, value }
  })
}

export default function ChecklistForm({ id, onClose }: { id: string; onClose: () => void }) {
  const checklist = useChecklistInstance(id)
  const [local, setLocal] = useState<ChecklistInstance | undefined>(checklist)
  const [addingObservationFor, setAddingObservationFor] = useState<string | 'checklist-level' | null>(null)
  const online = useOnlineStatus()
  const { register, handleSubmit, reset } = useForm<FormValues>()

  useEffect(() => {
    setLocal(checklist)
    if (checklist) reset(buildDefaults(checklist))
  }, [checklist, reset])

  // Persists immediately — a downloaded checklist's data must be durable the
  // instant an action happens, not after a debounce window. A draft becomes
  // "in progress" the moment it's touched; any other status (e.g. explicitly
  // marking it "completed") is respected as-is, not overwritten.
  function saveNow(next: ChecklistInstance) {
    setLocal(next)
    const status = next.status === 'draft' ? 'in_progress' : next.status
    saveChecklist({ ...next, updatedAt: new Date().toISOString(), status })
  }

  if (!local) return <p>Checklist not found.</p>

  function saveResults(values: FormValues) {
    if (!local) return
    saveNow({ ...local, results: buildResults(local, values) })
  }

  function markComplete(values: FormValues) {
    if (!local) return
    saveNow({ ...local, results: buildResults(local, values), status: 'completed' })
    onClose()
  }

  function addObservation(scope: string | 'checklist-level', value: ObservationFormValue) {
    if (!local) return
    const id = crypto.randomUUID()
    const observation: Observation = {
      id,
      checklistInstanceId: local.id,
      itemTemplateId: scope === 'checklist-level' ? undefined : scope,
      note: value.note,
      assetId: value.assetId,
      needsAssetLink: !value.assetId,
      photoBlobKey: value.photoBlob ? id : undefined,
      createdAt: new Date().toISOString(),
    }
    if (value.photoBlob) savePhoto(id, value.photoBlob)
    saveNow({ ...local, observations: [...local.observations, observation] })
    setAddingObservationFor(null)
  }

  const observationsFor = (itemTemplateId: string) =>
    local.observations.filter((o) => o.itemTemplateId === itemTemplateId)
  const checklistLevelObservations = local.observations.filter((o) => !o.itemTemplateId)

  return (
    <div>
      <div className="app-header">
        <h2>{local.title}</h2>
        <span className="badge-group">
          <ChecklistStatusBadge status={local.status} />
          <SyncStatusBadge id={local.id} />
        </span>
      </div>
      <p className="meta">
        Linked assets: {local.linkedAssets.map((a) => a.name).join(', ') || 'none'}
      </p>
      <p>
        <button disabled={!online} title={online ? undefined : 'Requires connection'}>
          + Link a new asset to this checklist
        </button>
        {!online && <span className="disabled-hint"> Requires connection</span>}
      </p>

      <form onSubmit={handleSubmit(saveResults)}>
        {local.items.map((item) => (
          <div className="form-section" key={item.id}>
            <label>{item.label}</label>
            <div className="form-row">
              {item.inputType === 'boolean' && (
                <select {...register(item.id)}>
                  <option value="">— select —</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              )}
              {item.inputType === 'number' && <input type="number" {...register(item.id)} />}
              {item.inputType === 'text' && <input type="text" {...register(item.id)} />}
            </div>

            {observationsFor(item.id).map((o) => (
              <ObservationSummary key={o.id} observation={o} />
            ))}

            {addingObservationFor === item.id ? (
              <ObservationForm
                availableAssets={local.linkedAssets}
                onSubmit={(v) => addObservation(item.id, v)}
                onCancel={() => setAddingObservationFor(null)}
              />
            ) : (
              <button type="button" onClick={() => setAddingObservationFor(item.id)}>
                + Add observation
              </button>
            )}
          </div>
        ))}

        <p>
          <button type="submit">Save checklist</button>
        </p>
      </form>

      <div className="form-section">
        <h3>Checklist-level observations</h3>
        {checklistLevelObservations.map((o) => (
          <ObservationSummary key={o.id} observation={o} />
        ))}
        {addingObservationFor === 'checklist-level' ? (
          <ObservationForm
            availableAssets={local.linkedAssets}
            onSubmit={(v) => addObservation('checklist-level', v)}
            onCancel={() => setAddingObservationFor(null)}
          />
        ) : (
          <button type="button" onClick={() => setAddingObservationFor('checklist-level')}>
            + Add checklist-level observation
          </button>
        )}
      </div>

      <p>
        <button onClick={handleSubmit(markComplete)}>Mark complete & close</button> <button onClick={onClose}>Back</button>
      </p>
    </div>
  )
}

function ObservationSummary({ observation }: { observation: Observation }) {
  return (
    <div className="observation-item">
      {observation.note}
      {observation.needsAssetLink && <span className="sync-badge pending"> Needs asset link</span>}
      {observation.photoBlobKey && <PhotoThumbnail blobKey={observation.photoBlobKey} />}
    </div>
  )
}

function PhotoThumbnail({ blobKey }: { blobKey: string }) {
  const [url, setUrl] = useState<string | undefined>()
  useEffect(() => {
    let objectUrl: string | undefined
    getPhoto(blobKey).then((blob) => {
      if (blob) {
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      }
    })
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [blobKey])
  if (!url) return null
  return <img src={url} alt="Observation" />
}
