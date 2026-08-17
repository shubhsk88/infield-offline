import { useState } from 'react'
import { useForm } from 'react-hook-form'
import type { Asset } from '../types'

export interface ObservationFormValue {
  note: string
  photoBlob?: Blob
  assetId: string | null
}

interface FormFields {
  note: string
  assetId: string
}

interface Props {
  /** Assets the user can pick from right now (checklist's pre-linked assets,
   * or — for standalone observations while online — the live asset pool).
   * Empty while offline for standalone observations (decision #4). */
  availableAssets: Asset[]
  assetPickerHint?: string
  onSubmit: (value: ObservationFormValue) => void
  onCancel: () => void
}

export default function ObservationForm({ availableAssets, assetPickerHint, onSubmit, onCancel }: Props) {
  const { register, handleSubmit, reset } = useForm<FormFields>({ defaultValues: { note: '', assetId: '' } })
  const [photoBlob, setPhotoBlob] = useState<Blob | undefined>()
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | undefined>()

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoBlob(file)
    setPhotoPreviewUrl(URL.createObjectURL(file))
  }

  function submit(fields: FormFields) {
    onSubmit({ note: fields.note.trim(), photoBlob, assetId: fields.assetId || null })
    reset()
    setPhotoBlob(undefined)
    setPhotoPreviewUrl(undefined)
  }

  return (
    <form className="form-section" onSubmit={handleSubmit(submit)}>
      <h3>New observation</h3>
      <div className="form-row">
        <label htmlFor="obs-note">Note</label>
        <textarea id="obs-note" rows={3} {...register('note', { required: true })} />
      </div>

      <div className="form-row">
        <label htmlFor="obs-asset">Asset</label>
        {availableAssets.length > 0 ? (
          <select id="obs-asset" {...register('assetId')}>
            <option value="">— none —</option>
            {availableAssets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.name}
              </option>
            ))}
          </select>
        ) : (
          <p className="disabled-hint">{assetPickerHint ?? 'No asset available to link right now.'}</p>
        )}
      </div>

      <div className="form-row">
        <label htmlFor="obs-photo">Photo</label>
        <input id="obs-photo" type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} />
        {photoPreviewUrl && <img src={photoPreviewUrl} alt="Observation preview" />}
      </div>

      <div className="form-row" style={{ flexDirection: 'row', gap: '0.5rem' }}>
        <button type="submit">Save observation</button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}
