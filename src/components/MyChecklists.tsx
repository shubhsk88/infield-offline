import { useDownloadedChecklists } from '../hooks/useDownloadedChecklists'
import SyncStatusBadge from './SyncStatusBadge'
import ChecklistStatusBadge from './ChecklistStatusBadge'

export default function MyChecklists({ onOpen }: { onOpen: (id: string) => void }) {
  const { checklists } = useDownloadedChecklists()

  if (checklists.length === 0) {
    return <p>No checklists downloaded yet. Go to "Catalog" while online to download some for the field.</p>
  }

  return (
    <div className="card-list">
      {checklists.map((checklist) => (
        <button key={checklist.id} className="card-row" onClick={() => onOpen(checklist.id)}>
          <span>
            <strong>{checklist.title}</strong>
            <div className="meta">
              <span className="tag">{checklist.discipline}</span> · {checklist.observations.length} observation(s)
            </div>
          </span>
          <span className="badge-group">
            <ChecklistStatusBadge status={checklist.status} />
            <SyncStatusBadge id={checklist.id} />
          </span>
        </button>
      ))}
    </div>
  )
}
