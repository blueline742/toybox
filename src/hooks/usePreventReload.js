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

    // Don't override href setter - it breaks too many things
    // Only log attempts
    if (originalHref && originalHref.set) {
      Object.defineProperty(window.location, 'href', {
        set: function(url) {
          console.warn('⚠️ Navigation attempt during PvP:', url);
          // Allow internal navigation but block external
          if (url && (url.startsWith('http') || url === '/')) {
            console.warn('❌ Blocked external navigation during PvP');
            return false;
          }
          return originalHref.set.call(this, url);
        },
        get: originalHref.get
      });
    }

    // Don't block history methods completely - breaks React Router
    history.pushState = function(...args) {
      console.log('📍 history.pushState during PvP:', args[2]);
      // Allow it but log
      return originalPushState.apply(this, args);
    };

    history.replaceState = function(...args) {
      console.log('📍 history.replaceState during PvP:', args[2]);
      // Allow it but log
      return originalReplaceState.apply(this, args);
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

    // Don't block all navigation - only external links
    const blockExternalNavigation = (e) => {
      const target = e.target?.closest('a');
      if (target && target.href && !target.href.includes(window.location.hostname)) {
        e.preventDefault();
        e.stopPropagation();
        console.warn('❌ Blocked: external link during PvP');
        return false;
      }
    };

    document.addEventListener('click', blockExternalNavigation, true);

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
      document.removeEventListener('click', blockExternalNavigation, true);
    };
  }, [isActive]);
};