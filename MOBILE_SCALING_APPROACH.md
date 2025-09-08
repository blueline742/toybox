# Mobile Scaling Approach Documentation

## Overview
Instead of redesigning for mobile, we use a **Hearthstone-style proportional scaling approach** where the desktop layout is preserved and simply scaled down for smaller screens.

## Core Implementation

### 1. Game Wrapper Container
All game UI elements (except background and version text) are wrapped in a `#game-wrapper` div:

```jsx
// In MainMenu.jsx and other screen components
<div id="game-wrapper" className="text-center z-10 max-w-4xl mx-auto">
  {/* All game UI goes here */}
</div>
```

### 2. CSS Scaling Strategy (index.css)

```css
/* Base wrapper setup */
#game-wrapper {
  transform-origin: center center;  /* Scale from center */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  position: relative;
}

/* Progressive scaling for different screen sizes */
@media (max-width: 1024px) and (min-width: 769px) {
  #game-wrapper {
    transform: scale(0.9);  /* 90% for small desktops */
  }
}

@media (max-width: 768px) and (min-width: 481px) {
  #game-wrapper {
    transform: scale(0.8);  /* 80% for tablets */
  }
}

@media (max-width: 480px) {
  #game-wrapper {
    transform: scale(0.65);  /* 65% for phones */
  }
}

@media (max-width: 375px) {
  #game-wrapper {
    transform: scale(0.55);  /* 55% for small phones */
  }
}
```

## Special Components Handling

### Team Preview Bar (TeamSelect.jsx)
The team preview bar uses **flexbox** instead of absolute positioning to maintain proper alignment when scaled:

```css
.team-preview-bar {
  display: flex !important;
  flex-direction: row !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 1rem !important;
  padding: 1rem 2rem !important;
  width: 90% !important;
  max-width: 800px !important;
  margin: 0 auto 1rem auto !important;
  box-sizing: border-box !important;
}

/* Fixed slot sizes prevent distortion */
.team-preview-slot {
  width: 80px !important;
  height: 80px !important;
  flex-shrink: 0 !important;  /* Prevents squishing */
}
```

### Mobile-Specific Adjustments
For the team preview bar on mobile, we allow wrapping but maintain proportions:

```css
@media (max-width: 768px) {
  .team-preview-bar {
    flex-wrap: wrap !important;  /* Allow wrapping on small screens */
  }
  
  .team-preview-slot {
    width: 60px !important;  /* Smaller but proportional */
    height: 60px !important;
  }
}
```

## Touch/Click Handling

### Global Touch Handler
We created a `GlobalTouchHandler` component that automatically adds touch support to ALL interactive elements:

```jsx
// In App.jsx
<GlobalTouchHandler />  // Added at root level
```

### Canvas Non-Blocking
All canvas elements are made non-interactive to prevent blocking buttons:

```css
canvas,
canvas *,
.canvas-container {
  pointer-events: none !important;
}

/* All interactive elements stay clickable */
button, .clickable, [role="button"] {
  pointer-events: auto !important;
  position: relative;
  z-index: 100 !important;
}
```

## Key Principles

1. **No Redesign** - Desktop layout is preserved exactly
2. **Proportional Scaling** - Everything scales together
3. **Center Origin** - Scaling happens from center, not top
4. **Flexbox Over Absolute** - Use flexbox for components that need alignment
5. **Touch-First Events** - Support both click and touch events globally
6. **Canvas Behind UI** - Canvas never blocks interactive elements

## Benefits of This Approach

✅ **Consistent Design** - Mobile looks identical to desktop, just smaller
✅ **Less Code** - No need for separate mobile layouts
✅ **Easier Maintenance** - Changes to desktop automatically apply to mobile
✅ **Professional Look** - Matches approach used by games like Hearthstone
✅ **Better Performance** - No layout recalculations, just transform

## Testing Checklist

- [ ] Buttons are clickable on mobile
- [ ] Team preview bar shows all 3 slots + battle button
- [ ] Scrolling works where needed
- [ ] No content cut off at top (title visible)
- [ ] Touch events work (tap, not requiring click)
- [ ] Canvas doesn't block interactions

## Common Issues & Solutions

**Problem**: Content cut off at top
**Solution**: Use `transform-origin: center center` not `top center`

**Problem**: Buttons not clickable
**Solution**: Check canvas has `pointer-events: none` and buttons have higher z-index

**Problem**: Layout breaks on specific screen
**Solution**: Add flexbox with `flex-shrink: 0` to prevent squishing

**Problem**: Double-tap zoom on mobile
**Solution**: Already handled with `touch-action: manipulation` in base CSS

## Future Considerations

If we need screen-specific adjustments, add them AFTER the scaling transform, not instead of it. The scaling should always be the foundation of our mobile approach.