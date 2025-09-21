import { useEffect } from 'react';

// Hook to prevent page reloads during PvP on mobile
export const usePreventReload = (isActive) => {
  useEffect(() => {
    if (!isActive) return;

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isWalletBrowser = /Phantom|Solflare/i.test(navigator.userAgent) ||
                           window.phantom || window.solflare;

    if (!isMobile && !isWalletBrowser) return;

    console.log('🛡️ Activating aggressive reload prevention for mobile/wallet browser');

    // Store original functions
    const originalReload = window.location.reload;
    const originalReplace = window.location.replace;
    const originalAssign = window.location.assign;
    const originalHref = Object.getOwnPropertyDescriptor(window.location, 'href');
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    const originalBack = history.back;
    const originalForward = history.forward;
    const originalGo = history.go;

    // Override all navigation methods
    window.location.reload = () => {
      console.warn('❌ Blocked: window.location.reload during PvP');
      return false;
    };

    window.location.replace = (url) => {
      console.warn('❌ Blocked: window.location.replace during PvP:', url);
      return false;
    };

    window.location.assign = (url) => {
      console.warn('❌ Blocked: window.location.assign during PvP:', url);
      return false;
    };

    // Override href setter
    Object.defineProperty(window.location, 'href', {
      set: (url) => {
        console.warn('❌ Blocked: window.location.href = during PvP:', url);
        return false;
      },
      get: originalHref?.get || (() => window.location.href)
    });

    // Override history methods
    history.pushState = (...args) => {
      console.warn('❌ Blocked: history.pushState during PvP');
      return null;
    };

    history.replaceState = (...args) => {
      console.warn('❌ Blocked: history.replaceState during PvP');
      return null;
    };

    history.back = () => {
      console.warn('❌ Blocked: history.back during PvP');
      return null;
    };

    history.forward = () => {
      console.warn('❌ Blocked: history.forward during PvP');
      return null;
    };

    history.go = () => {
      console.warn('❌ Blocked: history.go during PvP');
      return null;
    };

    // Block beforeunload and unload events
    const blockUnload = (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      console.warn('❌ Blocked: unload event during PvP');
      const message = 'PvP battle in progress!';
      e.returnValue = message;
      return message;
    };

    // Add multiple listeners to catch all attempts
    window.addEventListener('beforeunload', blockUnload, true);
    window.addEventListener('unload', blockUnload, true);
    document.addEventListener('beforeunload', blockUnload, true);
    document.addEventListener('unload', blockUnload, true);

    // Block page visibility changes that might trigger reload
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('📱 App backgrounded - preventing any reload attempts');
        // Re-apply all blocks in case they were cleared
        window.location.reload = () => false;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Block navigation via links
    const blockNavigation = (e) => {
      const target = e.target;
      if (target.tagName === 'A' || target.closest('a')) {
        e.preventDefault();
        e.stopPropagation();
        console.warn('❌ Blocked: link navigation during PvP');
        return false;
      }
    };

    document.addEventListener('click', blockNavigation, true);

    // Cleanup function
    return () => {
      console.log('🔓 Removing reload prevention');

      // Restore original functions
      window.location.reload = originalReload;
      window.location.replace = originalReplace;
      window.location.assign = originalAssign;

      if (originalHref) {
        Object.defineProperty(window.location, 'href', originalHref);
      }

      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
      history.back = originalBack;
      history.forward = originalForward;
      history.go = originalGo;

      // Remove event listeners
      window.removeEventListener('beforeunload', blockUnload, true);
      window.removeEventListener('unload', blockUnload, true);
      document.removeEventListener('beforeunload', blockUnload, true);
      document.removeEventListener('unload', blockUnload, true);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('click', blockNavigation, true);
    };
  }, [isActive]);
};