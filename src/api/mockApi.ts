import type { Asset, ChecklistInstance, ChecklistTemplate, Observation } from '../types'
import { ASSET_POOL, CHECKLIST_CATALOG } from './seedData'

/**
 * A fake, in-process backend standing in for Cognite Data Fusion.
 * No real network requests are made — everything here is simulated so this
 * POC has no external dependency or credentials to manage. It's built to be
 * a drop-in shape for a real API later: async functions with realistic
 * latency and failure, gated on real `navigator.onLine`.
 */

export class OfflineError extends Error {
  constructor() {
    super('No network connection')
    this.name = 'OfflineError'
  }
}

let simulatedOffline = false
let failureRate = 0
const simulatedOfflineListeners = new Set<() => void>()

/** Dev/demo-only controls, wired up to the DebugPanel. */
export function setSimulatedOffline(offline: boolean) {
  simulatedOffline = offline
  for (const listener of simulatedOfflineListeners) listener()
}
export function getSimulatedOffline() {
  return simulatedOffline
}
/** Notified whenever `setSimulatedOffline` changes — used to keep the
 * offline-transactions executor's own connectivity detection (and the app's
 * "Online/Offline" indicator) in sync with the debug toggle, not just the
 * mock API calls themselves. */
export function subscribeSimulatedOffline(listener: () => void): () => void {
  simulatedOfflineListeners.add(listener)
  return () => simulatedOfflineListeners.delete(listener)
}
export function setFailureRate(rate: number) {
  failureRate = Math.min(1, Math.max(0, rate))
}

export function isEffectivelyOnline() {
  if (simulatedOffline) return false
  if (typeof navigator !== 'undefined' && 'onLine' in navigator) return navigator.onLine
  return true
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function simulateNetwork() {
  if (!isEffectivelyOnline()) {
    throw new OfflineError()
  }
  await delay(300 + Math.random() * 700)
  if (Math.random() < failureRate) {
    throw new Error('Simulated transient server error')
  }
}

export async function fetchCatalog(): Promise<ChecklistTemplate[]> {
  await simulateNetwork()
  return CHECKLIST_CATALOG
}

export async function fetchAssetPool(): Promise<Asset[]> {
  await simulateNetwork()
  return ASSET_POOL
}

export async function submitChecklist(instance: ChecklistInstance): Promise<{ id: string }> {
  await simulateNetwork()
  console.info('[mockApi] checklist submitted', instance.id, instance.title)
  return { id: instance.id }
}

export async function submitObservation(observation: Observation): Promise<{ id: string }> {
  await simulateNetwork()
  console.info('[mockApi] observation submitted', observation.id, {
    hasPhoto: Boolean(observation.photoBlobKey),
    assetId: observation.assetId,
  })
  return { id: observation.id }
}

export async function linkAssetToObservation(observationId: string, assetId: string): Promise<{ id: string }> {
  await simulateNetwork()
  console.info('[mockApi] asset linked', observationId, assetId)
  return { id: observationId }
}
