/**
 * Réencode la texture d'un GLB et reconstruit le fichier.
 * Le chunk binaire est reconstruit entièrement : tous les bufferViews sont
 * réécrits à la suite avec un alignement 4 octets, et leurs byteOffset
 * recalculés. Les accesseurs référencent les bufferViews par index, donc rien
 * d'autre ne bouge.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const [, , src, dst, taille, qualite] = process.argv
const SCRATCH = 'C:/Users/oxyfu/AppData/Local/Temp/claude/c--Users-oxyfu-Desktop-Portfolio/5276ad9f-385e-49dd-951e-63dceee77108/scratchpad/'

const b = readFileSync(src)
const jsonLen = b.readUInt32LE(12)
const j = JSON.parse(b.slice(20, 20 + jsonLen).toString())
const binLen = b.readUInt32LE(20 + jsonLen)
const bin = b.slice(20 + jsonLen + 8, 20 + jsonLen + 8 + binLen)

// --- 1. extraire, réencoder la texture -----------------------------------
const imgIdx = 0
const ivIdx = j.images[imgIdx].bufferView
const iv = j.bufferViews[ivIdx]
const oldPng = bin.slice(iv.byteOffset ?? 0, (iv.byteOffset ?? 0) + iv.byteLength)
writeFileSync(SCRATCH + '_in.png', oldPng)

execFileSync('python', ['-c', `
from PIL import Image
im = Image.open(r'${SCRATCH}_in.png').convert('RGB')
im = im.resize((${taille}, ${taille}), Image.LANCZOS)
im.save(r'${SCRATCH}_out.jpg', 'JPEG', quality=${qualite}, optimize=True, progressive=True, subsampling=0)
`])
const newJpg = readFileSync(SCRATCH + '_out.jpg')

// --- 2. reconstruire le chunk binaire ------------------------------------
const morceaux = []
let offset = 0
for (const [i, v] of j.bufferViews.entries()) {
  const data = i === ivIdx ? newJpg : bin.slice(v.byteOffset ?? 0, (v.byteOffset ?? 0) + v.byteLength)
  const pad = (4 - (offset % 4)) % 4
  if (pad) { morceaux.push(Buffer.alloc(pad)); offset += pad }
  v.byteOffset = offset
  v.byteLength = data.length
  morceaux.push(data)
  offset += data.length
}
let newBin = Buffer.concat(morceaux)
if (newBin.length % 4) newBin = Buffer.concat([newBin, Buffer.alloc(4 - (newBin.length % 4))])

j.buffers[0].byteLength = newBin.length
j.images[imgIdx].mimeType = 'image/jpeg'

// --- 3. réémettre le GLB --------------------------------------------------
let jsonBuf = Buffer.from(JSON.stringify(j), 'utf8')
if (jsonBuf.length % 4) jsonBuf = Buffer.concat([jsonBuf, Buffer.alloc(4 - (jsonBuf.length % 4), 0x20)])

const total = 12 + 8 + jsonBuf.length + 8 + newBin.length
const out = Buffer.alloc(total)
out.write('glTF', 0)
out.writeUInt32LE(2, 4)
out.writeUInt32LE(total, 8)
out.writeUInt32LE(jsonBuf.length, 12)
out.write('JSON', 16)
jsonBuf.copy(out, 20)
out.writeUInt32LE(newBin.length, 20 + jsonBuf.length)
out.write('BIN\0', 24 + jsonBuf.length)
newBin.copy(out, 28 + jsonBuf.length)
writeFileSync(dst, out)

const ko = (n) => (n / 1024).toFixed(0) + ' Ko'
console.log(`  ${src.split(/[\\/]/).pop()}`)
console.log(`    texture : ${ko(oldPng.length)} PNG 2048² → ${ko(newJpg.length)} JPEG ${taille}² q${qualite}`)
console.log(`    fichier : ${ko(b.length)} → ${ko(out.length)}  (${(100 - (out.length / b.length) * 100).toFixed(0)} % de moins)`)
