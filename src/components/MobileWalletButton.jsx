import React, { useCallback, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletReadyState } from '@solana/wallet-adapter-base'
import { isMobileDevice } from '../config/walletConfig'

const MobileWalletButton = ({ style, className }) => {
  const { wallets, select, connect, connected, publicKey, disconnect, connecting } = useWallet()
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const handleConnect = useCallback(async () => {
    if (connected) {
      await disconnect()
      return
    }
    
    if (isMobileDevice()) {
      // On mobile, only show WalletConnect wallets
      const walletConnectWallet = wallets.find(
        wallet => wallet.adapter.name === 'WalletConnect'
      )
      
      if (walletConnectWallet) {
        try {
          await select(walletConnectWallet.adapter.name)
          await connect()
        } catch (error) {
          console.error('Failed to connect via WalletConnect:', error)
        }
      }
    } else {
      // On desktop, show modal with all wallet options
      setIsModalOpen(true)
    }
  }, [wallets, select, connect, connected, disconnect])
  
  const handleWalletSelect = useCallback(async (walletName) => {
    try {
      await select(walletName)
      await connect()
      setIsModalOpen(false)
    } catch (error) {
      console.error('Failed to connect wallet:', error)
    }
  }, [select, connect])
  
  const formatAddress = (address) => {
    if (!address) return ''
    const str = address.toString()
    return `${str.slice(0, 4)}...${str.slice(-4)}`
  }
  
  // Get button text
  const getButtonText = () => {
    if (connecting) return 'Connecting...'
    if (connected && publicKey) return formatAddress(publicKey)
    return 'Connect Wallet'
  }
  
  return (
    <>
      <button
        onClick={handleConnect}
        disabled={connecting}
        className={className}
        style={style}
      >
        {getButtonText()}
      </button>
      
      {/* Desktop Wallet Selection Modal */}
      {isModalOpen && !isMobileDevice() && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100000
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '400px',
              width: '90%'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 16px 0', color: '#333' }}>Select Wallet</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {wallets
                .filter(wallet => wallet.readyState === WalletReadyState.Installed || 
                               wallet.adapter.name === 'WalletConnect')
                .map(wallet => (
                  <button
                    key={wallet.adapter.name}
                    onClick={() => handleWalletSelect(wallet.adapter.name)}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #ddd',
                      backgroundColor: '#f9f9f9',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '16px'
                    }}
                  >
                    {wallet.adapter.name}
                  </button>
                ))}
            </div>
            <button
              onClick={() => setIsModalOpen(false)}
              style={{
                marginTop: '16px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#666',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default MobileWalletButton