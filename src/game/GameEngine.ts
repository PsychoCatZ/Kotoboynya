import { Input } from './Input'
import { GameAudio } from './Audio'
import { SpatialGrid } from './SpatialGrid'
import { WeaponSystem } from './WeaponSystem'
import { Renderer } from './Renderer'
import { ENEMIES, enemyCap, pickEnemy, spawnInterval, waveDuration } from './content/enemies'
import { BASE_STATS, ITEMS } from './content/items'
import { rollUpgrades, UPGRADES } from './content/upgrades'
import type { UpgradeOffer } from './content/upgrades'
import { WEAPONS } from './content/weapons'
import type { Enemy, Feather, ItemId, Offer, Particle, Player, Projectile, RunStats, Settings, Snapshot, WeaponId, WeaponState } from './types'

const BASE_HEIGHT = 720
export const ARENA_W = 2200, ARENA_H = 1400
const enemyPool = (): Enemy => ({ active: false, id: 0, kind: 'normal', x: 0, y: 0, vx: 0, vy: 0, r: 10, hp: 1, maxHp: 1, speed: 0, damage: 0, armor: 0, reward: 0, xp: 0, hitFlash: 0, attackCd: 0, state: 0, stateTime: 0, phase: 0, angle: 0, seed: 0, elite: false })
const projectilePool = (): Projectile => ({ active: false, team: 'player', kind: 'bullet', x: 0, y: 0, px: 0, py: 0, vx: 0, vy: 0, r: 4, damage: 0, life: 0, pierce: 0, color: '#fff', aoe: 0, bounces: 0, lastHit: -1, crit: false })
const featherPool = (): Feather => ({ active: false, x: 0, y: 0, vx: 0, vy: 0, value: 1, life: 0, phase: 0 })
const particlePool = (): Particle => ({ active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0, size: 1, color: '#fff' })

function segmentDistanceSq(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1, dy = y2 - y1
  const lengthSq = dx * dx + dy * dy
  const t = lengthSq > 0 ? Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSq)) : 0
  const x = x1 + dx * t, y = y1 + dy * t
  return (px - x) ** 2 + (py - y) ** 2
}

export class GameEngine {
  readonly player: Player = { x: ARENA_W / 2, y: ARENA_H / 2, vx: 0, vy: 0, r: 23, hp: 100, level: 1, xp: 0, xpNext: 22, invulnerable: 0, aim: 0, walk: 0, ninthLives: 0, stats: { ...BASE_STATS } }
  readonly enemies = Array.from({ length: 260 }, enemyPool)
  readonly projectiles = Array.from({ length: 800 }, projectilePool)
  readonly feathers = Array.from({ length: 600 }, featherPool)
  readonly particles = Array.from({ length: 360 }, particlePool)
  readonly grid = new SpatialGrid()
  readonly weapons: WeaponState[] = []
  readonly input: Input
  readonly renderer: Renderer
  readonly weaponSystem: WeaponSystem
  viewW = 1280
  viewH = BASE_HEIGHT
  wave = 1
  feathersCount = 0
  timeLeft = waveDuration(1)
  paused = false
  acceptPause = true
  shake = 0
  bossHp = 0
  bossMaxHp = 0
  run: RunStats = { kills: 0, damage: 0, taken: 0, feathers: 0, elapsed: 0, wave: 1, victory: false }
  offers: Offer[] = []
  levelUpOffers: UpgradeOffer[] = []
  pendingLevels = 0
  levelUpActive = false
  rerollCount = 0
  cameraX = this.player.x
  cameraY = this.player.y
  private nextEnemyId = 1
  private spawnCd = 0
  private raf = 0
  private lastTime = 0
  private accumulator = 0
  private snapshotCd = 0
  private fps = 60
  private ended = false
  private destroyRequested = false
  private resizeObserver?: ResizeObserver
  readonly audio: GameAudio
  private canvas: HTMLCanvasElement
  settings: Settings
  private onSnapshot: (snapshot: Snapshot) => void
  private onLevelUp: (offers: UpgradeOffer[]) => void
  private onWaveEnd: () => void
  private onRunEnd: (stats: RunStats) => void

