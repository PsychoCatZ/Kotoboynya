import { useCallback, useEffect, useState } from 'react'
import { MainMenu } from './components/MainMenu'
import { GameScreen } from './components/GameScreen'
import { SettingsModal } from './components/SettingsModal'
import { loadSettings, loadStats, saveSettings, saveStats } from './game/storage'
import type { RunStats, Settings } from './game/types'
import './App.css'

export default function App() {
  const [screen, setScreen] = useState<'menu' | 'game'>('menu')
  const [runId, setRunId] = useState(0)
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [stats, setStats] = useState(loadStats)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [exitOpen, setExitOpen] = useState(false)

  const play = useCallback(() => { setRunId(id => id + 1); setScreen('game') }, [])
  useEffect(() => {
    const listener = (e: KeyboardEvent) => { if (screen === 'menu' && e.code === 'Enter' && !settingsOpen && !exitOpen) play() }
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [screen, settingsOpen, exitOpen, play])

  const updateSettings = (next: Settings) => { setSettings(next); saveSettings(next) }
  const recordRun = useCallback((run: RunStats) => {
    setStats(previous => {
      const next = { ...previous, bestKills: Math.max(previous.bestKills, run.kills), maxWave: Math.max(previous.maxWave, run.wave), runs: previous.runs + 1, totalKills: previous.totalKills + run.kills, bestTime: Math.max(previous.bestTime, run.elapsed), victories: previous.victories + (run.victory ? 1 : 0) }
      saveStats(next); return next
    })
  }, [])

  return <>
    {screen === 'menu' ? <MainMenu stats={stats} onPlay={play} onSettings={() => setSettingsOpen(true)} onExit={() => setExitOpen(true)} exitOpen={exitOpen} onCloseExit={() => setExitOpen(false)}/> : <GameScreen key={runId} settings={settings} onSettings={() => setSettingsOpen(true)} onMenu={() => setScreen('menu')} onRestart={play} onRunRecorded={recordRun}/>}
    {settingsOpen && <SettingsModal settings={settings} onChange={updateSettings} onClose={() => setSettingsOpen(false)}/>}
  </>
}
