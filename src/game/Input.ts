export class Input {
  private keys = new Set<string>()
  private pointerId: number | null = null
  private originX = 0
  private originY = 0
  touchX = 0
  touchY = 0
  onPause?: () => void

  private canvas: HTMLCanvasElement
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    window.addEventListener('keydown', this.keyDown)
    window.addEventListener('keyup', this.keyUp)
    window.addEventListener('blur', this.blur)
    canvas.addEventListener('pointerdown', this.pointerDown)
    canvas.addEventListener('pointermove', this.pointerMove)
    canvas.addEventListener('pointerup', this.pointerUp)
    canvas.addEventListener('pointercancel', this.pointerUp)
  }

  private keyDown = (e: KeyboardEvent) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault()
    if (e.code === 'Escape' && !e.repeat) this.onPause?.()
    this.keys.add(e.code)
  }
  private keyUp = (e: KeyboardEvent) => this.keys.delete(e.code)
  private blur = () => { this.keys.clear(); this.resetTouch() }
  private pointerDown = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' || this.pointerId !== null) return
    e.preventDefault()
    this.pointerId = e.pointerId
    const rect = this.canvas.getBoundingClientRect()
    this.originX = e.clientX - rect.left
    this.originY = e.clientY - rect.top
    this.canvas.setPointerCapture(e.pointerId)
  }
  private pointerMove = (e: PointerEvent) => {
    if (e.pointerId !== this.pointerId) return
    const rect = this.canvas.getBoundingClientRect()
    const dx = e.clientX - rect.left - this.originX
    const dy = e.clientY - rect.top - this.originY
    const len = Math.hypot(dx, dy) || 1
    const amount = Math.min(1, len / 45)
    this.touchX = dx / len * amount
    this.touchY = dy / len * amount
  }
  private pointerUp = (e: PointerEvent) => { if (e.pointerId === this.pointerId) this.resetTouch() }
  private resetTouch() { this.pointerId = null; this.touchX = 0; this.touchY = 0 }

  setTouchVector(x: number, y: number) {
    const length = Math.hypot(x, y)
    const scale = length > 1 ? 1 / length : 1
    this.touchX = x * scale
    this.touchY = y * scale
  }

  axis() {
    let x = this.touchX, y = this.touchY
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) y -= 1
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) y += 1
    const len = Math.hypot(x, y)
    return len > 1 ? { x: x / len, y: y / len } : { x, y }
  }

  destroy() {
    window.removeEventListener('keydown', this.keyDown)
    window.removeEventListener('keyup', this.keyUp)
    window.removeEventListener('blur', this.blur)
    this.canvas.removeEventListener('pointerdown', this.pointerDown)
    this.canvas.removeEventListener('pointermove', this.pointerMove)
    this.canvas.removeEventListener('pointerup', this.pointerUp)
    this.canvas.removeEventListener('pointercancel', this.pointerUp)
  }
}
