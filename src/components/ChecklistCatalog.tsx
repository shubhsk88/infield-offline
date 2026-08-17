import { useState } from 'react'
import { useCatalog } from '../hooks/useCatalog'
import { useDownloadedChecklists } from '../hooks/useDownloadedChecklists'
import { saveChecklist } from '../sync/offlineTransactions'
import type { ChecklistInstance } from '../types'

/**
 * Browse today's available checklists and download the ones you need before
 * going offline (InField decision #1). This screen assumes connectivity —
 * the catalog itself isn't meant to be usable/fresh offline.
 */
export default function ChecklistCatalog() {
  const { templates, isLoading, isError } = useCatalog()
  const { checklists } = useDownloadedChecklists()
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const downloadedTemplateIds = new Set(checklists.map((c) => c.templateId))

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function downloadSelected() {
    for (const template of templates) {
      if (!selected.has(template.id)) continue
      const now = new Date().toISOString()
      const instance: ChecklistInstance = {
        id: crypto.randomUUID(),
        templateId: template.id,
        title: template.title,
        discipline: template.discipline,
        linkedAssets: template.linkedAssets,
        items: template.items,
        results: template.items.map((item) => ({ itemTemplateId: item.id, value: null })),
        observations: [],
        status: 'draft',
        downloadedAt: now,
        updatedAt: now,
      }
      saveChecklist(instance)
    }
    setSelected(new Set())
  }

  if (isLoading) return <p>Loading today's checklists… (requires connectivity)</p>
  if (isError) {
    return (
      <p>
        Couldn't load the catalog — you're likely offline. Downloaded checklists are still available under
        "My Checklists".
      </p>
    )
  }

  return (
    <div>
      <p className="meta">Pick the 1–3 checklists you need for the field today, then download them.</p>
      <div className="card-list">
        {templates.map((template) => {
          const alreadyDownloaded = downloadedTemplateIds.has(template.id)
          return (
            <label key={template.id} className="card-row">
              <span>
                <input
                  type="checkbox"
                  checked={selected.has(template.id)}
                  disabled={alreadyDownloaded}
                  onChange={() => toggle(template.id)}
                />{' '}
                <strong>{template.title}</strong>
                <div className="meta">
                  <span className="tag">{template.discipline}</span>{' '}
                  {template.linkedAssets.map((a) => a.name).join(', ')}
                </div>
              </span>
              {alreadyDownloaded && <span className="sync-badge synced">Downloaded</span>}
            </label>
          )
        })}
      </div>
      <p>
        <button onClick={downloadSelected} disabled={selected.size === 0}>
          Download selected ({selected.size})
        </button>
      </p>
    </div>
  )
}
