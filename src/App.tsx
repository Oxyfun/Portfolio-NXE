import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { sections } from './data/content'
import { installSceneAssets } from './lib/assets'
import { useSounds } from './hooks/useSounds'
import { useGamepad } from './hooks/useGamepad'
import { Background, Footer, GuideOrb, Header, Profile } from './components/Chrome'
import { TileRow } from './components/TileRow'
import { DetailBlade } from './components/DetailBlade'
import { BootScreen } from './components/BootScreen'
import { CrtOverlay, CrtSoftness } from './components/Crt'
import { Avatar3D } from './components/Avatar3D'
import { Cursor } from './components/Cursor'

/** `?boot=0` saute l'écran d'accueil — utilisé par compare.mjs. */
function skipBoot(): boolean {
  if (typeof location === 'undefined') return false
  const v = new URLSearchParams(location.search).get('boot')
  return v === '0' || v === 'false'
}

export default function App() {
  const { play, unlock } = useSounds()
  const [booted, setBooted] = useState(skipBoot)
  const [entering, setEntering] = useState(false)
  const [retour, setRetour] = useState(false)

  const [sectionIdx, setSectionIdx] = useState(0)
  const [tileIdx, setTileIdx] = useState(0)
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  const [rowIdx, setRowIdx] = useState(0)
  /* Quelle colonne de la lame a la main : la liste d'actions à gauche, ou le
     panneau de détail à droite. Flèche droite pour y aller, gauche pour en
     revenir. Le panneau actif s'éclaircit et se laisse défiler aux flèches. */
  const [zone, setZone] = useState<'liste' | 'detail'>('liste')

  const section = sections[sectionIdx]
  const tiles = section.tiles
  const libelles = useMemo(() => sections.map((s) => s.label), [])

  useEffect(() => {
    void installSceneAssets()
  }, [])

  /* Dépilement : les cartes partent empilées sur la première et s'étalent vers
     la droite. Sert à l'arrivée depuis l'écran d'accueil ET à chaque changement
     de section — c'est un nouveau jeu de cartes à chaque fois. Il ne fait plus
     de flash depuis qu'il n'anime plus l'opacité. */
  const entreeTimer = useRef(0)
  const rejouerEntree = useCallback(() => {
    setEntering(false)
    window.clearTimeout(entreeTimer.current)
    /* Un cadre d'arrêt avant de remettre la classe : sans ça React regroupe les
       deux mises à jour, la classe n'est jamais retirée du DOM et l'animation ne
       redémarre pas. */
    requestAnimationFrame(() => {
      setEntering(true)
      entreeTimer.current = window.setTimeout(() => setEntering(false), 1200)
    })
  }, [])

  /* Retour depuis une lame : simple coulissement, pas de dépilement. Les cartes
     n'ont jamais bougé, les faire repartir du paquet n'aurait aucun sens. */
  const retourTimer = useRef(0)
  const rejouerRetour = useCallback(() => {
    setRetour(false)
    window.clearTimeout(retourTimer.current)
    requestAnimationFrame(() => {
      setRetour(true)
      retourTimer.current = window.setTimeout(() => setRetour(false), 800)
    })
  }, [])

  // ── Navigation ─────────────────────────────────────────────────────────
  const moveTile = useCallback(
    (delta: number) => {
      setTileIdx((cur) => {
        const next = Math.min(tiles.length - 1, Math.max(0, cur + delta))
        if (next !== cur) play(delta > 0 ? 'moveRight' : 'moveLeft')
        return next
      })
    },
    [tiles.length, play],
  )

  const moveSection = useCallback(
    (delta: number) => {
      setSectionIdx((cur) => {
        const next = (cur + delta + sections.length) % sections.length
        if (next !== cur) {
          play('section')
          setTileIdx(0)
          rejouerEntree()
        }
        return next
      })
    },
    [play, rejouerEntree],
  )

  /* Saut direct à une section : c'est ce que fait le fil d'Ariane, où chaque
     ligne mène à la section qu'elle nomme. */
  const allerSection = useCallback(
    (i: number) => {
      setSectionIdx((cur) => {
        if (i === cur) return cur
        play('section')
        setTileIdx(0)
        rejouerEntree()
        return i
      })
    },
    [play, rejouerEntree],
  )

  const open = useCallback(
    (i: number) => {
      setOpenIdx(i)
      setRowIdx(0)
      setZone('liste')
      play('unfold')
    },
    [play],
  )

  const close = useCallback(() => {
    setOpenIdx(null)
    setZone('liste')
    play('back')
    rejouerRetour()
  }, [play, rejouerRetour])

  const activateRow = useCallback(
    (i: number) => {
      const tile = tiles[openIdx ?? 0]
      const row = tile?.detail.rows[i]
      play('select')
      if (row?.href) window.open(row.href, '_blank', 'noopener')
    },
    [tiles, openIdx, play],
  )

  const selectTile = useCallback(
    (i: number) => {
      setTileIdx((cur) => {
        if (i === cur) return cur
        play(i > cur ? 'moveRight' : 'moveLeft')
        return i
      })
    },
    [play],
  )

  /* Molette : un cran = une tuile. Le survol ne sélectionne plus — passer la
     souris au-dessus de la rangée faisait défiler les cartes sans qu'on ait
     rien demandé. On accumule le delta plutôt que de réagir à chaque
     événement : un pavé tactile en émet des dizaines par geste, et sans seuil
     on traverserait toute la rangée d'un coup. */
  const wheelLock = useRef(0)
  useEffect(() => {
    if (!booted) return
    /* Un cran de molette = une carte, quelle que soit sa force.
       L'accumulateur précédent était faux dans les deux sens : une souris qui
       envoie 100 « points » d'un coup en franchissait le seuil deux fois et
       sautait une carte, tandis qu'un pavé tactile qui en envoie 8 à la fois
       demandait deux gestes pour en franchir un seul. On ne compte donc plus la
       distance : on prend le SENS du premier événement et on se verrouille le
       temps que la salve retombe. */
    const VERROU = 320
    /* 1 et non 4 : un pavé tactile envoie des deltas de 3 ou moins et se
       retrouvait entièrement ignoré. Le verrou temporel suffit seul à éviter
       les crans multiples, le seuil ne sert qu'à écarter le bruit. */
    const MINI = 1
    const onWheel = (e: WheelEvent) => {
      /* Une zone qui peut défiler d'elle-même (le corps de la lame) garde la
         molette. `instanceof Element` et non un simple `?.` : la cible d'un
         événement peut être `window` ou `document`, qui n'ont pas de
         `closest` — l'appeler y lève une exception et le gestionnaire ne fait
         plus rien du tout. */
      const cible = e.target
      if (cible instanceof Element && cible.closest('.blade-body')) return
      e.preventDefault()
      if (openIdx !== null) return
      const d = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX
      if (Math.abs(d) < MINI) return
      const now = performance.now()
      if (now < wheelLock.current) return
      wheelLock.current = now + VERROU
      moveTile(Math.sign(d))
    }
    window.addEventListener('wheel', onWheel, { passive: false })
    return () => window.removeEventListener('wheel', onWheel)
  }, [booted, openIdx, moveTile])

  // ── Clavier ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!booted) return
    const onKey = (e: KeyboardEvent) => {
      const isOpen = openIdx !== null
      /* Un bouton qui a le focus gère lui-même Entrée et Espace : on ne les
         intercepte pas, sinon la navigation au clavier déclencherait deux
         actions à la fois. Idem pour le corps de la lame, qui doit pouvoir
         défiler aux flèches quand il a le focus. */
      const cible = e.target
      if (
        cible instanceof Element &&
        cible.closest('.blade-body') &&
        (e.key === 'ArrowDown' || e.key === 'ArrowUp')
      )
        return
      if (cible instanceof HTMLElement && cible.matches('button, a, [tabindex]') &&
          (e.key === 'Enter' || e.key === ' ')) return
      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault()
          if (isOpen) {
            setZone('detail')
            play('focus')
          } else moveTile(1)
          break
        case 'ArrowLeft':
          e.preventDefault()
          if (isOpen) {
            setZone('liste')
            play('focus')
          } else moveTile(-1)
          break
        case 'ArrowDown':
          e.preventDefault()
          if (isOpen) {
            // Zone « detail » : on laisse le panneau défiler tout seul.
            if (zone === 'detail') return
            const n = tiles[openIdx].detail.rows.length
            if (n) {
              setRowIdx((r) => Math.min(n - 1, r + 1))
              play('focus')
            }
          } else moveSection(1)
          break
        case 'ArrowUp':
          e.preventDefault()
          if (isOpen) {
            if (zone === 'detail') return
            if (tiles[openIdx].detail.rows.length) {
              setRowIdx((r) => Math.max(0, r - 1))
              play('focus')
            }
          } else moveSection(-1)
          break
        case 'Enter':
        case ' ':
          e.preventDefault()
          if (isOpen) activateRow(rowIdx)
          else open(tileIdx)
          break
        case 'Escape':
        case 'Backspace':
          e.preventDefault()
          if (isOpen) close()
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [booted, openIdx, tileIdx, rowIdx, zone, tiles, moveTile, moveSection, open, close, activateRow, play])

  // ── Manette ────────────────────────────────────────────────────────────
  useGamepad(
    {
      left: () => openIdx === null && moveTile(-1),
      right: () => openIdx === null && moveTile(1),
      up: () =>
        openIdx === null
          ? moveSection(-1)
          : (setRowIdx((r) => Math.max(0, r - 1)), play('focus')),
      down: () =>
        openIdx === null
          ? moveSection(1)
          : (setRowIdx((r) => Math.min(tiles[openIdx].detail.rows.length - 1, r + 1)), play('focus')),
      confirm: () => (openIdx === null ? open(tileIdx) : activateRow(rowIdx)),
      cancel: () => openIdx !== null && close(),
    },
    booted,
  )

  // ── Rendu ──────────────────────────────────────────────────────────────
  /* `CrtScreen` floute son contenu : il enveloppe TOUT, y compris l'écran
     d'accueil. `CrtOverlay` (rayures + cadre arrondi) n'apparaît qu'une fois
     dans le dashboard — sur l'accueil on ne veut que le flou. */
  if (!booted) {
    return (
      <>
        <BootScreen
          play={play}
          onDone={() => {
            unlock()
            setBooted(true)
            setEntering(true)
            /* 1200 ms : le dépilement dure 640 ms plus 165 par carte. À 560 la
               classe tombait avant la fin et les dernières cartes sautaient. */
            window.setTimeout(() => setEntering(false), 1200)
          }}
        />
        <CrtSoftness />
      </>
    )
  }

  const openTile = openIdx !== null ? tiles[openIdx] : null

  return (
    <>
      <main
        className={`dash${entering ? ' is-entering' : ''}${retour ? ' is-returning' : ''}${
          openTile ? ' has-blade' : ''
        }`}
      >
      <Background />
      <Header
        sections={libelles}
        index={sectionIdx}
        hidden={!!openTile}
        onAller={allerSection}
      />
      <Profile />

      <TileRow tiles={tiles} selected={tileIdx} onSelect={selectTile} onOpen={open} />
      <Avatar3D selected={tileIdx} lameOuverte={openIdx !== null} actif={sectionIdx === 0} />

      <Footer
        index={tileIdx}
        total={tiles.length}
        showCounter={!openTile}
        actions={
          openTile
            ? {
                a: { label: 'Ouvrir', onPress: () => activateRow(rowIdx) },
                b: { label: 'Retour', onPress: close },
              }
            : { a: { label: 'Sélectionner', onPress: () => open(tileIdx) } }
        }
      />
      <GuideOrb />

      {openTile && (
        <DetailBlade
          tile={openTile}
          activeRow={rowIdx}
          onRowChange={setRowIdx}
          onActivate={activateRow}
          onClose={close}
          zone={zone}
          onZone={setZone}
        />
      )}
      </main>

      {/* Le flou d'abord, puis la grille et le cadre par-dessus : sur un tube,
          l'image est molle, la grille d'ouverture et le cadre ne le sont pas. */}
      <CrtSoftness />
      <CrtOverlay />
      <Cursor />
    </>
  )
}
