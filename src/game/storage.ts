import type { PersistentStats, Settings } from './types'

const SETTINGS_KEY = 'kotoboynya.settings.v1'
const STATS_KEY = 'kotoboynya.stats.v1'

export const DEFAULT_SETTINGS: Settings = { master: 0.65, music: 0.25, effects: 0.7, damageNumbers: true, screenShake: true }
export const DEFAULT_STATS: PersistentStats = { bestKills: 0, maxWave: 0, runs: 0, totalKills: 0, bestTime: 0, victories: 0 }

export function loadSettings(): Settings {
  try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') } } catch { return DEFAULT_SETTINGS }
}
export function saveSettings(settings: Settings) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)) } catch { /* local-only fallback */ }
}
export function loadStats(): PersistentStats {
  try { return { ...DEFAULT_STATS, ...JSON.parse(localStorage.getItem(STATS_KEY) || '{}') } } catch { return DEFAULT_STATS }
}
export function saveStats(stats: PersistentStats) {
  try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)) } catch { /* local-only fallback */ }
}
