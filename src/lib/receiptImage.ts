import { BRAND, LOCATION, fmtBlockTime, fmtUsdc, shortAddress, txUrl } from './dozzie'
import type { Receipt } from './storage'

const W = 540
const MARGIN = 20
const PAD = 24
const SCALE = 2

const C = {
  bg: '#080808',
  card: '#151515',
  field: '#111111',
  line: 'rgba(255,255,255,0.14)',
  text: '#f4efe8',
  soft: '#d6cfc4',
  muted: '#a39d94',
  brand: '#FE9E15',
  brandSoft: 'rgba(254,158,21,0.14)',
  mint: '#38d996',
  mintSoft: 'rgba(56,217,150,0.16)',
  ink: '#080808',
}

const DISPLAY = '"Bricolage Grotesque", "DM Sans", sans-serif'
const SANS = '"DM Sans", sans-serif'
const MONO = '"JetBrains Mono", Menlo, monospace'

const FLAME =
  'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z'

class Painter {
  y = 0
  constructor(
    private ctx: CanvasRenderingContext2D,
    private dry: boolean,
  ) {}

  rrect(x: number, y: number, w: number, h: number, r: number, fill: string, stroke?: string): void {
    if (this.dry) return
    const c = this.ctx
    c.beginPath()
    c.roundRect(x, y, w, h, r)
    c.fillStyle = fill
    c.fill()
    if (stroke) {
      c.lineWidth = 1
      c.strokeStyle = stroke
      c.stroke()
    }
  }

  text(
    value: string,
    x: number,
    y: number,
    font: string,
    color: string,
    align: CanvasTextAlign = 'left',
    spacing = '0px',
  ): number {
    const c = this.ctx
    c.font = font
    c.letterSpacing = spacing
    const width = c.measureText(value).width
    if (!this.dry) {
      c.fillStyle = color
      c.textAlign = align
      c.textBaseline = 'alphabetic'
      c.fillText(value, x, y)
    }
    c.letterSpacing = '0px'
    return width
  }

  dashed(x1: number, x2: number, y: number): void {
    if (this.dry) return
    const c = this.ctx
    c.save()
    c.setLineDash([5, 5])
    c.strokeStyle = C.line
    c.lineWidth = 1
    c.beginPath()
    c.moveTo(x1, y)
    c.lineTo(x2, y)
    c.stroke()
    c.restore()
  }

  flame(x: number, y: number, size: number): void {
    if (this.dry) return
    const c = this.ctx
    c.save()
    c.translate(x, y)
    c.scale(size / 24, size / 24)
    c.strokeStyle = C.ink
    c.lineWidth = 2.4
    c.lineCap = 'round'
    c.lineJoin = 'round'
    c.stroke(new Path2D(FLAME))
    c.restore()
  }
}

