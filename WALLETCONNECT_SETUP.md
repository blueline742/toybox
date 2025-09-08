# WalletConnect Setup for Toy Box Brawl

## Overview
This game now uses WalletConnect v2 to enable seamless wallet connections on mobile devices. Users can stay in their browser (Safari, Chrome, etc.) while connecting through Phantom or other compatible wallets.

## Key Features
✅ **No In-App Browser Redirect** - Stay in Safari/Chrome while connecting  
✅ **Desktop Support** - Works with Phantom extension on desktop  
✅ **Mobile Support** - Uses WalletConnect for mobile wallet connections  
✅ **Multiple Wallets** - Supports Phantom, Solflare, and other WalletConnect-compatible wallets  
✅ **Landscape Mode** - Full support for landscape orientation on mobile  

## Setup Instructions

### 1. Get a WalletConnect Project ID

1. Go to [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Sign up or log in
3. Create a new project
4. Copy your Project ID

### 2. Configure the Project

Replace the placeholder Project ID in `src/config/walletConfig.js`:

```javascript
export const WALLETCONNECT_PROJECT_ID = 'your-actual-project-id-here'
```

### 3. Update Metadata (Optional)

You can customize the app metadata in `src/config/walletConfig.js`:

```javascript
export const walletConnectConfig = {
  relayUrl: 'wss://relay.walletconnect.com',
  projectId: WALLETCONNECT_PROJECT_ID,
  metadata: {
    name: 'Toy Box Brawl',
    description: 'Your description here',
    url: 'https://your-domain.com',
    icons: ['https://your-domain.com/icon.svg']
  }
}
```

## How It Works

### Mobile Flow
1. User clicks "Connect Wallet" button
2. WalletConnect modal appears with QR code and wallet options
3. User selects Phantom (or another wallet)
4. Phantom app opens with connection request
5. User approves in Phantom
6. User is returned to the game in their browser
7. Wallet is connected and ready to use

### Desktop Flow
1. User clicks "Connect Wallet" button
2. If Phantom extension is installed, it connects directly
3. Otherwise, WalletConnect modal appears for QR code scanning

## Wallet Adapter Configuration

The wallet adapters are configured in `src/components/SolanaWalletProvider.jsx`:

- **WalletConnect Adapter**: Primary adapter for mobile, also available on desktop
- **Phantom Adapter**: Desktop browser extension (only loaded on desktop)
- **Solflare Adapter**: Desktop browser extension (only loaded on desktop)

## Testing

### Desktop Testing
1. Open the game in Chrome/Firefox/Edge
2. Click "Connect Wallet"
3. Select Phantom from the list
4. Approve connection in Phantom extension

### Mobile Testing
1. Open the game in Safari/Chrome on your phone
2. Ensure you have Phantom app installed
3. Click "Connect Wallet"
4. Select Phantom from the list
5. Approve in Phantom app
6. Return to browser - wallet should be connected

### Landscape Mode Testing
1. Rotate your phone to landscape
2. Wallet button should remain accessible
3. Connection flow should work normally

## Troubleshooting

### Wallet Not Connecting
- Ensure you have a valid WalletConnect Project ID
- Check that your domain is added to the project's allowed origins
- Clear browser cache and try again

### Mobile Issues
- Make sure you're using a supported browser (Safari, Chrome)
- Ensure Phantom app is up to date
- Try disconnecting and reconnecting

### Desktop Issues
- Check that browser extensions are enabled
- Try disabling other wallet extensions that might conflict
- Use the WalletConnect option as a fallback

## Network Configuration

The app is currently configured for **Devnet**. To change to Mainnet:

1. Update `src/config/walletConfig.js`:
```javascript
export const NETWORK = 'mainnet-beta'
```

2. Update `src/components/SolanaWalletProvider.jsx`:
```javascript
const network = WalletAdapterNetwork.Mainnet
```

## Security Notes

- Never commit your actual WalletConnect Project ID to public repos
- Use environment variables for production:
  ```javascript
  export const WALLETCONNECT_PROJECT_ID = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID
  ```
- Ensure your domain whitelist is properly configured in WalletConnect Cloud

## Support

For issues related to:
- WalletConnect: Check [WalletConnect Docs](https://docs.walletconnect.com/)
- Solana Wallet Adapter: Check [Solana Wallet Adapter Docs](https://github.com/solana-labs/wallet-adapter)
- Phantom: Check [Phantom Support](https://phantom.app/support)