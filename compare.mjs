/**
 * compare.mjs - boucle de fidélité visuelle.
 *
 * Ouvre le site, capture, et pose la capture À CÔTÉ de la référence
 * correspondante dans une planche de comparaison, plus une carte de différence
 * absolue. Échoue si une erreur console apparaît.
 *
 * Usage :
 *   node compare.mjs                 # utilise le serveur de dev (npm run dev)
 *   node compare.mjs --preview       # démarre `vite preview` sur le build
 *   node compare.mjs --iter 3        # nomme les sorties shots/iter-03-*
 *   node compare.mjs --url http://…  # cible explicite
 *
 * Sorties dans shots/ :
 *   iter-NN-<vue>.png        capture brute
 *   iter-NN-<vue>-side.png   référence | capture, côte à côte
 *   iter-NN-<vue>-diff.png   différence absolue amplifiée
 *   report.json              scores par vue, historique des itérations
 */

import { chromium } from '@playwright/test'
import { spawn } from 'node:child_process'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { PNG } from 'pngjs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const SHOTS = path.join(ROOT, 'shots')
const REF = path.join(ROOT, 'reference')

const argv = process.argv.slice(2)
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`)
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : fallback
}
const has = (name) => argv.includes(`--${name}`)

const ITER = String(arg('iter', '1')).padStart(2, '0')
const USE_PREVIEW = has('preview')
const BASE = arg('url', USE_PREVIEW ? 'http://localhost:4173' : 'http://localhost:5173')

/**
 * Les vues à comparer. `ref` est la capture de référence, `viewport` est
 * choisi au ratio de cette référence pour que la comparaison au pixel ait un
 * sens (les références sont en ~1.90, pas en 16:9). `crop` retire l'habillage
 * navigateur présent sur certaines captures.
 */
const VIEWS = [
  {
    name: 'dash-projets',
    ref: 'image4.png',
    refCrop: { top: 34 },
    viewport: { width: 1264, height: 667 },
    url: '/?boot=0',
    setup: async (page) => {
      // section « Projets », première tuile
      await page.keyboard.press('ArrowDown')
      await page.waitForTimeout(600)
    },
  },
  {
    name: 'dash-accueil',
    ref: 'image2.png',
    viewport: { width: 1265, height: 665 },
    url: '/?boot=0',
    setup: async (page) => {
      await page.keyboard.press('ArrowRight')
      await page.waitForTimeout(600)
    },
  },
  {
    name: 'blade',
    ref: 'image5.png',
    viewport: { width: 1274, height: 665 },
    url: '/?boot=0',
    setup: async (page) => {
      await page.keyboard.press('ArrowDown')
      await page.waitForTimeout(400)
      await page.keyboard.press('Enter')
      await page.waitForTimeout(900)
    },
  },
  {
    name: 'boot',
    ref: 'image1.png',
    viewport: { width: 1261, height: 663 },
    url: '/?spin=0',
    setup: async (page) => {
      await page.waitForTimeout(1800)
    },
  },
  // Le format demandé par le brief, sans référence à ratio identique :
  // sert au contrôle de non-régression en 16:9.
  {
    name: 'fullhd',
    ref: 'image4.png',
    refCrop: { top: 34 },
    viewport: { width: 1920, height: 1080 },
    url: '/?boot=0',
    setup: async (page) => {
      await page.keyboard.press('ArrowDown')
      await page.waitForTimeout(600)
    },
  },
]

// ── Utilitaires image ─────────────────────────────────────────────────────

async function readPng(p) {
  return PNG.sync.read(await readFile(p))
}

function cropPng(src, crop) {
  if (!crop) return src
  const top = crop.top ?? 0
  const bottom = crop.bottom ?? 0
  const out = new PNG({ width: src.width, height: src.height - top - bottom })
  PNG.bitblt(src, out, 0, top, out.width, out.height, 0, 0)
  return out
}

/** Redimensionnement bilinéaire - suffisant, et évite une dépendance native. */
function resize(src, w, h) {
  const out = new PNG({ width: w, height: h })
  const sx = src.width / w
  const sy = src.height / h
  for (let y = 0; y < h; y++) {
    const fy = Math.min(src.height - 1, y * sy)
    const y0 = Math.floor(fy)
    const y1 = Math.min(src.height - 1, y0 + 1)
    const wy = fy - y0
    for (let x = 0; x < w; x++) {
      const fx = Math.min(src.width - 1, x * sx)
      const x0 = Math.floor(fx)
      const x1 = Math.min(src.width - 1, x0 + 1)
      const wx = fx - x0
      const o = (y * w + x) << 2
      for (let c = 0; c < 4; c++) {
        const p00 = src.data[((y0 * src.width + x0) << 2) + c]
        const p10 = src.data[((y0 * src.width + x1) << 2) + c]
        const p01 = src.data[((y1 * src.width + x0) << 2) + c]
        const p11 = src.data[((y1 * src.width + x1) << 2) + c]
        out.data[o + c] =
          p00 * (1 - wx) * (1 - wy) + p10 * wx * (1 - wy) + p01 * (1 - wx) * wy + p11 * wx * wy
      }
    }
  }
  return out
}

function sideBySide(a, b, gap = 16) {
  const h = Math.max(a.height, b.height)
  const out = new PNG({ width: a.width + gap + b.width, height: h })
  out.data.fill(24)
  PNG.bitblt(a, out, 0, 0, a.width, a.height, 0, 0)
  PNG.bitblt(b, out, 0, 0, b.width, b.height, a.width + gap, 0)
  return out
}

/** Différence absolue amplifiée + score moyen (0 = identique, 255 = opposé). */
function diffMap(a, b, gain = 3) {
  const out = new PNG({ width: a.width, height: a.height })
  let total = 0
  for (let i = 0; i < a.data.length; i += 4) {
    const dr = Math.abs(a.data[i] - b.data[i])
    const dg = Math.abs(a.data[i + 1] - b.data[i + 1])
    const db = Math.abs(a.data[i + 2] - b.data[i + 2])
    const d = (dr + dg + db) / 3
    total += d
    const v = Math.min(255, d * gain)
    out.data[i] = v
    out.data[i + 1] = v * 0.6
    out.data[i + 2] = v * 0.35
    out.data[i + 3] = 255
  }
  return { png: out, score: total / (a.data.length / 4) }
}

/** Moyenne d'une grille de blocs - utile pour situer l'écart, pas juste le chiffrer. */
function blockReport(a, b, cols = 6, rows = 4) {
  const bw = Math.floor(a.width / cols)
  const bh = Math.floor(a.height / rows)
  const grid = []
  for (let r = 0; r < rows; r++) {
    const line = []
    for (let c = 0; c < cols; c++) {
      let sum = 0
      let n = 0
      for (let y = r * bh; y < (r + 1) * bh; y += 2) {
        for (let x = c * bw; x < (c + 1) * bw; x += 2) {
          const i = (y * a.width + x) << 2
          sum +=
            (Math.abs(a.data[i] - b.data[i]) +
              Math.abs(a.data[i + 1] - b.data[i + 1]) +
              Math.abs(a.data[i + 2] - b.data[i + 2])) /
            3
          n++
        }
      }
      line.push(Math.round(sum / n))
    }
    grid.push(line)
  }
  return grid
}

// ── Serveur ───────────────────────────────────────────────────────────────

async function waitForServer(url, timeoutMs = 60000) {
  const t0 = Date.now()
  while (Date.now() - t0 < timeoutMs) {
    try {
      const r = await fetch(url, { method: 'GET' })
      if (r.ok || r.status === 304) return true
    } catch {
      /* pas encore prêt */
    }
    await new Promise((r) => setTimeout(r, 400))
  }
  return false
}

async function maybeStartServer() {
  if (await waitForServer(BASE, 1500)) return null
  const cmd = USE_PREVIEW ? ['run', 'preview'] : ['run', 'dev']
  const child = spawn('npm', cmd, {
    cwd: ROOT,
    stdio: 'ignore',
    shell: process.platform === 'win32',
  })
  const ok = await waitForServer(BASE, 90000)
  if (!ok) {
    child.kill()
    throw new Error(`Serveur injoignable sur ${BASE}`)
  }
  return child
}

// ── Boucle ────────────────────────────────────────────────────────────────

async function main() {
  await mkdir(SHOTS, { recursive: true })
  const server = await maybeStartServer()
  const browser = await chromium.launch()
  const results = []
  const consoleErrors = []

  try {
    for (const view of VIEWS) {
      const ctx = await browser.newContext({
        viewport: view.viewport,
        deviceScaleFactor: 1,
        reducedMotion: 'no-preference',
      })
      const page = await ctx.newPage()
      page.on('console', (m) => {
        if (m.type() === 'error') consoleErrors.push(`[${view.name}] ${m.text()}`)
      })
      page.on('pageerror', (e) => consoleErrors.push(`[${view.name}] ${e.message}`))

      await page.goto(BASE + view.url, { waitUntil: 'networkidle' })
      // Les polices et les images de fond doivent être posées avant la capture.
      await page.evaluate(() => document.fonts.ready)
      await page.waitForTimeout(900)
      await view.setup?.(page)
      await page.waitForTimeout(500)

      const shotPath = path.join(SHOTS, `iter-${ITER}-${view.name}.png`)
      await page.screenshot({ path: shotPath })
      await ctx.close()

      // Comparaison
      const refPath = path.join(REF, view.ref)
      if (!existsSync(refPath)) {
        results.push({ view: view.name, score: null, note: 'référence absente' })
        continue
      }
      const refRaw = cropPng(await readPng(refPath), view.refCrop)
      const shot = await readPng(shotPath)

      // On ramène la référence à la taille de la capture.
      const refScaled = resize(refRaw, shot.width, shot.height)

      const { png: diff, score } = diffMap(refScaled, shot)
      const grid = blockReport(refScaled, shot)

      await writeFile(
        path.join(SHOTS, `iter-${ITER}-${view.name}-side.png`),
        PNG.sync.write(sideBySide(refScaled, shot)),
      )
      await writeFile(path.join(SHOTS, `iter-${ITER}-${view.name}-diff.png`), PNG.sync.write(diff))

      results.push({
        view: view.name,
        ref: view.ref,
        viewport: `${view.viewport.width}x${view.viewport.height}`,
        score: +score.toFixed(2),
        grid,
      })
    }
  } finally {
    await browser.close()
    server?.kill()
  }

  // Rapport
  const reportPath = path.join(SHOTS, 'report.json')
  let history = []
  if (existsSync(reportPath)) {
    try {
      history = JSON.parse(await readFile(reportPath, 'utf8')).history ?? []
    } catch {
      history = []
    }
  }
  history = history.filter((h) => h.iter !== ITER)
  history.push({ iter: ITER, at: new Date().toISOString(), results, consoleErrors })
  history.sort((a, b) => a.iter.localeCompare(b.iter))
  await writeFile(reportPath, JSON.stringify({ history }, null, 2))

  console.log(`\n── itération ${ITER} ────────────────────────────────`)
  for (const r of results) {
    console.log(
      `  ${r.view.padEnd(14)} ${String(r.score ?? '-').padStart(7)}   (${r.viewport ?? ''} vs ${r.ref ?? ''})`,
    )
    if (r.grid) for (const line of r.grid) console.log('      ' + line.map((v) => String(v).padStart(4)).join(''))
  }
  const prev = history[history.length - 2]
  if (prev) {
    console.log('\n  évolution vs itération ' + prev.iter + ' :')
    for (const r of results) {
      const p = prev.results.find((x) => x.view === r.view)
      if (p?.score != null && r.score != null) {
        const d = r.score - p.score
        console.log(`    ${r.view.padEnd(14)} ${d >= 0 ? '+' : ''}${d.toFixed(2)}`)
      }
    }
  }
  if (consoleErrors.length) {
    console.error('\n  ERREURS CONSOLE :')
    consoleErrors.forEach((e) => console.error('    ' + e))
    process.exitCode = 1
  } else {
    console.log('\n  console : aucune erreur.')
  }
  console.log('')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
