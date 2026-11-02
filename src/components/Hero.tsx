import { ArrowDown, MapPin } from 'lucide-react'
import { LOCATION } from '@/lib/dozzie'

export function Hero({ onOrder }: { onOrder: () => void }) {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate overflow-hidden rounded-3xl border border-line sm:rounded-[28px]"
    >
      <img
        src="/img/hero.jpg"
        alt="Young suya sellers grilling skewers over a charcoal drum in the shade of tall pines"
        className="absolute inset-0 -z-20 h-full w-full object-cover"
        style={{ objectPosition: '50% 78%' }}
      />
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            'linear-gradient(180deg, rgba(8,8,8,0.55) 0%, rgba(8,8,8,0.62) 45%, rgba(8,8,8,0.94) 100%), linear-gradient(90deg, rgba(8,8,8,0.7), rgba(8,8,8,0.15))',
        }}
      />

      <div className="anim-rise flex min-h-[300px] flex-col justify-end gap-4 p-5 sm:min-h-[340px] sm:p-8 lg:min-h-[380px] lg:max-w-2xl lg:p-10">
        <p className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-fg">
          <MapPin size={13} className="text-brand" /> {LOCATION}
        </p>
        <div>
          <h1
            id="hero-title"
            className="font-display text-[40px] font-extrabold leading-[0.98] tracking-[-0.02em] text-balance sm:text-6xl"
          >
            Fresh Off the Grill.
          </h1>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-fg-soft text-pretty sm:text-base">
            Your favourite suya in Woji. Order fresh, pay in USDC, and show your receipt.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <button
            type="button"
            onClick={onOrder}
            className="btn btn-primary btn-lg"
          >
            Order Your Suya <ArrowDown size={18} />
          </button>
          <span className="text-sm font-medium text-fg-soft">Hot Suya. Instant USDC Payments.</span>
        </div>
      </div>
    </section>
  )
}
