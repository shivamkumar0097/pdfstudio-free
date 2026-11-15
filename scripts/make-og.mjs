// One-off generator for the social preview images in public/og.
// Run manually with: node scripts/make-og.mjs
// It uses @napi-rs/canvas, which ships with pdfjs-dist, so nothing is added
// to package.json and the build never depends on it.
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createCanvas } from '@napi-rs/canvas'
import { TOOL_META } from '../src/catalog.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'public', 'og')
mkdirSync(out, { recursive: true })

const W = 1200
const H = 630

const make = (file, title, sub) => {
  const c = createCanvas(W, H)
  const ctx = c.getContext('2d')

  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#0B0B0B')
  bg.addColorStop(1, '#171717')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  ctx.strokeStyle = 'rgba(255,255,255,.08)'
  ctx.lineWidth = 2
  for (let x = -H; x < W; x += 64) {
    ctx.beginPath()
    ctx.moveTo(x, H)
    ctx.lineTo(x + H, 0)
    ctx.stroke()
  }

  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 76px "Segoe UI", Arial, sans-serif'
  ctx.textBaseline = 'alphabetic'

  const words = title.split(' ')
  const lines = []
  let line = ''
  for (const w of words) {
    const test = line ? line + ' ' + w : w
    if (ctx.measureText(test).width > W - 160 && line) {
      lines.push(line)
      line = w
    } else line = test
  }
  lines.push(line)

  let y = H / 2 - (lines.length - 1) * 46
  for (const l of lines) {
    ctx.fillText(l, 80, y)
    y += 92
  }

  ctx.fillStyle = '#9A9A9A'
  ctx.font = '30px "Segoe UI", Arial, sans-serif'
  ctx.fillText(sub, 80, H - 90)

  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 30px "Segoe UI", Arial, sans-serif'
  ctx.fillText('PDF Studio', 80, 110)

  ctx.fillStyle = '#9A9A9A'
  ctx.font = '26px "Segoe UI", Arial, sans-serif'
  ctx.fillText('pdfstudio-free.netlify.app', W - 80 - ctx.measureText('pdfstudio-free.netlify.app').width, 110)

  writeFileSync(join(out, file), c.toBuffer('image/png'))
}

make('home.png', 'Free Browser PDF Tools', 'Merge, split, compress and convert — nothing is uploaded')
for (const t of TOOL_META) {
  make(`${t.id}.png`, t.title, 'Free online tool — files never leave your device')
}
console.log('OG images written to public/og')
