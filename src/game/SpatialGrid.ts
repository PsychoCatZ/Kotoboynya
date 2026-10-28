import type { Enemy } from './types'

export class SpatialGrid {
  private cells = new Map<number, Enemy[]>()
  private used: Enemy[][] = []
  private size: number
  constructor(size = 100) { this.size = size }

  clear() {
    for (const cell of this.used) cell.length = 0
    this.used.length = 0
  }
  private key(x: number, y: number) { return (Math.floor(x / this.size) + 128) * 1024 + Math.floor(y / this.size) + 128 }
  insert(enemy: Enemy) {
    const key = this.key(enemy.x, enemy.y)
    let cell = this.cells.get(key)
    if (!cell) { cell = []; this.cells.set(key, cell) }
    if (cell.length === 0) this.used.push(cell)
    cell.push(enemy)
  }
  forNearby(x: number, y: number, radius: number, fn: (enemy: Enemy) => void) {
    const minX = Math.floor((x - radius) / this.size), maxX = Math.floor((x + radius) / this.size)
    const minY = Math.floor((y - radius) / this.size), maxY = Math.floor((y + radius) / this.size)
    for (let cx = minX; cx <= maxX; cx++) for (let cy = minY; cy <= maxY; cy++) {
      const cell = this.cells.get((cx + 128) * 1024 + cy + 128)
      if (cell) for (let i = 0; i < cell.length; i++) fn(cell[i])
    }
  }
}
