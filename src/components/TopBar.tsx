import { ConnectKitButton } from 'connectkit'
import { Flame, Menu } from 'lucide-react'
import { BRAND, shortAddress } from '@/lib/dozzie'

interface Props {
  onMenu: () => void
  menuOpen: boolean
  wrongChain: boolean
  connected: boolean
}

export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-[10px] bg-brand text-ink"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Flame size={size * 0.58} strokeWidth={2.4} />
    </span>
  )
}

export function TopBar({ onMenu, menuOpen, wrongChain, connected }: Props) {
  return (
    <header className="sticky top-0 z-30 h-14 border-b border-line bg-ink/90 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-6xl items-center gap-2 px-2 sm:px-4">
        <button
          type="button"
          onClick={onMenu}
          aria-label="Open menu"
          aria-expanded={menuOpen}
          aria-controls="side-drawer"
          className="icon-btn"
        >
          <Menu size={22} />
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <BrandMark />
          <span
            className={`truncate font-display text-[17px] font-bold max-[359px]:text-[15px] leading-none tracking-tight ${connected ? 'max-[359px]:hidden' : ''}`}
          >
            {BRAND}
          </span>
        </div>

        <ConnectKitButton.Custom>
          {({ isConnected, isConnecting, show, address }) => (
            <button
              type="button"
              onClick={show}
              className={`press inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold max-[359px]:px-3 ${
                isConnected
                  ? 'border border-line bg-card text-fg hover:bg-raised'
                  : 'bg-brand text-ink hover:bg-brand-hover'
              }`}
            >
              {isConnected && address ? (
                <>
                  <span
                    className={`h-2 w-2 rounded-full ${wrongChain ? 'bg-danger' : 'bg-mint'}`}
                    aria-label={wrongChain ? 'Wrong network' : 'On Arc Testnet'}
                  />
                  <span className="font-mono text-[13px] tnum">{shortAddress(address)}</span>
                </>
              ) : isConnecting ? (
                'Connecting\u2026'
              ) : (
                <>
                  <span className="min-[400px]:hidden">Connect</span>
                  <span className="hidden min-[400px]:inline">Connect Wallet</span>
                </>
              )}
            </button>
          )}
        </ConnectKitButton.Custom>
      </div>
    </header>
  )
}
