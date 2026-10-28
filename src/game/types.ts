export type Phase = 'menu' | 'playing' | 'levelUp' | 'waveEnd' | 'shop' | 'results'
export type EnemyKind = 'normal' | 'fast' | 'fat' | 'helmet' | 'shooter' | 'bomber' | 'elite' | 'boss'
export type WeaponId = 'pistol' | 'claws' | 'shotgun' | 'rifle' | 'laser' | 'sardine' | 'yarn' | 'scratcher' | 'bat' | 'shovel'
export type ItemId = 'fish' | 'box' | 'catnip' | 'slipper' | 'vacuum' | 'laserDot' | 'valerian' | 'ninthLife'
export type Rarity = 'common' | 'good' | 'rare' | 'epic'

export interface Stats {
  maxHp: number
  damage: number
  attackSpeed: number
  speed: number
  armor: number
  crit: number
  pickup: number
  dodge: number
  regen: number
  projectiles: number
  projectileSpeed: number
  attackSize: number
  xpGain: number
}

export interface Player {
  x: number; y: number; vx: number; vy: number; r: number
  hp: number; level: number; xp: number; xpNext: number
  invulnerable: number; aim: number; walk: number; ninthLives: number
  stats: Stats
}

export interface Enemy {
  active: boolean; id: number; kind: EnemyKind
  x: number; y: number; vx: number; vy: number; r: number
  hp: number; maxHp: number; speed: number; damage: number
  armor: number; reward: number; xp: number; hitFlash: number
  attackCd: number; state: number; stateTime: number; phase: number
  angle: number; seed: number; elite: boolean
}

export interface Projectile {
  active: boolean; team: 'player' | 'enemy'; kind: string
  x: number; y: number; px: number; py: number; vx: number; vy: number
  r: number; damage: number; life: number; pierce: number; color: string
  aoe: number; bounces: number; lastHit: number; crit: boolean; source?: WeaponId
}

export interface Feather {
  active: boolean; x: number; y: number; vx: number; vy: number
  value: number; life: number; phase: number
}

export interface Particle {
  active: boolean; x: number; y: number; vx: number; vy: number
  life: number; maxLife: number; size: number; color: string; text?: string
}

export interface WeaponState {
  id: WeaponId; level: number; cooldown: number; angle: number; damageDone: number; flash: number
}

export interface RunStats {
  kills: number; damage: number; taken: number; feathers: number
  elapsed: number; wave: number; victory: boolean
}

export interface Snapshot {
  hp: number; maxHp: number; level: number; xp: number; xpNext: number
  wave: number; time: number; feathers: number; kills: number
  enemies: number; weapons: WeaponState[]; bossHp: number; bossMaxHp: number
  paused: boolean; fps: number
}

export interface Settings {
  master: number; music: number; effects: number
  damageNumbers: boolean; screenShake: boolean
}

export interface Offer {
  key: string; type: 'weapon' | 'item' | 'stat'
  id: WeaponId | ItemId | string; name: string; description: string
  price: number; rarity: Rarity; level?: number; sold: boolean
}

export interface PersistentStats {
  bestKills: number; maxWave: number; runs: number; totalKills: number
  bestTime: number; victories: number
}
