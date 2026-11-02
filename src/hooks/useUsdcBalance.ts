import { erc20Abi, type Address } from 'viem'
import { useReadContract } from 'wagmi'
import { getUsdc } from '@/onchain-facts'
import { ARC_CHAIN_ID } from '@/lib/dozzie'

const usdc = getUsdc(ARC_CHAIN_ID)

/** Live ERC-20 USDC balance (6 decimals) on Arc Testnet. This is the single balance shown in the app. */
export function useUsdcBalance(address: Address | undefined) {
  const query = useReadContract({
    address: usdc?.address as Address | undefined,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: ARC_CHAIN_ID,
    query: { enabled: Boolean(address && usdc), refetchInterval: 12_000 },
  })
  return {
    balance: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  }
}
