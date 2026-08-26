/**
 * L'avatar 3D planté devant la rangée de tuiles, comme sur image2.
 *
 * Chargé APRÈS le premier rendu du dashboard, et jamais avant : three.js
 * (688 Ko) et le modèle (1,6 Mo) n'ont rien à faire dans le chemin critique
 * d'une page qui s'affiche en 176 ms. Le dashboard apparaît d'abord, l'avatar
 * arrive en fondu une fraction de seconde plus tard.
 *
 * Si `public/avatar.glb` est absent, ce composant ne rend rien et ne charge
 * même pas three.js — même cascade de repli que les autres assets optionnels.
 */

import { useEffect, useRef, useState } from 'react'
import type * as THREE from 'three'
import { firstFileAvailable } from '../lib/assets'
import { K, advanceCoef } from './TileRow'

/**
 * Cadrage — l'avatar est un objet DE LA RANGÉE, arrimé à la tuile d'indice 1.
 *
 * Relevé sur les deux captures qui le montrent, et elles disent la même chose :
 *
 *              image6 (« 1 of 5 », tuile 1 au fond)   image2 (« 2 of 5 », tuile 1 devant)
 *   centre X / bord droit de la tuile 1        0.974                    0.999
 *   pieds sous le centre de rangée (× h_tuile) 0.564                    0.556
 *   hauteur (× h_tuile de la tuile 1)          1.138                    1.079
 *
 * Autrement dit : il se tient au bord droit de la tuile 1, et il grandit,
 * avance et disparaît avec elle. Quand la tuile 1 est sélectionnée il est
 * devant, grand ; quand on passe à la tuile 2 elle sort par la gauche et il
 * sort avec. C'est bien un élément de la rangée, pas un décor fixe.
 *
 * Les valeurs sont exprimées relativement à la tuile 1 et non en vh absolus :
 * les captures de référence n'ont pas toutes la même marge de rangée (15.3 vh
 * sur image2, 14.5 sur image6, 12.97 sur image4 d'où vient notre `--margin-x`),
 * donc un vh absolu recopié d'une capture serait faux chez nous. Ancré sur
 * notre propre géométrie de tuiles — validée à ±2 px par `measure.mjs` — le
 * placement reste juste. Vérification : le modèle prédit le centre de l'avatar
 * d'image6 à 98.9 vh, mesuré 99.3.
 */
const CADRE = {
  /** Centre horizontal, en largeurs de tuile depuis le bord gauche de la tuile 1. */
  centreDansTuile: 0.98,
  /** Pieds sous le centre de rangée, en hauteurs de tuile. */
  piedsSousRangee: 0.56,
  /** Hauteur du personnage, en hauteurs de tuile. */
  hauteurPerso: 1.11,
  /**
   * Cadre trois.js. Le sommet du crâne est mesuré à 1.736 unité au-dessus du
   * sol sur 240 poses (24 lacets × 10 instants) : 1.80 laisse juste ce qu'il
   * faut au-dessus sans gaspiller de canevas.
   */
  hauteurMonde: 1.8,
  /**
   * Largeur du cadre en fraction de sa hauteur. Le rayon horizontal maximal du
   * personnage — mesuré sur les mêmes 240 poses, car il peut désormais pivoter
   * sur 360° — vaut 0.470 unité, soit 0.522 de la demi-hauteur. À 0.56 il reste
   * de la marge : c'est ce qui manquait avant, où les mains sortaient du cadre
   * et se faisaient couper net.
   */
  largeurSurHauteur: 0.56,
}

/**
 * Rotation à la souris. Mêmes réglages que la console de l'écran d'accueil,
 * eux-mêmes repris d'`OrbitControls` : le geste alimente une réserve dont on
 * ne consomme que 5 % par frame, et le gain vaut la moitié du défaut.
 *
 * Ici c'est le PERSONNAGE qui tourne, pas la caméra — et seulement en lacet.
 * Le modèle est centré en X et Z avec les pieds à y = 0, donc une rotation
 * autour de son axe vertical les laisse plantés au sol. Pas de tangage : on ne
 * veut ni le voir basculer ni découvrir le dessous de ses semelles.
 */
const DAMPING = 0.05
const ROTATE_SPEED = 0.5

/** On veut l'animation d'attente, pas la marche ni la course. */
function choisirAttente(clips: THREE.AnimationClip[]): THREE.AnimationClip | null {
  if (!clips.length) return null
  const attente = clips.filter((c) => /breathe|idle|stand/i.test(c.name))
  // à défaut d'un nom explicite, la plus longue : marcher et courir sont courts
  const pool = attente.length ? attente : clips
  return pool.reduce((a, b) => (b.duration > a.duration ? b : a))
}

