import type { ItemId, Stats } from '../types'

export interface ItemDef {
  name: string; description: string; price: number
  apply: (stats: Stats) => void
}

export const ITEMS: Record<ItemId, ItemDef> = {
  fish: { name: 'Рыбный паёк', description: '+20 макс. HP и немного достоинства.', price: 35, apply: s => { s.maxHp += 20 } },
  box: { name: 'Картонная коробка', description: '+4 брони, −8% скорости. Тактическое укрепление.', price: 42, apply: s => { s.armor += 4; s.speed *= 0.92 } },
  catnip: { name: 'Кошачья мята', description: '+12% скорости, +5% уклонения.', price: 45, apply: s => { s.speed *= 1.12; s.dodge += 0.05 } },
  slipper: { name: 'Тапок хозяина', description: '+18% урона. Почему — не объяснять.', price: 52, apply: s => { s.damage *= 1.18 } },
  vacuum: { name: 'Пылесос', description: '+90 радиуса подбора. Перья сами принимают решение.', price: 38, apply: s => { s.pickup += 90 } },
  laserDot: { name: 'Красная точка', description: '+10% шанса критического удара.', price: 48, apply: s => { s.crit += 0.1 } },
  valerian: { name: 'Валерьянка', description: '+22% скорости атаки, +5 получаемого урона в виде −2 брони.', price: 46, apply: s => { s.attackSpeed *= 1.22; s.armor -= 2 } },
  ninthLife: { name: 'Девятая жизнь', description: 'Один раз пережить смертельный удар и восстановить 35 HP.', price: 110, apply: () => {} },
}

export const BASE_STATS: Stats = {
  maxHp: 100, damage: 1, attackSpeed: 1, speed: 250,
  armor: 0, crit: 0.05, pickup: 115, dodge: 0, regen: 0.25,
  projectiles: 0, projectileSpeed: 1, attackSize: 1, xpGain: 1,
}
