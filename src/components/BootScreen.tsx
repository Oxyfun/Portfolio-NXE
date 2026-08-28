/**
 * Écran d'accueil (cf. image1) : Xbox 360 en 3D sur fond blanc, rotation lente,
 * réaction à la souris, orbite au glissé. Au clic, la console pivote vers sa
 * face avant - celle du bouton power - en zoomant, puis fondu au blanc.
 *
 * three.js est chargé en `import()` dynamique : le dashboard n'en dépend pas.
 */

import { useEffect, useRef, useState } from 'react'
import type * as THREE from 'three'
import type { PlayFn } from '../hooks/useSounds'

/**
 * Pose de la console, calée sur image1 : grille d'aération en haut à gauche,
 * face avant (bouton power, « XBOX 360 ») en bas à droite, axe long descendant
 * d'environ 28° vers la droite - l'angle relevé sur la référence.
 * `?pose=x,y,roll,scale` permet de la régler sans recompiler.
 */
const DEFAULT_POSE = [-1.2, 4.9, 1.35, 2.1] as const

/**
 * Pose d'allumage : la face avant, celle du bouton power, présentée à la
 * caméra. Relevée en balayant `?pose=` (voir `pose.mjs`). Au clic on y va
 * toujours, quelle que soit l'orientation où l'utilisateur a laissé la console.
 *
 * `JITTER` désaccorde légèrement la pose et le cadrage à chaque allumage : on
 * arrive toujours sur CETTE face, mais jamais exactement au même endroit, ce qui
 * évite l'effet mécanique d'une animation qui rejoue la même image.
 */
const FRONT_POSE = { pitch: -1.75, yaw: 4.9, roll: 0.18 }
const JITTER = { pitch: 0.15, yaw: 0.24, roll: 0.38, panX: 0.26, panY: 0.24 }

/**
 * Réglages de rotation, relevés dans le bundle du site de référence, qui monte
 * un `<OrbitControls>` avec exactement :
 *
 *   enableZoom: false, enablePan: false, enableDamping: true,
 *   dampingFactor: 0.05, rotateSpeed: 0.5, autoRotate: true, autoRotateSpeed: 0.5
 *
 * Les valeurs qui font la sensation :
 *
 * - `DAMPING` : le geste alimente une réserve dont on ne consomme que 5 % par
 *   frame. La console suit la main de loin et continue de glisser au relâché.
 *   C'est la différence entre « elle colle au curseur » et « elle tourne ».
 * - `ROTATE_SPEED` : moitié du défaut d'OrbitControls. Sans lui, un écran de
 *   haut de glissé fait un tour complet, ce qui est beaucoup trop nerveux.
 *
 * Surtout : comme OrbitControls, **c'est la caméra qui orbite autour de la
 * console, pas la console qui tourne sur elle-même**. Faire tourner l'objet en
 * angles d'Euler ne respecte pas le geste : dès que l'objet est incliné, un
 * glissé horizontal ne tourne plus autour de la verticale de l'écran mais
 * autour d'un axe penché, et un cercle à la souris ne donne pas un cercle.
 * En coordonnées sphériques, le lacet reste toujours l'axe vertical de l'écran.
 */
const DAMPING = 0.05
const ROTATE_SPEED = 0.5
/** `autoRotateSpeed: 0.5` d'OrbitControls = 2π/3600 rad par frame à 60 Hz. */
const AUTO_SPIN = ((Math.PI * 2) / 3600) * 0.5 * 60

/**
 * Durées de la séquence d'allumage, en ms.
 *
 * `fadeStart` doit venir APRÈS la fin de `turn`, sinon le blanc recouvre la
 * console avant qu'elle soit arrivée sur sa face avant - invisible quand on
 * part du repos (le trajet est court), flagrant quand on a tourné la console
 * à l'opposé avant de cliquer.
 */
const IGNITE = { turn: 1500, fadeStart: 1390, fadeDur: 560 }

/**
 * Interpolation douce. Sinusoïdale et non cubique : une cubique in-out a une
 * pente maximale de 3 au milieu, contre π/2 ≈ 1.57 ici. C'est ce pic de vitesse
 * à mi-course qui donnait l'impression que « d'un coup ça zoome » - il ne se
 * passait presque rien, puis tout arrivait d'un bloc.
 */
