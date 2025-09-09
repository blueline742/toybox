import React, { useEffect, useState } from 'react'
import './TargetingArrow.css'

export default function SimpleTargetingArrow({ startElement, endElement }) {
  const [arrowStyle, setArrowStyle] = useState(null)
  
  useEffect(() => {
    if (!startElement || !endElement) {
      setArrowStyle(null)
      return
    }
    
    const updateArrow = () => {
      const startRect = startElement.getBoundingClientRect()
      const endRect = endElement.getBoundingClientRect()
      
      // Calculate center points
      const startX = startRect.left + startRect.width / 2
      const startY = startRect.top + startRect.height / 2
      const endX = endRect.left + endRect.width / 2
      const endY = endRect.top + endRect.height / 2
      
      // Calculate angle and distance
      const deltaX = endX - startX
      const deltaY = endY - startY
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI)
      
      setArrowStyle({
        left: `${startX}px`,
        top: `${startY}px`,
        width: `${distance}px`,
        transform: `rotate(${angle}deg)`
      })
    }
    
    updateArrow()
    
    // Update on window resize or scroll
    window.addEventListener('resize', updateArrow)
    window.addEventListener('scroll', updateArrow)
    
    return () => {
      window.removeEventListener('resize', updateArrow)
      window.removeEventListener('scroll', updateArrow)
    }
  }, [startElement, endElement])
  
  if (!arrowStyle) return null
  
  return (
    <div className="targeting-arrow-container">
      <div className="targeting-arrow" style={arrowStyle}>
        <div className="arrow-glow" />
        <div className="arrow-segments" />
        <div className="arrow-head" />
      </div>
    </div>
  )
}