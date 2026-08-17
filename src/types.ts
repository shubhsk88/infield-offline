// Shared domain types for the InField Offline POC.
// Mirrors CDF Asset/Event shapes loosely for visual realism, but this is a
// mock data layer only — no real Cognite Data Fusion integration.

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed'

export interface Asset {
  id: string
  name: string
  description?: string
  parentId?: string | null
  labels?: string[]
}

export type ChecklistItemInputType = 'boolean' | 'text' | 'number'

export interface ChecklistItemTemplate {
  id: string
  label: string
  inputType: ChecklistItemInputType
}

/** A checklist definition available in the catalog, not yet downloaded. */
export interface ChecklistTemplate {
  id: string
  title: string
  discipline: string
  linkedAssets: Asset[]
  items: ChecklistItemTemplate[]
}

export interface ChecklistItemResult {
  itemTemplateId: string
  value: string | number | boolean | null
}

/**
 * A downloaded, fillable copy of a template. `linkedAssets` is a frozen
 * snapshot taken at download time — per InField decision #3, no new assets
 * can be linked while offline, only assets already present here.
 *
 * Note: this record is persisted via a `localStorageCollectionOptions`
 * collection (JSON-serialized), so it must stay plain-data only — no Blobs.
 * Sync status (pending/syncing/synced/failed) is intentionally NOT stored
 * here; it's derived live from the offline-transactions outbox by
 * `useSyncQueue` so we don't need a second mutation just to update a status
 * field.
 */
export interface ChecklistInstance {
  id: string
  templateId: string
  title: string
  discipline: string
  linkedAssets: Asset[]
  items: ChecklistItemTemplate[]
  results: ChecklistItemResult[]
  observations: Observation[]
  status: 'draft' | 'in_progress' | 'completed'
  downloadedAt: string
  updatedAt: string
}

/**
 * An observation. Either scoped to a checklist (checklistInstanceId set,
 * optionally itemTemplateId for a specific item) or standalone.
 *
 * Per InField decision #4: standalone observations can be created fully
 * offline, but cannot get a new asset linked offline — `needsAssetLink`
 * flags that as an outstanding action once back online.
 *
 * `photoBlobKey` points into `src/db/photoStore.ts` (a small dedicated
 * IndexedDB store) rather than embedding the Blob directly, since this
 * record is JSON-persisted and Blobs can't survive that serialization.
 */
export interface Observation {
  id: string
  checklistInstanceId?: string
  itemTemplateId?: string
  note: string
  photoBlobKey?: string
  assetId: string | null
  needsAssetLink: boolean
  createdAt: string
}