const easeInOut = (t: number) => 0.5 * (1 - Math.cos(Math.PI * t))

/**
 * Interpolation d'une distance de caméra.
 *
 * La taille apparente d'un objet varie en 1/distance : interpoler le rayon
 * linéairement fait donc ACCÉLÉRER le grossissement vers la fin (de 7.2 à 3.15,
 * l'échelle passe par 1×, 1.15×, 1.4×, 1.8×, 2.3× - les écarts se creusent).
 * En géométrique, le taux de grossissement est constant d'un bout à l'autre,
 * ce qui est la définition d'un zoom régulier.
 */
const zoomLerp = (from: number, to: number, e: number) => from * Math.pow(to / from, e)

/** Ramène `target` sur le tour le plus proche de `from` : la console prend
 *  toujours le chemin le plus court, même après vingt tours de glissé. */
function nearestAngle(from: number, target: number) {
  const twoPi = Math.PI * 2
  return target + Math.round((from - target) / twoPi) * twoPi
}

function readPose(): readonly number[] {
  if (typeof location === 'undefined') return DEFAULT_POSE
  const raw = new URLSearchParams(location.search).get('pose')
  if (!raw) return DEFAULT_POSE
  const v = raw.split(',').map(Number)
  return v.length === 4 && v.every((n) => Number.isFinite(n)) ? v : DEFAULT_POSE
}

/** Seuil au-delà duquel un appui devient un glissé, et non plus un clic. */
const DRAG_THRESHOLD = 5

