import { Volume2, X, Music, Zap, Type, Move } from 'lucide-react'
import type { Settings } from '../game/types'

interface Props {
  settings: Settings
  onChange: (settings: Settings) => void
  onClose: () => void
}

export function SettingsModal({ settings, onChange, onClose }: Props) {
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => onChange({ ...settings, [key]: value })
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <section className="modal settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title" onKeyDown={e => { if (e.key === 'Escape') onClose() }}>
        <button className="icon-button modal-close" onClick={onClose} aria-label="Закрыть настройки"><X size={22} /></button>
        <p className="overline">ПОД СЕБЯ</p>
        <h2 id="settings-title">Настройки</h2>
        <div className="settings-list">
          <Slider icon={<Volume2 size={20} />} label="Общая громкость" value={settings.master} onChange={v => set('master', v)} />
          <Slider icon={<Music size={20} />} label="Музыка" value={settings.music} onChange={v => set('music', v)} />
          <Slider icon={<Zap size={20} />} label="Эффекты" value={settings.effects} onChange={v => set('effects', v)} />
          <label className="toggle-row"><span><Type size={20} /> Числа урона</span><input type="checkbox" checked={settings.damageNumbers} onChange={e => set('damageNumbers', e.target.checked)} /><i /></label>
          <label className="toggle-row"><span><Move size={20} /> Тряска экрана</span><input type="checkbox" checked={settings.screenShake} onChange={e => set('screenShake', e.target.checked)} /><i /></label>
        </div>
        <p className="settings-note">Музыка зарезервирована для следующей версии. Эффекты уже работают.</p>
        <button className="button button-primary button-full" onClick={onClose}>Готово</button>
      </section>
    </div>
  )
}

function Slider({ icon, label, value, onChange }: { icon: React.ReactNode; label: string; value: number; onChange: (value: number) => void }) {
  return <label className="slider-row"><span>{icon}{label}<b>{Math.round(value * 100)}%</b></span><input type="range" min="0" max="1" step="0.05" value={value} onChange={e => onChange(Number(e.target.value))} /></label>
}
