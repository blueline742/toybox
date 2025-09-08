import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

const WalletButtonPortal = () => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted) return null

  return ReactDOM.createPortal(
    <div 
      id="wallet-button-portal" 
      style={{ 
        position: 'fixed',
        top: '16px',
        left: '16px',
        zIndex: 9999
      }}
    >
      <div style={{ position: 'relative', display: 'inline-block' }}>
        {/* Glow effect background */}
        <div 
          style={{
            position: 'absolute',
            inset: '-4px',
            background: 'linear-gradient(45deg, #ff00ff, #00ffff, #ff00ff)',
            borderRadius: '9999px',
            filter: 'blur(8px)',
            opacity: 0.6,
            animation: 'pulse 2s infinite',
            pointerEvents: 'none'  // Ensure glow doesn't block clicks
          }}
        />
        
        {/* Wallet Button */}
        <WalletMultiButton 
          style={{
            position: 'relative',
            background: 'linear-gradient(135deg, #fbbf24 0%, #f472b6 50%, #a855f7 100%)',
            border: '2px solid rgba(255, 255, 255, 0.5)',
            borderRadius: '9999px',
            padding: '8px 24px',
            fontSize: '14px',
            fontWeight: 'bold',
            color: 'white',
            fontFamily: "'Comic Neue', cursive",
            boxShadow: '0 3px 0 #c026d3, 0 6px 15px rgba(0,0,0,0.3)',
            textShadow: '1px 1px 3px rgba(0,0,0,0.3)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '200px',
            zIndex: 10000,
            pointerEvents: 'auto',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            userSelect: 'none'
          }}
        />
      </div>
    </div>,
    document.body
  )
}

export default WalletButtonPortal