import type { EnemyKind } from '../types'

export interface EnemyDef {
  hp: number; speed: number; damage: number; radius: number
  reward: number; xp: number; armor: number; color: string
  name: string; description: string
}

export const ENEMIES: Record<EnemyKind, EnemyDef> = {
  normal: { hp: 24, speed: 82, damage: 8, radius: 19, reward: 2, xp: 3, armor: 0, color: '#e9efcf', name: 'Обычная утка', description: 'Просто прёт. У неё нет плана.' },
  fast: { hp: 15, speed: 148, damage: 6, radius: 14, reward: 2, xp: 3, armor: 0, color: '#e8d957', name: 'Быстрая утка', description: 'Маленькая. Злая. Очень торопится.' },
  fat: { hp: 100, speed: 47, damage: 15, radius: 29, reward: 6, xp: 8, armor: 1, color: '#a7b968', name: 'Жирная утка', description: 'Массовая проблема в прямом смысле.' },
  helmet: { hp: 62, speed: 67, damage: 11, radius: 21, reward: 5, xp: 6, armor: 5, color: '#d7dfc6', name: 'Утка в каске', description: 'Начала понимать ситуацию.' },
  shooter: { hp: 42, speed: 70, damage: 9, radius: 20, reward: 5, xp: 7, armor: 0, color: '#b9a5d9', name: 'Утка-стрелок', description: 'Держит дистанцию и злобу.' },
  bomber: { hp: 35, speed: 105, damage: 24, radius: 20, reward: 5, xp: 7, armor: 0, color: '#e5a34f', name: 'Утка-камикадзе', description: 'Красная лампочка — это не украшение.' },
  elite: { hp: 240, speed: 88, damage: 18, radius: 27, reward: 18, xp: 20, armor: 3, color: '#f3c84b', name: 'Элитная утка', description: 'Кря золотого запаса.' },
  boss: { hp: 4200, speed: 62, damage: 24, radius: 72, reward: 250, xp: 100, armor: 4, color: '#dd684c', name: 'МЕГАУТКА', description: 'Дипломатия окончательно провалилась.' },
}

export function pickEnemy(wave: number, random: number): EnemyKind {
  const pool: EnemyKind[] = ['normal', 'normal', 'normal']
  if (wave >= 2) pool.push('fast', 'fast')
  if (wave >= 4) pool.push('fat')
  if (wave >= 6) pool.push('helmet')
  if (wave >= 8) pool.push('shooter', 'shooter')
  if (wave >= 10) pool.push('bomber')
  if (wave >= 12) pool.push('fast', 'fat', 'helmet', 'shooter')
  return pool[Math.floor(random * pool.length)]
}

export function waveDuration(wave: number) {
  if (wave === 20) return 90
  return Math.min(34, 19 + wave * 0.65)
}

export function spawnInterval(wave: number) {
  return Math.max(0.085, 0.62 - wave * 0.024)
}

export function enemyCap(wave: number) {
  return Math.min(190, 48 + wave * 7)
}
