import { useCallback, useEffect, useRef, useState } from 'react'
import { erc20Abi, isAddressEqual, parseEventLogs } from 'viem'
import { useAccount, useConfig, useWriteContract } from 'wagmi'
import { getPublicClient, waitForTransactionReceipt } from 'wagmi/actions'
import { Amount, usdcToGasToken } from '@/onchain-money'
import {
  ARC_CHAIN_ID,
  USDC_DECIMALS_ARC,
  fmtUsdc,
  type CheckoutConfig,
} from '@/lib/dozzie'
import { classifyError, isReplacedError, type FailureKind } from '@/lib/errors'
import type { OrderSnapshot } from '@/lib/menu'
import {
  clearPending,
  loadActiveHash,
  loadPending,
  loadReceipts,
  recordReceipt,
  sameHash,
  savePending,
  setActiveHash,
  type PendingPayment,
  type Receipt,
} from '@/lib/storage'

export type Phase =
  | 'idle'
  | 'validating'
  | 'review'
  | 'awaiting_signature'
  | 'submitted'
  | 'confirming'
  | 'paid'
  | 'rejected'
  | 'failed'

export interface Failure {
  kind: FailureKind | 'unverified'
  message: string
}

export interface ReviewInfo {
  order: OrderSnapshot
  balance: bigint
  /** Estimated network fee in the native gas view (18 decimals). On Arc this is the same USDC. */
  fee: bigint
  /** Estimated gas units, reused so the wallet skips its own estimate. */
  gas: bigint
}

const RECEIPT_TIMEOUT_MS = 90_000

interface Options {
  cfg: CheckoutConfig
  onSettled: () => void
}

