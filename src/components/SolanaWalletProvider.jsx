import React, { useMemo, useEffect } from 'react'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare'
// Temporarily disable WalletConnect until configuration is fixed
// import { WalletConnectWalletAdapter } from '@solana/wallet-adapter-walletconnect'
import { clusterApiUrl } from '@solana/web3.js'
import { isMobileDevice, walletConnectConfig } from '../config/walletConfig'

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css'

export function SolanaWalletProvider({ children }) {
  // Use devnet for development
  const network = WalletAdapterNetwork.Devnet
  const endpoint = useMemo(() => clusterApiUrl(network), [network])

  // Prevent wallet disconnection from causing page reload on mobile
  useEffect(() => {
    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      // Override window.location to prevent accidental reloads
      const originalLocation = window.location;
      const locationProxy = new Proxy(originalLocation, {
        set(target, prop, value) {
          if (prop === 'href' || prop === 'pathname') {
            console.warn('Prevented page navigation during PvP battle:', prop, value);
            // Only allow navigation to root from error states
            if (value === '/' && window.location.pathname.includes('battle')) {
              return true; // Block navigation during battles
            }
          }
          return Reflect.set(target, prop, value);
        }
      });

      // Prevent reload() calls
      const originalReload = window.location.reload;
      window.location.reload = function(...args) {
        console.warn('Prevented page reload on mobile during gameplay');
        // Don't actually reload
        return false;
      };

      // Cleanup on unmount
      return () => {
        window.location.reload = originalReload;
      };
    }
  }, [])

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

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider
        wallets={wallets}
        autoConnect={false} // Don't auto-connect on mobile to prevent unwanted redirects
        onError={(error) => {
          console.error('Wallet connection error:', error)
          // Handle connection errors gracefully
          // CRITICAL: Don't reload the page on wallet errors!
          error.preventDefault?.();
          return false;
        }}
        localStorageKey="toybox-wallet"
      >
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}