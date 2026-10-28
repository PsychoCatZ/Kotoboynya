import type { Settings } from './types'

export class GameAudio {
  private ctx?: AudioContext
  private lastShot = 0
  settings: Settings
  constructor(settings: Settings) { this.settings = settings }

  private context() {
    if (!this.ctx) this.ctx = new AudioContext()
    if (this.ctx.state === 'suspended') void this.ctx.resume()
    return this.ctx
  }

  update(settings: Settings) { this.settings = settings }

  tone(kind: 'shot' | 'hit' | 'death' | 'pickup' | 'hurt' | 'buy' | 'wave' | 'boss' | 'laser' | 'explode') {
    const volume = this.settings.master * this.settings.effects
    if (volume <= 0) return
    const nowMs = performance.now()
    if (kind === 'shot' && nowMs - this.lastShot < 42) return
    if (kind === 'shot') this.lastShot = nowMs
    const ctx = this.context()
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()
    const presets = {
      shot: [170, 75, 0.055, 'square', 0.09], hit: [95, 60, 0.035, 'triangle', 0.035],
      death: [240, 85, 0.09, 'sawtooth', 0.065], pickup: [650, 1080, 0.07, 'sine', 0.055],
      hurt: [130, 48, 0.18, 'sawtooth', 0.14], buy: [420, 780, 0.16, 'triangle', 0.1],
      wave: [220, 520, 0.28, 'square', 0.08], boss: [75, 32, 0.8, 'sawtooth', 0.16],
      laser: [980, 260, 0.12, 'sawtooth', 0.07], explode: [90, 28, 0.3, 'square', 0.14],
    } as const
    const [from, to, duration, type, level] = presets[kind]
    osc.type = type
    osc.frequency.setValueAtTime(from, now)
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), now + duration)
    filter.type = 'lowpass'
    filter.frequency.value = kind === 'shot' ? 900 : 1800
    gain.gain.setValueAtTime(level * volume, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
    osc.connect(filter); filter.connect(gain); gain.connect(ctx.destination)
    osc.start(now); osc.stop(now + duration)
  }

  destroy() { void this.ctx?.close() }
}