export function BootScreen({ onDone, play }: { onDone(): void; play: PlayFn }) {
  const hostRef = useRef<HTMLButtonElement>(null)
  const [flash, setFlash] = useState(false)
  // Un ref ne redéclenche pas de rendu : il faut un état pour que la classe
  // `is-leaving` de l'indication soit réellement posée au clic.
  const [started, setStarted] = useState(false)
  const startedRef = useRef(false)
  /* Passé à `true` au clic : la boucle de rendu prend la main sur la rotation
     et joue l'allumage. Un ref, pas un état - on est dans une boucle rAF. */
  const igniteRef = useRef<(() => void) | null>(null)
  /* La scène three.js vit dans un effet monté une seule fois ; elle a besoin
     d'appeler `start` sans que celui-ci soit une dépendance de l'effet. */
  const startRef = useRef<() => void>(() => {})
  const reduced =
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

  // ── Scène three.js ─────────────────────────────────────────────────────
  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    let disposed = false
    let cleanup: (() => void) | undefined

    ;(async () => {
      const THREE = await import('three')
      if (disposed || !host) return

      const pose = readPose()
      // `?spin=0` fige la rotation : indispensable pour que compare.mjs
      // capture toujours la même pose.
      const frozen =
        typeof location !== 'undefined' && new URLSearchParams(location.search).get('spin') === '0'
      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(34, host.clientWidth / host.clientHeight, 0.1, 100)

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75))
      renderer.setSize(host.clientWidth, host.clientHeight)
      host.appendChild(renderer.domElement)

      /* Beaucoup d'ambiante et peu de contraste : sur fond blanc, une console
         blanche doit rester blanche, pas se détacher en gris. */
      scene.add(new THREE.HemisphereLight(0xffffff, 0xf0f0f0, 2.6))
      scene.add(new THREE.AmbientLight(0xffffff, 0.9))
      const key = new THREE.DirectionalLight(0xffffff, 1.35)
      key.position.set(3, 5, 6)
      scene.add(key)
      const fill = new THREE.DirectionalLight(0xffffff, 0.75)
      fill.position.set(-4, 1, 5)
      scene.add(fill)
      const rim = new THREE.DirectionalLight(0xffffff, 0.6)
      rim.position.set(-5, 2, -3)
      scene.add(rim)

      /* La console ne tourne jamais : son orientation de repos est figée dans
         deux groupes imbriqués (`roll` pour l'inclinaison à l'écran, `root`
         pour l'orientation), et c'est la caméra qui se déplace autour d'elle. */
      const roll = new THREE.Group()
      scene.add(roll)
      const root = new THREE.Group()
      roll.add(root)

      // Modèle : public/xbox360.glb s'il existe, sinon approximation procédurale.
      let loaded = false
      try {
        const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js')
        const gltf = await new GLTFLoader().loadAsync('/xbox360.glb')
        if (disposed) return
        const model = gltf.scene
        const box = new THREE.Box3().setFromObject(model)
        const size = box.getSize(new THREE.Vector3())
        const center = box.getCenter(new THREE.Vector3())
        model.position.sub(center)
        model.scale.setScalar(pose[3] / Math.max(size.x, size.y, size.z))

        /* Le .glb arrive en `metalness: 1, roughness: 1`. Un métal parfaitement
           rugueux n'a aucune composante diffuse : sans environment map il ne
           peut rendre que du gris terne, ce qui ressortait mal sur le fond
           blanc. La 360 est du plastique blanc brillant - on repasse en
           diélectrique et la texture d'albédo redevient visible. */
        model.traverse((o) => {
          const mesh = o as THREE.Mesh
          if (!mesh.material) return
          for (const mat of ([] as THREE.Material[]).concat(mesh.material)) {
            const std = mat as THREE.MeshStandardMaterial
            if (std.isMeshStandardMaterial) {
              std.metalness = 0
              std.roughness = 0.42
              std.needsUpdate = true
            }
          }
        })

        root.add(model)
        loaded = true
      } catch {
        loaded = false
      }

      if (!loaded && !disposed) {
        root.add(buildProceduralXbox(THREE))
      }

      /* Volume de sélection : c'est la console qui est cliquable, pas l'écran.
         Raycaster sur la géométrie complète du modèle à chaque mouvement de
         souris serait cher pour rien - la 360 est une boîte, une boîte suffit.
         `colorWrite: false` la rend invisible tout en gardant le raycast.

         `setFromObject` renvoie une boîte MONDE : on la calcule donc AVANT de
         poser l'orientation de repos, tant que les groupes sont à l'identité.
         Sinon on obtient l'AABB de la console inclinée, bien plus grosse. */
      roll.updateMatrixWorld(true)
      const bounds = new THREE.Box3().setFromObject(root)

      const bSize = bounds.getSize(new THREE.Vector3())
      const bCenter = bounds.getCenter(new THREE.Vector3())
      const hitProxy = new THREE.Mesh(
        /* Marge généreuse : la console est fine, et viser 6 px de large à la
           souris est un jeu d'adresse, pas une interface. On peut cliquer un
           peu à côté sans avoir à la toucher précisément. */
        new THREE.BoxGeometry(bSize.x * 1.35, bSize.y * 1.18, bSize.z * 2.2),
        new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }),
      )
      hitProxy.position.copy(bCenter)
      root.add(hitProxy)

      // Orientation de repos, figée : la console en diagonale, comme sur image1.
      roll.rotation.z = pose[2]
      root.rotation.set(pose[0], pose[1], 0)

      /* ── Orbite ──────────────────────────────────────────────────────────
         `theta` = azimut, `phi` = angle polaire, exactement la convention de
         `Spherical` de three.js. Le point de départ reproduit à l'identique
         l'ancienne caméra fixe (0, 0.6, 7.2) : θ = 0 et cos φ = 0.6 / rayon.
         `pan` décale la vue dans le plan de l'écran - c'est ce qui remplace
         l'ancien décalage de position de l'objet, et qui garde le cadrage
         constant quand on tourne autour. */
      const REST_R = Math.hypot(0.6, 7.2)
      const orb = { theta: 0, phi: Math.acos(0.6 / REST_R), radius: REST_R }
      const pan = { x: -0.02, y: -0.42 }
      const PHI_MIN = 0.08
      const PHI_MAX = Math.PI - 0.08

      const pointer = { x: 0, y: 0 }
      const par = { theta: 0, phi: 0 }
      /* `pt` / `pp` : orbite en attente, que l'amortissement consomme. */
      /* Le survol est le résultat d'un RAYCAST : il n'existe nulle part dans le
         DOM. On l'expose donc en classe, pas seulement en `cursor` - le curseur
         personnalisé masque le curseur natif et ne peut pas le relire, et le
         test de parcours a besoin du même signal pour localiser la console. */
      const marquerSurvol = (dessus: boolean) => {
        host.style.cursor = dessus ? 'pointer' : 'default'
        host.classList.toggle('is-over', dessus)
      }

      const drag = {
        active: false, id: -1, x: 0, y: 0, moved: 0, button: 0,
        pt: 0, pp: 0,
      }
      const raycaster = new THREE.Raycaster()
      const ndc = new THREE.Vector2()

      /** Place la caméra pour un état d'orbite donné. */
      const placeCamera = (theta: number, phi: number, radius: number, px: number, py: number) => {
        camera.position.setFromSphericalCoords(radius, phi, theta)
        camera.up.set(0, 1, 0)
        camera.lookAt(0, 0, 0)
        // Translation dans le repère de la caméra : un pur décalage à l'écran.
        camera.translateX(px)
        camera.translateY(py)
      }
      placeCamera(orb.theta, orb.phi, orb.radius, pan.x, pan.y)

      const hitsConsole = (clientX: number, clientY: number) => {
        const r = host.getBoundingClientRect()
        ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1)
        raycaster.setFromCamera(ndc, camera)
        return raycaster.intersectObject(hitProxy, false).length > 0
      }

      const onPointerDown = (e: PointerEvent) => {
        if (startedRef.current) return
        drag.active = true
        drag.id = e.pointerId
        drag.x = e.clientX
        drag.y = e.clientY
        drag.moved = 0
        drag.button = e.button
        host.setPointerCapture(e.pointerId)
        host.style.cursor = 'grabbing'
      }

      const onMove = (e: PointerEvent) => {
        if (drag.active && e.pointerId === drag.id) {
          const dx = e.clientX - drag.x
          const dy = e.clientY - drag.y
          drag.x = e.clientX
          drag.y = e.clientY
          drag.moved += Math.abs(dx) + Math.abs(dy)
          /* Gain et signes d'OrbitControls : un écran de haut = un tour,
             × rotateSpeed ; tirer à droite fait décroître l'azimut, ce qui
             fait tourner la console dans le sens de la main. */
          const perPx = ((Math.PI * 2) / Math.max(1, host.clientHeight)) * ROTATE_SPEED
          drag.pt -= dx * perPx
          drag.pp -= dy * perPx
          return
        }
        // Parallaxe douce hors glissé.
        pointer.x = (e.clientX / innerWidth) * 2 - 1
        pointer.y = (e.clientY / innerHeight) * 2 - 1
        marquerSurvol(hitsConsole(e.clientX, e.clientY))
      }

      const endDrag = (e: PointerEvent) => {
        if (!drag.active || e.pointerId !== drag.id) return
        drag.active = false
        if (host.hasPointerCapture(e.pointerId)) host.releasePointerCapture(e.pointerId)
        const wasClick = drag.moved < DRAG_THRESHOLD && drag.button === 0
        marquerSurvol(hitsConsole(e.clientX, e.clientY))
        if (wasClick && hitsConsole(e.clientX, e.clientY)) startRef.current()
      }

      // Le glissé au bouton droit ne doit pas ouvrir le menu contextuel.
      const onContextMenu = (e: Event) => e.preventDefault()

      host.addEventListener('pointerdown', onPointerDown)
      host.addEventListener('pointermove', onMove)
      host.addEventListener('pointerup', endDrag)
      host.addEventListener('pointercancel', endDrag)
      host.addEventListener('contextmenu', onContextMenu)

      const onResize = () => {
        if (!host.clientWidth) return
        camera.aspect = host.clientWidth / host.clientHeight
        camera.updateProjectionMatrix()
        renderer.setSize(host.clientWidth, host.clientHeight)
      }
      window.addEventListener('resize', onResize)

      /* ── Allumage ────────────────────────────────────────────────────────
         Au clic : la console pivote vers sa face avant par le chemin le plus
         court, la caméra s'approche, et le tout s'efface dans le blanc. Pas
         d'anneau qui s'allume, pas de saccade - une seule interpolation.     */
      const jitter = (a: number) => (Math.random() * 2 - 1) * a

      /* Direction de la face avant, en monde.
         `FRONT_POSE` a été relevée du temps où c'était l'objet qui tournait :
         elle décrit la rotation R_front qui amène cette face vers +Z. Ici
         l'objet porte R_rest et ne bouge plus, donc la caméra doit se placer
         dans la direction R_rest · R_front⁻¹ · ẑ. Pas besoin de re-balayer les
         poses à la main : la conversion est exacte. */
      const eulerOrder = 'XYZ' as const
      const qOf = (pitch: number, yaw: number, rollZ: number) =>
        new THREE.Quaternion()
          .setFromAxisAngle(new THREE.Vector3(0, 0, 1), rollZ)
          .multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, yaw, 0, eulerOrder)))
      const qRest = qOf(pose[0], pose[1], pose[2])
      const qFront = qOf(FRONT_POSE.pitch, FRONT_POSE.yaw, FRONT_POSE.roll)
      const dirFront = new THREE.Vector3(0, 0, 1).applyQuaternion(
        qRest.clone().multiply(qFront.clone().invert()),
      )
      const sphFront = new THREE.Spherical().setFromVector3(dirFront)

      let ignite: null | {
        t0: number
        from: { theta: number; phi: number; radius: number; panX: number; panY: number }
        to: { theta: number; phi: number; radius: number; panX: number; panY: number }
      } = null

      igniteRef.current = () => {
        if (ignite) return
        const from = {
          theta: orb.theta + par.theta,
          phi: orb.phi + par.phi,
          radius: orb.radius,
          panX: pan.x,
          panY: pan.y,
        }
        ignite = {
          t0: performance.now(),
          from,
          to: {
            // Chemin le plus court : la cible est ramenée sur le tour le plus
            // proche, l'animation reste courte même après vingt tours de glissé.
            theta: nearestAngle(from.theta, sphFront.theta) + jitter(JITTER.yaw),
            phi: Math.max(PHI_MIN, Math.min(PHI_MAX, sphFront.phi + jitter(JITTER.pitch))),
            /* Moins profond qu'au départ (on allait à 2.29×, on va à 2.09×) :
               moins de chemin à parcourir, donc moins de vitesse à un instant
               donné pour une même durée. */
            radius: 3.45 + jitter(0.3),
            panX: jitter(JITTER.panX),
            panY: jitter(JITTER.panY),
          },
        }
      }

      let raf = 0
      const clock = new THREE.Clock()
      const render = () => {
        const dt = clock.getDelta()

        if (ignite) {
          const p = Math.min(1, (performance.now() - ignite.t0) / IGNITE.turn)
          const e = easeInOut(p)
          const { from, to } = ignite
          const mix = (a: number, b: number) => a + (b - a) * e
          // La caméra fait le tour jusqu'en face, en s'approchant.
          placeCamera(
            mix(from.theta, to.theta),
            mix(from.phi, to.phi),
            zoomLerp(from.radius, to.radius, e),
            mix(from.panX, to.panX),
            mix(from.panY, to.panY),
          )
        } else {
          /* Amortissement, indépendant de la fréquence d'écran : à 120 Hz la
             réserve doit se vider à la même vitesse qu'à 60 Hz, sinon la
             console tourne deux fois plus vite sur un écran deux fois plus
             rapide. */
          const d = 1 - Math.pow(1 - DAMPING, Math.min(3, dt * 60))
          orb.theta += drag.pt * d
          // Bornée aux pôles : au-delà la vue se retourne d'un coup.
          orb.phi = Math.max(PHI_MIN, Math.min(PHI_MAX, orb.phi + drag.pp * d))
          drag.pt *= 1 - d
          drag.pp *= 1 - d

          // La rotation libre ne reprend qu'une fois la réserve épuisée, sinon
          // les deux s'additionnent et le mouvement ne se pose jamais.
          const gliding = Math.abs(drag.pt) + Math.abs(drag.pp) > 0.0015
          if (!reduced && !frozen && !drag.active && !gliding) orb.theta -= dt * AUTO_SPIN

          // Parallaxe au survol, gelée pendant le glissé pour ne pas le combattre.
          const tTheta = drag.active ? 0 : -pointer.x * 0.16
          const tPhi = drag.active ? 0 : -pointer.y * 0.10
          par.theta += (tTheta - par.theta) * 0.06
          par.phi += (tPhi - par.phi) * 0.06

          /* Posé directement : l'amortissement fait déjà le lissage, un lerp
             par-dessus n'ajouterait que du retard. */
          placeCamera(
            orb.theta + par.theta,
            Math.max(PHI_MIN, Math.min(PHI_MAX, orb.phi + par.phi)),
            orb.radius,
            pan.x,
            pan.y,
          )
        }

        renderer.render(scene, camera)
        raf = requestAnimationFrame(render)
      }
      render()

      cleanup = () => {
        cancelAnimationFrame(raf)
        host.removeEventListener('pointerdown', onPointerDown)
        host.removeEventListener('pointermove', onMove)
        host.removeEventListener('pointerup', endDrag)
        host.removeEventListener('pointercancel', endDrag)
        host.removeEventListener('contextmenu', onContextMenu)
        window.removeEventListener('resize', onResize)
        renderer.dispose()
        renderer.domElement.remove()
        scene.traverse((o) => {
          const m = o as THREE.Mesh
          if (m.geometry) m.geometry.dispose()
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
  }, [reduced])

  // ── Séquence d'allumage ────────────────────────────────────────────────
  const start = () => {
    if (startedRef.current) return
    startedRef.current = true
    setStarted(true)

    if (reduced) {
      setFlash(true)
      window.setTimeout(onDone, 260)
      return
    }

    igniteRef.current?.()
    /* Le son de démarrage de la console, celui que tout le monde reconnaît.
       Il dure 7 s et déborde volontairement sur le dashboard : c'est ce que
       fait la vraie console, le carillon continue pendant que le tableau de
       bord apparaît. Le clic est un geste utilisateur, donc la lecture
       automatique est autorisée. */
    play('boot', { delay: 0, volume: 0.55 })
    // Le blanc monte pendant que la console finit de se tourner : la coupure
    // ne se voit pas, on passe d'une image à l'autre sans rupture.
    window.setTimeout(() => setFlash(true), IGNITE.fadeStart)
    window.setTimeout(onDone, IGNITE.fadeStart + IGNITE.fadeDur)
  }
  startRef.current = start

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        startRef.current()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className={`boot${flash ? ' is-flash' : ''}`}>
      {/* La scène est un vrai bouton : au clavier elle se prend au Tab et
          s'active à Entrée. À la souris, seul un clic SUR la console démarre -
          le reste de la surface sert au glissé (voir le raycast plus haut). */}
      <button
        type="button"
        className="boot-stage"
        ref={hostRef}
        aria-label="Allumer la console"
        // `detail === 0` : activation clavier. Les clics souris sont traités
        // par le raycast, pas ici.
        onClick={(e) => e.detail === 0 && start()}
      />

      {/* Indication seule : l'élément cliquable, c'est la console. */}
      <p className={`boot-cta${started ? ' is-leaving' : ''}`} aria-hidden>
        Cliquer pour continuer
      </p>

      <div className="boot-flash" aria-hidden />
    </div>
  )
}