/**
 * Géométrie du bloc pour une profondeur `r = 1 - selected`.
 *
 * Le canevas garde une taille en pixels CONSTANTE — celle de la profondeur 0,
 * la plus grande — et c'est un `scale` CSS qui le fait avancer et reculer.
 * Redimensionner le canevas WebGL à chaque image d'une transition coûterait
 * une réallocation de tampon par image ; un `scale` est composité par le GPU.
 * C'est exactement ce que font les tuiles, et ça garde les deux synchrones.
 *
 * L'origine de la transformation est le point où les pieds touchent le sol :
 * une mise à l'échelle autour de ce point ne les décolle jamais.
 */
function geometrie(r: number) {
  const hauteurCanevas = (CADRE.hauteurPerso * 41.9) / (1.736 / CADRE.hauteurMonde)
  const largeurCanevas = hauteurCanevas * CADRE.largeurSurHauteur
  return {
    largeurCanevas,
    hauteurCanevas,
    // bord gauche du canevas à la profondeur 0
    gauche: `calc(var(--margin-x) + var(--tile-w) * ${CADRE.centreDansTuile} - ${largeurCanevas / 2}vh)`,
    // le bas du canevas est le sol : les pieds y reposent
    haut: `calc(var(--row-cy) + var(--tile-h) * ${CADRE.piedsSousRangee} - ${hauteurCanevas}vh)`,
    // avancée et grossissement, exactement comme la tuile 1
    transform:
      `translateX(calc(var(--tile-w) * ${(advanceCoef(r) - advanceCoef(0)).toFixed(4)}))` +
      ` scale(${Math.pow(K, Math.max(0, r)).toFixed(4)})`,
  }
}

/**
 * Position quand une lame est ouverte — relevée sur image10.
 *
 * L'avatar quitte la rangée et fait un pas en avant sur la droite : centre à
 * 33.1 vh du bord droit, pieds à 87.9 % de la hauteur d'écran (contre 78–80 %
 * dans la rangée), pour une taille de 48.2 vh — soit 1.04 fois sa taille à la
 * profondeur 0. Autant dire la même : il ne grossit pas, il descend.
 *
 * Je l'avais documenté comme écart assumé faute de références concordantes :
 * image3 le montrait déplacé à droite, image5 n'en montrait aucun. image10
 * trancherait à deux contre un, et surtout elle est nette. On le montre.
 */
const CADRE_LAME = {
  droiteVh: 33.1,
  piedsPourcent: 87.9,
  echelle: 1.04,
}

interface Props {
  /** Indice de la tuile sélectionnée : l'avatar est arrimé à la tuile 1. */
  selected: number
  /** Une lame est ouverte : l'avatar sort de la rangée et passe à droite. */
  lameOuverte?: boolean
}

