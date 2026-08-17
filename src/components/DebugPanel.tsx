import { useState } from 'react'
import { getSimulatedOffline, setFailureRate, setSimulatedOffline } from '../api/mockApi'

/**
 * Dev-only demo controls: lets you demo "airplane mode" and forced sync
 * failures without needing physical connectivity changes.
 */
export default function DebugPanel() {
  const [offline, setOffline] = useState(getSimulatedOffline())
  const [failureRate, setFailureRateState] = useState(0)

  return (
    <div className="debug-panel">
      <strong>Debug</strong>
      <label className="inline-checkbox">
        <input
          type="checkbox"
          checked={offline}
          onChange={(e) => {
            setOffline(e.target.checked)
            setSimulatedOffline(e.target.checked)
          }}
        />
        Simulate offline
      </label>
      <label className="inline-checkbox">
        Force failure rate
        <select
          value={failureRate}
          onChange={(e) => {
            const rate = Number(e.target.value)
            setFailureRateState(rate)
            setFailureRate(rate)
          }}
        >
          <option value={0}>0%</option>
          <option value={0.5}>50%</option>
          <option value={1}>100%</option>
        </select>
      </label>
    </div>
  )
}
