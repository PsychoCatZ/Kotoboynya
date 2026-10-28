import type { WeaponId } from '../types'

export interface WeaponDef {
  name: string; description: string; damage: number; cooldown: number
  range: number; price: number; color: string; icon: string
}

export const WEAPONS: Record<WeaponId, WeaponDef> = {
  pistol: { name: 'Пистолет', description: 'Точные одиночные выстрелы. Надёжно и без лишнего крику.', damage: 24, cooldown: 0.55, range: 540, price: 24, color: '#f5d76e', icon: 'pistol' },
  claws: { name: 'Когти', description: 'Быстрый веерный удар вблизи. Личное пространство закрыто.', damage: 12, cooldown: 0.48, range: 105, price: 28, color: '#e8f1db', icon: 'claws' },
  shotgun: { name: 'Дробовик', description: 'Пять дробин по широкой дуге. Для особо настойчивой толпы.', damage: 9, cooldown: 1.22, range: 330, price: 48, color: '#e4a65f', icon: 'shotgun' },
  rifle: { name: 'Автомат', description: 'Высокая скорострельность и лёгкий разброс. Много маленьких аргументов.', damage: 8, cooldown: 0.17, range: 470, price: 55, color: '#a5d99b', icon: 'rifle' },
  laser: { name: 'Лазерная указка', description: 'Мгновенный луч, пробивающий несколько целей. Теперь она на нашей стороне.', damage: 26, cooldown: 1.05, range: 650, price: 70, color: '#fa5b55', icon: 'laser' },
  sardine: { name: 'Банка шпрот', description: 'Взрывается по площади. Пахнет победой и рыбным днём.', damage: 34, cooldown: 1.75, range: 450, price: 62, color: '#7fc6d9', icon: 'sardine' },
  yarn: { name: 'Клубок смерти', description: 'Рикошетит между утками. Вязание перестало быть мирным хобби.', damage: 18, cooldown: 1.1, range: 460, price: 58, color: '#d88bb4', icon: 'yarn' },
  scratcher: { name: 'Когтеточка 3000', description: 'Вращающиеся когти непрерывно повреждают всё вокруг кота.', damage: 7, cooldown: 0.22, range: 128, price: 76, color: '#c9a36d', icon: 'scratcher' },
  bat: { name: 'Бейсбольная бита', description: 'Быстрый дуговой удар с сильным отбрасыванием. Спортивный ответ на кряканье.', damage: 27, cooldown: 0.82, range: 132, price: 46, color: '#d8b078', icon: 'bat' },
  shovel: { name: 'Лопата', description: 'Медленный тяжёлый взмах по широкой области. Закапывает любые разногласия.', damage: 46, cooldown: 1.48, range: 158, price: 64, color: '#a8b7ad', icon: 'shovel' },
}

export const WEAPON_SLOTS = [
  { x: 40, y: -16 }, { x: -40, y: -16 }, { x: 52, y: 20 },
  { x: -52, y: 20 }, { x: 30, y: -50 }, { x: -30, y: -50 },
]

export const RARITY_NAMES = ['Обычное', 'Хорошее', 'Редкое', 'Эпическое']
export const RARITY_COLORS = ['#a7b2aa', '#73c893', '#70aee8', '#c18be0']
export const weaponMultiplier = (level: number) => 1 + (level - 1) * 0.42
