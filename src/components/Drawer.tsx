import { useEffect, useRef } from 'react'
import { ConnectKitButton } from 'connectkit'
import { ArrowRight, Check, Copy, ExternalLink, Droplets, Receipt as ReceiptIcon, RotateCcw, X } from 'lucide-react'
import { TokenUSDC } from '@web3icons/react'
import { toast } from 'sonner'
import {
  ARC_CHAIN_ID,
  CHAIN_NAME,
  FAUCET_URL,
  copyText,
  fmtUsdc,
  shortAddress,
} from '@/lib/dozzie'
import { useOverlayLock } from '@/hooks/useOverlayLock'
import type { Receipt } from '@/lib/storage'
import { BrandMark } from './TopBar'

interface Props {
  open: boolean
  onClose: () => void
  address?: `0x${string}`
  chainId?: number
  balance?: bigint
  balanceLoading: boolean
  balanceError: boolean
  onSwitch: () => void
  switching: boolean
  canStartNext: boolean
  onStartNext: () => void
  receipts: Receipt[]
  onOpenReceipt: (r: Receipt) => void
  receiptsLocked: boolean
}

export function Drawer(p: Props) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLElement>(null)
  const { open, onClose } = p
  useOverlayLock(open)

  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    const t = window.setTimeout(() => closeRef.current?.focus(), 50)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab' || !panelRef.current) return
      const items = panelRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]')
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(t)
      document.removeEventListener('keydown', onKey)
      prev?.focus?.()
    }
  }, [open, onClose])

  const connected = Boolean(p.address)
  const wrongChain = connected && p.chainId !== ARC_CHAIN_ID

  const copy = async () => {
    if (p.address && (await copyText(p.address))) toast.success('Wallet address copied')
  }

  return (
    <div
      className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`}
      aria-hidden={!open}
      // inert keeps the closed drawer out of the tab order
      {...(open ? {} : { inert: '' as unknown as boolean })}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <aside
        id="side-drawer"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menu and wallet"
        className={`absolute inset-y-0 left-0 flex w-[min(300px,86vw)] flex-col border-r border-line bg-card shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
          <div className="flex items-center gap-2">
            <BrandMark size={28} />
            <span className="font-display text-base font-bold">Dozzie Hotspot</span>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="icon-btn -mr-2"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <section aria-label="Wallet" className="rounded-2xl border border-line bg-raised p-4">
            <p className="eyebrow">Wallet</p>
            {connected && p.address ? (
              <>
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <span className="font-mono text-sm tnum">{shortAddress(p.address)}</span>
                  <button
                    type="button"
                    onClick={() => void copy()}
                    aria-label="Copy wallet address"
                    className="press grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-white/5 hover:text-white"
                  >
                    <Copy size={16} />
                  </button>
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <p className="eyebrow">USDC balance</p>
                    <p className="mt-0.5 flex items-center gap-1.5 font-display text-2xl font-bold tnum">
                      <TokenUSDC variant="branded" size={22} />
                      {wrongChain
                        ? '\u2014'
                        : p.balance !== undefined
                          ? fmtUsdc(p.balance, 2)
                          : p.balanceError
                            ? 'Unavailable'
                            : p.balanceLoading
                              ? '\u2026'
                              : '\u2014'}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <p className="mt-1.5 text-sm text-muted">Connect a wallet to see your USDC balance.</p>
                <ConnectKitButton.Custom>
                  {({ show }) => (
                    <button
                      type="button"
                      onClick={show}
                      className="btn btn-primary mt-3 w-full"
                    >
                      Connect Wallet
                    </button>
                  )}
                </ConnectKitButton.Custom>
              </>
            )}
          </section>

          <section aria-label="Network status" className="flex items-center justify-between gap-3 well px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                  !connected ? 'bg-faint' : wrongChain ? 'bg-danger' : 'bg-mint'
                }`}
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {!connected ? 'Not connected' : wrongChain ? 'Wrong network' : CHAIN_NAME}
                </p>
                <p className="text-xs text-muted">
                  {!connected ? 'Wallet needed to pay' : wrongChain ? 'Switch to pay' : 'Ready to pay'}
                </p>
              </div>
            </div>
            {wrongChain && (
              <button
                type="button"
                onClick={p.onSwitch}
                disabled={p.switching}
                className="press h-9 shrink-0 rounded-lg bg-brand px-3 text-xs font-bold text-ink disabled:opacity-50"
              >
                {p.switching ? 'Switching\u2026' : 'Switch'}
              </button>
            )}
          </section>

          <section aria-label="Test USDC">
            <a
              href={FAUCET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="press flex min-h-[48px] items-center justify-between gap-2 rounded-xl border border-brand/50 bg-brand-soft px-4 text-sm font-bold text-brand hover:bg-brand/20"
            >
              <span className="flex items-center gap-2">
                <Droplets size={18} /> Get test USDC
              </span>
              <ExternalLink size={16} />
            </a>
            <ol className="mt-3 space-y-1.5 pl-1 text-[13px] leading-relaxed text-muted">
              <li className="flex gap-2">
                <span className="font-mono text-brand">1</span> Open the Circle faucet and pick Arc Testnet.
              </li>
              <li className="flex gap-2">
                <span className="font-mono text-brand">2</span> Paste your wallet address and request USDC.
              </li>
              <li className="flex gap-2">
                <span className="font-mono text-brand">3</span> Come back here. Your balance updates on its own.
              </li>
            </ol>
          </section>

          {p.receipts.length > 0 && (
            <section aria-label="Past orders">
              <p className="mb-2 flex items-center gap-1.5 eyebrow">
                <ReceiptIcon size={13} /> Past orders on this device
              </p>
              <ul className="space-y-1.5">
                {[...p.receipts]
                  .reverse()
                  .slice(0, 5)
                  .map((r) => (
                    <li key={r.hash}>
                      <button
                        type="button"
                        disabled={p.receiptsLocked}
                        onClick={() => {
                          p.onOpenReceipt(r)
                          p.onClose()
                        }}
                        className="press flex min-h-[44px] w-full items-center justify-between rounded-xl border border-line bg-field px-3 text-left text-sm hover:bg-raised disabled:opacity-40"
                      >
                        <span className="font-mono tnum">{r.code}</span>
                        <span className="flex items-center gap-1 text-muted tnum">
                          {fmtUsdc(BigInt(r.amount))} USDC <ArrowRight size={14} />
                        </span>
                      </button>
                    </li>
                  ))}
              </ul>
            </section>
          )}
        </div>

        <div className="shrink-0 border-t border-line p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => {
              p.onStartNext()
              p.onClose()
            }}
            disabled={!p.canStartNext}
            className="btn btn-outline h-12 w-full bg-raised hover:border-brand/60 hover:bg-raised"
          >
            <RotateCcw size={16} /> Start Next Order
          </button>
          {connected && (
            <p className="mt-2 flex items-center justify-center gap-1 text-center text-[11px] text-faint">
              <Check size={12} /> Chain ID {ARC_CHAIN_ID}
            </p>
          )}
        </div>
      </aside>
    </div>
  )
}
