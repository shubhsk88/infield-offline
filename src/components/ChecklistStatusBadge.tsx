import type { ChecklistInstance } from '../types'

const LABEL: Record<ChecklistInstance['status'], string> = {
  draft: 'Draft',
  in_progress: 'In progress',
  completed: 'Completed',
}

/**
 * The checklist's own domain status (draft/in progress/completed) — distinct
 * from `SyncStatusBadge`, which reflects whether the record has been
 * uploaded yet. The two are unrelated: a checklist can be "Completed" and
 * still "Pending" sync, or "Draft" and already "Synced".
 */
export default function ChecklistStatusBadge({ status }: { status: ChecklistInstance['status'] }) {
  return <span className={`status-badge ${status}`}>{LABEL[status]}</span>
}
