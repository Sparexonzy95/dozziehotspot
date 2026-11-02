import { FILTERS, type Filter } from '@/lib/menu'

interface Props {
  value: Filter
  onChange: (f: Filter) => void
}

export function FilterTabs({ value, onChange }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Filter menu by meat"
      className="no-scrollbar -mx-4 flex flex-nowrap gap-2 overflow-x-auto px-4 py-1 sm:mx-0 sm:px-0"
    >
      {FILTERS.map((f) => {
        const active = f === value
        return (
          <button
            key={f}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(f)}
            className={`press inline-flex h-11 shrink-0 items-center whitespace-nowrap rounded-full border px-5 text-sm font-semibold ${
              active
                ? 'border-brand bg-brand text-ink'
                : 'border-line bg-card text-fg-soft hover:border-white/25 hover:bg-raised'
            }`}
          >
            {f}
          </button>
        )
      })}
    </div>
  )
}
