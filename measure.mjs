/**
 * measure.mjs — relève la géométrie réelle du DOM et la confronte aux cibles
 * mesurées sur reference/image4.png. Complément de compare.mjs : la carte de
 * différence dit « ça ne colle pas », celle-ci dit « de combien, et où ».
 *
 *   node measure.mjs [--url http://localhost:5173]
 */

import { chromium } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const argv = process.argv.slice(2)
const i = argv.indexOf('--url')
const BASE = i >= 0 ? argv[i + 1] : 'http://localhost:5173'

const VW = 1264
const VH = 667
const S = VH / 1334 // référence → viewport

/** Cibles relevées sur image4 (contenu 2526 × 1334), converties. */
const TARGETS = {
  'tile0.left': (173 / 2526) * VW,
  'tile0.top': 493 * S,
  'tile0.width': (736 / 2526) * VW,
  'tile0.height': 559 * S,
  'tile1.top': 540 * S,
  'tile1.height': 461 * S,
  'tile1.right': (1329 / 2526) * VW,
  'tile2.right': (1759 / 2526) * VW,
  // les y ci-dessous sont relevés sur l'image brute : -34 px de barre navigateur
  'crumb1.capTop': (121 - 34) * S,
  'crumb2.capTop': (171 - 34) * S,
  'crumb3.capTop': (239 - 34) * S,
  'avatar.size': 123 * S,
  'avatar.right': (2440 / 2526) * VW,
  'avatar.top': (89 - 34) * S,
  'legendA.size': 42 * S,
  'legendA.left': (183 / 2526) * VW,
  'legendA.centerY': (1256.5 - 34) * S,
  'counter.textTop': (1131 - 34) * S,
  'legendLabel.textTop': (1247 - 34) * S,
  // orbe Guide : la sphère occupe 46 % du PNG ; le X vert relevé fait 69 px,
  // ce qui donne un PNG rendu à 201 px, bord droit à x = 2385 (image4).
  'orb.size': 201 * S,
  'orb.right': (2385.5 / 2526) * VW,
  'orb.bottom': (1334 - 34) * S,
}

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1 })
const page = await ctx.newPage()
await page.goto(BASE + '/?boot=0', { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(800)
await page.keyboard.press('ArrowDown')
await page.waitForTimeout(700)

const got = await page.evaluate(() => {
  const out = {}
  const r = (el) => el.getBoundingClientRect()

  const tiles = [...document.querySelectorAll('.tile')]
  tiles.slice(0, 3).forEach((t, i) => {
    const b = r(t.querySelector(':scope > .tile-face'))
    out[`tile${i}.left`] = b.left
    out[`tile${i}.top`] = b.top
    out[`tile${i}.right`] = b.right
    out[`tile${i}.bottom`] = b.bottom
    out[`tile${i}.width`] = b.width
    out[`tile${i}.height`] = b.height
  })

  // Hauteur de capitale réelle : on mesure via un canvas, pas via la boîte.
  const capTop = (el) => {
    const b = r(el)
    const cs = getComputedStyle(el)
    const fs = parseFloat(cs.fontSize)
    const c = document.createElement('canvas').getContext('2d')
    c.font = `${fs}px ${cs.fontFamily}`
    const m = c.measureText('H')
    // baseline = top + (lineHeight - (asc+desc))/2 + asc, avec line-height:1
    const lh = parseFloat(cs.lineHeight) || fs
    const fm = c.measureText('Hg')
    const asc = fm.fontBoundingBoxAscent ?? m.actualBoundingBoxAscent
    const desc = fm.fontBoundingBoxDescent ?? 0
    const baseline = b.top + (lh - (asc + desc)) / 2 + asc
    return baseline - m.actualBoundingBoxAscent
  }
  const textWidth = (el) => {
    const cs = getComputedStyle(el)
    const c = document.createElement('canvas').getContext('2d')
    c.font = `${parseFloat(cs.fontSize)}px ${cs.fontFamily}`
    return c.measureText(el.textContent).width
  }

  const c1 = document.querySelector('.crumb-1')
  const c2 = document.querySelector('.crumb-2')
  const c3 = document.querySelector('.crumb-3')
  out['crumb1.capTop'] = capTop(c1)
  out['crumb2.capTop'] = capTop(c2)
  out['crumb3.capTop'] = capTop(c3)
  out['crumb1.textWidth'] = textWidth(c1)
  out['crumb2.textWidth'] = textWidth(c2)
  out['crumb3.textWidth'] = textWidth(c3)

  const av = document.querySelector('.profile-avatar')
  const ab = r(av)
  out['avatar.size'] = ab.width
  out['avatar.right'] = ab.right
  out['avatar.top'] = ab.top

  const la = document.querySelector('.legend-item img, .legend-dot')
  if (la) {
    const lb = r(la)
    out['legendA.size'] = lb.width
    out['legendA.left'] = lb.left
    out['legendA.centerY'] = (lb.top + lb.bottom) / 2
  }

  const counter = document.querySelector('.counter')
  const cb = r(counter)
  out['counter.textTop'] = capTop(counter)
  out['counter.textBottom'] = cb.bottom

  const label = document.querySelector('.legend-item')
  const lbb = r(label)
  out['legendLabel.textTop'] = capTop(label)
  out['legendLabel.textBottom'] = lbb.bottom

  const orb = document.querySelector('.guide-orb')
  if (orb) {
    const ob = r(orb)
    out['orb.size'] = ob.width
    out['orb.right'] = ob.right
    out['orb.bottom'] = ob.bottom
  }

  const glyph = document.querySelector('.tile .tile-glyph')
  if (glyph) {
    const gb = r(glyph)
    const tb = r(document.querySelector('.tile .tile-face'))
    out['glyph.relLeft'] = (gb.left - tb.left) / tb.width
    out['glyph.relTop'] = (gb.top - tb.top) / tb.height
    out['glyph.relH'] = gb.height / tb.height
  }
  return out
})

await browser.close()

console.log(`\n  viewport ${VW}×${VH} — cibles issues de reference/image4.png\n`)
console.log('  ' + 'mesure'.padEnd(22) + 'cible'.padStart(9) + 'obtenu'.padStart(10) + 'écart'.padStart(9))
console.log('  ' + '─'.repeat(50))
let worst = []
for (const [k, target] of Object.entries(TARGETS)) {
  const v = got[k]
  if (v == null) {
    console.log(`  ${k.padEnd(22)}${target.toFixed(1).padStart(9)}${'—'.padStart(10)}`)
    continue
  }
  const d = v - target
  const flag = Math.abs(d) > 3 ? '  ←' : ''
  console.log(
    `  ${k.padEnd(22)}${target.toFixed(1).padStart(9)}${v.toFixed(1).padStart(10)}${(d >= 0 ? '+' : '') + d.toFixed(1)}`.padEnd(
      52,
    ) + flag,
  )
  if (Math.abs(d) > 3) worst.push([k, d])
}
console.log('\n  autres :')
for (const [k, v] of Object.entries(got)) {
  if (!(k in TARGETS)) console.log(`    ${k.padEnd(22)} ${typeof v === 'number' ? v.toFixed(2) : v}`)
}
if (worst.length) {
  console.log('\n  hors tolérance (±3 px) : ' + worst.map(([k, d]) => `${k} ${d.toFixed(1)}`).join(', '))
}
console.log('')
void ROOT
