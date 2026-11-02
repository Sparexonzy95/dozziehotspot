import { Minus, Plus } from 'lucide-react'
import { MAX_PER_PRODUCT, type Product } from '@/lib/menu'
import { parseUsdc } from '@/onchain-money'
import { fmtUsdc } from '@/lib/dozzie'

interface Props {
  product: Product
  qty: number
  onChange: (qty: number) => void
}

export function ProductCard({ product, qty, onChange }: Props) {
  const price = fmtUsdc(parseUsdc(product.price), 0)
  const selected = qty > 0
  return (
    <article
      className={`anim-rise group flex flex-col overflow-hidden rounded-3xl border bg-card transition-colors duration-200 ${
        selected ? 'border-brand/70' : 'border-line'
      }`}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-raised">
        <img
          src={product.image}
          alt={`${product.name} on the grill`}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          style={{ objectPosition: product.imagePosition }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <span className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] text-fg backdrop-blur-sm">
          {product.category}
        </span>
        {selected && (
          <span
            key={qty}
            className="anim-bump absolute right-3 top-3 grid h-8 min-w-8 place-items-center rounded-full bg-brand px-2 text-sm font-bold text-ink tnum"
          >
            {qty}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
        <div className="flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-display text-xl font-bold tracking-tight">{product.name}</h3>
            <p className="shrink-0 text-right tnum">
              <span className="font-display text-xl font-bold text-brand">{price}</span>
              <span className="ml-1 text-xs font-medium text-muted">USDC/pack</span>
            </p>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-muted text-pretty">{product.blurb}</p>
        </div>

        <div
          role="group"
          aria-label={`${product.name} quantity`}
          className="flex items-center justify-between well p-1.5"
        >
          <button
            type="button"
            onClick={() => onChange(Math.max(0, qty - 1))}
            disabled={qty === 0}
            aria-label={`Remove one pack of ${product.name}`}
            className="press grid h-12 w-14 place-items-center rounded-xl bg-raised text-fg hover:bg-lift disabled:opacity-30"
          >
            <Minus size={20} />
          </button>
          <span aria-live="polite" className="font-display text-2xl font-bold tnum">
            {qty}
            <span className="sr-only"> packs</span>
          </span>
          <button
            type="button"
            onClick={() => onChange(Math.min(MAX_PER_PRODUCT, qty + 1))}
            disabled={qty >= MAX_PER_PRODUCT}
            aria-label={`Add one pack of ${product.name}`}
            className="press grid h-12 w-14 place-items-center rounded-xl bg-brand text-ink hover:bg-brand-hover disabled:opacity-30"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>
    </article>
  )
}
