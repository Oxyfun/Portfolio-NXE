/**
 * Rangée de tuiles en fuite.
 *
 * Modèle relevé sur image4 (SPEC § 2) :
 *   – facteur d'échelle constant K = 0.83 par tuile ;
 *   – toutes les tuiles sont centrées sur la même ligne (l'horizon) ;
 *   – le pas horizontal vaut 0.79 × la largeur de la tuile précédente.
 *
 * Positions en `calc()` sur les variables de scène : aucune écoute de resize,
 * et la mise en page reste correcte à n'importe quel ratio d'écran.
 */

import { memo } from 'react'
import type { Tile } from '../data/content'
import { NxeGlyph } from '../lib/glyphs'

/* Exportés : l'avatar 3D est arrimé à la tuile d'indice 1 et doit avancer,
   grandir et sortir exactement comme elle. Une seule source pour la géométrie
   de la rangée, sinon les deux dérivent. */
export const K = 0.83
const ADVANCE = 0.79

/**
 * Décalage cumulé du bord gauche, en multiples de la largeur d'une tuile pleine.
 *
 * Les quatre premières valeurs sont relevées directement sur image4 : la suite
 * n'est pas exactement géométrique (0.748 puis 0.713 puis 0.552 de pas), et
 * caler un facteur unique laissait 15 px d'erreur sur la deuxième tuile — visible.
 * Au-delà de la quatrième, on prolonge géométriquement.
 */
const CUM = [0, 0.7483, 1.461, 2.0133]

export function advanceCoef(r: number): number {
  if (r <= 0) return r * ADVANCE // tuiles dépassées : elles sortent par la gauche
  if (r < CUM.length) return CUM[r]
  let c = CUM[CUM.length - 1]
  let step = (CUM[CUM.length - 1] - CUM[CUM.length - 2]) * K
  for (let i = CUM.length; i <= r; i++) {
    c += step
    step *= K
  }
  return c
}

function TileFace({ tile }: { tile: Tile }) {
  return (
    <div
      className="tile-face"
      style={tile.image ? { backgroundImage: `url("${tile.image}")` } : undefined}
    >
      <div className="tile-scrim" />
      <div className="tile-glyph">
        <NxeGlyph glyph={tile.glyph} />
      </div>
      <div className="tile-label">
        <span className="tile-title">{tile.title}</span>
        <span className="tile-sub">{tile.subtitle}</span>
      </div>
    </div>
  )
}

/**
 * Reflet au sol.
 *
 * Relevé au pixel sur image4 : juste sous la tuile, le sol vaut `#8f969d`
 * contre `#8c929e` en zone nue — soit +3 seulement. Et à l'endroit du titre
 * inversé, +6 à +12. Autrement dit le NXE ne renvoie PAS un miroir de la
 * tuile (qui produirait une bande sombre, la tuile étant presque noire en
 * bas) : il ne renvoie que la lumière. On ne duplique donc que le texte, sans
 * fond ni voile, par-dessus le halo de `.tile-glow`.
 */
function TileReflection({ tile }: { tile: Tile }) {
  return (
    <div className="tile-reflection" aria-hidden>
      <div className="tile-label">
        <span className="tile-title">{tile.title}</span>
        <span className="tile-sub">{tile.subtitle}</span>
      </div>
    </div>
  )
}

interface Props {
  tiles: Tile[]
  selected: number
  onSelect(index: number): void
  onOpen(index: number): void
}

function TileRowImpl({ tiles, selected, onSelect, onOpen }: Props) {
  return (
    <div className="row">
      {tiles.map((tile, i) => {
        const r = i - selected
        const scale = r <= 0 ? 1 : Math.pow(K, r)
        const x = `calc(var(--margin-x) + var(--tile-w) * ${advanceCoef(r).toFixed(4)})`
        const y = `calc(var(--row-cy) - var(--tile-h) * ${(scale / 2).toFixed(4)})`
        /* Point de départ de l'animation d'arrivée : la place de la PREMIÈRE
           carte. Toutes commencent empilées là, puis se dépilent vers la droite
           l'une après l'autre — c'est le geste d'un paquet qu'on étale. */
        const x0 = `calc(var(--margin-x) + var(--tile-w) * ${advanceCoef(0).toFixed(4)})`
        const y0 = `calc(var(--row-cy) - var(--tile-h) * 0.5)`

        return (
          <button
            key={tile.id}
            type="button"
            className={`tile${r === 0 ? ' is-selected' : ''}`}
            style={{
              transform: `translate(${x}, ${y}) scale(${scale.toFixed(4)})`,
              /* Le thème NPE embarque HUIT fonds de carte (420 × 320, le format
                 exact de nos tuiles) : même vert à 5 unités près, seuls les
                 motifs de ronds changent. C'est ce que montrent les références —
                 la couleur ne varie pas d'une carte à l'autre, le motif si.
                 J'avais fait varier la teinte, ce qui n'était pas demandé. */
              ['--tile-i' as string]: String(i),
              ['--tile-motif' as string]: `url("/nxe/cards/bg${(i % 8) + 1}.png")`,
              ['--x' as string]: x,
              ['--y' as string]: y,
              ['--s' as string]: scale.toFixed(4),
              ['--x0' as string]: x0,
              ['--y0' as string]: y0,
              zIndex: 1000 - i,
              opacity: r < 0 ? 0 : 1,
              pointerEvents: r < 0 ? 'none' : 'auto',
            }}
            aria-current={r === 0 ? 'true' : undefined}
            /* Plus de sélection au survol : passer la souris au-dessus de la
               rangée faisait défiler les cartes sans qu'on l'ait demandé. On
               sélectionne au clic, à la molette ou aux flèches. */
            onClick={() => (r === 0 ? onOpen(i) : onSelect(i))}
            onFocus={() => r !== 0 && onSelect(i)}
          >
            <span className="sr-only">
              {tile.title} — {tile.subtitle}
            </span>
            <div className="tile-glow" aria-hidden />
            <TileReflection tile={tile} />
            <TileFace tile={tile} />
          </button>
        )
      })}
    </div>
  )
}

export const TileRow = memo(TileRowImpl)
