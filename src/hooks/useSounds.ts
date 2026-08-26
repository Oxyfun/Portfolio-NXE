/**
 * Sons du dashboard.
 *
 * Les fichiers sont ceux du NXE (cf. SPEC § 7). Le brief demande que le son
 * arrive 30 à 50 ms APRÈS le début de l'animation, jamais en même temps :
 * `play()` programme donc un `setTimeout` court, et une garde par identifiant
 * empêche qu'un même son parte deux fois dans la même frame.
 */

import { useCallback, useEffect, useRef } from 'react'

export type SoundId =
  | 'moveRight'
  | 'moveLeft'
  | 'select'
  | 'back'
  | 'focus'
  | 'unfold'
  | 'section'
  | 'transition'
  | 'boot'

const SOURCES: Record<SoundId, string[]> = {
  moveRight: ['/assets/sfx/move.wav', '/audio/snd_panelright.wav'],
  moveLeft: ['/assets/sfx/move.wav', '/audio/snd_panelleft.wav'],
  select: ['/assets/sfx/select.wav', '/audio/snd_buttonselect.wav'],
  back: ['/assets/sfx/back.wav', '/audio/snd_buttonback.wav'],
  focus: ['/audio/btn_Focus.wav'],
  unfold: ['/audio/snd_panelunfold.wav'],
  /* `snd_channelup.wav` ne dure que 20 ms : mesuré sur son en-tête WAV, c'est
     un fichier tronqué, inaudible. Le changement de section n'avait donc en
     pratique aucun son. */
  section: ['/assets/sfx/section.wav', '/audio/btn_Select.wav'],
  transition: ['/audio/snd_transitioninto.wav'],
  boot: ['/audio/intro.wav'],
}

/** Délai son ↔ animation, en ms. */
const DELAY: Partial<Record<SoundId, number>> = {
  moveRight: 38,
  moveLeft: 38,
  select: 45,
  back: 45,
  focus: 30,
  unfold: 40,
  section: 35,
}

const VOLUME = 0.55

export function useSounds() {
  const pool = useRef(new Map<SoundId, HTMLAudioElement[]>())
  const lastFired = useRef(new Map<SoundId, number>())
  const enabled = useRef(false)
  const timers = useRef<number[]>([])

  // Politique autoplay : rien avant la première interaction utilisateur.
  useEffect(() => {
    const unlock = () => {
      enabled.current = true
    }
    const opts = { once: true, passive: true } as const
    window.addEventListener('pointerdown', unlock, opts)
    window.addEventListener('keydown', unlock, opts)
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
      timers.current.forEach(clearTimeout)
      timers.current = []
    }
  }, [])

  const acquire = useCallback((id: SoundId): HTMLAudioElement | null => {
    let voices = pool.current.get(id)
    if (!voices) {
      voices = []
      pool.current.set(id, voices)
    }
    const free = voices.find((a) => a.paused || a.ended)
    if (free) return free
    if (voices.length >= 3) return null // évite l'empilement en navigation rapide
    // Chaîne de repli : le premier `src` qui charge gagne, sinon silence.
    const audio = new Audio()
    const candidates = [...SOURCES[id]]
    const tryNext = () => {
      const next = candidates.shift()
      if (!next) return
      audio.src = next
    }
    audio.addEventListener('error', tryNext)
    audio.preload = 'auto'
    audio.volume = VOLUME
    tryNext()
    voices.push(audio)
    return audio
  }, [])

  const play = useCallback(
    (id: SoundId, opts?: { delay?: number; volume?: number }) => {
      if (!enabled.current) return
      const now = performance.now()
      const last = lastFired.current.get(id) ?? -Infinity
      if (now - last < 40) return // garde : pas deux fois dans la même frame
      lastFired.current.set(id, now)

      const delay = opts?.delay ?? DELAY[id] ?? 0
      const t = window.setTimeout(() => {
        const audio = acquire(id)
        if (!audio) return
        audio.volume = opts?.volume ?? VOLUME
        audio.currentTime = 0
        void audio.play().catch(() => {})
      }, delay)
      timers.current.push(t)
      if (timers.current.length > 64) timers.current = timers.current.slice(-32)
    },
    [acquire],
  )

  /** Force l'activation (après un clic explicite, ex. écran d'accueil). */
  const unlock = useCallback(() => {
    enabled.current = true
  }, [])

  return { play, unlock }
}

export type PlayFn = ReturnType<typeof useSounds>['play']
