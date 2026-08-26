/**
 * Résolution des assets avec repli en cascade.
 *
 *   public/assets/<override>   →   public/nxe/<original>   →   généré en CSS
 *
 * Rien n'est obligatoire : si les deux dossiers sont vides le site s'affiche
 * quand même, avec les dégradés relevés sur les références (cf. SPEC § 9.3).
 */

const cache = new Map<string, Promise<string | null>>()

function probeImage(url: string): Promise<string | null> {
  if (cache.has(url)) return cache.get(url)!
  const p = new Promise<string | null>((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img.naturalWidth > 0 ? url : null)
    img.onerror = () => resolve(null)
    img.src = url
  })
  cache.set(url, p)
  return p
}

/** Premier candidat qui charge réellement, ou null. Images uniquement. */
export async function firstAvailable(...candidates: string[]): Promise<string | null> {
  for (const c of candidates) {
    const ok = await probeImage(c)
    if (ok) return ok
  }
  return null
}

const fileCache = new Map<string, Promise<string | null>>()

/**
 * Sonde un fichier quelconque — modèle 3D, son… — par requête HTTP.
 *
 * `firstAvailable` ne convient pas ici : elle teste avec `new Image()`, qui
 * échoue systématiquement sur un `.glb` puisque le navigateur ne sait pas le
 * décoder comme une image.
 *
 * Le code 200 ne suffit PAS à conclure que le fichier existe : le serveur de
 * dev de Vite comme le `try_files $uri $uri/ /index.html` de nginx renvoient
 * la page HTML de l'application pour tout chemin inconnu. Sans le contrôle du
 * type de contenu, la sonde validait `/assets/avatar.glb` inexistant et le
 * chargeur 3D recevait du HTML.
 */
export async function firstFileAvailable(...candidates: string[]): Promise<string | null> {
  for (const url of candidates) {
    let p = fileCache.get(url)
    if (!p) {
      p = fetch(url, { method: 'HEAD' })
        .then((r) => {
          if (!r.ok) return null
          const type = r.headers.get('content-type') ?? ''
          return type.includes('text/html') ? null : url
        })
        .catch(() => null)
      fileCache.set(url, p)
    }
    const ok = await p
    if (ok) return ok
  }
  return null
}

export const SKY_CANDIDATES = ['/assets/background.jpg', '/assets/background.png', '/nxe/bg.png']
export const FLOOR_CANDIDATES = ['/assets/floor.png', '/nxe/bgFloor.png']
export const TILE_CANDIDATES = ['/assets/tile.png', '/assets/tile.jpg', '/nxe/cards/BlankGreen.jpg']
export const PANEL_CANDIDATES = ['/assets/panel.png', '/nxe/BackgroundPanel.png']

/**
 * Icônes NXE d'origine, quand le glyphe demandé en a une.
 * `music` et `film` sont des alias : autant utiliser les vraies icônes
 * « Music Library » et « Video Library » plutôt qu'un SVG approchant.
 */
export const NXE_ICONS: Partial<Record<string, string>> = {
  musiclib: '/nxe/icons/icon_musiclib.png',
  picturelib: '/nxe/icons/icon_picturelib.png',
  videolib: '/nxe/icons/icon_videolib.png',
  gamelib: '/nxe/icons/icon_gamelib.png',
  settings: '/nxe/icons/icon_settings.png',
  music: '/nxe/icons/icon_musiclib.png',
  film: '/nxe/icons/icon_videolib.png',
}

export function iconCandidates(glyph: string): string[] {
  const list = [`/assets/icons/${glyph}.png`, `/assets/icons/${glyph}.svg`]
  const nxe = NXE_ICONS[glyph]
  if (nxe) list.push(nxe)
  return list
}

/** Applique les images de fond résolues sur :root, une fois pour toutes. */
export async function installSceneAssets(): Promise<{
  sky: boolean
  floor: boolean
  tile: boolean
  panel: boolean
}> {
  const [sky, floor, tile, panel] = await Promise.all([
    firstAvailable(...SKY_CANDIDATES),
    firstAvailable(...FLOOR_CANDIDATES),
    firstAvailable(...TILE_CANDIDATES),
    firstAvailable(...PANEL_CANDIDATES),
  ])
  const root = document.documentElement.style
  if (sky) root.setProperty('--sky-image', `url("${sky}")`)
  if (floor) root.setProperty('--floor-image', `url("${floor}")`)
  if (tile) root.setProperty('--tile-image', `url("${tile}")`)
  if (panel) root.setProperty('--panel-texture', `url("${panel}")`)
  return { sky: !!sky, floor: !!floor, tile: !!tile, panel: !!panel }
}