  constructor(
    canvas: HTMLCanvasElement,
    audio: GameAudio,
    settings: Settings,
    onSnapshot: (snapshot: Snapshot) => void,
    onLevelUp: (offers: UpgradeOffer[]) => void,
    onWaveEnd: () => void,
    onRunEnd: (stats: RunStats) => void,
  ) {
    this.canvas = canvas
    this.audio = audio
    this.settings = settings
    this.onSnapshot = onSnapshot
    this.onLevelUp = onLevelUp
    this.onWaveEnd = onWaveEnd
    this.onRunEnd = onRunEnd
    this.input = new Input(canvas)
    this.input.onPause = () => { if (!this.ended && this.acceptPause) this.paused = !this.paused; this.emitSnapshot() }
    this.renderer = new Renderer(canvas, this)
    this.weaponSystem = new WeaponSystem(this)
    this.weapons.push({ id: 'pistol', level: 1, cooldown: 0.2, angle: 0, damageDone: 0, flash: 0 })
    this.resize()
    window.addEventListener('resize', this.resize)
    window.visualViewport?.addEventListener('resize', this.resize)
    this.resizeObserver = new ResizeObserver(this.resize)
    this.resizeObserver.observe(canvas)
    this.audio.tone('wave')
    this.raf = requestAnimationFrame(this.loop)
  }

  setTouchVector(x: number, y: number) {
    this.input.setTouchVector(x, y)
  }

