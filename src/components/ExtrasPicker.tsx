import { Check } from 'lucide-react'
import { EXTRAS } from '@/lib/menu'

interface Props {
  selected: string[]
  onToggle: (id: string) => void
}

export function ExtrasPicker({ selected, onToggle }: Props) {
  return (
    <fieldset className="panel p-4 sm:p-5">
      <legend className="sr-only">Free extras for the whole order</legend>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-lg font-bold tracking-tight">Free extras</h3>
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Whole order</span>
      </div>
      <p className="mt-1 text-sm text-muted">On the house. They show on your receipt and never change the total.</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {EXTRAS.map((e) => {
          const on = selected.includes(e.id)
          return (
            <label
              key={e.id}
              className={`press relative flex min-h-[52px] cursor-pointer items-center gap-3 rounded-2xl border px-3.5 py-2.5 text-sm font-medium transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand ${
                on ? 'border-brand/70 bg-brand-soft' : 'border-line bg-field hover:bg-raised'
              }`}
            >
              <input
                type="checkbox"
                checked={on}
                onChange={() => onToggle(e.id)}
                className="peer sr-only"
              />
              <span
                aria-hidden="true"
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border transition-colors ${
                  on ? 'border-brand bg-brand text-ink' : 'border-white/25 text-transparent'
                }`}
              >
                <Check size={15} strokeWidth={3} />
              </span>
              <span className="flex-1">{e.label}</span>
              <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-brand">Free</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
