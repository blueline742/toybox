// WalletConnect Configuration (Currently Disabled)
// WalletConnect requires additional setup and verification
// For now, using Solflare for better mobile experience

export const WALLETCONNECT_PROJECT_ID = 'ea70be4dc72fd3ba78ec71af5a112eb0'

export const walletConnectConfig = {
  relayUrl: 'wss://relay.walletconnect.com',
  projectId: WALLETCONNECT_PROJECT_ID,
  metadata: {
    name: 'Toy Box Brawl',
    description: 'Epic toy battles on Solana! Battle, win, and collect unique toy NFTs.',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://toyboxbrawl.netlify.app',
    icons: [
      typeof window !== 'undefined' 
        ? `${window.location.origin}/toybox-icon.svg`
        : 'https://toyboxbrawl.netlify.app/toybox-icon.svg'
    ]
  },
  // Ensure WalletConnect modal is used instead of deep links
  qrcode: true,
  // Disable automatic deep linking on mobile
  disableProviderPing: true
}

// Detect if we're on mobile
export const isMobileDevice = () => {
  if (typeof window === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         (window.innerWidth <= 768)
}

// Network configuration
export const NETWORK = 'devnet' // Change to 'mainnet-beta' for production

// Mobile wallet recommendations
export const MOBILE_WALLET_INFO = {
  recommended: 'Solflare',
  reason: 'Solflare provides the best mobile experience, staying within your browser.',
  phantom: 'Phantom opens in its own browser for security, which is expected behavior.',
  instructions: 'For the best mobile experience, we recommend using Solflare wallet.'
}