/** Lays the receipt out (or measures it when `dry`) and returns the total height. */
function layout(ctx: CanvasRenderingContext2D, r: Receipt, dry: boolean, height = 0): number {
  const p = new Painter(ctx, dry)
  const x0 = MARGIN + PAD
  const x1 = W - MARGIN - PAD
  const innerW = x1 - x0

  if (!dry) {
    p.rrect(0, 0, W, height, 0, C.bg)
    p.rrect(MARGIN, MARGIN, W - MARGIN * 2, height - MARGIN * 2, 28, C.card, C.line)
  }

  let y = MARGIN + PAD

  // Header
  p.rrect(x0, y, 44, 44, 12, C.brand)
  p.flame(x0 + 11, y + 11, 22)
  p.text(BRAND, x0 + 56, y + 20, `700 20px ${DISPLAY}`, C.text)
  p.text(LOCATION, x0 + 56, y + 39, `400 13px ${SANS}`, C.muted)
  const badgeW = 74
  p.rrect(x1 - badgeW, y + 8, badgeW, 28, 14, C.mintSoft)
  p.text('PAID', x1 - badgeW / 2, y + 27, `700 12px ${SANS}`, C.mint, 'center', '1.2px')
  y += 44 + 22

  // Order code + customer
  p.dashed(x0, x1, y)
  y += 26
  p.text('ORDER', x0, y, `600 11px ${SANS}`, C.muted, 'left', '1.2px')
  p.text('CUSTOMER', x1, y, `600 11px ${SANS}`, C.muted, 'right', '1.2px')
  y += 28
  p.text(r.code, x0, y, `500 28px ${MONO}`, C.text)
  p.text(shortAddress(r.payer), x1, y, `400 14px ${MONO}`, C.soft, 'right')
  y += 20
  p.dashed(x0, x1, y)
  y += 28

  // Lines
  for (const l of r.order.lines) {
    p.text(l.name, x0, y, `600 16px ${SANS}`, C.text)
    p.text(`${fmtUsdc(BigInt(l.line))} USDC`, x1, y, `500 16px ${SANS}`, C.text, 'right')
    y += 20
    p.text(`${l.qty} ${l.qty === 1 ? 'pack' : 'packs'} \u00d7 ${fmtUsdc(BigInt(l.unit))} USDC`, x0, y, `400 13px ${SANS}`, C.muted)
    y += 28
  }

  // Extras
  const extras = r.order.extras.length ? r.order.extras.join(', ') : 'None selected'
  p.rrect(x0, y - 4, innerW, 62, 14, C.field)
  p.text('COMPLIMENTARY EXTRAS', x0 + 16, y + 18, `600 11px ${SANS}`, C.muted, 'left', '1.2px')
  p.text(extras, x0 + 16, y + 42, `400 14px ${SANS}`, C.soft)
  y += 62 + 24

  // Total
  p.dashed(x0, x1, y - 8)
  y += 22
  p.text('Total paid', x0, y, `600 16px ${SANS}`, C.text)
  p.text(fmtUsdc(BigInt(r.amount)), x1 - 52, y + 4, `700 36px ${DISPLAY}`, C.text, 'right')
  p.text('USDC', x1, y + 4, `600 14px ${SANS}`, C.muted, 'right')
  y += 40

  // Transaction details
  p.text('TRANSACTION', x0, y, `600 11px ${SANS}`, C.muted, 'left', '1.2px')
  y += 22
  p.text(r.hash.slice(0, 34), x0, y, `400 12.5px ${MONO}`, C.soft)
  y += 19
  p.text(r.hash.slice(34), x0, y, `400 12.5px ${MONO}`, C.soft)
  y += 28

  const row = (label: string, value: string, mono = false): void => {
    p.text(label, x0, y, `400 13px ${SANS}`, C.muted)
    p.text(value, x1, y, mono ? `400 13px ${MONO}` : `500 13px ${SANS}`, C.text, 'right')
    y += 24
  }
  row('Verified block time', fmtBlockTime(r.blockTimestamp))
  row('Block', r.blockNumber, true)
  row('Network', 'Arc Testnet')
  y += 4

  // Collect banner
  p.rrect(x0, y, innerW, 48, 16, C.brandSoft, 'rgba(254,158,21,0.5)')
  p.text('Show this screen to Professor Dozzie', W / 2, y + 30, `700 16px ${DISPLAY}`, C.brand, 'center')
  y += 48 + 18

  p.text('Verify on Arc Explorer:', W / 2, y, `400 11px ${SANS}`, C.muted, 'center')
  y += 16
  const url = txUrl(r.hash).replace('https://', '')
  p.text(`${url.slice(0, 44)}\u2026`, W / 2, y, `400 10.5px ${MONO}`, C.muted, 'center')
  y += 14

  return y + PAD + MARGIN
}

async function loadFonts(): Promise<void> {
  if (!('fonts' in document)) return
  await Promise.all([
    document.fonts.load(`700 20px ${DISPLAY}`),
    document.fonts.load(`400 14px ${SANS}`),
    document.fonts.load(`600 14px ${SANS}`),
    document.fonts.load(`400 14px ${MONO}`),
    document.fonts.load(`500 28px ${MONO}`),
  ]).catch(() => undefined)
}

export function receiptFileName(r: Receipt): string {
  return `dozzie-${r.code.replace('#', '').toLowerCase()}-receipt.png`
}

/** Renders the confirmed receipt to a PNG that can be saved or shared. */
export async function renderReceiptPng(r: Receipt): Promise<Blob> {
  await loadFonts()
  const measure = document.createElement('canvas').getContext('2d')
  if (!measure) throw new Error('Canvas is not available')
  const height = Math.ceil(layout(measure, r, true))

  const canvas = document.createElement('canvas')
  canvas.width = W * SCALE
  canvas.height = height * SCALE
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is not available')
  ctx.scale(SCALE, SCALE)
  layout(ctx, r, false, height)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not create the image'))), 'image/png')
  })
}
