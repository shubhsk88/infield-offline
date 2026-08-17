import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), VitePWA({
    registerType: 'autoUpdate',
    injectRegister: false,

    pwaAssets: {
      disabled: false,
      config: true,
    },

    // No manual `icons` array here — `pwaAssets: { config: true }` below
    // already generates and injects it automatically from
    // pwa-assets.config.ts. Listing icons manually here as well caused each
    // one to be registered for precaching twice (once via the normal
    // workbox globPatterns disk scan, once via this array), with two
    // different content hashes each time — which throws
    // "add-to-cache-list-conflicting-entries" synchronously at the top of
    // the service worker script, before any of its event listeners ever get
    // registered. That's what broke offline entirely on the deployed site.
    manifest: {
      name: 'InField Offline POC',
      short_name: 'InField POC',
      description: 'Offline-first checklist & observation capture for field crews with unreliable connectivity',
      theme_color: '#23431f',
      background_color: '#23431f',
      display: 'standalone',
    },

    workbox: {
      globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      cleanupOutdatedCaches: true,
      clientsClaim: true,
      // Required for offline navigation on any route besides the exact
      // precached "/" (e.g. /catalog, /checklist/$id) — without this the SW
      // only serves exact cache hits, so reloading offline on any other
      // route falls straight through to the network and fails.
      navigateFallback: 'index.html',
      // Default generateSW output splits the workbox runtime into a
      // separately-loaded chunk (workbox-xxxx.js), pulled in from inside the
      // install handler via a dynamic importScripts loader shim. Inlining it
      // avoids that indirection entirely — one self-contained sw.js, no
      // async module loading between the SW starting up and its install
      // listener actually being registered.
      inlineWorkboxRuntime: true,
    },

    devOptions: {
      enabled: true,
      navigateFallback: 'index.html',
      suppressWarnings: true,
      type: 'module',
    },
  })],
})