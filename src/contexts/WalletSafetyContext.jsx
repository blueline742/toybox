import React, { createContext, useContext, useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

const WalletSafetyContext = createContext();

export const useWalletSafety = () => {
  const context = useContext(WalletSafetyContext);
  if (!context) {
    throw new Error('useWalletSafety must be used within WalletSafetyProvider');
  }
  return context;
};

export const WalletSafetyProvider = ({ children }) => {
  const wallet = useWallet();
  const [isPvPActive, setIsPvPActive] = useState(false);
  const [walletWasConnected, setWalletWasConnected] = useState(false);

  // Monitor for PvP battles
  useEffect(() => {
    const checkPvPState = () => {
      // Check if we're in a PvP battle
      const inPvP = window.location.pathname?.includes('/pvp') ||
                    window.location.pathname?.includes('/battle') ||
                    document.querySelector('[data-pvp-active="true"]');

      setIsPvPActive(!!inPvP);
    };

    checkPvPState();

    // Check periodically
    const interval = setInterval(checkPvPState, 1000);

    return () => clearInterval(interval);
  }, []);

  // Handle wallet disconnect during PvP on mobile
  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile && isPvPActive && wallet.connected) {
      console.log('PvP active on mobile - disconnecting wallet for stability');
      setWalletWasConnected(true);

      // Disconnect wallet safely
      try {
        // Add a flag to prevent reload
        window._preventWalletReload = true;

        // Temporarily override event handlers
        const originalAddEventListener = window.addEventListener;
        window.addEventListener = function(type, listener, options) {
          // Block beforeunload events during disconnect
          if (type === 'beforeunload' || type === 'unload') {
            console.log('Blocked', type, 'event during wallet disconnect');
            return;
          }
          return originalAddEventListener.call(this, type, listener, options);
        };

        // Disconnect wallet
        wallet.disconnect().catch(err => {
          console.warn('Failed to disconnect wallet:', err);
        });

        // Restore after a moment
        setTimeout(() => {
          window.addEventListener = originalAddEventListener;
          window._preventWalletReload = false;
        }, 100);

      } catch (err) {
        console.error('Error disconnecting wallet:', err);
      }
    } else if (!isPvPActive && walletWasConnected && !wallet.connected) {
      console.log('PvP ended - wallet can be reconnected');
      setWalletWasConnected(false);
    }
  }, [isPvPActive, wallet.connected]);

  // Prevent reload events
  useEffect(() => {
    if (!isPvPActive) return;

    const handleBeforeUnload = (e) => {
      if (window._preventWalletReload) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Prevented reload during PvP');
        return false;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload, true);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload, true);
    };
  }, [isPvPActive]);

  return (
    <WalletSafetyContext.Provider value={{ isPvPActive, setIsPvPActive }}>
      {children}
    </WalletSafetyContext.Provider>
  );
};