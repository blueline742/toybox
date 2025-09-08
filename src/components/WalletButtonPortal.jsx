import React, { useEffect, useState, useCallback } from 'react'
import ReactDOM from 'react-dom'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

const WalletButtonPortal = () => {
  const [mounted, setMounted] = useState(false)
  const [isPressed, setIsPressed] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Handle touch events to ensure button works on mobile
  const handleTouchStart = useCallback((e) => {
    e.stopPropagation()
    setIsPressed(true)
  }, [])

  const handleTouchEnd = useCallback((e) => {
    e.stopPropagation()
    setIsPressed(false)
    // Force click event on touch devices
    const target = e.currentTarget
    if (target) {
      setTimeout(() => {
        target.click()
      }, 0)
    }
  }, [])

  if (!mounted) return null

  return ReactDOM.createPortal(
    <div 
      id="wallet-button-portal" 
      style={{ 
        position: 'fixed',
        top: '16px',
        left: '16px',
        zIndex: 99999  // Extremely high z-index
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
            opacity: isPressed ? 0.8 : 0.6,
            animation: 'pulse 2s infinite',
            pointerEvents: 'none'  // Ensure glow doesn't block clicks
          }}
        />
        
        {/* Touch wrapper for mobile */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{
            position: 'relative',
            display: 'inline-block',
            touchAction: 'none',  // Prevent any default touch behavior
            WebkitTouchCallout: 'none',
            WebkitUserSelect: 'none',
            userSelect: 'none'
          }}
        >
          {/* Wallet Button */}
          <WalletMultiButton 
            style={{
              position: 'relative',
              background: isPressed 
                ? 'linear-gradient(135deg, #facc15 0%, #f97316 50%, #9333ea 100%)'
                : 'linear-gradient(135deg, #fbbf24 0%, #f472b6 50%, #a855f7 100%)',
              border: '2px solid rgba(255, 255, 255, 0.5)',
              borderRadius: '9999px',
              padding: '8px 24px',
              fontSize: '14px',
              fontWeight: 'bold',
              color: 'white',
              fontFamily: "'Comic Neue', cursive",
              boxShadow: isPressed 
                ? '0 1px 0 #c026d3, 0 3px 10px rgba(0,0,0,0.3)'
                : '0 3px 0 #c026d3, 0 6px 15px rgba(0,0,0,0.3)',
              textShadow: '1px 1px 3px rgba(0,0,0,0.3)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '200px',
              transform: isPressed ? 'scale(0.95)' : 'scale(1)',
              transition: 'all 0.1s ease',
              pointerEvents: 'auto',
              touchAction: 'none',
              WebkitTapHighlightColor: 'transparent',
              userSelect: 'none'
            }}
          />
        </div>
      </div>
    </div>,
    document.body
  )
}

export default WalletButtonPortal