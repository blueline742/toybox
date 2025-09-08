import { useEffect } from 'react'

const GlobalTouchHandler = () => {
  useEffect(() => {
    let touchStartPos = null
    let preventClick = false
    
    // Handle touch start
    const handleTouchStart = (e) => {
      // Skip if touching the wallet button portal
      if (e.target.closest('#wallet-button-portal, .wallet-adapter-modal-wrapper')) {
        return
      }
      
      // Check if target is an interactive element
      const target = e.target.closest('button, .clickable, [role="button"], a, .back-button, .character-card, .team-select-card')
      if (target) {
        touchStartPos = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          time: Date.now(),
          target
        }
      }
    }
    
    // Handle touch end
    const handleTouchEnd = (e) => {
      // Skip if touching the wallet button portal
      if (e.target.closest('#wallet-button-portal, .wallet-adapter-modal-wrapper')) {
        return
      }
      
      if (!touchStartPos) return
      
      const touchEnd = {
        x: e.changedTouches[0].clientX,
        y: e.changedTouches[0].clientY,
        time: Date.now()
      }
      
      // Check if it was a tap (not a swipe)
      const deltaX = Math.abs(touchEnd.x - touchStartPos.x)
      const deltaY = Math.abs(touchEnd.y - touchStartPos.y)
      const deltaTime = touchEnd.time - touchStartPos.time
      
      if (deltaX < 10 && deltaY < 10 && deltaTime < 500) {
        // It's a tap - trigger click event
        const target = e.target.closest('button, .clickable, [role="button"], a, .back-button, .character-card, .team-select-card, .wallet-adapter-button, #wallet-button-portal')
        if (target && target === touchStartPos.target) {
          e.preventDefault()
          preventClick = true
          
          // Create and dispatch a click event
          const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
          })
          target.dispatchEvent(clickEvent)
          
          // Reset preventClick after a short delay
          setTimeout(() => {
            preventClick = false
          }, 100)
        }
      }
      
      touchStartPos = null
    }
    
    // Handle touch move (for scroll detection)
    const handleTouchMove = (e) => {
      if (!touchStartPos) return
      
      const touch = e.touches[0]
      const deltaX = Math.abs(touch.clientX - touchStartPos.x)
      const deltaY = Math.abs(touch.clientY - touchStartPos.y)
      
      // If user is scrolling, cancel the tap
      if (deltaY > 10 || deltaX > 10) {
        touchStartPos = null
      }
    }
    
    // Prevent ghost clicks on mobile
    const handleClick = (e) => {
      // Skip if clicking the wallet button portal
      if (e.target.closest('#wallet-button-portal, .wallet-adapter-modal-wrapper')) {
        return
      }
      
      if (preventClick) {
        e.preventDefault()
        e.stopPropagation()
        preventClick = false
      }
    }
    
    // Add event listeners
    document.addEventListener('touchstart', handleTouchStart, { passive: false })
    document.addEventListener('touchend', handleTouchEnd, { passive: false })
    document.addEventListener('touchmove', handleTouchMove, { passive: true })
    document.addEventListener('click', handleClick, true)
    
    // Cleanup
    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('click', handleClick, true)
    }
  }, [])
  
  return null
}

export default GlobalTouchHandler