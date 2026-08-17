import { usePendingAssetLinks } from '../sync/pendingAssetLinks'
import { useOnlineStatus } from '../hooks/useOnlineStatus'

export default function PendingAssetLinkBanner({ onResolve }: { onResolve: () => void }) {
  const pending = usePendingAssetLinks()
  const online = useOnlineStatus()

  if (!online || pending.length === 0) return null

  return (
    <div className="pending-link-banner">
      <span>
        You're back online — {pending.length} observation{pending.length > 1 ? 's' : ''} need{pending.length === 1 ? 's' : ''} an
        asset linked.
      </span>
      <button onClick={onResolve}>Resolve now</button>
    </div>
  )
}
