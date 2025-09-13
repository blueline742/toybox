// mobilePositioning.js - Utilities for accurate positioning on mobile devices

/**
 * Get accurate element position that works on both desktop and mobile
 * Accounts for viewport scaling, device pixel ratio, and zoom
 */
export function getElementCenter(element) {
  if (!element) return { x: 0, y: 0 };
  
  // Find the actual character card within the container
  // Updated to match actual Tailwind classes used: w-[110px], sm:w-[140px], md:w-[160px]
  const characterCard = element.querySelector('.character-card') || 
                       element.querySelector('[class*="w-\\["]') || 
                       element.querySelector('[class*="border-2"]') || 
                       element;
  
  const rect = characterCard.getBoundingClientRect();
  
  // Account for any scroll offset and visual viewport on mobile
  const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
  const scrollY = window.pageYOffset || document.documentElement.scrollTop;
  
  // Use visualViewport API if available (better mobile support)
  if (window.visualViewport) {
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
  }
  
  // Fallback for older browsers
  return {
    x: rect.left + rect.width / 2 + scrollX,
    y: rect.top + rect.height / 2 + scrollY
  };
}

/**
 * Get accurate canvas coordinates for drawing
 * Converts screen coordinates to canvas coordinates accounting for DPR
 */
export function getCanvasCoordinates(screenX, screenY, canvas) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  
  return {
    x: (screenX - rect.left) * scaleX,
    y: (screenY - rect.top) * scaleY
  };
}

/**
 * Get the actual viewport dimensions accounting for zoom
 */
export function getViewportDimensions() {
  const visualViewport = window.visualViewport;
  
  if (visualViewport) {
    return {
      width: visualViewport.width,
      height: visualViewport.height,
      scale: visualViewport.scale
    };
  }
  
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    scale: 1
  };
}

/**
 * Check if we're on a mobile device
 */
export function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         (window.innerWidth <= 768);
}

/**
 * Get position relative to character card center
 * This is more reliable than absolute positioning on mobile
 */
export function getRelativePosition(element, offsetX = 0, offsetY = 0) {
  if (!element) return { x: 0, y: 0 };
  
  const rect = element.getBoundingClientRect();
  const viewport = getViewportDimensions();
  
  // Find the actual character card within the container
  const characterCard = element.querySelector('.character-card-container') || 
                       element.querySelector('[class*="w-"][class*="h-"]') || 
                       element;
  
  if (characterCard !== element) {
    const cardRect = characterCard.getBoundingClientRect();
    return {
      x: cardRect.left + cardRect.width / 2 + offsetX,
      y: cardRect.top + cardRect.height / 2 + offsetY
    };
  }
  
  return {
    x: rect.left + rect.width / 2 + offsetX,
    y: rect.top + rect.height / 2 + offsetY
  };
}