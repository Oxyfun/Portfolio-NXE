/**
 * Fond animé du NXE : les anneaux qui dérivent lentement.
 *
 * Ce n'est ni un dégradé qui respire ni un calque qui glisse — c'est un
 * SYSTÈME DE PARTICULES. Relevé sur `components/Background.qml` du thème
 * Pegasus NPE (riquenunes/pegasus-theme-npe), qui l'implémente au paramètre
 * près :
 *
 *   Emitter   emitRate 2/s, ancré en haut à droite sur 80 % × 80 % du cadre
 *             lifeSpan 10000 ms ± 4000
 *             velocity AngleDirection { angle 320°, ±20, magnitude 25, ±5 }
 *   Particle  opacity 0.15, image bg_ring1..4.png tirée au hasard (256 px)
 *             scale animée de random×0.125 vers random×0.875 + 0.125 sur 14 s
 *
 * J'avais d'abord fabriqué six anneaux fixes qui dérivaient ensemble : ça ne
 * ressemblait à rien, parce que ce qui fait vivre ce fond n'est pas le
 * mouvement d'ensemble mais le fait que chaque anneau naisse, grandisse et
 * meure avec ses propres valeurs.
 *
 * Chaque anneau porte sa trajectoire dans des variables CSS et une animation
 * qui dure toute sa vie : aucune boucle JS par image, c'est le compositeur qui
 * travaille. Seul l'apparition/disparition passe par un timer.
 */

import { useEffect, useRef, useState } from 'react'
import { firstAvailable } from '../lib/assets'

const EMISSION_MS = 500 // emitRate 2/s
const VIE_MS = 10000
const VIE_VAR_MS = 4000
const ANGLE_DEG = 320
const ANGLE_VAR_DEG = 20
const VITESSE = 25 // px/s
const VITESSE_VAR = 5
const OPACITE = 0.15
const DUREE_ECHELLE_MS = 14000
const TAILLE_PX = 256

const alea = (min: number, max: number) => min + Math.random() * (max - min)

export function Anneaux() {
  const hote = useRef<HTMLDivElement>(null)
  const [base, setBase] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    let vivant = true
    firstAvailable('/assets/bgrings/bg_ring1.png', '/nxe/bgrings/bg_ring1.png').then(
      (r) => vivant && setBase(r),
    )
    return () => {
      vivant = false
    }
  }, [])

  useEffect(() => {
    const el = hote.current
    if (!base || !el) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const dossier = base.replace(/bg_ring1\.png$/, '')

    const emettre = () => {
      const a = hote.current
      if (!a) return
      const w = a.clientWidth
      const h = a.clientHeight
      if (!w || !h) return

      const vie = VIE_MS + alea(-VIE_VAR_MS, VIE_VAR_MS)
      const angle = ((ANGLE_DEG + alea(-ANGLE_VAR_DEG, ANGLE_VAR_DEG)) * Math.PI) / 180
      const vitesse = VITESSE + alea(-VITESSE_VAR, VITESSE_VAR)
      const dist = (vitesse * vie) / 1000

      // Émetteur ancré en haut à droite, sur 80 % de la largeur et de la hauteur.
      const x0 = alea(w * 0.2, w)
      const y0 = alea(0, h * 0.8)
      const x1 = x0 + Math.cos(angle) * dist
      // L'axe Y de l'écran descend : un angle de 320° monte vers la droite.
      const y1 = y0 + Math.sin(angle) * dist

      /* L'échelle est programmée sur 14 s alors que l'anneau ne vit que 10 :
         il meurt donc avant d'atteindre sa taille finale. C'est ce que fait le
         thème d'origine, et c'est ce qui donne des tailles si variées. */
      const s0 = Math.random() * 0.125
      const s1cible = Math.random() * (1 - 0.125) + 0.125
      const s1 = s0 + (s1cible - s0) * (vie / DUREE_ECHELLE_MS)

      const d = document.createElement('div')
      d.className = 'anneau'
      d.style.setProperty('--x0', `${x0 - TAILLE_PX / 2}px`)
      d.style.setProperty('--y0', `${y0 - TAILLE_PX / 2}px`)
      d.style.setProperty('--x1', `${x1 - TAILLE_PX / 2}px`)
      d.style.setProperty('--y1', `${y1 - TAILLE_PX / 2}px`)
      d.style.setProperty('--s0', String(s0))
      d.style.setProperty('--s1', String(s1))
      d.style.setProperty('--op', String(OPACITE))
      d.style.backgroundImage = `url("${dossier}bg_ring${1 + Math.floor(Math.random() * 4)}.png")`
      d.style.animationDuration = `${Math.round(vie)}ms`
      d.addEventListener('animationend', () => d.remove(), { once: true })
      a.appendChild(d)
    }

    /* Amorçage : sans ça l'écran met dix secondes à se peupler et les premières
       secondes sont vides. On sème des anneaux déjà en cours de vie. */
    for (let i = 0; i < Math.round(VIE_MS / EMISSION_MS); i++) {
      emettre()
      const dernier = el.lastElementChild as HTMLElement | null
      if (dernier) dernier.style.animationDelay = `-${Math.round(alea(0, VIE_MS))}ms`
    }

    const id = window.setInterval(emettre, EMISSION_MS)
    return () => {
      window.clearInterval(id)
      el.replaceChildren()
    }
  }, [base])

  if (!base) return null
  return <div className="anneaux" ref={hote} aria-hidden />
}
