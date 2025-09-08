// Hook to handle both click and touch events for mobile compatibility
import { useCallback, useRef } from 'react'

export const useTouchClick = (handler) => {
  const touchStartRef = useRef(null)
  const preventClickRef = useRef(false)
  
  const handleTouchStart = useCallback((e) => {
    // Store touch start position
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now()
    }
    preventClickRef.current = false
  }, [])
  
  const handleTouchEnd = useCallback((e) => {
    if (!touchStartRef.current) return
    
    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY,
      time: Date.now()
    }
    
    // Check if it was a tap (not a swipe or long press)
    const deltaX = Math.abs(touchEnd.x - touchStartRef.current.x)
    const deltaY = Math.abs(touchEnd.y - touchStartRef.current.y)
    const deltaTime = touchEnd.time - touchStartRef.current.time
    
    if (deltaX < 10 && deltaY < 10 && deltaTime < 500) {
      // It's a tap, trigger the handler
      e.preventDefault()
      preventClickRef.current = true
      handler(e)
    }
    
    touchStartRef.current = null
  }, [handler])
  
  const handleClick = useCallback((e) => {
    // Prevent double-firing on devices that send both touch and click
    if (preventClickRef.current) {
      preventClickRef.current = false
      return
    }
    handler(e)
  }, [handler])
  
  return {
    onClick: handleClick,
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd
  }
}