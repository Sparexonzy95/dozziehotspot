export type FailureKind = 'rejected' | 'insufficient' | 'reverted' | 'network' | 'wrong_chain' | 'unknown'

interface Classified {
  kind: FailureKind
  message: string
}

function chainText(error: unknown): string {
  const parts: string[] = []
  let cur: unknown = error
  for (let i = 0; i < 6 && cur; i++) {
    if (typeof cur === 'object') {
      const e = cur as { name?: unknown; message?: unknown; shortMessage?: unknown; code?: unknown; cause?: unknown }
      if (typeof e.name === 'string') parts.push(e.name)
      if (typeof e.shortMessage === 'string') parts.push(e.shortMessage)
      if (typeof e.message === 'string') parts.push(e.message)
      if (typeof e.code === 'number' || typeof e.code === 'string') parts.push(`code:${String(e.code)}`)
      cur = e.cause
    } else {
      if (typeof cur === 'string') parts.push(cur)
      break
    }
  }
  return parts.join(' | ').toLowerCase()
}

export function classifyError(error: unknown): Classified {
  const t = chainText(error)
  if (t.includes('userrejected') || t.includes('user rejected') || t.includes('user denied') || t.includes('code:4001') || t.includes('rejected the request')) {
    return { kind: 'rejected', message: 'You cancelled the payment in your wallet. Nothing was charged.' }
  }
  if (t.includes('chainmismatch') || t.includes('does not match the target chain') || t.includes('switchchain') || t.includes('chain not configured')) {
    return { kind: 'wrong_chain', message: 'Your wallet is on the wrong network. Switch to Arc Testnet and try again.' }
  }
  if (t.includes('insufficient funds') || t.includes('exceeds balance') || t.includes('insufficientfunds')) {
    return { kind: 'insufficient', message: 'Not enough USDC to cover the order and the network fee. Use Get test USDC in the sidebar.' }
  }
  if (t.includes('revert') || t.includes('execution reverted')) {
    return { kind: 'reverted', message: 'The payment was rejected by the network. Nothing was charged. Please try again.' }
  }
  if (
    t.includes('timeout') ||
    t.includes('timed out') ||
    t.includes('network') ||
    t.includes('fetch') ||
    t.includes('http request failed') ||
    t.includes('rpc') ||
    t.includes('failed to') ||
    t.includes('429')
  ) {
    return { kind: 'network', message: 'Could not reach Arc Testnet. Check your connection and try again.' }
  }
  return { kind: 'unknown', message: 'Something went wrong with the payment. Please try again.' }
}

export function isTimeoutError(error: unknown): boolean {
  const t = chainText(error)
  return t.includes('timeouterror') || t.includes('timed out') || t.includes('timeout')
}

export function isReplacedError(error: unknown): boolean {
  return chainText(error).includes('transactionreplacederror')
}
