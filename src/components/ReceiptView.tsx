import { useEffect, useState } from 'react'
import { Check, Copy, Download, ExternalLink, Flame, RotateCcw, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { TokenUSDC } from '@web3icons/react'
import { BRAND, LOCATION, copyText, fmtBlockTime, fmtUsdc, shortAddress, shortHash, txUrl } from '@/lib/dozzie'
import { receiptFileName, renderReceiptPng } from '@/lib/receiptImage'
import type { Receipt } from '@/lib/storage'

interface Props {
  receipt: Receipt
  onNext: () => void
}

export function ReceiptView({ receipt: r, onNext }: Props) {
  // The image is rendered ahead of time so Save and Share run straight from the tap.
  const [file, setFile] = useState<File | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let alive = true
    renderReceiptPng(r)
      .then((blob) => {
        if (alive) setFile(new File([blob], receiptFileName(r), { type: 'image/png' }))
      })
      .catch(() => {
        if (alive) setFailed(true)
      })
    return () => {
      alive = false
    }
  }, [r])

  const canShare = Boolean(file && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] }))

  const save = () => {
    if (!file) return
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 4000)
    toast.success('Receipt saved')
  }

  const share = async () => {
    if (!file) return
    try {
      await navigator.share({
        files: [file],
        title: `${BRAND} receipt ${r.code}`,
        text: `Paid ${fmtUsdc(BigInt(r.amount))} USDC at ${BRAND}. ${txUrl(r.hash)}`,
      })
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      save()
    }
  }

  const copyHash = async () => {
    if (await copyText(r.hash)) toast.success('Transaction hash copied')
    else toast.error('Could not copy. Select the hash instead.')
  }

  return (
    <section aria-labelledby="receipt-title" className="mx-auto w-full max-w-md py-6 sm:py-10">
      <div className="text-center">
        <div className="anim-ring mx-auto grid h-20 w-20 place-items-center rounded-full border border-mint/40 bg-mint-soft">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#38d996" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" className="anim-draw" />
          </svg>
        </div>
        <h1 id="receipt-title" className="anim-rise mt-5 font-display text-[32px] max-[359px]:text-[27px] font-extrabold leading-[1.02] tracking-[-0.02em] text-balance sm:text-4xl">
          Payment Confirmed. Fire Up the Grill.
        </h1>
        <p className="anim-rise mt-2 text-sm text-muted" style={{ animationDelay: '90ms' }}>
          Paid! Show your receipt to collect your suya.
        </p>
      </div>

      <div className="anim-rise mt-6" style={{ animationDelay: '160ms' }}>
        <article className="ticket-edge grain rounded-t-3xl border border-b-0 border-line bg-card px-5 pb-10 pt-5 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-ink">
                <Flame size={22} strokeWidth={2.4} />
              </span>
              <div>
                <p className="font-display text-lg font-bold leading-tight">{BRAND}</p>
                <p className="text-xs text-muted">{LOCATION}</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-mint-soft px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] text-mint">
              <Check size={13} strokeWidth={3} /> Paid
            </span>
          </div>

          <div className="mt-5 flex items-end justify-between border-y border-dashed border-line py-4">
            <div>
              <p className="eyebrow">Order</p>
              <p className="font-mono text-2xl font-medium tracking-tight tnum">{r.code}</p>
            </div>
            <div className="text-right">
              <p className="eyebrow">Customer</p>
              <p className="font-mono text-sm tnum">{shortAddress(r.payer)}</p>
            </div>
          </div>

          <ul className="mt-4 space-y-2.5 text-sm">
            {r.order.lines.map((l) => (
              <li key={l.id} className="flex items-baseline justify-between gap-3 tnum">
                <span>
                  <span className="font-semibold">{l.name}</span>
                  <span className="block text-xs text-muted">
                    {l.qty} {l.qty === 1 ? 'pack' : 'packs'} × {fmtUsdc(BigInt(l.unit))} USDC
                  </span>
                </span>
                <span>{fmtUsdc(BigInt(l.line))} USDC</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 rounded-xl bg-field p-3 text-xs">
            <p className="font-semibold uppercase tracking-[0.08em] text-muted">Complimentary extras</p>
            <p className="mt-1 text-sm text-fg-soft">{r.order.extras.length ? r.order.extras.join(', ') : 'None selected'}</p>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
            <span className="text-sm font-semibold">Total paid</span>
            <span className="flex items-center gap-2 font-display text-3xl font-bold tnum">
              <TokenUSDC variant="branded" size={24} /> {fmtUsdc(BigInt(r.amount))}
              <span className="text-sm font-semibold text-muted">USDC</span>
            </span>
          </div>

          <dl className="mt-5 space-y-3 text-sm">
            <div>
              <dt className="eyebrow">Transaction</dt>
              <dd className="mt-1 flex items-center justify-between gap-2">
                <span className="break-all font-mono text-xs tnum" title={r.hash}>
                  {shortHash(r.hash)}
                </span>
                <span className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => void copyHash()}
                    aria-label="Copy transaction hash"
                    className="icon-btn border border-line"
                  >
                    <Copy size={16} />
                  </button>
                  <a
                    href={txUrl(r.hash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="View transaction on Arc Explorer"
                    className="icon-btn border border-line"
                  >
                    <ExternalLink size={16} />
                  </a>
                </span>
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-muted">Verified block time</dt>
              <dd className="text-right tnum">{fmtBlockTime(r.blockTimestamp)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-muted">Block</dt>
              <dd className="font-mono tnum">{r.blockNumber}</dd>
            </div>
          </dl>

          <p className="mt-6 rounded-2xl border border-brand/50 bg-brand-soft px-4 py-3 text-center font-display text-base font-bold text-brand text-balance">
            Show this screen to Professor Dozzie
          </p>
        </article>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={save}
          disabled={!file}
          className={`btn btn-outline btn-lg ${canShare ? '' : 'col-span-2'}`}
        >
          <Download size={17} /> {file ? 'Download receipt' : failed ? 'Image unavailable' : 'Preparing\u2026'}
        </button>
        {canShare && (
          <button type="button" onClick={() => void share()} className="btn btn-outline btn-lg">
            <Share2 size={17} /> Share
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={onNext}
        className="btn btn-primary btn-lg mt-2 w-full"
      >
        <RotateCcw size={17} /> Start Next Order
      </button>
      <a
        href={txUrl(r.hash)}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-quiet mt-2 w-full"
      >
        View on Arc Explorer <ExternalLink size={14} />
      </a>
    </section>
  )
}
