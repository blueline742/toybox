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
      const isMobile = isMobileDevice()
      
      if (isMobile) {
        // MOBILE: Only use WalletConnect adapter
        // This prevents Phantom's deep link from opening a new tab
        adapters.push(
          new WalletConnectWalletAdapter({
            network,
            options: {
              ...walletConnectConfig,
              // Force WalletConnect to handle the connection
              qrcodeModalOptions: {
                mobileLinks: [
                  'phantom',
                  'solflare',
                  'trust',
                ],
                desktopLinks: []
              }
            }
          })
        )
        // DO NOT add any other adapters on mobile to prevent conflicts
      } else {
        // DESKTOP: Use browser extensions first, WalletConnect as fallback
        
        // Phantom browser extension (desktop only)
        adapters.push(new PhantomWalletAdapter())
        
        // Solflare browser extension
        adapters.push(new SolflareWalletAdapter())
        
        // WalletConnect as a fallback option on desktop
        adapters.push(
          new WalletConnectWalletAdapter({
            network,
            options: walletConnectConfig
          })
        )
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