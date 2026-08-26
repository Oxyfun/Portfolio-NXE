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

  const [sectionIdx, setSectionIdx] = useState(0)
  const [tileIdx, setTileIdx] = useState(0)
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  const [rowIdx, setRowIdx] = useState(0)

  const section = sections[sectionIdx]
  const tiles = section.tiles
  const previousLabel = useMemo(
    () => sections[(sectionIdx - 1 + sections.length) % sections.length].label,
    [sectionIdx],
  )

  useEffect(() => {
    void installSceneAssets()
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
        }
        return next
      })
    },
    [play],
  )

  const open = useCallback(
    (i: number) => {
      setOpenIdx(i)
      setRowIdx(0)
      play('unfold')
    },
    [play],
  )

  const close = useCallback(() => {
    setOpenIdx(null)
    play('back')
  }, [play])

  const activateRow = useCallback(
    (i: number) => {
      const tile = tiles[openIdx ?? 0]
      const row = tile?.detail.rows[i]
      play('select')
      if (row?.href) window.open(row.href, '_blank', 'noopener')
    },
    [tiles, openIdx, play],
  )

  /* Le survol ne sélectionne qu'à partir du moment où la souris a bougé sur le
     dashboard. Sinon, cliquer sur la console au centre de l'écran ouvrait le
     dashboard avec la tuile qui se trouvait sous le curseur déjà sélectionnée. */
  const pointerMoved = useRef(false)
  useEffect(() => {
    if (!booted) return
    pointerMoved.current = false
    const onMove = () => {
      pointerMoved.current = true
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [booted])

  const selectTile = useCallback(
    (i: number) => {
      if (!pointerMoved.current) return
      setTileIdx((cur) => {
        if (i === cur) return cur
        play(i > cur ? 'moveRight' : 'moveLeft')
        return i
      })
    },
    [play],
  )

  // ── Clavier ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!booted) return
    const onKey = (e: KeyboardEvent) => {
      const isOpen = openIdx !== null
      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault()
          if (!isOpen) moveTile(1)
          break
        case 'ArrowLeft':
          e.preventDefault()
          if (!isOpen) moveTile(-1)
          break
        case 'ArrowDown':
          e.preventDefault()
          if (isOpen) {
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
            if (tiles[openIdx].detail.rows.length) {
              setRowIdx((r) => Math.max(0, r - 1))
              play('focus')
            }
          } else moveSection(-1)
          break
        case 'Enter':
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
  }, [booted, openIdx, tileIdx, rowIdx, tiles, moveTile, moveSection, open, close, activateRow, play])

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
            window.setTimeout(() => setEntering(false), 560)
          }}
        />
        <CrtSoftness />
      </>
    )
  }

  const openTile = openIdx !== null ? tiles[openIdx] : null

  return (
    <>
      <main className={`dash${entering ? ' is-entering' : ''}`}>
      <Background />
      <Header previous={previousLabel} current={section.label} hidden={!!openTile} />
      <Profile />

      <TileRow tiles={tiles} selected={tileIdx} onSelect={selectTile} onOpen={open} />
      <Avatar3D selected={tileIdx} lameOuverte={openIdx !== null} />

      <Footer
        index={tileIdx}
        total={tiles.length}
        showCounter={!openTile}
        actions={openTile ? { a: 'Ouvrir', b: 'Retour' } : { a: 'Sélectionner' }}
      />
      <GuideOrb />

      {openTile && (
        <DetailBlade
          tile={openTile}
          activeRow={rowIdx}
          onRowChange={setRowIdx}
          onActivate={activateRow}
          onClose={close}
        />
      )}
      </main>

      {/* Le flou d'abord, puis la grille et le cadre par-dessus : sur un tube,
          l'image est molle, la grille d'ouverture et le cadre ne le sont pas. */}
      <CrtSoftness />
      <CrtOverlay />
    </>
  )
}