  private resize = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const width = Math.max(1, this.canvas.clientWidth)
    const height = Math.max(1, this.canvas.clientHeight)
    this.viewW = BASE_HEIGHT * width / height
    this.viewH = BASE_HEIGHT
    this.canvas.width = Math.round(this.viewW * dpr)
    this.canvas.height = Math.round(this.viewH * dpr)
    this.renderer.setScale(dpr)
  }

  private loop = (now: number) => {
    if (this.destroyRequested) return
    const rawDt = this.lastTime ? Math.min(0.1, (now - this.lastTime) / 1000) : 0
    this.lastTime = now
    this.fps += ((rawDt ? 1 / rawDt : 60) - this.fps) * 0.05
    if (!this.paused && !this.ended) {
      this.accumulator += rawDt
      let steps = 0
      while (this.accumulator >= 1 / 60 && steps++ < 5) {
        this.update(1 / 60)
        this.accumulator -= 1 / 60
      }
    }
    this.renderer.draw()
    this.snapshotCd -= rawDt
    if (this.snapshotCd <= 0) { this.emitSnapshot(); this.snapshotCd = 0.12 }
    this.raf = requestAnimationFrame(this.loop)
  }

  private update(dt: number) {
    this.run.elapsed += dt
    this.run.wave = this.wave
    if (this.wave !== 20) {
      this.timeLeft -= dt
      if (this.timeLeft <= 0) { this.finishWave(); return }
    } else this.timeLeft += dt
    this.player.invulnerable = Math.max(0, this.player.invulnerable - dt)
    this.player.hp = Math.min(this.player.stats.maxHp, this.player.hp + this.player.stats.regen * dt)
    this.updatePlayer(dt)
    this.grid.clear()
    for (const e of this.enemies) if (e.active) this.grid.insert(e)
    this.spawnCd -= dt
    if (this.spawnCd <= 0) {
      this.spawnWaveEnemy()
      this.spawnCd = spawnInterval(this.wave)
    }
    for (const e of this.enemies) if (e.active) this.updateEnemy(e, dt)
    this.weaponSystem.update(dt)
    this.updateProjectiles(dt)
    this.updateFeathers(dt)
    this.updateParticles(dt)
    this.cameraX += (this.player.x - this.cameraX) * Math.min(1, dt * 7)
    this.cameraY += (this.player.y - this.cameraY) * Math.min(1, dt * 7)
    this.shake = Math.max(0, this.shake - dt * 15)
  }

  private updatePlayer(dt: number) {
    const axis = this.input.axis()
    const speed = this.player.stats.speed
    this.player.vx += (axis.x * speed - this.player.vx) * Math.min(1, dt * 14)
    this.player.vy += (axis.y * speed - this.player.vy) * Math.min(1, dt * 14)
    this.player.x = Math.max(45, Math.min(ARENA_W - 45, this.player.x + this.player.vx * dt))
    this.player.y = Math.max(45, Math.min(ARENA_H - 45, this.player.y + this.player.vy * dt))
    this.player.walk += Math.hypot(this.player.vx, this.player.vy) * dt * 0.035
    const target = this.findNearest(this.player.x, this.player.y, 700)
    if (target) this.player.aim = Math.atan2(target.y - this.player.y, target.x - this.player.x)
  }

  private spawnWaveEnemy() {
    const cap = enemyCap(this.wave)
    let count = 0
    for (const e of this.enemies) if (e.active) count++
    if (count >= cap) return
    if (this.wave === 20 && this.bossHp <= 0 && !this.enemies.some(e => e.active && e.kind === 'boss')) this.spawnEnemy('boss', true)
    else if (this.wave !== 20 || Math.random() < 0.45) {
      const eliteChance = this.wave >= 5 ? Math.min(0.11, (this.wave - 4) * 0.007) : 0
      this.spawnEnemy(pickEnemy(this.wave, Math.random()), Math.random() < eliteChance)
      if (this.wave > 12 && Math.random() < 0.28) this.spawnEnemy(pickEnemy(this.wave, Math.random()), false)
    }
  }

  spawnEnemy(kind: keyof typeof ENEMIES, elite = false, x?: number, y?: number) {
    const e = this.enemies.find(item => !item.active)
    if (!e) return
    const def = ENEMIES[kind]
    const angle = Math.random() * Math.PI * 2
    const distance = kind === 'boss' ? 430 : 590 + Math.random() * 170
    e.active = true; e.id = this.nextEnemyId++; e.kind = kind
    e.x = x ?? Math.max(50, Math.min(ARENA_W - 50, this.player.x + Math.cos(angle) * distance))
    e.y = y ?? Math.max(50, Math.min(ARENA_H - 50, this.player.y + Math.sin(angle) * distance))
    e.vx = 0; e.vy = 0; e.r = def.radius * (elite && kind !== 'boss' ? 1.16 : 1)
    const hpScale = kind === 'boss' ? 1 : 1 + (this.wave - 1) * 0.105
    const eliteScale = elite && kind !== 'boss' ? 2.4 : 1
    e.maxHp = def.hp * hpScale * eliteScale; e.hp = e.maxHp
    e.speed = def.speed * (1 + Math.min(0.24, this.wave * 0.009)) * (elite && kind !== 'boss' ? 1.08 : 1)
    e.damage = def.damage * (1 + this.wave * 0.025)
    e.armor = def.armor + (elite && kind !== 'boss' ? 2 : 0)
    e.reward = def.reward * (elite && kind !== 'boss' ? 3 : 1); e.xp = def.xp * (elite ? 2 : 1)
    e.hitFlash = 0; e.attackCd = 0.5 + Math.random(); e.state = 0; e.stateTime = 0
    e.phase = Math.random() * Math.PI * 2; e.angle = 0; e.seed = Math.random(); e.elite = elite
    if (kind === 'boss') {
      this.bossHp = e.hp; this.bossMaxHp = e.maxHp; this.audio.tone('boss'); this.shake = 14
      this.addText(this.player.x, this.player.y - 150, 'МЕГАУТКА', '#ffd85c', 30)
    }
  }

  private updateEnemy(e: Enemy, dt: number) {
    e.hitFlash = Math.max(0, e.hitFlash - dt)
    e.attackCd -= dt; e.stateTime -= dt; e.phase += dt * 5
    const dx = this.player.x - e.x, dy = this.player.y - e.y
    const dist = Math.hypot(dx, dy) || 1
    const nx = dx / dist, ny = dy / dist
    e.angle = Math.atan2(dy, dx)
    if (e.kind === 'boss') { this.updateBoss(e, dt, dist, nx, ny); this.bossHp = e.hp; return }
    if (e.kind === 'shooter') {
      const direction = dist > 360 ? 1 : dist < 250 ? -0.8 : 0
      e.vx = nx * e.speed * direction + -ny * Math.sin(e.phase * 0.35) * 25
      e.vy = ny * e.speed * direction + nx * Math.sin(e.phase * 0.35) * 25
      if (e.attackCd <= 0 && dist < 590) {
        this.spawnProjectile('enemy', 'duckShot', e.x, e.y, nx * 270, ny * 270, e.damage, 7, 3, '#dba4f1')
        e.attackCd = Math.max(0.8, 1.8 - this.wave * 0.025)
      }
    } else if (e.kind === 'bomber') {
      if (e.state === 0) {
        e.vx = nx * e.speed; e.vy = ny * e.speed
        if (dist < 92) { e.state = 1; e.stateTime = 0.65; e.vx = 0; e.vy = 0 }
      } else {
        e.vx = 0; e.vy = 0
        if (e.stateTime <= 0) {
          if (dist < 125) this.damagePlayer(e.damage)
          this.explosion(e.x, e.y, '#ffb14e', 18)
          e.hp = 0; this.killEnemy(e, false); return
        }
      }
    } else {
      e.vx = nx * e.speed; e.vy = ny * e.speed
    }
    e.x += e.vx * dt; e.y += e.vy * dt
    if (dist < e.r + this.player.r && e.attackCd <= 0) {
      this.damagePlayer(e.damage); e.attackCd = 0.85
      e.x -= nx * 18; e.y -= ny * 18
    }
    if (e.id % 2 === Math.floor(this.run.elapsed * 60) % 2) {
      this.grid.forNearby(e.x, e.y, e.r * 2, other => {
        if (other === e || !other.active || other.id < e.id) return
        const ox = e.x - other.x, oy = e.y - other.y
        const d2 = ox * ox + oy * oy, min = e.r + other.r
        if (d2 > 0 && d2 < min * min) { const d = Math.sqrt(d2); e.x += ox / d * 0.7; e.y += oy / d * 0.7 }
      })
    }
  }

  private updateBoss(e: Enemy, dt: number, dist: number, nx: number, ny: number) {
    const phaseTwo = e.hp < e.maxHp * 0.5
    const rate = phaseTwo ? 0.7 : 1
    if (e.state === 0) {
      e.vx = nx * e.speed * (phaseTwo ? 1.25 : 1); e.vy = ny * e.speed * (phaseTwo ? 1.25 : 1)
      e.x += e.vx * dt; e.y += e.vy * dt
      if (e.attackCd <= 0) {
        e.state = 1 + (Math.floor(e.seed * 10 + this.run.elapsed) % 4)
        e.seed = Math.random(); e.stateTime = e.state === 1 ? 0.9 : 0.7
        e.vx = 0; e.vy = 0
      }
    } else if (e.state === 1) {
      if (e.stateTime <= 0) { e.state = 5; e.stateTime = 0.55; e.vx = nx * 650; e.vy = ny * 650; this.audio.tone('boss') }
    } else if (e.state === 5) {
      e.x += e.vx * dt; e.y += e.vy * dt
      if (dist < e.r + this.player.r + 12) this.damagePlayer(e.damage * 1.35)
      if (e.stateTime <= 0) this.resetBoss(e, 1.2 * rate)
    } else if (e.state === 2) {
      if (e.stateTime <= 0) {
        const count = phaseTwo ? 24 : 16
        for (let i = 0; i < count; i++) { const a = i / count * Math.PI * 2; this.spawnProjectile('enemy', 'featherShot', e.x, e.y, Math.cos(a) * 230, Math.sin(a) * 230, e.damage * 0.55, 8, 4, '#ffd37a') }
        this.audio.tone('explode'); this.resetBoss(e, 1.5 * rate)
      }
    } else if (e.state === 3) {
      if (e.stateTime <= 0) {
        for (let i = 0; i < (phaseTwo ? 8 : 5); i++) { const a = i / 5 * Math.PI * 2; this.spawnEnemy(i % 3 === 0 ? 'fast' : 'normal', false, e.x + Math.cos(a) * 100, e.y + Math.sin(a) * 100) }
        this.resetBoss(e, 1.8 * rate)
      }
    } else if (e.state === 4) {
      if (e.stateTime <= 0) {
        const base = Math.atan2(this.player.y - e.y, this.player.x - e.x)
        for (let i = -3; i <= 3; i++) { const a = base + i * 0.13; this.spawnProjectile('enemy', 'duckShot', e.x, e.y, Math.cos(a) * 330, Math.sin(a) * 330, e.damage * 0.65, 8, 3.2, '#ff8f72') }
        this.resetBoss(e, 1.1 * rate)
      }
    }
    e.x = Math.max(e.r, Math.min(ARENA_W - e.r, e.x)); e.y = Math.max(e.r, Math.min(ARENA_H - e.r, e.y))
  }

  private resetBoss(e: Enemy, cd: number) { e.state = 0; e.attackCd = cd; e.stateTime = 0 }

  spawnProjectile(team: 'player' | 'enemy', kind: string, x: number, y: number, vx: number, vy: number, damage: number, r: number, life: number, color: string, pierce = 0, aoe = 0, bounces = 0, crit = false, source?: WeaponId) {
    const p = this.projectiles.find(item => !item.active)
    if (!p) return
    p.active = true; p.team = team; p.kind = kind; p.x = x; p.y = y; p.px = x; p.py = y
    p.vx = vx; p.vy = vy; p.damage = damage; p.r = r; p.life = life; p.color = color
    p.pierce = pierce; p.aoe = aoe; p.bounces = bounces; p.lastHit = -1; p.crit = crit; p.source = source
  }

  private updateProjectiles(dt: number) {
    for (const p of this.projectiles) {
      if (!p.active) continue
      p.life -= dt; p.px = p.x; p.py = p.y; p.x += p.vx * dt; p.y += p.vy * dt
      if (p.life <= 0 || p.x < -100 || p.y < -100 || p.x > ARENA_W + 100 || p.y > ARENA_H + 100) {
        if (p.active && p.aoe > 0 && p.team === 'player') this.detonate(p)
        p.active = false; continue
      }
      if (p.team === 'enemy') {
        if (segmentDistanceSq(this.player.x, this.player.y, p.px, p.py, p.x, p.y) < (p.r + this.player.r) ** 2) { this.damagePlayer(p.damage); p.active = false }
      } else {
        const travel = Math.hypot(p.x - p.px, p.y - p.py)
        this.grid.forNearby((p.x + p.px) / 2, (p.y + p.py) / 2, p.r + 80 + travel / 2, e => {
          if (!p.active || !e.active || e.id === p.lastHit) return
          if (segmentDistanceSq(e.x, e.y, p.px, p.py, p.x, p.y) > (p.r + e.r) ** 2) return
          if (p.aoe > 0) { this.detonate(p); p.active = false; return }
          this.damageEnemy(e, p.damage, p.crit, p.source ? this.weapons.find(w => w.id === p.source) : undefined)
          p.lastHit = e.id
          if (p.bounces > 0) {
            const next = this.findNearest(e.x, e.y, 300, e.id)
            if (next) { const a = Math.atan2(next.y - e.y, next.x - e.x); const speed = Math.hypot(p.vx, p.vy); p.vx = Math.cos(a) * speed; p.vy = Math.sin(a) * speed; p.bounces--; p.x = e.x; p.y = e.y }
            else p.bounces = 0
          } else if (p.pierce > 0) p.pierce--
          else p.active = false
        })
      }
    }
  }

  private detonate(p: Projectile) {
    this.explosion(p.x, p.y, p.color, 22); this.audio.tone('explode')
    this.grid.forNearby(p.x, p.y, p.aoe + 80, e => {
      if (!e.active) return
      const d = Math.hypot(e.x - p.x, e.y - p.y)
      if (d < p.aoe + e.r) this.damageEnemy(e, p.damage * (1 - Math.min(0.5, d / (p.aoe * 2))), p.crit, p.source ? this.weapons.find(w => w.id === p.source) : undefined)
    })
  }

  damageEnemy(e: Enemy, amount: number, crit = false, weapon?: WeaponState) {
    if (!e.active) return
    const actual = Math.max(1, amount - e.armor)
    e.hp -= actual; e.hitFlash = 0.08; this.run.damage += actual
    if (weapon) weapon.damageDone += actual
    if (this.settings.damageNumbers && (crit || Math.random() < 0.24)) this.addText(e.x, e.y - e.r, `${Math.round(actual)}`, crit ? '#ffe15b' : '#f2f0dc', crit ? 19 : 13)
    if (Math.random() < 0.18) this.addParticle(e.x, e.y, '#e7edcf', 3, 0.25)
    if (e.hp <= 0) this.killEnemy(e)
  }

  private killEnemy(e: Enemy, reward = true) {
    if (!e.active) return
    e.active = false
    if (reward) {
      this.run.kills++; this.gainXp(e.xp)
      const drops = e.kind === 'boss' ? 20 : e.elite ? 5 : e.kind === 'fat' ? 3 : 1
      for (let i = 0; i < drops; i++) this.dropFeather(e.x, e.y, Math.ceil(e.reward / drops))
      if (Math.random() < 0.35) this.audio.tone('death')
    }
    for (let i = 0; i < Math.min(14, 4 + e.r / 3); i++) this.addParticle(e.x, e.y, ENEMIES[e.kind].color, 3 + Math.random() * 4, 0.45)
    if (e.kind === 'boss') { this.bossHp = 0; this.finishRun(true) }
  }

  damagePlayer(amount: number) {
    if (this.player.invulnerable > 0 || this.ended) return
    if (Math.random() < this.player.stats.dodge) { this.addText(this.player.x, this.player.y - 35, 'МИМО', '#a9e6c2', 15); return }
    const actual = Math.max(1, amount - this.player.stats.armor)
    this.player.hp -= actual; this.run.taken += actual; this.player.invulnerable = 0.55
    this.shake = this.settings.screenShake ? 9 : 0; this.audio.tone('hurt')
    this.addText(this.player.x, this.player.y - 35, `−${Math.round(actual)}`, '#ff806e', 18)
    if (this.player.hp <= 0) {
      if (this.player.ninthLives > 0) {
        this.player.ninthLives--; this.player.hp = 35; this.player.invulnerable = 2
        this.addText(this.player.x, this.player.y - 55, 'ДЕВЯТАЯ ЖИЗНЬ', '#ffe15b', 20)
      } else this.finishRun(false)
    }
  }

  private gainXp(amount: number) {
    this.player.xp += amount * this.player.stats.xpGain
    while (this.player.xp >= this.player.xpNext) {
      this.player.xp -= this.player.xpNext
      this.player.level++
      this.player.xpNext = Math.round(22 * Math.pow(this.player.level, 1.32))
      this.pendingLevels++
      this.addText(this.player.x, this.player.y - 55, `УРОВЕНЬ ${this.player.level}`, '#ffe16b', 20)
    }
    if (this.pendingLevels > 0 && !this.levelUpActive) {
      this.levelUpActive = true
      this.paused = true
      this.levelUpOffers = rollUpgrades(this.player.level)
      this.audio.tone('wave')
      this.onLevelUp(this.levelUpOffers.map(offer => ({ ...offer })))
      this.emitSnapshot()
    }
  }

  chooseLevelUp(key: string): UpgradeOffer[] | null {
    if (!this.levelUpActive) return null
    const offer = this.levelUpOffers.find(item => item.key === key)
    const upgrade = UPGRADES.find(item => item.id === offer?.id)
    if (!offer || !upgrade) return this.levelUpOffers
    upgrade.apply(this.player)
    this.pendingLevels = Math.max(0, this.pendingLevels - 1)
    this.audio.tone('buy')
    if (this.pendingLevels > 0) {
      this.levelUpOffers = rollUpgrades(this.player.level - this.pendingLevels + 1)
      return this.levelUpOffers.map(item => ({ ...item }))
    }
    this.levelUpOffers = []
    this.levelUpActive = false
    this.paused = false
    this.emitSnapshot()
    return null
  }

  private dropFeather(x: number, y: number, value: number) {
    const f = this.feathers.find(item => !item.active)
    if (!f) { this.feathersCount += value; this.run.feathers += value; return }
    const a = Math.random() * Math.PI * 2
    f.active = true; f.x = x; f.y = y; f.vx = Math.cos(a) * 55; f.vy = Math.sin(a) * 55
    f.value = value; f.life = 35; f.phase = Math.random() * 6
  }

  private updateFeathers(dt: number) {
    const radius = this.player.stats.pickup
    for (const f of this.feathers) {
      if (!f.active) continue
      f.life -= dt; f.phase += dt * 4
      f.vx *= 0.91; f.vy *= 0.91
      const dx = this.player.x - f.x, dy = this.player.y - f.y, dist = Math.hypot(dx, dy) || 1
      if (dist < radius) { const force = 260 + (radius - dist) * 5; f.vx += dx / dist * force * dt; f.vy += dy / dist * force * dt }
      f.x += f.vx * dt; f.y += f.vy * dt
      if (dist < this.player.r + 12) {
        f.active = false; this.feathersCount += f.value; this.run.feathers += f.value
        if (Math.random() < 0.3) this.audio.tone('pickup')
      } else if (f.life <= 0) f.active = false
    }
  }

  addParticle(x: number, y: number, color: string, size: number, life: number) {
    const p = this.particles.find(item => !item.active)
    if (!p) return
    const a = Math.random() * Math.PI * 2, speed = 25 + Math.random() * 90
    p.active = true; p.x = x; p.y = y; p.vx = Math.cos(a) * speed; p.vy = Math.sin(a) * speed
    p.life = life; p.maxLife = life; p.size = size; p.color = color; p.text = undefined
  }
  addText(x: number, y: number, text: string, color: string, size: number) {
    const p = this.particles.find(item => !item.active)
    if (!p) return
    p.active = true; p.x = x; p.y = y; p.vx = 0; p.vy = -32; p.life = 0.7; p.maxLife = 0.7; p.size = size; p.color = color; p.text = text
  }
  explosion(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) this.addParticle(x, y, color, 4 + Math.random() * 7, 0.35 + Math.random() * 0.25)
    this.shake = this.settings.screenShake ? 7 : 0
  }
  private updateParticles(dt: number) {
    for (const p of this.particles) if (p.active) {
      p.life -= dt; if (p.life <= 0) { p.active = false; continue }
      p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.96; p.vy *= 0.96
    }
  }

  findNearest(x: number, y: number, range: number, exclude = -1): Enemy | undefined {
    let best: Enemy | undefined, bestD = range * range
    this.grid.forNearby(x, y, range, e => {
      if (!e.active || e.id === exclude) return
      const d = (e.x - x) ** 2 + (e.y - y) ** 2
      if (d < bestD) { bestD = d; best = e }
    })
    return best
  }

  private finishWave() {
    if (this.ended) return
    for (const f of this.feathers) if (f.active) { this.feathersCount += f.value; this.run.feathers += f.value; f.active = false }
    for (const e of this.enemies) e.active = false
    for (const p of this.projectiles) p.active = false
    this.paused = true
    this.generateOffers()
    this.onWaveEnd()
  }

  continueToNextWave() {
    this.wave++; this.run.wave = this.wave; this.timeLeft = waveDuration(this.wave)
    this.spawnCd = 0.25; this.paused = false; this.rerollCount = 0
    this.player.hp = Math.min(this.player.stats.maxHp, this.player.hp + this.player.stats.maxHp * 0.08)
    this.audio.tone('wave'); this.emitSnapshot()
  }

  private finishRun(victory: boolean) {
    if (this.ended) return
    this.ended = true; this.paused = true; this.run.victory = victory; this.run.wave = this.wave
    this.onRunEnd({ ...this.run })
  }

  generateOffers() {
    const weaponIds = Object.keys(WEAPONS) as WeaponId[]
    const itemIds = Object.keys(ITEMS) as ItemId[]
    const rarities = ['common', 'good', 'rare', 'epic'] as const
    this.offers = Array.from({ length: 4 }, (_, i) => {
      const roll = Math.random()
      const rarityIndex = Math.min(3, Math.floor(Math.random() * (1 + this.wave / 7)))
      const priceScale = (1 + this.wave * 0.07) * (1 + rarityIndex * 0.32)
      if (roll < 0.42) {
        const id = weaponIds[Math.floor(Math.random() * weaponIds.length)]
        const owned = this.weapons.find(w => w.id === id)
        return { key: `${this.wave}-${this.rerollCount}-${i}`, type: 'weapon', id, name: WEAPONS[id].name, description: owned ? `Улучшение до уровня ${Math.min(4, owned.level + 1)}. ${WEAPONS[id].description}` : WEAPONS[id].description, price: Math.round(WEAPONS[id].price * priceScale), rarity: rarities[rarityIndex], level: owned?.level ?? 1, sold: false }
      }
      if (roll < 0.8) {
        const id = itemIds[Math.floor(Math.random() * itemIds.length)]
        return { key: `${this.wave}-${this.rerollCount}-${i}`, type: 'item', id, name: ITEMS[id].name, description: ITEMS[id].description, price: Math.round(ITEMS[id].price * priceScale), rarity: rarities[rarityIndex], sold: false }
      }
      const stats = [
        ['damage', 'Кошачья злость', '+12% урона'], ['speed', 'Мокрые пятки', '+9% скорости движения'],
        ['attackSpeed', 'Дёрганый хвост', '+12% скорости атаки'], ['armor', 'Плотная шерсть', '+2 брони'],
        ['regen', 'Мурчание', '+0.5 восстановления HP/с'], ['crit', 'Охотничий азарт', '+6% критического шанса'],
      ] as const
      const stat = stats[Math.floor(Math.random() * stats.length)]
      return { key: `${this.wave}-${this.rerollCount}-${i}`, type: 'stat', id: stat[0], name: stat[1], description: stat[2], price: Math.round(32 * priceScale), rarity: rarities[rarityIndex], sold: false }
    })
    if (this.wave === 1 && this.rerollCount === 0) {
      this.offers[0] = { key: `${this.wave}-0-starter`, type: 'stat', id: 'damage', name: 'Кошачья злость', description: '+12% урона. Доступно даже после очень неровной первой волны.', price: 10, rarity: 'common', sold: false }
    }
  }

  buy(key: string) {
    const offer = this.offers.find(o => o.key === key)
    if (!offer || offer.sold || this.feathersCount < offer.price) return false
    this.feathersCount -= offer.price; offer.sold = true
    if (offer.type === 'weapon') {
      const id = offer.id as WeaponId, owned = this.weapons.find(w => w.id === id)
      if (owned) owned.level = Math.min(4, owned.level + 1)
      else if (this.weapons.length < 6) this.weapons.push({ id, level: 1, cooldown: 0.2, angle: 0, damageDone: 0, flash: 0 })
      else { const weakest = this.weapons.reduce((a, b) => a.level <= b.level ? a : b); weakest.id = id; weakest.level = 1; weakest.cooldown = 0; weakest.damageDone = 0; weakest.flash = 0 }
    } else if (offer.type === 'item') {
      const id = offer.id as ItemId
      if (id === 'ninthLife') this.player.ninthLives++
      else { ITEMS[id].apply(this.player.stats); if (id === 'fish') this.player.hp += 20 }
    } else {
      const id = offer.id
      if (id === 'damage') this.player.stats.damage *= 1.12
      if (id === 'speed') this.player.stats.speed *= 1.09
      if (id === 'attackSpeed') this.player.stats.attackSpeed *= 1.12
      if (id === 'armor') this.player.stats.armor += 2
      if (id === 'regen') this.player.stats.regen += 0.5
      if (id === 'crit') this.player.stats.crit += 0.06
    }
    this.audio.tone('buy'); this.emitSnapshot(); return true
  }

  reroll() {
    const cost = this.rerollCost()
    if (this.feathersCount < cost) return false
    this.feathersCount -= cost; this.rerollCount++; this.generateOffers(); this.audio.tone('buy'); return true
  }
  rerollCost() { return 8 + this.wave * 2 + this.rerollCount * 5 }
  togglePause() { if (!this.ended) this.paused = !this.paused; this.emitSnapshot() }
  updateSettings(settings: Settings) { this.settings = settings; this.audio.update(settings) }

  private emitSnapshot() {
    this.onSnapshot({ hp: this.player.hp, maxHp: this.player.stats.maxHp, level: this.player.level, xp: this.player.xp, xpNext: this.player.xpNext, wave: this.wave, time: this.timeLeft, feathers: this.feathersCount, kills: this.run.kills, enemies: this.enemies.filter(e => e.active).length, weapons: this.weapons.map(w => ({ ...w })), bossHp: this.bossHp, bossMaxHp: this.bossMaxHp, paused: this.paused, fps: this.fps })
  }

  destroy() {
    this.destroyRequested = true; cancelAnimationFrame(this.raf)
    window.removeEventListener('resize', this.resize)
    window.visualViewport?.removeEventListener('resize', this.resize)
    this.resizeObserver?.disconnect()
    this.input.destroy(); this.renderer.destroy()
  }
}