/** Approximation procédurale, utilisée si public/xbox360.glb est absent. */
function buildProceduralXbox(THREE: typeof import('three')) {
  const g = new THREE.Group()

  const white = new THREE.MeshStandardMaterial({ color: 0xf4f4f2, roughness: 0.38, metalness: 0.04 })
  const grey = new THREE.MeshStandardMaterial({ color: 0xbfc3c4, roughness: 0.3, metalness: 0.3 })
  const dark = new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: 0.6 })

  // Corps principal (360 Slim : parallélépipède à arêtes adoucies).
  const body = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.05, 2.5, 4, 2, 4), white)
  g.add(body)

  // Bandeau latéral chromé.
  const band = new THREE.Mesh(new THREE.BoxGeometry(4.62, 0.12, 2.52), grey)
  band.position.y = 0.12
  g.add(band)

  // Grille d'aération : lamelles instanciées sur la moitié gauche.
  const slat = new THREE.BoxGeometry(0.055, 0.06, 2.2)
  const slats = new THREE.InstancedMesh(slat, dark, 26)
  const m = new THREE.Matrix4()
  for (let i = 0; i < 26; i++) {
    m.makeTranslation(-2.15 + i * 0.075, 0.53, 0)
    slats.setMatrixAt(i, m)
  }
  g.add(slats)

  // Bouton power + son anneau.
  const power = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.07, 32), grey)
  power.rotation.x = Math.PI / 2
  power.position.set(1.5, 0.05, 1.26)
  g.add(power)
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.26, 0.03, 12, 40),
    new THREE.MeshStandardMaterial({ color: 0xdfdfdf, roughness: 0.45 }),
  )
  ring.position.set(1.5, 0.05, 1.24)
  g.add(ring)

  // Fente du lecteur.
  const slot = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.05, 0.04), dark)
  slot.position.set(0.55, 0.1, 1.26)
  g.add(slot)

  return g
}
