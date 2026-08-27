/**
 * Curseur vert du NXE.
 *
 * Relevé sur le site de référence : ce n'est pas un `cursor:` CSS mais un
 * élément suivi à la souris, avec deux PNG de 17 × 22 px (`default` et
 * `pointer`), `image-rendering: pixelated` et une ombre portée. Couleur
 * échantillonnée sur les fichiers : #a6ff00 cerné de noir.
 *
 * Uniquement sur pointeur fin : masquer le curseur natif sur une tablette ou un
 * écran tactile ne servirait à rien et casserait la saisie.
 */

import { useEffect, useRef, useState } from 'react'
import { firstAvailable } from '../lib/assets'

export function Cursor() {
  const ref = useRef<HTMLDivElement>(null)
  const [dispo, setDispo] = useState<boolean | null>(null)

  useEffect(() => {
    let alive = true
    Promise.all([
      firstAvailable('/assets/cursor/default.png', '/cursor/default.png'),
      firstAvailable('/assets/cursor/pointer.png', '/cursor/pointer.png'),
    ]).then(([d, p]) => alive && setDispo(Boolean(d && p)))
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!dispo) return
    const fin = matchMedia('(pointer: fine)').matches
    if (!fin) return
    const el = ref.current
    if (!el) return

    document.body.classList.add('a-curseur')

    /* On peint dans la boucle d'affichage et non dans l'événement : un
       `pointermove` peut arriver plusieurs fois entre deux images, et écrire le
       `transform` à chaque fois ne ferait que du travail jeté. */
    let x = -100
    let y = -100
    let raf = 0
    let dernierX = NaN
    let dernierY = NaN

    const peindre = () => {
      raf = requestAnimationFrame(peindre)
      if (x === dernierX && y === dernierY) return
      dernierX = x
      dernierY = y
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`
    }
    raf = requestAnimationFrame(peindre)

    const onMove = (e: PointerEvent) => {
      x = e.clientX
      y = e.clientY
      el.style.opacity = '1'
      /* La forme se déduit de la nature de l'élément survolé.
         J'ai d'abord lu son `cursor` calculé, pour ne pas tenir une liste de
         sélecteurs en double du CSS — mais c'est impossible : masquer le
         curseur natif écrase justement cette valeur pour tout le monde, et la
         variante « pointer » ne s'affichait donc jamais. Les deux cas 3D
         (console de l'accueil, silhouette de l'avatar) exposent leur état sous
         forme de classe, parce qu'un raycast ne se lit pas dans le DOM. */
      const sous = document.elementFromPoint(e.clientX, e.clientY)
      el.classList.toggle(
        'is-pointer',
        Boolean(
          sous?.closest('button, a, [role="button"], input, select, textarea') ||
            sous?.closest('.boot-stage.is-over') ||
            sous?.closest('.avatar3d.is-hot'),
        ),
      )
    }
    const onLeave = () => {
      el.style.opacity = '0'
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
      document.body.classList.remove('a-curseur')
    }
  }, [dispo])

  if (!dispo) return null
  return <div className="curseur" ref={ref} aria-hidden />
}
