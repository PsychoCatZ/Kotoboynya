import { Heart, Feather, Pause, Crosshair, Skull } from 'lucide-react'
import type { Snapshot } from '../game/types'
import { WEAPONS } from '../game/content/weapons'

export function HUD({ snapshot, onPause }: { snapshot: Snapshot; onPause: () => void }) {
  const hpPercent = Math.max(0, snapshot.hp / snapshot.maxHp * 100)
  const xpPercent = snapshot.xp / snapshot.xpNext * 100
  const minutes = Math.floor(snapshot.time / 60), seconds = Math.max(0, Math.floor(snapshot.time % 60))
  return <div className="hud" aria-live="off">
    <div className="hud-top">
      <div className="hud-health panel"><div className="hud-health-row"><Heart size={18} fill="currentColor"/><b>{Math.ceil(snapshot.hp)}</b><span>/ {Math.round(snapshot.maxHp)}</span><span className="hud-level">УР. {snapshot.level}</span></div><div className="bar health-bar"><i style={{ width: `${hpPercent}%` }}/></div><div className="bar xp-bar"><i style={{ width: `${xpPercent}%` }}/></div></div>
      <div className="hud-wave"><span>{snapshot.wave === 20 ? 'ФИНАЛЬНАЯ ВОЛНА' : `ВОЛНА ${snapshot.wave} / 20`}</span><b>{snapshot.wave === 20 ? 'МЕГАУТКА' : `${minutes}:${seconds.toString().padStart(2, '0')}`}</b></div>
      <div className="hud-right"><div className="hud-feathers panel"><Feather size={19}/><b>{snapshot.feathers}</b></div><button className="icon-button hud-pause" onClick={onPause} aria-label="Пауза"><Pause size={22}/></button></div>
    </div>
    {snapshot.bossMaxHp > 0 && snapshot.bossHp > 0 && <div className="boss-hud"><span>МЕГАУТКА</span><div className="bar"><i style={{ width: `${snapshot.bossHp / snapshot.bossMaxHp * 100}%` }}/></div></div>}
    <div className="hud-bottom"><div className="weapon-strip">{snapshot.weapons.map((w, i) => <div className={`weapon-chip weapon-${w.id}`} key={`${w.id}-${i}`} title={`${WEAPONS[w.id].name}, уровень ${w.level}`}><Crosshair size={16}/><span>{WEAPONS[w.id].name}</span><b>{w.level}</b></div>)}</div><div className="hud-kills"><Skull size={16}/>{snapshot.kills}<span>· {snapshot.enemies} на поле</span></div></div>
  </div>
}
