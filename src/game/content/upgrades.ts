import type { Player, Rarity } from '../types'

export interface UpgradeDef {
  id: string
  name: string
  description: string
  rarity: Rarity
  weight: number
  apply: (player: Player) => void
}

export interface UpgradeOffer {
  key: string
  id: string
  name: string
  description: string
  rarity: Rarity
}

export const UPGRADES: UpgradeDef[] = [
  { id: 'damage', name: 'Острые аргументы', description: '+10% ко всему наносимому урону.', rarity: 'common', weight: 100, apply: p => { p.stats.damage *= 1.1 } },
  { id: 'attackSpeed', name: 'Дёрганый хвост', description: '+10% к скорости атаки всего оружия.', rarity: 'common', weight: 100, apply: p => { p.stats.attackSpeed *= 1.1 } },
  { id: 'moveSpeed', name: 'Мокрые пятки', description: '+5% к скорости передвижения.', rarity: 'common', weight: 90, apply: p => { p.stats.speed *= 1.05 } },
  { id: 'maxHp', name: 'Рыбный запас', description: '+10 максимального HP и сразу +10 HP.', rarity: 'common', weight: 90, apply: p => { p.stats.maxHp += 10; p.hp = Math.min(p.stats.maxHp, p.hp + 10) } },
  { id: 'heal', name: 'Передышка', description: 'Восстановить 30% максимального HP.', rarity: 'common', weight: 75, apply: p => { p.hp = Math.min(p.stats.maxHp, p.hp + p.stats.maxHp * 0.3) } },
  { id: 'crit', name: 'Красная точка', description: '+5% к шансу критического удара.', rarity: 'common', weight: 85, apply: p => { p.stats.crit += 0.05 } },
  { id: 'armor', name: 'Плотная шерсть', description: '+1 броня. Каждая единица снижает получаемый урон.', rarity: 'common', weight: 85, apply: p => { p.stats.armor += 1 } },
  { id: 'pickup', name: 'Магнитная личность', description: '+10% к радиусу притяжения перьев.', rarity: 'common', weight: 80, apply: p => { p.stats.pickup *= 1.1 } },
  { id: 'dodge', name: 'Не сегодня', description: '+5% к шансу уклонения.', rarity: 'good', weight: 55, apply: p => { p.stats.dodge = Math.min(0.6, p.stats.dodge + 0.05) } },
  { id: 'projectile', name: 'Лишний аргумент', description: '+1 снаряд для метательного и огнестрельного оружия.', rarity: 'rare', weight: 28, apply: p => { p.stats.projectiles += 1 } },
  { id: 'projectileSpeed', name: 'Быстрые лапы', description: '+10% к скорости снарядов.', rarity: 'good', weight: 60, apply: p => { p.stats.projectileSpeed *= 1.1 } },
  { id: 'attackSize', name: 'Шире размах', description: '+10% к размеру снарядов и радиусу атак.', rarity: 'good', weight: 60, apply: p => { p.stats.attackSize *= 1.1 } },
  { id: 'xp', name: 'Опытный кошак', description: '+10% к опыту, получаемому от врагов.', rarity: 'good', weight: 55, apply: p => { p.stats.xpGain *= 1.1 } },
  { id: 'regen', name: 'Мурчание', description: '+0.35 восстановления HP в секунду.', rarity: 'rare', weight: 30, apply: p => { p.stats.regen += 0.35 } },
  { id: 'glassCannon', name: 'Кошачья наглость', description: '+25% урона, но −5 максимального HP.', rarity: 'epic', weight: 12, apply: p => { p.stats.damage *= 1.25; p.stats.maxHp = Math.max(20, p.stats.maxHp - 5); p.hp = Math.min(p.hp, p.stats.maxHp) } },
]

export function rollUpgrades(level: number, count = 3): UpgradeOffer[] {
  const result: UpgradeOffer[] = []
  const available = [...UPGRADES]
  while (result.length < count && available.length) {
    let total = 0
    for (const upgrade of available) total += upgrade.weight
    let roll = Math.random() * total
    let selected = available[0]
    let index = 0
    for (let i = 0; i < available.length; i++) {
      roll -= available[i].weight
      if (roll <= 0) { selected = available[i]; index = i; break }
    }
    available.splice(index, 1)
    result.push({ key: `${level}-${result.length}-${selected.id}`, id: selected.id, name: selected.name, description: selected.description, rarity: selected.rarity })
  }
  return result
}
