import React, { useMemo } from 'react'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets'
import { clusterApiUrl } from '@solana/web3.js'
import { isMobileDevice } from '../config/walletConfig'

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css'

export function SolanaWalletProvider({ children }) {
  // Use devnet for development
  const network = WalletAdapterNetwork.Devnet
  const endpoint = useMemo(() => clusterApiUrl(network), [network])

  const wallets = useMemo(
    () => {
      const adapters = []
      
      // Add Phantom adapter for both mobile and desktop
      // The key is to use the WalletModalProvider which handles connections properly
      adapters.push(new PhantomWalletAdapter())
      
      // Add Solflare as an alternative
      adapters.push(new SolflareWalletAdapter())
      
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