import type { GameEngine } from './GameEngine'
import { ARENA_W, ARENA_H } from './GameEngine'
import { ENEMIES } from './content/enemies'
import { WEAPONS, WEAPON_SLOTS } from './content/weapons'
import type { Enemy } from './types'

export class Renderer {
  private ctx: CanvasRenderingContext2D
  private dpr = 1
  readonly game: GameEngine
  constructor(canvas: HTMLCanvasElement, game: GameEngine) {
    this.game = game
    this.ctx = canvas.getContext('2d', { alpha: false })!
  }
  setScale(dpr: number) { this.dpr = dpr }
  destroy() {}

  draw() {
    const ctx = this.ctx, g = this.game, W = g.viewW, H = g.viewH
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    ctx.fillStyle = '#182722'; ctx.fillRect(0, 0, W, H)
    const shakeX = g.shake ? (Math.random() - 0.5) * g.shake : 0
    const shakeY = g.shake ? (Math.random() - 0.5) * g.shake : 0
    ctx.save()
    ctx.translate(W / 2 - g.cameraX + shakeX, H / 2 - g.cameraY + shakeY)
    this.drawArena()
    for (const f of g.feathers) if (f.active && this.visible(f.x, f.y, 30)) this.drawFeather(f.x, f.y, f.phase)
    for (const p of g.projectiles) if (p.active && p.team === 'enemy' && this.visible(p.x, p.y, 30)) this.drawProjectile(p)
    for (const e of g.enemies) if (e.active && this.visible(e.x, e.y, e.r + 40)) this.drawEnemy(e)
    for (const p of g.projectiles) if (p.active && p.team === 'player' && this.visible(p.x, p.y, 50)) this.drawProjectile(p)
    this.drawCat()
    this.drawWeapons()
    for (const p of g.particles) if (p.active && this.visible(p.x, p.y, 50)) this.drawParticle(p)
    ctx.restore()
    const vignette = ctx.createRadialGradient(W / 2, H / 2, 250, W / 2, H / 2, 760)
    vignette.addColorStop(0, 'rgba(9,18,15,0)'); vignette.addColorStop(1, 'rgba(9,18,15,.38)')
    ctx.fillStyle = vignette; ctx.fillRect(0, 0, W, H)
  }

  private visible(x: number, y: number, pad: number) {
    const g = this.game
    return Math.abs(x - g.cameraX) < g.viewW / 2 + pad && Math.abs(y - g.cameraY) < g.viewH / 2 + pad
  }

  private drawArena() {
    const ctx = this.ctx, g = this.game
    ctx.fillStyle = '#304b3b'; ctx.fillRect(0, 0, ARENA_W, ARENA_H)
    const left = Math.max(0, Math.floor((g.cameraX - g.viewW / 2) / 80) * 80)
    const right = Math.min(ARENA_W, g.cameraX + g.viewW / 2 + 80)
    const top = Math.max(0, Math.floor((g.cameraY - g.viewH / 2) / 80) * 80)
    const bottom = Math.min(ARENA_H, g.cameraY + g.viewH / 2 + 80)
    ctx.strokeStyle = 'rgba(166,193,132,.075)'; ctx.lineWidth = 1
    ctx.beginPath()
    for (let x = left; x <= right; x += 80) { ctx.moveTo(x, top); ctx.lineTo(x, bottom) }
    for (let y = top; y <= bottom; y += 80) { ctx.moveTo(left, y); ctx.lineTo(right, y) }
    ctx.stroke()
    for (let x = left; x <= right; x += 80) for (let y = top; y <= bottom; y += 80) {
      const hash = Math.abs(Math.sin(x * 12.3 + y * 4.7))
      if (hash > 0.45) {
        const gx = x + 12 + hash * 38, gy = y + 15 + hash * 29
        ctx.strokeStyle = 'rgba(160,188,116,.19)'; ctx.lineWidth = 2
        ctx.beginPath(); ctx.moveTo(gx, gy + 5); ctx.lineTo(gx - 3, gy); ctx.moveTo(gx, gy + 5); ctx.lineTo(gx + 4, gy - 2); ctx.stroke()
      }
    }
    ctx.strokeStyle = '#182d25'; ctx.lineWidth = 28; ctx.strokeRect(0, 0, ARENA_W, ARENA_H)
    ctx.strokeStyle = '#79915c'; ctx.lineWidth = 3; ctx.setLineDash([18, 14]); ctx.strokeRect(19, 19, ARENA_W - 38, ARENA_H - 38); ctx.setLineDash([])
  }