export function useCheckout({ cfg, onSettled }: Options) {
  const config = useConfig()
  const { address, chainId } = useAccount()
  const { writeContractAsync } = useWriteContract()

  const [init] = useState(() => {
    let pending = loadPending()
    if (pending) {
      const hash = pending.hash
      const done = loadReceipts().find((r) => sameHash(r.hash, hash))
      if (done) {
        // The receipt was saved but the pending record was not cleared before the page closed.
        clearPending()
        setActiveHash(done.hash)
        pending = null
      }
    }
    const activeHash = loadActiveHash()
    const receipt = !pending && activeHash ? (loadReceipts().find((r) => sameHash(r.hash, activeHash)) ?? null) : null
    return { pending, receipt }
  })

  const [phase, setPhase] = useState<Phase>(init.pending ? 'confirming' : init.receipt ? 'paid' : 'idle')
  const [pending, setPending] = useState<PendingPayment | null>(init.pending)
  const [receipt, setReceipt] = useState<Receipt | null>(init.receipt)
  const [review, setReview] = useState<ReviewInfo | null>(null)
  const [failure, setFailure] = useState<Failure | null>(null)
  const [delayed, setDelayed] = useState(false)

  const lockRef = useRef(Boolean(init.pending))
  const lastOrderRef = useRef<OrderSnapshot | null>(init.pending?.order ?? null)
  const recoveredRef = useRef(false)
  const onSettledRef = useRef(onSettled)
  useEffect(() => {
    onSettledRef.current = onSettled
  }, [onSettled])

  const fail = useCallback((f: Failure, next: 'failed' | 'rejected' = 'failed') => {
    lockRef.current = false
    setFailure(f)
    setPhase(next)
  }, [])

  /** Waits for the real receipt, then checks the USDC Transfer event before recording anything. */
  const verifyPayment = useCallback(
    async (p: PendingPayment): Promise<void> => {
      try {
        const rc = await waitForTransactionReceipt(config, {
          hash: p.hash,
          chainId: ARC_CHAIN_ID,
          timeout: RECEIPT_TIMEOUT_MS,
          pollingInterval: 750,
        })

        if (rc.status !== 'success') {
          clearPending()
          setPending(null)
          fail({ kind: 'reverted', message: 'The transaction was mined but failed on Arc. No payment was made and no receipt was issued.' })
          return
        }

        const transfers = parseEventLogs({ abi: erc20Abi, eventName: 'Transfer', logs: rc.logs })
        const expected = BigInt(p.amount)
        const verified = transfers.some(
          (l) =>
            isAddressEqual(l.address, p.token) &&
            isAddressEqual(l.args.from, p.payer) &&
            isAddressEqual(l.args.to, p.recipient) &&
            l.args.value === expected,
        )
        if (!verified) {
          clearPending()
          setPending(null)
          fail({
            kind: 'unverified',
            message: 'The transaction confirmed, but it did not move the exact USDC amount to the merchant. No receipt was issued.',
          })
          return
        }

        const client = getPublicClient(config, { chainId: ARC_CHAIN_ID })
        if (!client) throw new Error('RPC client unavailable')
        const block = await client.getBlock({ blockNumber: rc.blockNumber })

        const saved = recordReceipt({
          hash: rc.transactionHash,
          payer: p.payer,
          recipient: p.recipient,
          token: p.token,
          chainId: p.chainId,
          amount: p.amount,
          order: p.order,
          blockNumber: rc.blockNumber.toString(),
          blockTimestamp: Number(block.timestamp),
        })
        setActiveHash(saved.hash)
        clearPending()
        setPending(null)
        setReceipt(saved)
        setDelayed(false)
        setFailure(null)
        lockRef.current = false
        setPhase('paid')
        onSettledRef.current()
      } catch (e) {
        if (isReplacedError(e)) {
          clearPending()
          setPending(null)
          fail({ kind: 'reverted', message: 'The transaction was cancelled or replaced in your wallet. No payment was made.' })
          return
        }
        // Timeouts and RPC hiccups: the payment may still land. Keep it pending and let the customer re-check.
        setDelayed(true)
        setPhase('confirming')
      }
    },
    [config, fail],
  )

  // Resume a payment that was submitted before a refresh.
  useEffect(() => {
    if (recoveredRef.current) return
    recoveredRef.current = true
    const p = init.pending
    if (!p) return
    window.setTimeout(() => void verifyPayment(p), 0)
  }, [init.pending, verifyPayment])

  const startCheckout = useCallback(
    async (order: OrderSnapshot): Promise<void> => {
      if (lockRef.current) return
      lockRef.current = true
      lastOrderRef.current = order
      setFailure(null)
      setReview(null)
      setPhase('validating')

      try {
        if (!cfg.ok || !cfg.merchant || !cfg.usdc) {
          return fail({ kind: 'unknown', message: cfg.error ?? 'Checkout is not configured.' })
        }
        if (order.packs < 1 || order.lines.length === 0) {
          return fail({ kind: 'unknown', message: 'Your cart is empty. Add some suya first.' })
        }
        if (!address) {
          return fail({ kind: 'unknown', message: 'Connect your wallet to pay.' })
        }
        if (chainId !== ARC_CHAIN_ID) {
          return fail({ kind: 'wrong_chain', message: 'Switch your wallet to Arc Testnet to pay.' })
        }

        const client = getPublicClient(config, { chainId: ARC_CHAIN_ID })
        if (!client) return fail({ kind: 'network', message: 'Could not reach Arc Testnet. Try again.' })

        const total = BigInt(order.total)
        // One round trip: balance, gas estimate and gas price are fetched together.
        const [balanceRes, gasRes, priceRes] = await Promise.allSettled([
          client.readContract({ address: cfg.usdc, abi: erc20Abi, functionName: 'balanceOf', args: [address] }),
          client.estimateContractGas({
            address: cfg.usdc,
            abi: erc20Abi,
            functionName: 'transfer',
            args: [cfg.merchant, total],
            account: address,
          }),
          client.getGasPrice(),
        ])
        if (balanceRes.status === 'rejected') throw balanceRes.reason
        const balance = balanceRes.value
        if (balance < total) {
          return fail({
            kind: 'insufficient',
            message: `You have ${fmtUsdc(balance)} USDC but this order is ${fmtUsdc(total)} USDC. Use Get test USDC in the sidebar.`,
          })
        }
        if (gasRes.status === 'rejected') throw gasRes.reason
        if (priceRes.status === 'rejected') throw priceRes.reason

        const gas = gasRes.value
        const fee = gas * priceRes.value
        const needNative = usdcToGasToken(ARC_CHAIN_ID, Amount.fromRaw(total, USDC_DECIMALS_ARC)).raw + (fee * 12n) / 10n
        const haveNative = usdcToGasToken(ARC_CHAIN_ID, Amount.fromRaw(balance, USDC_DECIMALS_ARC)).raw
        if (haveNative < needNative) {
          return fail({
            kind: 'insufficient',
            message: 'Your USDC covers the order but not the network fee on top. Use Get test USDC in the sidebar.',
          })
        }

        setReview({ order, balance, fee, gas })
        setPhase('review')
      } catch (e) {
        const c = classifyError(e)
        fail({ kind: c.kind, message: c.message })
      }
    },
    [address, cfg, chainId, config, fail],
  )

  const confirmAndPay = useCallback(async (): Promise<void> => {
    if (phase !== 'review' || !review || !address || !cfg.ok || !cfg.merchant || !cfg.usdc) return
    if (chainId !== ARC_CHAIN_ID) {
      return fail({ kind: 'wrong_chain', message: 'Switch your wallet to Arc Testnet to pay.' })
    }
    const { order } = review
    const total = BigInt(order.total)
    setPhase('awaiting_signature')
    try {
      const hash = await writeContractAsync({
        address: cfg.usdc,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [cfg.merchant, total],
        chainId: ARC_CHAIN_ID,
        gas: (review.gas * 12n) / 10n,
      })
      const p: PendingPayment = {
        hash,
        payer: address,
        recipient: cfg.merchant,
        token: cfg.usdc,
        chainId: ARC_CHAIN_ID,
        amount: total.toString(),
        order,
        submittedAt: Date.now(),
      }
      savePending(p)
      setPending(p)
      setReview(null)
      setPhase('submitted')
      // Show "submitted" briefly, then the confirming step. Verification starts right away either way.
      window.setTimeout(() => setPhase((cur) => (cur === 'submitted' ? 'confirming' : cur)), 350)
      void verifyPayment(p)
    } catch (e) {
      const c = classifyError(e)
      if (c.kind === 'rejected') fail({ kind: c.kind, message: c.message }, 'rejected')
      else fail({ kind: c.kind, message: c.message })
    }
  }, [address, cfg, chainId, fail, phase, review, verifyPayment, writeContractAsync])

  const dismiss = useCallback((): void => {
    if (phase === 'review' || phase === 'rejected' || phase === 'failed') {
      lockRef.current = false
      setReview(null)
      setFailure(null)
      setPhase('idle')
    }
  }, [phase])

  const retry = useCallback((): void => {
    const order = lastOrderRef.current
    if (!order || (phase !== 'rejected' && phase !== 'failed')) return
    lockRef.current = false
    void startCheckout(order)
  }, [phase, startCheckout])

  const recheck = useCallback((): void => {
    if (!pending) return
    setDelayed(false)
    void verifyPayment(pending)
  }, [pending, verifyPayment])

  /** Stops tracking an unconfirmed payment. Only offered once confirmation is delayed. */
  const stopTracking = useCallback((): void => {
    clearPending()
    setPending(null)
    setDelayed(false)
    lockRef.current = false
    setPhase('idle')
  }, [])

  /** Leaves the receipt view. Past receipts stay in storage. */
  const startNextOrder = useCallback((): boolean => {
    if (phase !== 'paid' && phase !== 'idle') return false
    setActiveHash(null)
    setReceipt(null)
    setReview(null)
    setFailure(null)
    lockRef.current = false
    lastOrderRef.current = null
    setPhase('idle')
    return true
  }, [phase])

  const openReceipt = useCallback(
    (r: Receipt): void => {
      if (phase !== 'paid' && phase !== 'idle') return
      setActiveHash(r.hash)
      setReceipt(r)
      setPhase('paid')
    },
    [phase],
  )

  const busy = phase !== 'idle' && phase !== 'paid'

  return {
    phase,
    busy,
    pending,
    receipt,
    review,
    failure,
    delayed,
    startCheckout,
    confirmAndPay,
    dismiss,
    retry,
    recheck,
    stopTracking,
    startNextOrder,
    openReceipt,
  }
}

export type Checkout = ReturnType<typeof useCheckout>
