import { ConnectKitButton } from 'connectkit'
import { Loader2, ShoppingBag } from 'lucide-react'
import { fmtUsdc } from '@/lib/dozzie'

export type BlockReason = 'empty' | 'disconnected' | 'wrong_chain' | 'config' | 'busy' | null

interface Props {
  packs: number
  total: bigint
  blocked: BlockReason
  configError?: string
  switching: boolean
  onSwitch: () => void
  onPay: () => void
  validating: boolean
}

function Hint({ blocked, configError, switching, onSwitch }: Omit<Props, 'total' | 'onPay' | 'validating' | 'packs'>) {
  const link = 'press link'
  if (blocked === 'config') return <span className="text-danger">{configError ?? 'Checkout is not configured.'}</span>
  if (blocked === 'busy') return <span>A payment is in progress.</span>
  if (blocked === 'empty') return <span>Add some suya to start.</span>
  if (blocked === 'disconnected') {
    return (
      <span>
        <ConnectKitButton.Custom>
          {({ show }) => (
            <button type="button" onClick={show} className={link}>
              Connect your wallet
            </button>
          )}
        </ConnectKitButton.Custom>{' '}
        to pay.
      </span>
    )
  }
  if (blocked === 'wrong_chain') {
    return (
      <span>
        Wrong network.{' '}
        <button type="button" onClick={onSwitch} disabled={switching} className={link}>
          {switching ? 'Switching\u2026' : 'Switch to Arc Testnet'}
        </button>
      </span>
    )
  }
  return <span>Your suya is looking good.</span>
}

export function CheckoutBar(p: Props) {
  const disabled = p.blocked !== null || p.validating
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink/95 backdrop-blur-md"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 pt-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="flex min-w-0 items-center justify-between gap-4 sm:justify-start sm:gap-6">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-fg tnum">
              <ShoppingBag size={15} className="text-brand" />
              <span key={p.packs} className="anim-bump inline-block">
                {p.packs}
              </span>{' '}
              {p.packs === 1 ? 'pack' : 'packs'}
            </p>
            <p className="mt-0.5 truncate text-xs leading-snug text-muted sm:max-w-[300px]">
              <Hint
                blocked={p.blocked}
                configError={p.configError}
                switching={p.switching}
                onSwitch={p.onSwitch}
              />
            </p>
          </div>
          <p className="shrink-0 text-right" aria-live="polite">
            <span key={p.total.toString()} className="anim-bump inline-block font-display text-[28px] font-bold leading-none tnum">
              {fmtUsdc(p.total, 2)}
            </span>
            <span className="ml-1.5 text-xs font-semibold text-muted">USDC</span>
          </p>
        </div>

        <button
          type="button"
          onClick={p.onPay}
          disabled={disabled}
          className="btn btn-primary btn-lg w-full shrink-0 sm:w-auto sm:min-w-[270px]"
        >
          {p.validating ? (
            <>
              <Loader2 size={18} className="anim-spin" /> Checking your order
            </>
          ) : (
            'Pay in USDC (Arc Testnet)'
          )}
        </button>
      </div>
    </div>
  )
}
