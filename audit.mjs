/**
 * audit.mjs - plancher de qualité : erreurs console, temps de chargement,
 * focus clavier visible, prefers-reduced-motion, et captures mobile/tablette.
 *   node audit.mjs [--url http://localhost:4173]
 */
import { chromium, devices } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
const i = process.argv.indexOf('--url')
const BASE = i >= 0 ? process.argv[i + 1] : 'http://localhost:4173'
await mkdir('shots', { recursive: true })
const b = await chromium.launch()
const errs = []
let fail = false

async function page(ctx, url = '/?boot=0') {
  const p = await ctx.newPage()
  p.on('console', (m) => m.type() === 'error' && errs.push(`${url} ${m.text()}`))
  p.on('pageerror', (e) => errs.push(`${url} ${e.message}`))
  await p.goto(BASE + url, { waitUntil: 'networkidle' })
  return p
}

// 1. Temps de chargement jusqu'au premier rendu utile
{
  const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 } })
  const p = await page(ctx)
  const t = await p.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0]
    const fcp = performance.getEntriesByName('first-contentful-paint')[0]
    return { domContentLoaded: nav?.domContentLoadedEventEnd, load: nav?.loadEventEnd, fcp: fcp?.startTime }
  })
  console.log(`  chargement : FCP ${Math.round(t.fcp)} ms · DOMContentLoaded ${Math.round(t.domContentLoaded)} ms · load ${Math.round(t.load)} ms`)
  if (t.load > 2000) { console.log('    ⚠ au-dessus des 2 s visées'); fail = true }
  await ctx.close()
}

// 2. Focus clavier visible
{
  const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 } })
  const p = await page(ctx)
  await p.keyboard.press('Tab')
  const ok = await p.evaluate(() => {
    const el = document.activeElement
    if (!el || el === document.body) return null
    const cs = getComputedStyle(el)
    return { tag: el.tagName, outline: cs.outlineWidth, style: cs.outlineStyle, shadow: cs.boxShadow.slice(0, 40) }
  })
  console.log('  focus clavier :', ok ? `${ok.tag} outline ${ok.style} ${ok.outline}` : 'AUCUN ÉLÉMENT FOCUSABLE')
  if (!ok || ok.outline === '0px') { console.log('    ⚠ focus non visible'); fail = true }
  await p.screenshot({ path: 'shots/audit-focus.png' })
  await ctx.close()
}

// 3. prefers-reduced-motion
{
  const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 }, reducedMotion: 'reduce' })
  const p = await page(ctx)
  const durs = await p.evaluate(() =>
    [...document.querySelectorAll('.tile, .bg-sky, .crumb')].map((e) => getComputedStyle(e).transitionDuration + '/' + getComputedStyle(e).animationDuration),
  )
  // 0.01 ms est sérialisé « 1e-05s » par Chrome : c'est la valeur neutralisée.
  const neutral = (v) => parseFloat(v) <= 0.0002
  const moving = durs.filter((d) => !neutral(d.split('/')[0]))
  console.log('  reduced-motion :', moving.length === 0 ? 'toutes les transitions neutralisées' : `⚠ ${moving.length} encore animées (${moving[0]})`)
  if (moving.length) fail = true
  await ctx.close()
}

// 4. Captures responsive
for (const [name, cfg] of Object.entries({
  mobile: devices['iPhone 13'],
  'mobile-blade': devices['iPhone 13'],
  tablette: devices['iPad Mini'],
  'ultra-wide': { viewport: { width: 2560, height: 1080 } },
  'petite-hauteur': { viewport: { width: 1440, height: 520 } },
})) {
  const ctx = await b.newContext({ ...cfg, isMobile: cfg.isMobile ?? false, hasTouch: cfg.hasTouch ?? false })
  const p = await page(ctx)
  await p.waitForTimeout(900)
  if (name === 'mobile-blade') {
    await p.locator('.tile').first().click()
    await p.waitForTimeout(700)
  }
  await p.screenshot({ path: `shots/audit-${name}.png` })
  await ctx.close()
}

await b.close()
console.log(errs.length ? `\n  ⚠ ERREURS CONSOLE :\n    ${errs.join('\n    ')}` : '\n  console : aucune erreur.')
process.exitCode = errs.length || fail ? 1 : 0