export function Avatar3D({ selected, lameOuverte = false }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [src, setSrc] = useState<string | null | undefined>(undefined)
  const [visible, setVisible] = useState(false)

  const r = 1 - selected
  const geo = geometrie(r)
  // r < 0 : la tuile 1 est sortie par la gauche, l'avatar sort avec elle.
  // Sauf lame ouverte : là il ne dépend plus de la rangée.
  const sorti = r < 0 && !lameOuverte

  const pose = lameOuverte
    ? {
        left: `calc(100% - ${CADRE_LAME.droiteVh}vh - ${geo.largeurCanevas / 2}vh)`,
        top: `calc(${CADRE_LAME.piedsPourcent}vh - ${geo.hauteurCanevas}vh)`,
        transform: `scale(${CADRE_LAME.echelle})`,
      }
    : { left: geo.gauche, top: geo.haut, transform: geo.transform }

  // 1. Sonde le fichier, sans rien charger d'autre.
  useEffect(() => {
    let alive = true
    const lancer = () => {
      firstFileAvailable('/assets/avatar.glb', '/avatar.glb').then((r) => alive && setSrc(r))
    }
    /* Après le premier rendu : on laisse le dashboard s'afficher d'abord.
       `requestIdleCallback` n'existe pas sur Safari, d'où le repli. */
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number
      cancelIdleCallback?: (id: number) => void
    }
    const parIdle = typeof w.requestIdleCallback === 'function'
    const id = parIdle ? w.requestIdleCallback!(lancer, { timeout: 1200 }) : w.setTimeout(lancer, 300)
    return () => {
      alive = false
      if (parIdle) w.cancelIdleCallback?.(id)
      else clearTimeout(id)
    }
  }, [])

  // 2. Scène three.js, montée seulement si le modèle existe.
  useEffect(() => {
    const host = hostRef.current
    if (!src || !host) return
    let disposed = false
    let cleanup: (() => void) | undefined

    ;(async () => {
      const THREE = await import('three')
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js')
      if (disposed) return

      const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches
      const w = host.clientWidth
      const h = host.clientHeight
      const aspect = w / h
      const demi = CADRE.hauteurMonde / 2

      const scene = new THREE.Scene()
      const camera = new THREE.OrthographicCamera(
        -demi * aspect,
        demi * aspect,
        demi,
        -demi,
        -10,
        10,
      )
      // Le bas du cadre est au niveau du sol : les pieds tombent sur le bord bas.
      camera.position.set(0, demi, 5)
      camera.lookAt(0, demi, 0)

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      /* 1.5 suffit largement pour un personnage haut de 45 % d'écran, et coûte
         deux fois moins de pixels qu'un rendu en 2×. */
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
      renderer.setSize(w, h)
      renderer.outputColorSpace = THREE.SRGBColorSpace
      host.appendChild(renderer.domElement)

      /* Éclairage du NXE : très diffus, contraste faible, une dominante
         légèrement verte venant du sol pour que le perso appartienne à la scène. */
      scene.add(new THREE.HemisphereLight(0xffffff, 0x9ab84a, 2.4))
      const key = new THREE.DirectionalLight(0xffffff, 1.5)
      key.position.set(2, 4, 5)
      scene.add(key)
      const fill = new THREE.DirectionalLight(0xffffff, 0.5)
      fill.position.set(-3, 1, 4)
      scene.add(fill)

      /* Le pivot porte la rotation à la souris ; l'animation continue de jouer
         dessous sans être perturbée. */
      const pivot = new THREE.Group()
      scene.add(pivot)

      let mixer: THREE.AnimationMixer | null = null
      let hitProxy: THREE.Mesh | null = null
      try {
        const gltf = await new GLTFLoader().loadAsync(src)
        if (disposed) return
        pivot.add(gltf.scene)

        /* Volume de sélection : on ne teste pas les 23 000 triangles à chaque
           mouvement de souris. Une boîte suffit à savoir si le curseur est sur
           le personnage — et surtout, le conteneur reste transparent aux clics
           tant qu'on n'est pas dessus, pour ne pas créer une zone morte devant
           les tuiles qu'il recouvre. */
        const box = new THREE.Box3().setFromObject(gltf.scene)
        const taille = box.getSize(new THREE.Vector3())
        const centre = box.getCenter(new THREE.Vector3())
        hitProxy = new THREE.Mesh(
          new THREE.BoxGeometry(taille.x * 0.62, taille.y, taille.z * 2),
          new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }),
        )
        hitProxy.position.copy(centre)
        /* `Raycaster` ne regarde que les calques, jamais `visible` : la boîte
           reste détectable tout en sortant du rendu. Autant d'appels de dessin
           en moins à chaque image, sur un fil déjà disputé avec les sons. */
        hitProxy.visible = false
        pivot.add(hitProxy)

        const clip = choisirAttente(gltf.animations)
        if (clip) {
          mixer = new THREE.AnimationMixer(gltf.scene)
          const action = mixer.clipAction(clip)
          action.play()
          // Sous reduced-motion : une pose fixe, prise en cours d'animation
          // pour que les bras soient le long du corps et non écartés.
          mixer.update(reduit ? 2 : 0)
        }
      } catch (err) {
        /* Un `catch` muet ici avait masqué pendant un moment un vrai bug (la
           sonde validait un chemin inexistant). On avertit, sans passer par
           `console.error` que le plancher de qualité interdit. */
        console.warn('Avatar 3D : chargement impossible —', err)
        return
      }

      /* Prise de mesure, en dev seulement (Vite l'élimine du build). La règle
         du projet est de relever plutôt que d'estimer : sans accès à la scène,
         toute mesure sur l'avatar passerait par une capture d'écran où il se
         confond avec les tuiles derrière lui. Avec ce point d'entrée, un script
         peut fixer une pose et lire les pixels rendus. */
      if (import.meta.env.DEV) {
        ;(window as unknown as Record<string, unknown>).__avatar = {
          THREE,
          scene,
          camera,
          renderer,
          pivot,
          mixer,
          host,
        }
      }

      setVisible(true)

      /* Plafonné à 30 images/s. Une respiration lente est identique à l'œil
         entre 30 et 60, mais la boucle de rendu d'un maillage animé accapare le
         fil principal : à 60 i/s, les sons du dashboard partaient 90 à 120 ms
         après le début de l'animation au lieu des 38 programmés, parce que leur
         `setTimeout` attendait son tour. Mesuré, et corrigé ici plutôt qu'en
         élargissant la tolérance du test. */
      const IMAGES_PAR_SEC = 30
      const INTERVALLE = 1000 / IMAGES_PAR_SEC

      let raf = 0
      let dernier = 0
      const clock = new THREE.Clock()
      const rendre = (t: number) => {
        raf = requestAnimationFrame(rendre)
        /* Plein régime tant que l'utilisateur manipule le personnage, ou que
           l'inertie le fait encore glisser. 30 i/s ne se voient pas sur une
           respiration lente, mais se voient très bien sur un objet qui suit la
           souris : c'est le décalage entre le curseur et le personnage qui
           devient saccadé, pas l'animation. Le plafond ne sert qu'à protéger
           l'ordonnancement des sons pendant la navigation au clavier — or on ne
           navigue pas au clavier en faisant tourner l'avatar à la souris. */
        const manipule = drag.actif || Math.abs(drag.attente) > 0.0004
        const dt = (t - dernier) / 1000
        if (!manipule && t - dernier < INTERVALLE) return
        dernier = t
        if (mixer) mixer.update(clock.getDelta())

        // Amortissement de la rotation, indépendant de la fréquence d'écran.
        const d = 1 - Math.pow(1 - DAMPING, Math.min(3, dt * 60))
        pivot.rotation.y += drag.attente * d
        drag.attente *= 1 - d

        renderer.render(scene, camera)
      }
      if (reduit) renderer.render(scene, camera)
      else raf = requestAnimationFrame(rendre)

      /* ── Rotation à la souris ─────────────────────────────────────────────
         Le conteneur est `pointer-events: none` par défaut. On écoute donc au
         niveau de la fenêtre, on décide par raycast si le curseur est sur le
         personnage, et on ne rend le conteneur cliquable qu'à ce moment-là.
         Résultat : l'avatar n'intercepte jamais un clic destiné à une tuile. */
      const raycaster = new THREE.Raycaster()
      const ndc = new THREE.Vector2()
      const drag = { actif: false, id: -1, x: 0, attente: 0 }

      /* Mis en cache : `surAvatar` tourne à chaque mouvement de souris sur
         toute la page, et `getBoundingClientRect` y forcerait un calcul de mise
         en page à chaque fois.
         Mais le cadre BOUGE : l'avatar avance et recule avec la tuile 1, et se
         déplace à droite quand une lame s'ouvre. Un cache posé une fois pour
         toutes visait l'ancienne position et la silhouette devenait
         insaisissable. On le marque sale à chaque fin de transition. */
      let rect = host.getBoundingClientRect()
      let rectSale = false
      const salir = () => {
        rectSale = true
      }
      const conteneurBox = host.parentElement
      conteneurBox?.addEventListener('transitionend', salir)

      const surAvatar = (clientX: number, clientY: number) => {
        if (!hitProxy) return false
        if (rectSale) {
          rect = host.getBoundingClientRect()
          rectSale = false
        }
        const r = rect
        if (clientX < r.left || clientX > r.right || clientY < r.top || clientY > r.bottom) return false
        ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1)
        raycaster.setFromCamera(ndc, camera)
        return raycaster.intersectObject(hitProxy, false).length > 0
      }

      const conteneur = host.parentElement as HTMLElement | null

      /* Bouclier de glissement, monté sur `document.body` et non dans l'avatar.
         `.avatar3d` porte un `transform` depuis qu'il suit la tuile 1, et un
         ancêtre transformé fait qu'un `position: fixed` se cale sur LUI et non
         sur la fenêtre : le bouclier ne couvrait donc plus que la boîte de
         l'avatar, et le glissement continuait de sélectionner les tuiles
         traversées. Hors du sous-arbre transformé, il couvre bien l'écran. */
      const bouclier = document.createElement('div')
      bouclier.className = 'avatar3d-shield'

      const onMove = (e: PointerEvent) => {
        /* Le bouclier survit au relâchement jusqu'au geste suivant. Le retirer
           dès le `pointerup` le faisait disparaître sous un curseur qui, après
           320 px de glissement, se trouve au-dessus d'une autre tuile : le
           navigateur recalculait le survol et la sélection sautait toute seule
           (mesuré : de la tuile 1 à la 3). Relâcher ne sélectionne rien ;
           bouger la souris, si — et là c'est l'utilisateur qui le demande. */
        if (!drag.actif && bouclier.isConnected) bouclier.remove()
        if (drag.actif && e.pointerId === drag.id) {
          const dx = e.clientX - drag.x
          drag.x = e.clientX
          /* Gain d'OrbitControls, mais indexé sur la LARGEUR du canevas et non
             sa hauteur : le geste est horizontal et le personnage est haut et
             étroit (160 px de large pour 383 de haut). Indexé sur la hauteur,
             il fallait 766 px de glissement pour un tour, soit sept fois la
             largeur visible du personnage — on pousse beaucoup pour peu.
             Sur la largeur : un tour en 320 px. Le mapping physique « j'attrape
             la surface et je pousse » (arc = r·θ, demi-largeur ≈ 55 px) donne
             346 px de son côté : les deux convergent à 8 % près. */
          drag.attente += dx * ((Math.PI * 2) / Math.max(1, host.clientWidth)) * ROTATE_SPEED
          /* En mouvement réduit la boucle de rendu est à l'arrêt : on applique
             le geste tout de suite et on redessine à la demande. Faire tourner
             le personnage est une manipulation directe, pas une animation
             d'ambiance — la couper reviendrait à ignorer l'utilisateur. Ce
             qu'on lui retire, c'est l'inertie, pas la réponse. */
          if (reduit) {
            pivot.rotation.y += drag.attente
            drag.attente = 0
            renderer.render(scene, camera)
          }
          return
        }
        conteneur?.classList.toggle('is-hot', surAvatar(e.clientX, e.clientY))
      }

      const onDown = (e: PointerEvent) => {
        // Un clic ailleurs lève le bouclier résiduel avant tout autre effet.
        if (!drag.actif && bouclier.isConnected) bouclier.remove()
        if (e.button !== 0 || !surAvatar(e.clientX, e.clientY)) return
        // Capture : la tuile recouverte ne doit pas recevoir ce clic.
        e.stopPropagation()
        e.preventDefault()
        drag.actif = true
        drag.id = e.pointerId
        drag.x = e.clientX
        conteneur?.classList.add('is-hot', 'is-dragging')
        document.body.appendChild(bouclier)
      }

      const onUp = (e: PointerEvent) => {
        if (!drag.actif || e.pointerId !== drag.id) return
        drag.actif = false
        conteneur?.classList.remove('is-dragging')
        conteneur?.classList.toggle('is-hot', surAvatar(e.clientX, e.clientY))
      }

      window.addEventListener('pointermove', onMove, { passive: true })
      window.addEventListener('pointerdown', onDown, true)
      window.addEventListener('pointerup', onUp, true)
      window.addEventListener('pointercancel', onUp, true)

      const onResize = () => {
        if (!host.clientWidth) return
        rect = host.getBoundingClientRect()
        rectSale = false
        const a = host.clientWidth / host.clientHeight
        camera.left = -demi * a
        camera.right = demi * a
        camera.updateProjectionMatrix()
        renderer.setSize(host.clientWidth, host.clientHeight)
        if (reduit) renderer.render(scene, camera)
      }
      window.addEventListener('resize', onResize)

      cleanup = () => {
        cancelAnimationFrame(raf)
        window.removeEventListener('resize', onResize)
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerdown', onDown, true)
        window.removeEventListener('pointerup', onUp, true)
        window.removeEventListener('pointercancel', onUp, true)
        conteneurBox?.removeEventListener('transitionend', salir)
        bouclier.remove()
        conteneur?.classList.remove('is-hot', 'is-dragging')
        mixer?.stopAllAction()
        renderer.dispose()
        renderer.domElement.remove()
        scene.traverse((o) => {
          const m = o as THREE.Mesh
          m.geometry?.dispose()
          const mat = m.material
          if (Array.isArray(mat)) mat.forEach((x) => x.dispose())
          else if (mat) (mat as THREE.Material).dispose()
        })
      }
    })()

    return () => {
      disposed = true
      cleanup?.()
    }
  }, [src])

  if (src === undefined || src === null) return null

  return (
    <div
      className={`avatar3d${visible && !sorti ? ' is-visible' : ''}${lameOuverte ? ' is-blade' : ''}`}
      aria-hidden
      style={{
        left: pose.left,
        top: pose.top,
        width: `${geo.largeurCanevas}vh`,
        height: `${geo.hauteurCanevas}vh`,
        transform: pose.transform,
      }}
    >
      <div className="avatar3d-shadow" />
      <div className="avatar3d-stage" ref={hostRef} />
    </div>
  )
}
