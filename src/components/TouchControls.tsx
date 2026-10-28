import { useEffect, useRef, useState } from 'react'

interface Props {
  onVector: (x: number, y: number) => void
}

const MAX_OFFSET = 42

export function TouchControls({ onVector }: Props) {
  const baseRef = useRef<HTMLDivElement>(null)
  const pointerId = useRef<number | null>(null)
  const onVectorRef = useRef(onVector)
  const [knob, setKnob] = useState({ x: 0, y: 0 })
  const [active, setActive] = useState(false)
  useEffect(() => { onVectorRef.current = onVector }, [onVector])

  const reset = () => {
    pointerId.current = null
    setKnob({ x: 0, y: 0 })
    setActive(false)
    onVectorRef.current(0, 0)
  }

  const update = (clientX: number, clientY: number) => {
    const rect = baseRef.current?.getBoundingClientRect()
    if (!rect) return
    const dx = clientX - (rect.left + rect.width / 2)
    const dy = clientY - (rect.top + rect.height / 2)
    const maxOffset = rect.width * (MAX_OFFSET / 124)
    const length = Math.hypot(dx, dy)
    const scale = length > maxOffset ? maxOffset / length : 1
    const x = dx * scale
    const y = dy * scale
    setKnob({ x, y })
    onVectorRef.current(x / maxOffset, y / maxOffset)
  }

  useEffect(() => () => onVectorRef.current(0, 0), [])

  return <div className={`touch-controls ${active ? 'active' : ''}`} aria-label="Сенсорное управление движением">
    <div
      ref={baseRef}
      className="touch-joystick"
      onPointerDown={event => {
        if (pointerId.current !== null) return
        event.preventDefault()
        pointerId.current = event.pointerId
        event.currentTarget.setPointerCapture(event.pointerId)
        setActive(true)
        update(event.clientX, event.clientY)
      }}
      onPointerMove={event => {
        if (event.pointerId !== pointerId.current) return
        event.preventDefault()
        update(event.clientX, event.clientY)
      }}
      onPointerUp={event => { if (event.pointerId === pointerId.current) reset() }}
      onPointerCancel={event => { if (event.pointerId === pointerId.current) reset() }}
      onLostPointerCapture={event => { if (event.pointerId === pointerId.current) reset() }}
    >
      <span className="touch-cross" aria-hidden="true" />
      <span className="touch-knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} aria-hidden="true" />
    </div>
    <span className="touch-caption">ДВИЖЕНИЕ</span>
  </div>
}
