import { Play, Settings, LogOut, Feather, Skull, Trophy, X } from 'lucide-react'
import { MenuArt } from './MenuArt'
import type { PersistentStats } from '../game/types'

interface Props { stats: PersistentStats; onPlay: () => void; onSettings: () => void; onExit: () => void; exitOpen: boolean; onCloseExit: () => void }

export function MainMenu({ stats, onPlay, onSettings, onExit, exitOpen, onCloseExit }: Props) {
  const isDesktop = window.kotoboynyaDesktop?.isDesktop === true
  return (
    <main className="main-menu">
      <div className="menu-grain" />
      <header className="menu-topbar"><span><Feather size={17} /> СЕРЬЁЗНАЯ ИГРА ПРО НЕСЕРЬЁЗНУЮ УГРОЗУ</span><span>ВЕРСИЯ 0.4 / ЛОКАЛЬНЫЙ ЗАБЕГ</span></header>
      <section className="menu-content">
        <div className="menu-copy">
          <div className="title-mark"><span /> УТИНЫЙ ВОПРОС</div>
          <h1>КОТО<br/><em>БОЙНЯ</em></h1>
          <p className="menu-tagline">Они пришли толпой.<br/>У тебя есть когти и полный магазин.</p>
          <nav className="menu-actions" aria-label="Главное меню">
            <button className="button button-play" onClick={onPlay}><Play fill="currentColor" size={22}/><span>Играть</span><kbd>ENTER</kbd></button>
            <div className="menu-secondary"><button className="button button-secondary" onClick={onSettings}><Settings size={19}/> Настройки</button><button className="button button-quiet" onClick={onExit}><LogOut size={19}/> Выход</button></div>
          </nav>
          <div className="menu-stats">
            <span><Skull size={16}/><b>{stats.totalKills.toLocaleString('ru-RU')}</b> уток за всё время</span>
            <span><Trophy size={16}/><b>{stats.maxWave}</b> лучшая волна</span>
          </div>
        </div>
        <div className="menu-visual"><MenuArt/><div className="menu-quote">«Причины конфликта<br/>не имеют значения»</div></div>
      </section>
      <footer className="menu-footer"><span><b>WASD</b> / <b>СТРЕЛКИ</b> / <b>ДЖОЙСТИК</b> — ДВИЖЕНИЕ</span><span>ОРУЖИЕ СТРЕЛЯЕТ САМО</span><span><b>ESC</b> — ПАУЗА</span></footer>
      {exitOpen && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onCloseExit() }}><section className="modal exit-modal" role="dialog" aria-modal="true" aria-label="Выход из игры"><button className="icon-button modal-close" onClick={onCloseExit} aria-label="Закрыть"><X size={22}/></button><LogOut size={38}/><h2>Уже уходишь?</h2><p>{isDesktop ? 'Можно закрыть игру и продолжить войну с утками позже. Общая статистика уже сохранена.' : 'Браузер не даёт игре закрыть вкладку самостоятельно. Просто закрой её — утки никуда не денутся.'}</p>{isDesktop && <button className="button button-primary button-full" onClick={() => window.kotoboynyaDesktop?.exit()}>Выйти из игры</button>}<button className={`button ${isDesktop ? 'button-secondary' : 'button-primary'} button-full`} onClick={onCloseExit}>Остаться и разобраться</button></section></div>}
    </main>
  )
}
