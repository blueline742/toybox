import React, { useMemo, useEffect, useState } from 'react'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare'
// Temporarily disable WalletConnect until configuration is fixed
// import { WalletConnectWalletAdapter } from '@solana/wallet-adapter-walletconnect'
import { clusterApiUrl } from '@solana/web3.js'
import { isMobileDevice, walletConnectConfig } from '../config/walletConfig'

import { useWallet } from '@solana/wallet-adapter-react'

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css'

// Wallet Connection Manager Component
const WalletConnectionManager = ({ children, onConnect, onDisconnect }) => {
  const wallet = useWallet()

  useEffect(() => {
    // Listen for wallet events
    if (wallet?.wallet) {
      wallet.wallet.adapter?.on?.('connect', () => onConnect(wallet))
      wallet.wallet.adapter?.on?.('disconnect', onDisconnect)

      return () => {
        wallet.wallet.adapter?.off?.('connect', () => onConnect(wallet))
        wallet.wallet.adapter?.off?.('disconnect', onDisconnect)
      }
    }
  }, [wallet?.wallet, onConnect, onDisconnect, wallet])

  return <>{children}</>
}

export function SolanaWalletProvider({ children }) {
  // Use devnet for development
  const network = WalletAdapterNetwork.Devnet
  const endpoint = useMemo(() => clusterApiUrl(network), [network])

  // Persist wallet connection in localStorage
  const [storedWallet, setStoredWallet] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('connectedWallet')
    }
    return null
  })

  const wallets = useMemo(
    () => {
      const adapters = []
      
      // Check if we're on mobile
      const isMobile = isMobileDevice()
      
      // Temporarily disable WalletConnect due to configuration issues
      // Will re-enable once proper project setup is complete
      /*
      if (isMobile) {
        try {
          const wcAdapter = new WalletConnectWalletAdapter({
            network: network === WalletAdapterNetwork.Devnet ? 'devnet' : 'mainnet-beta',
            options: {
              projectId: walletConnectConfig.projectId,
              relayUrl: walletConnectConfig.relayUrl,
              metadata: {
                name: walletConnectConfig.metadata.name,
                description: walletConnectConfig.metadata.description,
                url: walletConnectConfig.metadata.url,
                icons: walletConnectConfig.metadata.icons
              }
            }
          })
          adapters.push(wcAdapter)
        } catch (error) {
          console.error('Failed to initialize WalletConnect adapter:', error)
        }
      }
      */
      
      // Configure Phantom adapter for mobile
      // Note: Phantom mobile app always opens in their browser by design
      // This is intentional for security - users should manage wallets in Phantom app
      const phantomAdapter = new PhantomWalletAdapter()
      adapters.push(phantomAdapter)
      
      // Add Solflare as an alternative wallet option
      // Solflare has better mobile integration and stays in-app
      const solflareAdapter = new SolflareWalletAdapter()
      
      // On mobile, prioritize Solflare over Phantom for better UX
      if (isMobile) {
        adapters.push(solflareAdapter)
        adapters.push(phantomAdapter)
      } else {
        adapters.push(phantomAdapter)
        adapters.push(solflareAdapter)
      }
      
      return adapters
    },
    [network]
  )

  // Handle wallet connection persistence
  const handleConnect = (wallet) => {
    if (wallet?.publicKey) {
      const key = wallet.publicKey.toString()
      localStorage.setItem('connectedWallet', key)
      setStoredWallet(key)
      console.log('Wallet connected and saved:', key)
    }
  }

  const handleDisconnect = () => {
    console.log('Wallet disconnected')

    // Check if we're in PvP battle
    const inPvP = window.location.pathname?.includes('/pvp') ||
                  window.location.pathname?.includes('/battle') ||
                  document.querySelector('[data-pvp-active="true"]')

    if (inPvP) {
      // Don't clear storage during PvP - allow reconnect
      console.log('In PvP battle - preserving wallet state for reconnect')

      // Show a non-blocking notification instead of confirm dialog
      const notification = document.createElement('div')
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(255, 165, 0, 0.9);
        color: white;
        padding: 15px;
        border-radius: 8px;
        z-index: 10000;
        font-weight: bold;
      `
      notification.textContent = 'Wallet disconnected - Battle continues!'
      document.body.appendChild(notification)

      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification)
        }
      }, 3000)
    } else {
      // Not in PvP, safe to clear
      localStorage.removeItem('connectedWallet')
      setStoredWallet(null)
    }
  }

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider
        wallets={wallets}
        autoConnect={true} // Enable auto-reconnect
        onError={(error) => {
          console.error('Wallet connection error:', error)
          // Handle connection errors gracefully without reloading
          if (error.message?.includes('User rejected')) {
            console.log('User cancelled wallet connection')
          } else if (error.message?.includes('WalletNotFound')) {
            console.log('Wallet not installed')
          }
        }}
      >
        <WalletModalProvider>
          {/* Wrap children with connection handlers */}
          <WalletConnectionManager onConnect={handleConnect} onDisconnect={handleDisconnect}>
            {children}
          </WalletConnectionManager>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}