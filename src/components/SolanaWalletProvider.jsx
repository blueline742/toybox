import React, { useMemo } from 'react'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets'
import { WalletConnectWalletAdapter } from '@solana/wallet-adapter-walletconnect'
import { clusterApiUrl } from '@solana/web3.js'
import { walletConnectConfig, isMobileDevice } from '../config/walletConfig'

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css'

export function SolanaWalletProvider({ children }) {
  // Use devnet for development
  const network = WalletAdapterNetwork.Devnet
  const endpoint = useMemo(() => clusterApiUrl(network), [network])

  const wallets = useMemo(
    () => {
      const adapters = []
      
      // WalletConnect adapter - Primary for mobile, also available on desktop
      // This enables users to stay in their browser while connecting through WalletConnect
      // Works with Phantom, Solflare, and other WalletConnect-compatible wallets
      adapters.push(
        new WalletConnectWalletAdapter({
          network,
          options: walletConnectConfig
        })
      )
      
      // Desktop-specific wallet adapters
      // Only add browser extension wallets on desktop
      if (!isMobileDevice()) {
        // Phantom browser extension (desktop only)
        adapters.push(new PhantomWalletAdapter())
        
        // Solflare browser extension
        adapters.push(new SolflareWalletAdapter())
      }
      
      return adapters
    },
    [network]
  )

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}