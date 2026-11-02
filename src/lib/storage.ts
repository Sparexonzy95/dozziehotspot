import type { Address, Hash } from 'viem'
import type { OrderSnapshot } from './menu'

const NS = 'dozzie:v1:'
const K_PENDING = `${NS}pending`
const K_RECEIPTS = `${NS}receipts`
const K_COUNTER = `${NS}counter`
const K_ACTIVE = `${NS}active`

export interface PendingPayment {
  hash: Hash
  payer: Address
  recipient: Address
  token: Address
  chainId: number
  /** Atomic USDC as a decimal string. */
  amount: string
  order: OrderSnapshot
  submittedAt: number
}

export interface Receipt {
  hash: Hash
  seq: number
  code: string
  payer: Address
  recipient: Address
  token: Address
  chainId: number
  amount: string
  order: OrderSnapshot
  blockNumber: string
  blockTimestamp: number
  recordedAt: number
}

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage can be full or blocked (private mode). The in-memory flow still works.
  }
}

const isHash = (v: unknown): v is Hash => typeof v === 'string' && /^0x[0-9a-fA-F]{64}$/.test(v)

export function loadPending(): PendingPayment | null {
  const p = read<PendingPayment>(K_PENDING)
  if (!p || !isHash(p.hash) || !p.order || typeof p.amount !== 'string') return null
  return p
}

export const savePending = (p: PendingPayment): void => write(K_PENDING, p)

export function clearPending(): void {
  try {
    localStorage.removeItem(K_PENDING)
  } catch {
    // ignore
  }
}

export function loadReceipts(): Receipt[] {
  const list = read<Receipt[]>(K_RECEIPTS)
  if (!Array.isArray(list)) return []
  return list.filter((r) => r && isHash(r.hash) && r.order && typeof r.amount === 'string')
}

export const orderCode = (seq: number): string => `#WOJI-${String(seq).padStart(3, '0')}`

export const sameHash = (a: string, b: string): boolean => a.toLowerCase() === b.toLowerCase()

/**
 * Stores a confirmed payment exactly once per transaction hash and assigns the next
 * local order number. Returns the existing receipt when the hash was already recorded.
 */
export function recordReceipt(input: Omit<Receipt, 'seq' | 'code' | 'recordedAt'>): Receipt {
  const receipts = loadReceipts()
  const existing = receipts.find((r) => sameHash(r.hash, input.hash))
  if (existing) return existing

  const counter = Number(read<number>(K_COUNTER) ?? 0)
  const highest = receipts.reduce((m, r) => Math.max(m, r.seq), 0)
  const seq = Math.max(Number.isFinite(counter) ? counter : 0, highest) + 1
  const receipt: Receipt = { ...input, seq, code: orderCode(seq), recordedAt: Date.now() }

  write(K_COUNTER, seq)
  write(K_RECEIPTS, [...receipts, receipt])
  return receipt
}

export function loadActiveHash(): string | null {
  return read<string>(K_ACTIVE)
}

export function setActiveHash(hash: string | null): void {
  if (hash) {
    write(K_ACTIVE, hash)
    return
  }
  try {
    localStorage.removeItem(K_ACTIVE)
  } catch {
    // ignore
  }
}
