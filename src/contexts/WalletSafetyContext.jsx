import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  const [reloadAttempts, setReloadAttempts] = useState(0);
  const lastDisconnectTime = useRef(0);

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

  // Only disconnect wallet if it's actually causing reload issues
  useEffect(() => {
    if (!wallet.connected || !isPvPActive) return;

    const handleDisconnect = () => {
      const now = Date.now();
      const timeSinceLastDisconnect = now - lastDisconnectTime.current;

      // If wallet disconnected and page is trying to reload within 2 seconds,
      // it's likely the wallet causing the issue
      if (timeSinceLastDisconnect < 2000) {
        console.warn('Wallet disconnect detected - preventing reload');
        setReloadAttempts(prev => prev + 1);
      }

      lastDisconnectTime.current = now;
    };

    wallet.wallet?.adapter?.on?.('disconnect', handleDisconnect);

    return () => {
      wallet.wallet?.adapter?.off?.('disconnect', handleDisconnect);
    };
  }, [wallet, isPvPActive]);

  // Prevent reload events only if wallet is causing issues
  useEffect(() => {
    if (!isPvPActive) return;

    const handleBeforeUnload = (e) => {
      // Only prevent reload if we've detected wallet-related reload attempts
      if (reloadAttempts > 0) {
        const timeSinceDisconnect = Date.now() - lastDisconnectTime.current;

        // If reload happens shortly after wallet disconnect, prevent it
        if (timeSinceDisconnect < 3000) {
          e.preventDefault();
          e.stopPropagation();
          console.log('Prevented wallet-triggered reload during PvP');

          // Show user message
          const message = 'Your wallet disconnected but the game continues!';
          e.returnValue = message;

          // Reset counter after preventing
          setTimeout(() => setReloadAttempts(0), 5000);

          return message;
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload, true);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload, true);
    };
  }, [isPvPActive, reloadAttempts]);

  // Log wallet status for debugging
  useEffect(() => {
    if (isPvPActive) {
      console.log('PvP Battle Active - Wallet Status:', {
        connected: wallet.connected,
        publicKey: wallet.publicKey?.toString(),
        reloadAttempts,
        walletName: wallet.wallet?.adapter?.name
      });
    }
  }, [isPvPActive, wallet.connected, reloadAttempts]);

  return (
    <WalletSafetyContext.Provider value={{
      isPvPActive,
      setIsPvPActive,
      walletConnected: wallet.connected,
      reloadAttempts
    }}>
      {children}
    </WalletSafetyContext.Provider>
  );
};