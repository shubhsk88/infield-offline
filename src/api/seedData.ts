import type { Asset, ChecklistTemplate } from '../types'

// Static seed data mimicking a CDF-style asset hierarchy for an offshore
// platform. Purely for visual realism in the demo — not fetched from CDF.

export const ASSET_POOL: Asset[] = [
  { id: 'asset-platform-a', name: 'Platform Alpha', labels: ['platform'] },
  { id: 'asset-pump-101', name: 'Pump 101', description: 'Main seawater lift pump', parentId: 'asset-platform-a', labels: ['pump'] },
  { id: 'asset-pump-102', name: 'Pump 102', description: 'Backup seawater lift pump', parentId: 'asset-platform-a', labels: ['pump'] },
  { id: 'asset-valve-201', name: 'Valve 201', description: 'Emergency shutdown valve', parentId: 'asset-platform-a', labels: ['valve'] },
  { id: 'asset-valve-202', name: 'Valve 202', description: 'Riser isolation valve', parentId: 'asset-platform-a', labels: ['valve'] },
  { id: 'asset-tank-301', name: 'Tank 301', description: 'Diesel storage tank', parentId: 'asset-platform-a', labels: ['tank'] },
  { id: 'asset-genset-401', name: 'Generator Set 401', description: 'Primary power generator', parentId: 'asset-platform-a', labels: ['generator'] },
]

function findAssets(ids: string[]): Asset[] {
  return ASSET_POOL.filter((a) => ids.includes(a.id))
}

export const CHECKLIST_CATALOG: ChecklistTemplate[] = [
  {
    id: 'template-daily-pump',
    title: 'Daily Pump Inspection',
    discipline: 'Mechanical',
    linkedAssets: findAssets(['asset-pump-101', 'asset-pump-102']),
    items: [
      { id: 'item-1', label: 'Pump running without unusual noise', inputType: 'boolean' },
      { id: 'item-2', label: 'No visible leaks at seals', inputType: 'boolean' },
      { id: 'item-3', label: 'Discharge pressure (bar)', inputType: 'number' },
      { id: 'item-4', label: 'Additional notes', inputType: 'text' },
    ],
  },
  {
    id: 'template-valve-safety',
    title: 'Valve Safety Check',
    discipline: 'Mechanical',
    linkedAssets: findAssets(['asset-valve-201', 'asset-valve-202']),
    items: [
      { id: 'item-1', label: 'Valve position matches log', inputType: 'boolean' },
      { id: 'item-2', label: 'Actuator responds correctly', inputType: 'boolean' },
      { id: 'item-3', label: 'Additional notes', inputType: 'text' },
    ],
  },
  {
    id: 'template-tank-integrity',
    title: 'Tank Integrity Round',
    discipline: 'Mechanical',
    linkedAssets: findAssets(['asset-tank-301']),
    items: [
      { id: 'item-1', label: 'No corrosion visible on shell', inputType: 'boolean' },
      { id: 'item-2', label: 'Level reading (%)', inputType: 'number' },
    ],
  },
  {
    id: 'template-genset-daily',
    title: 'Generator Daily Round',
    discipline: 'Electrical',
    linkedAssets: findAssets(['asset-genset-401']),
    items: [
      { id: 'item-1', label: 'Oil pressure normal', inputType: 'boolean' },
      { id: 'item-2', label: 'Coolant temperature normal', inputType: 'boolean' },
      { id: 'item-3', label: 'Load (kW)', inputType: 'number' },
    ],
  },
  {
    id: 'template-fire-safety',
    title: 'Fire & Gas Detection Walkdown',
    discipline: 'Safety',
    linkedAssets: findAssets(['asset-platform-a']),
    items: [
      { id: 'item-1', label: 'All detectors unobstructed', inputType: 'boolean' },
      { id: 'item-2', label: 'Extinguishers in place and in-date', inputType: 'boolean' },
      { id: 'item-3', label: 'Additional notes', inputType: 'text' },
    ],
  },
]
