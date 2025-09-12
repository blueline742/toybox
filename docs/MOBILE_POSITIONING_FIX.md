# Mobile Positioning Fix Documentation

## Problem Description
On mobile devices, spell effects, glows, and shields were appearing in the wrong positions - offset from the character cards or appearing as "skinny rectangles" below the cards instead of surrounding them.

## Root Causes

### 1. Overflow Hidden Clipping
- Character cards had `overflow-hidden` which was clipping absolute positioned effects with negative insets
- Effects like ActiveCharacterGlow that used `-inset-8` were being cut off

### 2. Incorrect Element Targeting
- Code was searching for `.w-40` elements (desktop size) on mobile where cards are `.w-32`
- This caused positioning calculations to target the wrong element or fail entirely

### 3. Container Size Mismatch
- Effects were sized larger than their containers (e.g., 120px shield in 110px container)
- This caused overflow and positioning issues

## Solutions Applied

### 1. Smart Element Detection (mobilePositioning.js)
```javascript
export function getElementCenter(element) {
  if (!element) return { x: 0, y: 0 };
  
  // Find the actual character card within the container
  // Look for the card element with specific width classes (w-32 on mobile, w-40 on desktop)
  const characterCard = element.querySelector('.w-32, .w-40') || 
                       element.querySelector('[class*="border-2"]') || 
                       element;
  
  const rect = characterCard.getBoundingClientRect();
  
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
}
```

### 2. Restructured Character Card (CharacterCard.jsx)
- Moved ActiveCharacterGlow outside overflow containers
- Gave it explicit dimensions matching card size
```jsx
{isActive && !isDead && (
  <div className="absolute inset-0 w-32 h-44 md:w-40 md:h-56 pointer-events-none">
    <ActiveCharacterGlow isActive={true} teamColor={teamColor} />
  </div>
)}
```

### 3. Responsive Effect Sizing
- Made effects responsive to screen size
- Ensured effects are smaller than their containers

#### ActiveCharacterGlow.jsx:
```javascript
const isMobile = typeof window !== 'undefined' && window.innerWidth <= 640;
className={`absolute ${isMobile ? '-inset-2' : '-inset-8'} ...`}
```

#### ShieldEffect.jsx:
```javascript
// Must be smaller than the character card container (110px on mobile, 160px on desktop)
const shieldSize = isMobile ? '100px' : '180px';
const orbitRadius = isMobile ? '45px' : '85px';
```

## Key Principles for Future Development

### 1. Always Consider Mobile Sizes
- Character cards: `w-32 h-44` on mobile, `w-40 h-56` on desktop
- Container div: `w-[110px]` on mobile, `w-[160px]` on desktop
- Effects must fit within these dimensions

### 2. Use Smart Selectors
- Don't hardcode desktop sizes like `.w-40`
- Use multiple selectors: `.w-32, .w-40` or detect mobile vs desktop

### 3. Test Effect Positioning
- Effects positioned with absolute positioning need proper parent containers
- Be careful with `overflow-hidden` on parent containers
- Use `pointer-events-none` on overlay effects

### 4. Responsive Breakpoints
- Mobile: `window.innerWidth <= 640` or `sm:` breakpoint
- Tablet: `md:` breakpoint
- Desktop: default or `lg:` breakpoint

## Testing Checklist
When adding new effects or modifying positioning:
1. ✅ Test on mobile (< 640px width)
2. ✅ Test on tablet (640-768px)
3. ✅ Test on desktop (> 768px)
4. ✅ Verify effects are centered on character cards
5. ✅ Check that effects aren't clipped by overflow
6. ✅ Ensure effects scale appropriately with card size

## Canvas-Based Solution for Complex Effects

### Problem with CSS-Based Shield Positioning
The ShieldEffect component used CSS absolute positioning with `left: 50%, top: 50%` and transform translate, but this was still offset on mobile due to container constraints and CSS positioning quirks.

### Solution: Canvas-Based Overlay (MobileShieldOverlay.jsx)
Created a canvas-based overlay that draws shields directly at character positions:

```javascript
// Get exact character position
const position = getElementCenter(element);

// Draw shield at exact coordinates
ctx.arc(position.x, position.y, shieldRadius, 0, Math.PI * 2);
```

Benefits of canvas approach:
- ✅ Pixel-perfect positioning
- ✅ No CSS container constraints
- ✅ Better performance with multiple effects
- ✅ Can preload and draw images for richer visuals
- ✅ Consistent across all devices

## Common Pitfalls to Avoid
- ❌ Using fixed pixel values without responsive alternatives
- ❌ Hardcoding desktop-specific class selectors
- ❌ Making effects larger than their containers
- ❌ Forgetting to test on actual mobile devices/viewports
- ❌ Using negative insets without considering overflow constraints
- ❌ Relying on CSS positioning for critical visual effects on mobile