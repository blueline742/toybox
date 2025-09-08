// Device detection utilities for performance optimization

export const isMobileDevice = () => {
  // Check if it's a touch device
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Check screen size
  const isSmallScreen = window.innerWidth <= 768;
  
  // Check user agent for mobile devices
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  const isMobileUA = mobileRegex.test(navigator.userAgent);
  
  return hasTouch || isSmallScreen || isMobileUA;
};

export const isLowEndDevice = () => {
  // Check for low-end device indicators
  const memoryLimit = navigator.deviceMemory && navigator.deviceMemory <= 4;
  const coreLimit = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
  
  return isMobileDevice() || memoryLimit || coreLimit;
};

export const getPerformanceSettings = () => {
  const isLowEnd = isLowEndDevice();
  const isMobile = isMobileDevice();
  
  return {
    particleCount: isLowEnd ? 20 : isMobile ? 40 : 60,
    animationDuration: isLowEnd ? 0.3 : isMobile ? 0.5 : 1,
    enableComplexEffects: !isLowEnd,
    enableParticles: !isLowEnd,
    enableShadows: !isMobile,
    maxConcurrentAnimations: isLowEnd ? 2 : isMobile ? 3 : 5,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
  };
};