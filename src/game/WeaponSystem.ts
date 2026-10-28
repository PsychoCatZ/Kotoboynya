import type { GameEngine } from './GameEngine'
import { WEAPONS, WEAPON_SLOTS, weaponMultiplier } from './content/weapons'
import type { Enemy, WeaponState } from './types'

export class WeaponSystem {
  private game: GameEngine
  constructor(game: GameEngine) { this.game = game }

  update(dt: number) {
    const g = this.game
    for (const weapon of g.weapons) {
      const def = WEAPONS[weapon.id]
      weapon.flash = Math.max(0, weapon.flash - dt)
      weapon.cooldown -= dt * g.player.stats.attackSpeed
      const slot = WEAPON_SLOTS[g.weapons.indexOf(weapon)] ?? WEAPON_SLOTS[0]
      const originX = g.player.x + slot.x, originY = g.player.y + slot.y
      const target = g.findNearest(originX, originY, def.range * g.player.stats.attackSize)
      if (target) weapon.angle = Math.atan2(target.y - originY, target.x - originX)
      let shots = 0
      while (weapon.cooldown <= 0 && shots++ < 3) {
        if (!target && weapon.id !== 'scratcher') { weapon.cooldown = 0.08; break }
        this.fire(weapon, target)
        weapon.cooldown += def.cooldown
      }
    }
  }

  private damage(weapon: WeaponState) {
    const g = this.game, def = WEAPONS[weapon.id]
    return def.damage * weaponMultiplier(weapon.level) * g.player.stats.damage
  }

  private crit() { return Math.random() < this.game.player.stats.crit }
  private critDamage(base: number, crit: boolean) { return base * (crit ? 2 : 1) }

