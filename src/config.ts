/**
 * wagmi configuration
 * Built with Arc Studio — https://studio.arc.io
 */

import { http, createConfig } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { arcTestnet } from 'viem/chains'
import { injected, walletConnect } from 'wagmi/connectors'
import { registerChain } from './tracing'

// Pre-register chain RPC URLs so trace events show correct chain names immediately
registerChain(arcTestnet.id, arcTestnet.rpcUrls.default.http[0])

const wcProjectId = (import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined)?.trim()

export const config = createConfig({
  chains: [arcTestnet, mainnet], // mainnet needed for ENS resolution
  connectors: [
    injected(),
    // Optional: adds a QR / mobile deep-link option when a WalletConnect project ID is provided.
    ...(wcProjectId ? [walletConnect({ projectId: wcProjectId, showQrModal: false })] : []),
  ],
  transports: {
    [arcTestnet.id]: http(),
    [mainnet.id]: http(), // ENS resolution uses mainnet
  },
})
