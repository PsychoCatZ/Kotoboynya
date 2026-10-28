import { ArrowUp, Sparkles, Zap, Crown } from 'lucide-react'
import type { UpgradeOffer } from '../game/content/upgrades'
import { RARITY_COLORS } from '../game/content/weapons'

export function LevelUp({ level, offers, onChoose }: { level: number; offers: UpgradeOffer[]; onChoose: (key: string) => void }) {
  return <div className="levelup-screen overlay-screen" role="dialog" aria-modal="true" aria-labelledby="levelup-title">
    <div className="levelup-inner">
      <div className="levelup-heading"><span className="levelup-icon"><ArrowUp size={28}/></span><div><p className="overline">НОВЫЙ УРОВЕНЬ · {level}</p><h2 id="levelup-title">Кот становится опаснее</h2></div></div>
      <p className="levelup-subtitle">Выбери одно бесплатное усиление. Утки пока стоят где стояли.</p>
      <div className="levelup-grid">{offers.map((offer, index) => {
        const rarityIndex = ['common','good','rare','epic'].indexOf(offer.rarity)
        return <button className="upgrade-card" key={offer.key} onClick={() => onChoose(offer.key)} style={{ '--rarity': RARITY_COLORS[rarityIndex] } as React.CSSProperties}>
          <span className="upgrade-number">{index + 1}</span>
          <span className="upgrade-icon">{offer.rarity === 'epic' ? <Crown size={25}/> : offer.rarity === 'rare' ? <Sparkles size={25}/> : <Zap size={25}/>}</span>
          <span className="upgrade-rarity">{({common:'ОБЫЧНОЕ',good:'ХОРОШЕЕ',rare:'РЕДКОЕ',epic:'ЭПИЧЕСКОЕ'} as const)[offer.rarity]}</span>
          <strong>{offer.name}</strong>
          <span className="upgrade-description">{offer.description}</span>
          <span className="upgrade-action">Выбрать <ArrowUp size={17}/></span>
        </button>
      })}</div>
      <p className="levelup-hint"><span className="keyboard-control-hint">Можно также нажать 1, 2 или 3</span><span className="touch-control-hint">Коснитесь карточки, чтобы выбрать усиление</span></p>
    </div>
  </div>
}
