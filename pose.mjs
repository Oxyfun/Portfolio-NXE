import { chromium } from '@playwright/test'
import { PNG } from 'pngjs'
import { writeFile } from 'node:fs/promises'
const poses = process.argv.slice(2)
const b = await chromium.launch()
const shots = []
for (const p of poses) {
  const ctx = await b.newContext({ viewport: { width: 631, height: 332 }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  await page.goto(`http://localhost:5173/?pose=${p}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1600)
  shots.push({ p, buf: await page.screenshot() })
  await ctx.close()
}
await b.close()
const imgs = shots.map(s => PNG.sync.read(s.buf))
const cols = 2, rows = Math.ceil(imgs.length / cols)
const out = new PNG({ width: cols * 631, height: rows * 332 })
out.data.fill(200)
imgs.forEach((im, i) => PNG.bitblt(im, out, 0, 0, im.width, im.height, (i % cols) * 631, Math.floor(i / cols) * 332))
await writeFile('shots/pose-grid.png', PNG.sync.write(out))
console.log(poses.map((p,i)=>`${i}: ${p}`).join('\n'))
