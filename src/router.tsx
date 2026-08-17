/* eslint-disable react-refresh/only-export-components -- this file mixes the
   router/route definitions (non-component exports) with route components by
   design, matching TanStack Router's standard single-file route setup for a
   small app; splitting it up would add files without adding clarity. */
import { Link, Outlet, createRootRoute, createRoute, createRouter, useNavigate, useRouterState } from '@tanstack/react-router'
import PWABadge from './PWABadge.tsx'
import ChecklistCatalog from './components/ChecklistCatalog'
import MyChecklists from './components/MyChecklists'
import ChecklistForm from './components/ChecklistForm'
import NewStandaloneObservation from './components/NewStandaloneObservation'
import PendingAssetLinkBanner from './components/PendingAssetLinkBanner'
import AssetLinkResolution from './components/AssetLinkResolution'
import SyncIndicator from './components/SyncIndicator'
import SyncFailureBanner from './components/SyncFailureBanner'
import DebugPanel from './components/DebugPanel'
import SyncDebugPanel from './components/SyncDebugPanel'
import './App.css'
import ReloadPrompt from './components/ReloadPrompt.tsx'

/**
 * Simple code-based routing (no file-based route generation/plugin) — kept
 * deliberately minimal for a POC: one file, five routes, no nested layouts
 * beyond the single root shell.
 */
function RootLayout() {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const showTabs = !pathname.startsWith('/checklist/') && pathname !== '/asset-links'

  return (
    <>
      <div className="app-header">
        <h1>InField Offline POC</h1>
      </div>

      <SyncIndicator />
      <SyncFailureBanner />
      <PendingAssetLinkBanner onResolve={() => navigate({ to: '/asset-links' })} />

      {showTabs && (
        <div className="app-tabs">
          <Link to="/" activeOptions={{ exact: true }} activeProps={{ className: 'active' }}>
            My Checklists
          </Link>
          <Link to="/catalog" activeProps={{ className: 'active' }}>
            Catalog
          </Link>
          <Link to="/new-observation" activeProps={{ className: 'active' }}>
            + New Observation
          </Link>
        </div>
      )}

      <Outlet />

      <ReloadPrompt />

      <DebugPanel />
      <SyncDebugPanel />
      <PWABadge />
    </>
  )
}

const rootRoute = createRootRoute({ component: RootLayout })

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: function Index() {
    const navigate = useNavigate()
    return <MyChecklists onOpen={(id) => navigate({ to: '/checklist/$checklistId', params: { checklistId: id } })} />
  },
})

const catalogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/catalog',
  component: ChecklistCatalog,
})

const checklistRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/checklist/$checklistId',
  component: function ChecklistRoute() {
    const { checklistId } = checklistRoute.useParams()
    const navigate = useNavigate()
    return <ChecklistForm id={checklistId} onClose={() => navigate({ to: '/' })} />
  },
})

const newObservationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/new-observation',
  component: function NewObservationRoute() {
    const navigate = useNavigate()
    return <NewStandaloneObservation onSaved={() => navigate({ to: '/' })} />
  },
})

const assetLinksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/asset-links',
  component: function AssetLinksRoute() {
    const navigate = useNavigate()
    return <AssetLinkResolution onDone={() => navigate({ to: '/' })} />
  },
})

const routeTree = rootRoute.addChildren([indexRoute, catalogRoute, checklistRoute, newObservationRoute, assetLinksRoute])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
