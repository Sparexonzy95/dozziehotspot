import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAccount, useSwitchChain } from 'wagmi'
import { Droplets } from 'lucide-react'
import { TopBar } from '@/components/TopBar'
import { Drawer } from '@/components/Drawer'
import { Hero } from '@/components/Hero'
import { FilterTabs } from '@/components/FilterTabs'
import { ProductCard } from '@/components/ProductCard'
import { ExtrasPicker } from '@/components/ExtrasPicker'
import { CheckoutBar, type BlockReason } from '@/components/CheckoutBar'
import { PaymentSheet } from '@/components/PaymentSheet'
import { ReceiptView } from '@/components/ReceiptView'
import { Footer } from '@/components/Footer'
import { useUsdcBalance } from '@/hooks/useUsdcBalance'
import { useCheckout } from '@/hooks/useCheckout'
import { ARC_CHAIN_ID, readCheckoutConfig } from '@/lib/dozzie'
import { PRODUCTS, cartPacks, cartTotal, snapshotOrder, type Filter, type Quantities } from '@/lib/menu'
import { loadReceipts } from '@/lib/storage'

export default function App() {
  const cfg = useMemo(() => readCheckoutConfig(), [])
  const { address, chainId } = useAccount()
  const { switchChain, isPending: switching } = useSwitchChain()
  const { balance, isLoading: balanceLoading, isError: balanceError, refetch } = useUsdcBalance(address)

  const [filter, setFilter] = useState<Filter>('All')
  const [qty, setQty] = useState<Quantities>({})
  const [extras, setExtras] = useState<string[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)

  const onSettled = useCallback(() => {
    void refetch()
  }, [refetch])
  const checkout = useCheckout({ cfg, onSettled })

  const packs = cartPacks(qty)
  const total = cartTotal(qty)
  const wrongChain = Boolean(address) && chainId !== ARC_CHAIN_ID
  const showReceipt = checkout.phase === 'paid' && checkout.receipt !== null

  const blocked: BlockReason = !cfg.ok
    ? 'config'
    : checkout.busy
      ? 'busy'
      : packs === 0
        ? 'empty'
        : !address
          ? 'disconnected'
          : wrongChain
            ? 'wrong_chain'
            : null

  const switchToArc = useCallback(() => switchChain({ chainId: ARC_CHAIN_ID }), [switchChain])
  const closeDrawer = useCallback(() => setDrawerOpen(false), [])

  const receipts = useMemo(() => loadReceipts(), [checkout.receipt, checkout.phase]) // eslint-disable-line react-hooks/exhaustive-deps

  const startNext = useCallback(() => {
    if (checkout.startNextOrder()) {
      setQty({})
      setExtras([])
      window.scrollTo({ top: 0 })
    }
  }, [checkout])

  const toggleExtra = (id: string) =>
    setExtras((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))

  // The checkout bar is hidden on the receipt, so the Arc Studio badge drops back to the corner.
  useEffect(() => {
    const root = document.documentElement
    if (showReceipt) root.dataset.view = 'receipt'
    return () => {
      delete root.dataset.view
    }
  }, [showReceipt])

  const visible = PRODUCTS.filter((p) => filter === 'All' || p.category === filter)

  return (
    <div className="min-h-dvh">
      <TopBar onMenu={() => setDrawerOpen(true)} menuOpen={drawerOpen} wrongChain={wrongChain} connected={Boolean(address)} />

      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        address={address}
        chainId={chainId}
        balance={balance}
        balanceLoading={balanceLoading}
        balanceError={balanceError}
        onSwitch={switchToArc}
        switching={switching}
        canStartNext={!checkout.busy}
        onStartNext={startNext}
        receipts={receipts}
        onOpenReceipt={checkout.openReceipt}
        receiptsLocked={checkout.busy}
      />

      <main
        className={`mx-auto max-w-6xl px-4 pt-4 sm:pt-6 ${
          showReceipt ? 'pb-24' : 'pb-[calc(var(--bar-h)+1.5rem)]'
        }`}
      >
        {showReceipt && checkout.receipt ? (
          <ReceiptView receipt={checkout.receipt} onNext={startNext} />
        ) : (
          <>
            <Hero
              onOrder={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            />

            {!cfg.ok && (
              <div role="alert" className="mt-4 rounded-2xl border border-danger/40 bg-danger/10 p-4 text-sm">
                <p className="font-semibold text-danger">Checkout is switched off</p>
                <p className="mt-1 text-[#e4ddd2]">{cfg.error}</p>
              </div>
            )}

            <section id="menu" aria-labelledby="menu-title" className="scroll-mt-20 pt-8 sm:pt-10">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
                <div>
                  <h2 id="menu-title" className="font-display text-3xl font-extrabold tracking-[-0.02em]">
                    The Menu
                  </h2>
                  <p className="mt-1 text-sm text-[#a39d94]">Fresh from the fire. Priced per pack in USDC.</p>
                </div>
              </div>
              <FilterTabs value={filter} onChange={setFilter} />
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {visible.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    qty={qty[p.id] ?? 0}
                    onChange={(n) => setQty((cur) => ({ ...cur, [p.id]: n }))}
                  />
                ))}
              </div>
            </section>

            <div className="mt-4 space-y-3">
              <ExtrasPicker selected={extras} onToggle={toggleExtra} />
              <p className="flex items-center gap-2.5 px-1 text-sm text-muted">
                <Droplets size={16} className="shrink-0 text-brand" />
                <span>
                  Need test USDC? Use Get test USDC in the sidebar.{' '}
                  <button type="button" onClick={() => setDrawerOpen(true)} className="press link min-h-[44px] sm:min-h-0">
                    Open sidebar
                  </button>
                </span>
              </p>
            </div>

            <Footer />
          </>
        )}
      </main>

      {!showReceipt && (
        <CheckoutBar
          packs={packs}
          total={total}
          blocked={blocked}
          configError={cfg.error}
          switching={switching}
          onSwitch={switchToArc}
          validating={checkout.phase === 'validating'}
          onPay={() => void checkout.startCheckout(snapshotOrder(qty, extras))}
        />
      )}

      <PaymentSheet checkout={checkout} merchant={cfg.merchant} onSwitch={switchToArc} switching={switching} />
    </div>
  )
}
