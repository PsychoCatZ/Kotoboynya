import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Home, RotateCcw, Settings as SettingsIcon, Play, Feather, Skull } from 'lucide-react'
import { GameEngine } from '../game/GameEngine'
import { GameAudio } from '../game/Audio'
import type { Offer, Phase, RunStats, Settings, Snapshot } from '../game/types'
import { HUD } from './HUD'
import { Shop } from './Shop'
import { Results } from './Results'
import { LevelUp } from './LevelUp'
import { TouchControls } from './TouchControls'
import type { UpgradeOffer } from '../game/content/upgrades'

const EMPTY_SNAPSHOT: Snapshot = { hp: 100, maxHp: 100, level: 1, xp: 0, xpNext: 22, wave: 1, time: 20, feathers: 0, kills: 0, enemies: 0, weapons: [], bossHp: 0, bossMaxHp: 0, paused: false, fps: 60 }

interface Props { settings: Settings; onSettings: () => void; onMenu: () => void; onRestart: () => void; onRunRecorded: (run: RunStats) => void }

export function GameScreen({ settings, onSettings, onMenu, onRestart, onRunRecorded }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<GameEngine>(null)
  const audioRef = useRef<GameAudio>(null)
  const [phase, setPhase] = useState<Phase>('playing')
  const [snapshot, setSnapshot] = useState<Snapshot>(EMPTY_SNAPSHOT)
  const [offers, setOffers] = useState<Offer[]>([])
  const [levelOffers, setLevelOffers] = useState<UpgradeOffer[]>([])
  const [run, setRun] = useState<RunStats | null>(null)
  const phaseRef = useRef(phase)
  phaseRef.current = phase

  useEffect(() => {
    if (!canvasRef.current) return
    const audio = new GameAudio(settings)
    audioRef.current = audio
    const engine = new GameEngine(canvasRef.current, audio, settings, setSnapshot, levelOffers => {
      setLevelOffers(levelOffers)
      setPhase('levelUp')
    }, () => {
      setOffers(engine.offers.map(o => ({ ...o })))
      setPhase('waveEnd')
    }, result => {
      setRun(result); setPhase('results'); onRunRecorded(result)
    })
    engineRef.current = engine
    if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('qa')) {
      ;(window as unknown as { __kotoboynya: GameEngine }).__kotoboynya = engine
    }
    const enter = (e: KeyboardEvent) => {
      if (e.code === 'Enter' && phaseRef.current === 'waveEnd') setPhase('shop')
      if (phaseRef.current === 'levelUp' && ['Digit1', 'Digit2', 'Digit3'].includes(e.code)) {
        const offer = engine.levelUpOffers[Number(e.code.slice(-1)) - 1]
        if (offer) chooseUpgrade(offer.key)
      }
    }
    window.addEventListener('keydown', enter)
    return () => { window.removeEventListener('keydown', enter); engine.destroy(); audio.destroy(); engineRef.current = null }
    // Engine lifetime equals one run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    engineRef.current?.updateSettings(settings)
    audioRef.current?.update(settings)
  }, [settings])

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.acceptPause = phase === 'playing'
      if (phase !== 'playing') engineRef.current.paused = true
    }
  }, [phase])

  const buy = (key: string) => {
    const engine = engineRef.current
    if (engine?.buy(key)) { setOffers(engine.offers.map(o => ({ ...o }))); setSnapshot(s => ({ ...s, feathers: engine.feathersCount })) }
  }
  const reroll = () => {
    const engine = engineRef.current
    if (engine?.reroll()) { setOffers(engine.offers.map(o => ({ ...o }))); setSnapshot(s => ({ ...s, feathers: engine.feathersCount })) }
  }
  const next = () => { engineRef.current?.continueToNextWave(); setPhase('playing') }
  const chooseUpgrade = (key: string) => {
    const nextOffers = engineRef.current?.chooseLevelUp(key)
    if (nextOffers) setLevelOffers(nextOffers)
    else setPhase('playing')
  }
  const resume = () => { engineRef.current?.togglePause(); setSnapshot(s => ({ ...s, paused: false })) }
  const favorite = engineRef.current?.weapons.slice().sort((a, b) => b.damageDone - a.damageDone)[0]?.id

  return <main className="game-screen">
    <div className="canvas-wrap"><canvas ref={canvasRef} aria-label="Игровая арена. Управление WASD или стрелками. На сенсорном экране ведите пальцем по арене."/><div className="canvas-scanlines"/></div>
    <HUD snapshot={snapshot} onPause={() => engineRef.current?.togglePause()}/>
    {phase === 'playing' && !snapshot.paused && <TouchControls onVector={(x, y) => engineRef.current?.setTouchVector(x, y)}/>}
    {phase === 'playing' && snapshot.paused && <div className="modal-backdrop pause-backdrop"><section className="modal pause-modal"><p className="overline">УТКИ ПОДОЖДУТ</p><h2>Пауза</h2><p>Кот передыхает. Недолго.</p><button className="button button-primary button-full" onClick={resume}><Play size={19} fill="currentColor"/> Продолжить</button><button className="button button-secondary button-full" onClick={onSettings}><SettingsIcon size={19}/> Настройки</button><button className="button button-secondary button-full" onClick={onRestart}><RotateCcw size={19}/> Начать заново</button><button className="button button-quiet button-full" onClick={onMenu}><Home size={19}/> В главное меню</button></section></div>}
    {phase === 'levelUp' && <LevelUp level={snapshot.level} offers={levelOffers} onChoose={chooseUpgrade}/>}
    {phase === 'waveEnd' && <div className="wave-end overlay-screen"><div className="wave-end-card"><p className="overline">ПОЛЕ ВРЕМЕННО ОЧИЩЕНО</p><h2>Волна {snapshot.wave} пережита</h2><p>Оставшиеся перья собраны автоматически.<br/>Кот сделал вид, что всё шло по плану.</p><div className="wave-summary"><span><Skull size={19}/><b>{snapshot.kills}</b> уток</span><span><Feather size={19}/><b>{snapshot.feathers}</b> перьев</span></div><button className="button button-primary" onClick={() => setPhase('shop')}>В магазин <ArrowRight size={20}/></button><small>ENTER — тоже работает</small></div></div>}
    {phase === 'shop' && engineRef.current && <Shop wave={snapshot.wave} feathers={snapshot.feathers} offers={offers} rerollCost={engineRef.current.rerollCost()} run={engineRef.current.run} onBuy={buy} onReroll={reroll} onNext={next}/>}
    {phase === 'results' && run && <Results run={run} favoriteWeapon={favorite} onRestart={onRestart} onMenu={onMenu}/>}
    {phase === 'playing' && !snapshot.paused && snapshot.wave === 1 && snapshot.time > 16 && <div className="controls-toast"><span className="keyboard-control-hint"><b>WASD</b> или <b>стрелки</b> — двигаться · оружие целится само</span><span className="touch-control-hint"><b>ДЖОЙСТИК</b> — двигаться · оружие целится само</span></div>}
  </main>
}
