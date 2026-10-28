import { ArrowRight, Feather, RefreshCw, ShoppingBag, Check, Crosshair, Package, TrendingUp } from 'lucide-react'
import type { Offer, RunStats } from '../game/types'
import { RARITY_COLORS } from '../game/content/weapons'

interface Props { wave: number; feathers: number; offers: Offer[]; rerollCost: number; run: RunStats; onBuy: (key: string) => void; onReroll: () => void; onNext: () => void }

export function Shop({ wave, feathers, offers, rerollCost, run, onBuy, onReroll, onNext }: Props) {
  return <div className="shop-screen overlay-screen">
    <header className="shop-header"><div><p className="overline">ВОЛНА {wave} ПОЗАДИ</p><h2>Кошачий чёрный рынок</h2><p>Цены выросли. Утки виноваты, наверное.</p></div><div className="shop-wallet"><Feather size={25}/><b>{feathers}</b><span>перьев</span></div></header>
    <div className="shop-runline"><span>УТОК: <b>{run.kills}</b></span><span>НАНЕСЕНО: <b>{Math.round(run.damage)}</b></span><span>ПОЛУЧЕНО: <b>{Math.round(run.taken)}</b></span></div>
    <div className="shop-grid">{offers.map(offer => {
      const affordable = feathers >= offer.price
      return <article className={`shop-card ${offer.sold ? 'sold' : ''}`} key={offer.key} style={{ '--rarity': RARITY_COLORS[['common','good','rare','epic'].indexOf(offer.rarity)] } as React.CSSProperties}>
        <div className="shop-card-top"><span className="offer-type">{offer.type === 'weapon' ? <Crosshair size={17}/> : offer.type === 'item' ? <Package size={17}/> : <TrendingUp size={17}/>}</span><span className="rarity-label">{({common:'ОБЫЧНОЕ',good:'ХОРОШЕЕ',rare:'РЕДКОЕ',epic:'ЭПИЧЕСКОЕ'} as const)[offer.rarity]}</span></div>
        <h3>{offer.name}</h3><p>{offer.description}</p>
        <button className="button shop-buy" disabled={offer.sold || !affordable} onClick={() => onBuy(offer.key)}>{offer.sold ? <><Check size={18}/> Куплено</> : <><Feather size={17}/>{offer.price}<span>{affordable ? 'Купить' : 'Не хватает'}</span></>}</button>
      </article>
    })}</div>
    <footer className="shop-footer"><button className="button button-secondary" disabled={feathers < rerollCost} onClick={onReroll}><RefreshCw size={18}/> Обновить <span className="inline-price"><Feather size={14}/>{rerollCost}</span></button><div className="shop-tip"><ShoppingBag size={17}/> Купленное оружие того же типа повышает уровень</div><button className="button button-primary" onClick={onNext}>Волна {wave + 1}<ArrowRight size={20}/></button></footer>
  </div>
}
