import { parseUsdc } from '@/onchain-money'

export type Category = 'Beef' | 'Chicken' | 'Ram'
export type Filter = 'All' | Category
export const FILTERS: Filter[] = ['All', 'Beef', 'Chicken', 'Ram']

export interface Product {
  id: string
  name: string
  category: Category
  /** Whole-USDC price per pack, as a decimal string. */
  price: string
  blurb: string
  image: string
  imagePosition: string
}

export const PRODUCTS: Product[] = [
  {
    id: 'beef',
    name: 'Beef Suya',
    category: 'Beef',
    price: '2',
    blurb: 'Thin-sliced beef, rubbed in yaji and charred over open coals. Served with sliced onions.',
    image: '/img/pepper.jpg',
    imagePosition: '50% 45%',
  },
  {
    id: 'chicken',
    name: 'Chicken Suya',
    category: 'Chicken',
    price: '3',
    blurb: 'Juicy chicken on the stick, glazed with spiced oil and grilled until the edges catch.',
    image: '/img/varieties.jpg',
    imagePosition: '50% 12%',
  },
  {
    id: 'ram',
    name: 'Ram Suya',
    category: 'Ram',
    price: '4',
    blurb: 'Tender ram, heavy on the pepper, the Woji Road favourite. Smoky, rich and properly hot.',
    image: '/img/grill.jpg',
    imagePosition: '60% 70%',
  },
]

export interface Extra {
  id: string
  label: string
}

export const EXTRAS: Extra[] = [
  { id: 'yaji', label: 'Extra yaji pepper' },
  { id: 'onions', label: 'Extra sliced onions' },
  { id: 'cabbage', label: 'Cabbage wrap' },
]

export const MAX_PER_PRODUCT = 20

export type Quantities = Record<string, number>

export interface OrderLine {
  id: string
  name: string
  qty: number
  /** Atomic USDC (6 decimals) as a decimal string, so it survives JSON. */
  unit: string
  line: string
}

export interface OrderSnapshot {
  lines: OrderLine[]
  extras: string[]
  packs: number
  /** Atomic USDC total as a decimal string. */
  total: string
}

const unitPrice = (p: Product): bigint => parseUsdc(p.price)

export function cartPacks(q: Quantities): number {
  return PRODUCTS.reduce((n, p) => n + (q[p.id] ?? 0), 0)
}

/** Pure integer arithmetic in atomic USDC units. Extras never contribute. */
export function cartTotal(q: Quantities): bigint {
  return PRODUCTS.reduce((sum, p) => sum + unitPrice(p) * BigInt(q[p.id] ?? 0), 0n)
}

export function snapshotOrder(q: Quantities, extraIds: string[]): OrderSnapshot {
  const lines: OrderLine[] = PRODUCTS.filter((p) => (q[p.id] ?? 0) > 0).map((p) => {
    const qty = q[p.id] ?? 0
    return {
      id: p.id,
      name: p.name,
      qty,
      unit: unitPrice(p).toString(),
      line: (unitPrice(p) * BigInt(qty)).toString(),
    }
  })
  const extras = EXTRAS.filter((e) => extraIds.includes(e.id)).map((e) => e.label)
  const total = lines.reduce((s, l) => s + BigInt(l.line), 0n)
  return { lines, extras, packs: lines.reduce((n, l) => n + l.qty, 0), total: total.toString() }
}
