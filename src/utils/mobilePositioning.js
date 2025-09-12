// mobilePositioning.js - Utilities for accurate positioning on mobile devices

/**
 * Get accurate element position that works on both desktop and mobile
 * Accounts for viewport scaling, device pixel ratio, and zoom
 */
export function getElementCenter(element) {
  if (!element) return { x: 0, y: 0 };
  
  // Find the actual character card within the container
  // Look for the card element with specific width classes (w-32 on mobile, w-40 on desktop)
  const characterCard = element.querySelector('.w-32, .w-40') || 
                       element.querySelector('[class*="border-2"]') || 
                       element;
  
  const rect = characterCard.getBoundingClientRect();
  
  // Return the center of the actual card element
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
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