  private drawFeather(x: number, y: number, phase: number) {
    const ctx = this.ctx
    ctx.save(); ctx.translate(x, y + Math.sin(phase) * 3); ctx.rotate(-0.55 + Math.sin(phase * 0.7) * 0.15)
    ctx.fillStyle = 'rgba(10,20,16,.22)'; ctx.beginPath(); ctx.ellipse(2, 8, 9, 4, 0, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#f5dc72'; ctx.strokeStyle = '#554d2e'; ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(-2, 9); ctx.quadraticCurveTo(-13, -4, 2, -12); ctx.quadraticCurveTo(13, -4, -2, 9); ctx.fill(); ctx.stroke()
    ctx.strokeStyle = '#8f7837'; ctx.beginPath(); ctx.moveTo(-4, 11); ctx.lineTo(4, -8); ctx.stroke(); ctx.restore()
  }

  private drawEnemy(e: Enemy) {
    const ctx = this.ctx, def = ENEMIES[e.kind]
    const scale = e.r / 20
    const bob = Math.sin(e.phase) * (e.kind === 'boss' ? 2 : 1.5)
    ctx.save(); ctx.translate(e.x, e.y + bob)
    if (e.kind === 'boss' && (e.state === 1 || e.state === 2 || e.state === 3 || e.state === 4)) {
      const pulse = 0.45 + Math.sin(e.stateTime * 24) * 0.15
      ctx.strokeStyle = `rgba(255,105,73,${pulse})`; ctx.lineWidth = 6
      ctx.beginPath(); ctx.arc(0, 0, e.r + 24 + (0.7 - e.stateTime) * 22, 0, Math.PI * 2); ctx.stroke()
    }
    if (e.kind === 'bomber' && e.state === 1) {
      ctx.fillStyle = `rgba(255,100,54,${0.1 + Math.sin(e.stateTime * 28) * 0.08})`
      ctx.beginPath(); ctx.arc(0, 0, 125, 0, Math.PI * 2); ctx.fill()
      ctx.strokeStyle = '#ffad54'; ctx.lineWidth = 3; ctx.setLineDash([8, 8]); ctx.stroke(); ctx.setLineDash([])
    }
    ctx.fillStyle = 'rgba(10,20,16,.27)'; ctx.beginPath(); ctx.ellipse(0, e.r * 0.78, e.r * 0.9, e.r * 0.34, 0, 0, Math.PI * 2); ctx.fill()
    ctx.scale(scale, scale)
    const facingLeft = Math.cos(e.angle) < 0
    if (facingLeft) ctx.scale(-1, 1)
    const flash = e.hitFlash > 0
    // feet
    ctx.strokeStyle = '#7c512c'; ctx.lineWidth = 3; ctx.lineCap = 'round'
    const step = Math.sin(e.phase * 1.7) * 3
    ctx.beginPath(); ctx.moveTo(-7, 13); ctx.lineTo(-9 + step, 19); ctx.moveTo(7, 13); ctx.lineTo(9 - step, 19); ctx.stroke()
    // body and wing
    ctx.fillStyle = flash ? '#fff8df' : def.color; ctx.strokeStyle = '#26372e'; ctx.lineWidth = e.kind === 'boss' ? 3.2 : 2.6
    ctx.beginPath(); ctx.ellipse(-2, 2, 18, 15, -0.12, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
    ctx.fillStyle = flash ? '#fff8df' : this.shade(def.color, -15)
    ctx.beginPath(); ctx.ellipse(-8, 4, 10, 7, -0.45, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
    // head
    ctx.fillStyle = flash ? '#fff8df' : def.color
    ctx.beginPath(); ctx.arc(10, -10, 11.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
    // beak
    ctx.fillStyle = '#ed9b3c'; ctx.beginPath(); ctx.moveTo(18, -10); ctx.lineTo(31, -6); ctx.lineTo(18, -3); ctx.closePath(); ctx.fill(); ctx.stroke()
    // angry eye + brow
    ctx.fillStyle = '#1a2621'; ctx.beginPath(); ctx.arc(13, -13, 2.2, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = '#1a2621'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(7, -18); ctx.lineTo(16, -15); ctx.stroke()
    if (e.kind === 'helmet') {
      ctx.fillStyle = '#778987'; ctx.strokeStyle = '#293b38'; ctx.lineWidth = 2.5
      ctx.beginPath(); ctx.arc(9, -14, 13, Math.PI, Math.PI * 2); ctx.lineTo(23, -11); ctx.lineTo(-4, -11); ctx.closePath(); ctx.fill(); ctx.stroke()
      ctx.fillStyle = '#aebdb5'; ctx.fillRect(6, -26, 4, 11)
    }
    if (e.kind === 'shooter') {
      ctx.strokeStyle = '#382d40'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(1, 1); ctx.lineTo(22, 5); ctx.stroke()
      ctx.strokeStyle = '#b8c2b4'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(19, 5); ctx.lineTo(29, 5); ctx.stroke()
    }
    if (e.kind === 'bomber') {
      ctx.fillStyle = '#b84e36'; ctx.fillRect(-14, -2, 20, 13)
      ctx.fillStyle = e.state === 1 && Math.sin(e.stateTime * 35) > 0 ? '#fff078' : '#ff553d'
      ctx.beginPath(); ctx.arc(-4, 3, 3.5, 0, Math.PI * 2); ctx.fill()
    }
    if (e.elite && e.kind !== 'boss') this.drawCrown(6, -28, 0.75)
    if (e.kind === 'boss') {
      this.drawCrown(4, -30, 1.2)
      ctx.fillStyle = '#782f29'; ctx.beginPath(); ctx.moveTo(-21, -1); ctx.lineTo(-34, -12); ctx.lineTo(-29, 8); ctx.closePath(); ctx.fill(); ctx.stroke()
    }
    ctx.restore()
    if (e.hp < e.maxHp && e.kind !== 'boss') {
      const width = e.r * 1.8
      ctx.fillStyle = 'rgba(15,25,20,.72)'; ctx.fillRect(e.x - width / 2, e.y - e.r - 17, width, 4)
      ctx.fillStyle = e.elite ? '#f1cb53' : '#cfdf9b'; ctx.fillRect(e.x - width / 2, e.y - e.r - 17, width * Math.max(0, e.hp / e.maxHp), 4)
    }
  }

  private drawCrown(x: number, y: number, scale: number) {
    const ctx = this.ctx
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale)
    ctx.fillStyle = '#f6d44f'; ctx.strokeStyle = '#5c4c24'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(-11, 7); ctx.lineTo(-13, -7); ctx.lineTo(-5, -1); ctx.lineTo(0, -11); ctx.lineTo(5, -1); ctx.lineTo(13, -7); ctx.lineTo(11, 7); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore()
  }

  private drawCat() {
    const ctx = this.ctx, g = this.game, p = g.player
    ctx.save(); ctx.translate(p.x, p.y)
    if (p.invulnerable > 0 && Math.floor(p.invulnerable * 14) % 2 === 0) ctx.globalAlpha = 0.48
    ctx.fillStyle = 'rgba(8,17,14,.34)'; ctx.beginPath(); ctx.ellipse(0, 19, 25, 9, 0, 0, Math.PI * 2); ctx.fill()
    // tail
    ctx.strokeStyle = '#151e1c'; ctx.lineWidth = 10; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(-17, 8); ctx.bezierCurveTo(-40, 12, -37, -19, -24, -17 + Math.sin(p.walk) * 5); ctx.stroke()
    const bounce = Math.sin(p.walk * 2) * 1.5
    ctx.translate(0, bounce)
    // body
    ctx.fillStyle = '#1c2724'; ctx.strokeStyle = '#0f1715'; ctx.lineWidth = 3
    ctx.beginPath(); ctx.ellipse(0, 6, 21, 22, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
    // ears
    ctx.beginPath(); ctx.moveTo(-19, -13); ctx.lineTo(-16, -33); ctx.lineTo(-4, -20); ctx.moveTo(19, -13); ctx.lineTo(16, -33); ctx.lineTo(4, -20); ctx.fill(); ctx.stroke()
    ctx.fillStyle = '#805d60'; ctx.beginPath(); ctx.moveTo(-15, -20); ctx.lineTo(-14, -28); ctx.lineTo(-8, -21); ctx.moveTo(15, -20); ctx.lineTo(14, -28); ctx.lineTo(8, -21); ctx.fill()
    // head
    ctx.fillStyle = '#202c29'; ctx.beginPath(); ctx.ellipse(0, -9, 22, 19, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
    // muzzle
    ctx.fillStyle = '#37423d'; ctx.beginPath(); ctx.ellipse(0, -2, 10, 6, 0, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#b07875'; ctx.beginPath(); ctx.moveTo(-3, -6); ctx.lineTo(3, -6); ctx.lineTo(0, -2); ctx.closePath(); ctx.fill()
    // eyes
    ctx.fillStyle = '#d5e86a'; ctx.beginPath(); ctx.ellipse(-8, -12, 5, 3.4, 0.12, 0, Math.PI * 2); ctx.ellipse(8, -12, 5, 3.4, -0.12, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#14201b'; ctx.fillRect(-8.7, -15, 1.8, 6); ctx.fillRect(6.9, -15, 1.8, 6)
    ctx.strokeStyle = '#0e1614'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-15, -19); ctx.lineTo(-4, -15); ctx.moveTo(15, -19); ctx.lineTo(4, -15); ctx.stroke()
    ctx.restore()
    const scratcher = g.weapons.find(w => w.id === 'scratcher')
    if (scratcher) {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(g.run.elapsed * 5)
      ctx.strokeStyle = 'rgba(224,197,139,.5)'; ctx.lineWidth = 3; ctx.setLineDash([14, 12]); ctx.beginPath(); ctx.arc(0, 0, 118 * g.player.stats.attackSize, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([])
      for (let i = 0; i < 3; i++) { ctx.rotate(Math.PI * 2 / 3); ctx.fillStyle = '#c9a36d'; ctx.fillRect(103, -5, 25, 10) }
      ctx.restore()
    }
  }

  private drawWeapons() {
    const ctx = this.ctx, g = this.game, player = g.player
    // Every drawn item is the actual WeaponState used by the combat system.
    g.weapons.slice(0, 6).forEach((weapon, index) => {
      const def = WEAPONS[weapon.id], slot = WEAPON_SLOTS[index]
      const melee = weapon.id === 'claws' || weapon.id === 'bat' || weapon.id === 'shovel'
      const maxFlash = weapon.id === 'shovel' ? 0.38 : melee ? 0.26 : weapon.id === 'shotgun' ? 0.2 : 0.11
      const progress = weapon.flash > 0 ? 1 - weapon.flash / maxFlash : 1
      if (melee && weapon.flash > 0) {
        const arc = weapon.id === 'shovel' ? 1.3 : weapon.id === 'bat' ? 1 : 0.85
        const start = weapon.angle - arc, end = start + arc * 2 * Math.min(1, progress)
        ctx.save(); ctx.globalAlpha = Math.sin(progress * Math.PI) * 0.75
        ctx.strokeStyle = def.color; ctx.lineWidth = weapon.id === 'shovel' ? 12 : 8; ctx.lineCap = 'round'
        ctx.beginPath(); ctx.arc(player.x, player.y, def.range * g.player.stats.attackSize * 0.82, start, end); ctx.stroke()
        ctx.globalAlpha *= 0.45; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(player.x, player.y, def.range * g.player.stats.attackSize, start, end); ctx.stroke(); ctx.restore()
      }
      const recoil = weapon.flash > 0 && !melee ? Math.sin(progress * Math.PI) * (weapon.id === 'shotgun' ? 11 : 4) : 0
      const swing = melee && weapon.flash > 0 ? (progress - 0.5) * (weapon.id === 'shovel' ? 2.2 : 1.7) : 0
      const bob = Math.sin(g.run.elapsed * 3 + index * 1.7) * 1.4
      ctx.save()
      ctx.translate(player.x + slot.x - Math.cos(weapon.angle) * recoil, player.y + slot.y + bob - Math.sin(weapon.angle) * recoil)
      ctx.rotate(weapon.angle + swing)
      ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = '#17231e'; ctx.lineWidth = 2.5
      this.drawWeaponShape(weapon.id, def.color)
      if (weapon.flash > 0 && !melee && !['sardine', 'yarn', 'scratcher'].includes(weapon.id)) {
        ctx.globalAlpha = Math.sin(progress * Math.PI)
        ctx.fillStyle = '#ffe795'; ctx.beginPath(); ctx.moveTo(30, 0); ctx.lineTo(42, -7); ctx.lineTo(39, 0); ctx.lineTo(42, 7); ctx.closePath(); ctx.fill()
      }
      ctx.restore()
    })
  }

  private drawWeaponShape(id: GameEngine['weapons'][number]['id'], color: string) {
    const ctx = this.ctx
    if (id === 'pistol') {
      ctx.fillStyle = '#9caaa0'; ctx.fillRect(-12, -5, 31, 10); ctx.strokeRect(-12, -5, 31, 10)
      ctx.fillStyle = '#526158'; ctx.fillRect(-4, 4, 9, 13); ctx.strokeRect(-4, 4, 9, 13)
      ctx.fillStyle = '#d5ded3'; ctx.fillRect(12, -2, 10, 3)
    } else if (id === 'shotgun') {
      ctx.fillStyle = '#7c5336'; ctx.fillRect(-22, -5, 18, 11); ctx.strokeRect(-22, -5, 18, 11)
      ctx.fillStyle = '#7f9187'; ctx.fillRect(-6, -6, 39, 12); ctx.strokeRect(-6, -6, 39, 12)
      ctx.strokeStyle = '#d3dbcf'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(4, -2); ctx.lineTo(34, -2); ctx.moveTo(4, 3); ctx.lineTo(34, 3); ctx.stroke()
    } else if (id === 'rifle') {
      ctx.fillStyle = '#63766a'; ctx.fillRect(-19, -5, 47, 10); ctx.strokeRect(-19, -5, 47, 10)
      ctx.fillStyle = '#303f37'; ctx.fillRect(-3, 4, 10, 13); ctx.strokeRect(-3, 4, 10, 13)
      ctx.fillRect(18, -2, 18, 4); ctx.strokeRect(18, -2, 18, 4)
      ctx.fillStyle = '#a6b7a9'; ctx.fillRect(-6, -10, 15, 4)
    } else if (id === 'claws') {
      ctx.strokeStyle = '#dce5d7'; ctx.lineWidth = 4
      for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(-12, i * 7); ctx.quadraticCurveTo(6, i * 9 - 3, 20, i * 7); ctx.stroke() }
    } else if (id === 'bat') {
      ctx.strokeStyle = '#503c2a'; ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(-20, 0); ctx.lineTo(20, 0); ctx.stroke()
      ctx.strokeStyle = color; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-19, 0); ctx.lineTo(19, 0); ctx.stroke()
      ctx.strokeStyle = '#e0c495'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(20, 0); ctx.stroke()
    } else if (id === 'shovel') {
      ctx.strokeStyle = '#70543a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-24, 0); ctx.lineTo(15, 0); ctx.stroke()
      ctx.fillStyle = color; ctx.strokeStyle = '#26352e'; ctx.lineWidth = 2.5
      ctx.beginPath(); ctx.moveTo(12, -9); ctx.lineTo(28, -7); ctx.lineTo(32, 0); ctx.lineTo(28, 7); ctx.lineTo(12, 9); ctx.closePath(); ctx.fill(); ctx.stroke()
      ctx.strokeStyle = '#aeb9af'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-25, -6); ctx.lineTo(-25, 6); ctx.stroke()
    } else if (id === 'laser') {
      ctx.fillStyle = '#485b50'; ctx.fillRect(-17, -6, 32, 12); ctx.strokeRect(-17, -6, 32, 12)
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(16, 0, 5, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#b7c5b8'; ctx.fillRect(-7, -3, 9, 3)
    } else if (id === 'sardine') {
      ctx.fillStyle = color; ctx.fillRect(-13, -9, 26, 18); ctx.strokeRect(-13, -9, 26, 18)
      ctx.fillStyle = '#e0e6d7'; ctx.fillRect(-9, -4, 18, 3); ctx.beginPath(); ctx.arc(7, 4, 2, 0, Math.PI * 2); ctx.fill()
    } else if (id === 'yarn') {
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
      ctx.strokeStyle = '#6d4058'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 1.6); ctx.moveTo(-10, -3); ctx.lineTo(10, 4); ctx.stroke()
    } else if (id === 'scratcher') {
      ctx.fillStyle = '#806445'; ctx.fillRect(-15, -7, 30, 14); ctx.strokeRect(-15, -7, 30, 14)
      ctx.strokeStyle = color; ctx.lineWidth = 3; for (let x = -10; x <= 10; x += 5) { ctx.beginPath(); ctx.moveTo(x, -6); ctx.lineTo(x, 6); ctx.stroke() }
    }
  }

  private drawProjectile(p: GameEngine['projectiles'][number]) {
    const ctx = this.ctx
    if (p.kind === 'laser') {
      ctx.strokeStyle = p.color; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.globalAlpha = 0.85
      ctx.beginPath(); ctx.moveTo(p.px - p.vx * 0.02, p.py - p.vy * 0.02); ctx.lineTo(p.x, p.y); ctx.stroke(); ctx.globalAlpha = 1
      ctx.strokeStyle = '#ffd2bd'; ctx.lineWidth = 1.5; ctx.stroke()
    } else if (p.kind === 'sardine') {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.atan2(p.vy, p.vx) + p.life * 8)
      ctx.fillStyle = '#7fc6d9'; ctx.strokeStyle = '#29434a'; ctx.lineWidth = 2; ctx.fillRect(-10, -7, 20, 14); ctx.strokeRect(-10, -7, 20, 14)
      ctx.fillStyle = '#d5e3d4'; ctx.fillRect(-7, -4, 14, 2); ctx.restore()
    } else if (p.kind === 'yarn') {
      ctx.fillStyle = p.color; ctx.strokeStyle = '#5c354c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 0.55, 0, Math.PI * 1.5); ctx.stroke()
    } else if (p.team === 'enemy') {
      ctx.fillStyle = 'rgba(244,119,91,.18)'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 5, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = p.color; ctx.strokeStyle = '#633b35'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
    } else {
      ctx.strokeStyle = p.color; ctx.lineWidth = p.r * 1.3; ctx.lineCap = 'round'
      ctx.beginPath(); ctx.moveTo(p.px, p.py); ctx.lineTo(p.x, p.y); ctx.stroke()
    }
  }

  private drawParticle(p: GameEngine['particles'][number]) {
    const ctx = this.ctx, alpha = Math.max(0, p.life / p.maxLife)
    ctx.globalAlpha = alpha
    if (p.text) {
      ctx.font = `900 ${p.size}px "Arial Narrow", sans-serif`; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(21,31,26,.75)'; ctx.strokeText(p.text, p.x, p.y); ctx.fillStyle = p.color; ctx.fillText(p.text, p.x, p.y)
    } else {
      ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2); ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  private shade(hex: string, amount: number) {
    const value = parseInt(hex.slice(1), 16)
    const r = Math.max(0, Math.min(255, (value >> 16) + amount)), g = Math.max(0, Math.min(255, ((value >> 8) & 255) + amount)), b = Math.max(0, Math.min(255, (value & 255) + amount))
    return `rgb(${r},${g},${b})`
  }
}
