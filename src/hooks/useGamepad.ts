/**
 * Manette via l'API Gamepad : stick gauche, croix directionnelle, A, B.
 * Répétition automatique façon console : 380 ms puis 130 ms.
 */

import { useEffect, useRef } from 'react'

export interface GamepadActions {
  left(): void
  right(): void
  up(): void
  down(): void
  confirm(): void
  cancel(): void
}

const DEAD_ZONE = 0.45
const REPEAT_FIRST = 380
const REPEAT_NEXT = 130

// Disposition standard : 0 = A, 1 = B, 12..15 = croix directionnelle.
const BTN = { A: 0, B: 1, UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15 }

export function useGamepad(actions: GamepadActions, active = true) {
  const ref = useRef(actions)
  ref.current = actions

  useEffect(() => {
    if (!active) return
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return

    let raf = 0
    const held = new Map<string, number>() // touche → prochain déclenchement

    const edge = (key: string, down: boolean, fire: () => void) => {
      const now = performance.now()
      if (!down) {
        held.delete(key)
        return
      }
      const next = held.get(key)
      if (next === undefined) {
        held.set(key, now + REPEAT_FIRST)
        fire()
      } else if (now >= next) {
        held.set(key, now + REPEAT_NEXT)
        fire()
      }
    }

    const tick = () => {
      const pads = navigator.getGamepads?.() ?? []
      for (const pad of pads) {
        if (!pad) continue
        const ax = pad.axes[0] ?? 0
        const ay = pad.axes[1] ?? 0
        const b = pad.buttons

        edge('left', ax < -DEAD_ZONE || !!b[BTN.LEFT]?.pressed, () => ref.current.left())
        edge('right', ax > DEAD_ZONE || !!b[BTN.RIGHT]?.pressed, () => ref.current.right())
        edge('up', ay < -DEAD_ZONE || !!b[BTN.UP]?.pressed, () => ref.current.up())
        edge('down', ay > DEAD_ZONE || !!b[BTN.DOWN]?.pressed, () => ref.current.down())
        edge('a', !!b[BTN.A]?.pressed, () => ref.current.confirm())
        edge('b', !!b[BTN.B]?.pressed, () => ref.current.cancel())
        break // une seule manette suffit
      }
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active])
}