  private fire(weapon: WeaponState, target?: Enemy) {
    const g = this.game, def = WEAPONS[weapon.id]
    const base = this.damage(weapon), a = weapon.angle
    const slot = WEAPON_SLOTS[g.weapons.indexOf(weapon)] ?? WEAPON_SLOTS[0]
    const originX = g.player.x + slot.x, originY = g.player.y + slot.y
    const targetDistance = target ? Math.hypot(target.x - originX, target.y - originY) : 22
    const muzzle = target ? Math.min(22, Math.max(3, targetDistance - target.r - 7)) : 22
    const x = originX + Math.cos(a) * muzzle, y = originY + Math.sin(a) * muzzle
    const speedScale = g.player.stats.projectileSpeed
    const sizeScale = g.player.stats.attackSize
    const extra = g.player.stats.projectiles
    weapon.flash = weapon.id === 'shovel' ? 0.38 : ['claws', 'bat'].includes(weapon.id) ? 0.26 : weapon.id === 'shotgun' ? 0.2 : 0.11

    if (weapon.id === 'pistol' || weapon.id === 'rifle') {
      const count = 1 + extra
      for (let i = 0; i < count; i++) {
        const spread = (i - (count - 1) / 2) * 0.1 + (weapon.id === 'rifle' ? (Math.random() - 0.5) * 0.12 : 0)
        const crit = this.crit(), speed = (weapon.id === 'rifle' ? 840 : 760) * speedScale
        g.spawnProjectile('player', weapon.id, x, y, Math.cos(a + spread) * speed, Math.sin(a + spread) * speed, this.critDamage(base, crit), (weapon.id === 'rifle' ? 4 : 5) * sizeScale, 0.85, def.color, weapon.level >= 4 ? 1 : 0, 0, 0, crit, weapon.id)
      }
      g.audio.tone('shot')
    } else if (weapon.id === 'shotgun') {
      const count = 4 + weapon.level + extra
      for (let i = 0; i < count; i++) {
        const angle = a + (i - (count - 1) / 2) * 0.12 + (Math.random() - 0.5) * 0.06
        const crit = this.crit()
        g.spawnProjectile('player', 'pellet', x, y, Math.cos(angle) * 700 * speedScale, Math.sin(angle) * 700 * speedScale, this.critDamage(base, crit), 4 * sizeScale, 0.42, def.color, 0, 0, 0, crit, weapon.id)
      }
      g.audio.tone('shot'); g.shake = g.settings.screenShake ? 3 : 0
    } else if (weapon.id === 'laser') {
      for (let i = 0; i <= extra; i++) {
        const angle = a + (i - extra / 2) * 0.07, crit = this.crit()
        g.spawnProjectile('player', 'laser', x, y, Math.cos(angle) * 1500 * speedScale, Math.sin(angle) * 1500 * speedScale, this.critDamage(base, crit), 7 * sizeScale, 0.44, def.color, 2 + weapon.level, 0, 0, crit, weapon.id)
      }
      g.audio.tone('laser')
    } else if (weapon.id === 'sardine') {
      for (let i = 0; i <= extra; i++) {
        const angle = a + (i - extra / 2) * 0.16, crit = this.crit()
        const distance = target ? Math.hypot(target.x - x, target.y - y) : 200
        const speed = 380 * speedScale, travel = Math.min(1.1, distance / speed)
        g.spawnProjectile('player', 'sardine', x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, this.critDamage(base, crit), 11 * sizeScale, travel, def.color, 0, (95 + weapon.level * 9) * sizeScale, 0, crit, weapon.id)
      }
    } else if (weapon.id === 'yarn') {
      for (let i = 0; i <= extra; i++) {
        const angle = a + (i - extra / 2) * 0.12, crit = this.crit()
        g.spawnProjectile('player', 'yarn', x, y, Math.cos(angle) * 520 * speedScale, Math.sin(angle) * 520 * speedScale, this.critDamage(base, crit), 10 * sizeScale, 1.5, def.color, 0, 0, 1 + weapon.level, crit, weapon.id)
      }
      g.audio.tone('shot')
    } else if (weapon.id === 'claws' || weapon.id === 'bat' || weapon.id === 'shovel') {
      const arc = weapon.id === 'shovel' ? 1.3 : weapon.id === 'bat' ? 1 : 0.85
      const knockback = weapon.id === 'bat' ? 95 : weapon.id === 'shovel' ? 42 : 12
      this.swing(weapon, a, base, arc, knockback)
    } else if (weapon.id === 'scratcher') {
      let hit = false
      const range = def.range * sizeScale
      g.grid.forNearby(g.player.x, g.player.y, range + 60, enemy => {
        if (!enemy.active) return
        if (Math.hypot(enemy.x - g.player.x, enemy.y - g.player.y) < range + enemy.r) {
          const crit = this.crit(); g.damageEnemy(enemy, this.critDamage(base, crit), crit, weapon); hit = true
        }
      })
      if (hit && Math.random() < 0.3) g.audio.tone('hit')
    }
  }

  private swing(weapon: WeaponState, angle: number, base: number, arc: number, knockback: number) {
    const g = this.game, def = WEAPONS[weapon.id], range = def.range * g.player.stats.attackSize
    let hit = false
    g.grid.forNearby(g.player.x, g.player.y, range + 60, enemy => {
      if (!enemy.active) return
      const dx = enemy.x - g.player.x, dy = enemy.y - g.player.y, distance = Math.hypot(dx, dy) || 1
      let delta = Math.atan2(dy, dx) - angle
      delta = Math.atan2(Math.sin(delta), Math.cos(delta))
      if (distance < range + enemy.r && Math.abs(delta) < arc) {
        const crit = this.crit()
        g.damageEnemy(enemy, this.critDamage(base, crit), crit, weapon)
        if (enemy.active) { enemy.x += dx / distance * knockback; enemy.y += dy / distance * knockback }
        hit = true
      }
    })
    if (hit) { g.audio.tone('hit'); if (weapon.id !== 'claws') g.shake = g.settings.screenShake ? 2 : 0 }
  }
}
