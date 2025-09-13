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
import { isMobileDevice, walletConnectConfig } from '../config/walletConfig'

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css'

export function SolanaWalletProvider({ children }) {
  // Use devnet for development
  const network = WalletAdapterNetwork.Devnet
  const endpoint = useMemo(() => clusterApiUrl(network), [network])

  const wallets = useMemo(
    () => {
      const adapters = []
      
      // Check if we're on mobile
      const isMobile = isMobileDevice()
      
      if (isMobile) {
        // On mobile, prioritize WalletConnect to avoid tab switching
        // This keeps users in your app instead of redirecting to Phantom browser
        adapters.push(new WalletConnectWalletAdapter({
          network: network,
          options: {
            projectId: walletConnectConfig.projectId,
            relayUrl: walletConnectConfig.relayUrl,
            metadata: walletConnectConfig.metadata,
            qrcode: true, // Show QR code for desktop scanning
            disableProviderPing: true // Prevent auto-redirect on mobile
          }
        }))
      }
      
      // Add Phantom adapter - on mobile it will be a secondary option
      adapters.push(new PhantomWalletAdapter())
      
      // Add Solflare as an alternative
      adapters.push(new SolflareWalletAdapter())
      
      return adapters
    },
    [network]
  )

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider 
        wallets={wallets} 
        autoConnect={false} // Don't auto-connect on mobile to prevent unwanted redirects
        onError={(error) => {
          console.error('Wallet connection error:', error)
          // Handle connection errors gracefully
        }}
      >
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}