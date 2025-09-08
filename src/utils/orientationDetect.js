// Orientation detection utilities for landscape mode enforcement during battles

export const isLandscapeMode = () => {
  // Check if it's a mobile device first
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                   window.innerWidth <= 768;
  
  if (!isMobile) {
    // Desktop always considered "landscape" (no restriction)
    return true;
  }
  
  // For mobile devices, check actual orientation
  if (window.orientation !== undefined) {
    // Mobile browsers with orientation API
    return window.orientation === 90 || window.orientation === -90;
  }
  
  // Fallback to window dimensions
  return window.innerWidth > window.innerHeight;
};

export const isPortraitMode = () => {
  return !isLandscapeMode();
};

export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         ('ontouchstart' in window) ||
         (navigator.maxTouchPoints > 0);
};

export const isTabletDevice = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(userAgent);
  return isTablet;
};

export const shouldEnforceLandscape = () => {
  // Only enforce landscape on phones, not tablets or desktop
  return isMobileDevice() && !isTabletDevice() && window.innerWidth <= 768;
};

export const getOrientationType = () => {
  if (window.screen && window.screen.orientation) {
    return window.screen.orientation.type;
  }
  
  if (window.orientation !== undefined) {
    if (window.orientation === 0 || window.orientation === 180) {
      return 'portrait-primary';
    }
    return 'landscape-primary';
  }
  
  return window.innerHeight > window.innerWidth ? 'portrait-primary' : 'landscape-primary';
};