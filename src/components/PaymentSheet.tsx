import { useEffect, useRef } from 'react'
import { AlertTriangle, Check, ExternalLink, Loader2, ShieldCheck, X } from 'lucide-react'
import { TokenUSDC } from '@web3icons/react'
import { Amount, gasTokenToUsdc } from '@/onchain-money'
import { ARC_CHAIN_ID, CHAIN_NAME, addressUrl, fmtUsdc, shortAddress, shortHash, txUrl } from '@/lib/dozzie'
import type { Checkout } from '@/hooks/useCheckout'
import { useOverlayLock } from '@/hooks/useOverlayLock'

interface Props {
  checkout: Checkout
  merchant?: `0x${string}`
  onSwitch: () => void
  switching: boolean
}

const STEPS = [
  { key: 'awaiting_signature', label: 'Confirm payment in your wallet.' },
  { key: 'submitted', label: 'Payment sent to Arc.' },
  { key: 'confirming', label: 'Verifying payment on Arc.' },
] as const

function Steps({ phase, delayed }: { phase: string; delayed: boolean }) {
  const current = STEPS.findIndex((s) => s.key === phase)
  return (
    <ol className="space-y-3" aria-label="Payment progress">
      {STEPS.map((s, i) => {
        const done = i < current
        const active = i === current
        return (
          <li key={s.key} className="flex items-center gap-3" aria-current={active ? 'step' : undefined}>
            <span
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border text-xs font-bold transition-colors ${
                done
                  ? 'border-brand bg-brand text-ink'
                  : active
                    ? 'border-brand text-brand'
                    : 'border-line text-faint'
              }`}
            >
              {done ? <Check size={14} strokeWidth={3} /> : active ? <Loader2 size={14} className="anim-spin" /> : i + 1}
            </span>
            <span className={`text-sm ${active ? 'font-semibold text-fg' : done ? 'text-fg-soft' : 'text-faint'}`}>
              {s.label}
              {active && s.key === 'confirming' && delayed && ' Taking longer than usual.'}
            </span>
          </li>
        )
      })}
      <li className="relative mt-1 h-1 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
        <span
          className="absolute inset-y-0 left-0 rounded-full bg-brand transition-[width] duration-500"
          style={{ width: `${((Math.max(current, 0) + 0.5) / STEPS.length) * 100}%` }}
        />
        {!delayed && (
          <span className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent" style={{ animation: 'sweep 1.4s linear infinite' }} />
        )}
      </li>
    </ol>
  )
}

export function PaymentSheet({ checkout: c, merchant, onSwitch, switching }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const open = c.phase !== 'idle' && c.phase !== 'paid'
  const dismissible = c.phase === 'review' || c.phase === 'rejected' || c.phase === 'failed'
  const { dismiss } = c
  useOverlayLock(open)

  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    ref.current?.focus()
    return () => {
      prev?.focus?.()
    }
  }, [open])

  useEffect(() => {
    if (!open || !dismissible) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && dismiss()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, dismissible, dismiss])

  if (!open) return null

  const order = c.review?.order ?? c.pending?.order
  const total = order ? BigInt(order.total) : 0n
  const fee = c.review ? gasTokenToUsdc(ARC_CHAIN_ID, Amount.fromRaw(c.review.fee, 18)).toFixed(4) : null
  const inFlight = c.phase === 'awaiting_signature' || c.phase === 'submitted' || c.phase === 'confirming'
  const hash = c.pending?.hash

  return (
    <div
      className="anim-fade fixed inset-0 z-[60] flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && dismissible && dismiss()}
    >
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Payment"
        className="anim-sheet max-h-[92dvh] w-full max-w-md overflow-y-auto overscroll-contain rounded-t-3xl border border-line bg-card p-5 outline-none sm:rounded-3xl"
        style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold tracking-tight">
            {c.phase === 'review'
              ? 'Confirm your order'
              : c.phase === 'validating'
                ? 'Checking your order'
                : c.phase === 'rejected'
                  ? 'Payment cancelled'
                  : c.phase === 'failed'
                    ? 'Payment not completed'
                    : 'Paying on Arc'}
          </h2>
          {dismissible && (
            <button type="button" onClick={dismiss} aria-label="Close" className="icon-btn -mr-2">
              <X size={20} />
            </button>
          )}
        </div>

        {c.phase === 'validating' && (
          <p className="flex items-center gap-3 py-6 text-sm text-fg-soft">
            <Loader2 size={20} className="anim-spin text-brand" /> Checking your wallet, balance and network fee.
          </p>
        )}

        {(c.phase === 'review' || inFlight) && order && (
          <div className="well p-4">
            <ul className="space-y-2 text-sm">
              {order.lines.map((l) => (
                <li key={l.id} className="flex items-baseline justify-between gap-3 tnum">
                  <span>
                    {l.qty} × {l.name}
                  </span>
                  <span className="text-fg-soft">{fmtUsdc(BigInt(l.line))} USDC</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 border-t border-dashed border-line pt-3 text-xs text-muted">
              <span className="font-semibold text-fg-soft">Free extras:</span>{' '}
              {order.extras.length ? order.extras.join(', ') : 'None selected'}
            </p>
            <div className="mt-3 flex items-end justify-between border-t border-line pt-3">
              <span className="text-sm font-semibold">Total</span>
              <span className="flex items-center gap-1.5 font-display text-2xl font-bold tnum">
                <TokenUSDC variant="branded" size={20} /> {fmtUsdc(total)}
              </span>
            </div>
          </div>
        )}

        {c.phase === 'review' && c.review && (
          <>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Pay to</dt>
                <dd className="font-mono tnum">
                  {merchant ? (
                    <a href={addressUrl(merchant)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-brand">
                      {shortAddress(merchant)} <ExternalLink size={12} />
                    </a>
                  ) : (
                    '\u2014'
                  )}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Network</dt>
                <dd>{CHAIN_NAME}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Network fee (est.)</dt>
                <dd className="tnum">{fee} USDC</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Your balance</dt>
                <dd className="tnum">{fmtUsdc(c.review.balance)} USDC</dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={() => void c.confirmAndPay()}
              className="btn btn-primary btn-lg mt-5 w-full"
            >
              <ShieldCheck size={18} /> Confirm and pay {fmtUsdc(total)} USDC
            </button>
            <button type="button" onClick={dismiss} className="btn btn-quiet mt-2 w-full">
              Back to my order
            </button>
          </>
        )}

        {inFlight && (
          <div className="mt-5">
            <Steps phase={c.phase} delayed={c.delayed} />
            {hash && (
              <a
                href={txUrl(hash)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 font-mono text-xs text-muted hover:text-brand tnum"
              >
                {shortHash(hash)} <ExternalLink size={12} />
              </a>
            )}
            {c.delayed && (
              <div className="mt-4 rounded-2xl border border-brand/40 bg-brand-soft p-4 text-sm">
                <p className="text-fg">
                  Arc has not confirmed this payment yet. It may still land. Do not pay again. Your order is saved on this device.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={c.recheck} className="btn btn-primary">
                    Check again
                  </button>
                  <button type="button" onClick={c.stopTracking} className="btn btn-outline">
                    Stop tracking
                  </button>
                </div>
              </div>
            )}
            {!c.delayed && c.phase === 'awaiting_signature' && (
              <p className="mt-4 text-xs text-muted">Approve the USDC transfer in your wallet. This page waits for you.</p>
            )}
          </div>
        )}

        {(c.phase === 'rejected' || c.phase === 'failed') && c.failure && (
          <div>
            <div className="flex gap-3 rounded-2xl border border-danger/40 bg-danger/10 p-4">
              <AlertTriangle size={20} className="mt-0.5 shrink-0 text-danger" />
              <p className="text-sm leading-relaxed text-fg">{c.failure.message}</p>
            </div>
            <div className="mt-5 space-y-2">
              {c.failure.kind === 'wrong_chain' && (
                <button
                  type="button"
                  onClick={onSwitch}
                  disabled={switching}
                  className="btn btn-primary btn-lg w-full"
                >
                  {switching ? 'Switching\u2026' : 'Switch to Arc Testnet'}
                </button>
              )}
              {c.failure.kind !== 'wrong_chain' && (
                <button
                  type="button"
                  onClick={c.retry}
                  className="btn btn-primary btn-lg w-full"
                >
                  Try again
                </button>
              )}
              <button type="button" onClick={dismiss} className="btn btn-outline w-full">
                Back to my order
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
