import { getAddress, isAddress, isAddressEqual, type Address } from 'viem'
import { buildAddressExplorerUrl, buildTxExplorerUrl, getUsdc, requireChain } from '@/onchain-facts'
import { Amount, usdcDecimalsFor } from '@/onchain-money'

export const ARC_CHAIN_ID = 5042002 as const
export const FAUCET_URL = 'https://faucet.circle.com'
export const BRAND = 'Dozzie Hotspot'
export const LOCATION = 'Woji Road, Port Harcourt'

const chain = requireChain(ARC_CHAIN_ID)
export const CHAIN_NAME = chain.name
export const USDC_DECIMALS_ARC = usdcDecimalsFor(ARC_CHAIN_ID)

export interface CheckoutConfig {
  ok: boolean
  merchant?: Address
  usdc?: Address
  error?: string
}

/** The merchant address is read only from the environment. There is deliberately no fallback. */
export function readCheckoutConfig(): CheckoutConfig {
  const usdcFact = getUsdc(ARC_CHAIN_ID)
  if (!usdcFact || !isAddress(usdcFact.address, { strict: false })) {
    return { ok: false, error: 'USDC is not configured for Arc Testnet.' }
  }
  const usdc = getAddress(usdcFact.address)

  const raw: unknown = import.meta.env.VITE_DOZZIE_WALLET
  const value = typeof raw === 'string' ? raw.trim() : ''
  if (!value) {
    return { ok: false, usdc, error: 'VITE_DOZZIE_WALLET is not set. Add the merchant wallet to .env and restart.' }
  }
  if (!isAddress(value, { strict: false })) {
    return { ok: false, usdc, error: 'VITE_DOZZIE_WALLET is not a valid wallet address.' }
  }
  const merchant = getAddress(value)
  if (isAddressEqual(merchant, '0x0000000000000000000000000000000000000000')) {
    return { ok: false, usdc, error: 'VITE_DOZZIE_WALLET cannot be the zero address.' }
  }
  if (isAddressEqual(merchant, usdc)) {
    return { ok: false, usdc, error: 'VITE_DOZZIE_WALLET cannot be the USDC contract.' }
  }
  return { ok: true, merchant, usdc }
}

export const shortAddress = (value: string): string =>
  value.length > 12 ? `${value.slice(0, 6)}\u2026${value.slice(-4)}` : value

export const shortHash = (value: string): string =>
  value.length > 20 ? `${value.slice(0, 10)}\u2026${value.slice(-8)}` : value

export const txUrl = (hash: string): string => buildTxExplorerUrl(ARC_CHAIN_ID, hash)
export const addressUrl = (address: string): string => buildAddressExplorerUrl(ARC_CHAIN_ID, address)

/** Display helper for an ERC-20 USDC amount in atomic units. */
export function fmtUsdc(atomic: bigint, fractionDigits = 2): string {
  return Amount.fromRaw(atomic, USDC_DECIMALS_ARC).toFixed(fractionDigits)
}

const lagos = new Intl.DateTimeFormat('en-NG', {
  dateStyle: 'medium',
  timeStyle: 'medium',
  timeZone: 'Africa/Lagos',
})

export function fmtBlockTime(seconds: number): string {
  return `${lagos.format(new Date(seconds * 1000))} WAT`
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const el = document.createElement('textarea')
      el.value = text
      el.setAttribute('readonly', '')
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(el)
      return ok
    } catch {
      return false
    }
  }
}
