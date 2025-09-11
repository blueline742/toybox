// AnimationManager.js - RAF-based smooth animation system with deltaTime interpolation
class AnimationManager {
  constructor() {
    this.animations = [];
    this.lastTime = performance.now();
    this.frameId = null;
    this.running = false;
  }

  // Add a new animation to the queue
  add(object, props) {
    const { duration, to, from = {}, onComplete, easing = 'easeInOut' } = props;
    
    // Get current values as starting point if not specified
    const fromValues = {};
    const toValues = {};
    
    for (const key in to) {
      fromValues[key] = from[key] !== undefined ? from[key] : object[key];
      toValues[key] = to[key];
    }
    
    const animation = {
      object,
      from: fromValues,
      to: toValues,
      duration,
      startTime: performance.now(),
      onComplete,
      easing: this.getEasingFunction(easing)
    };
    
    this.animations.push(animation);
    
    // Start the animation loop if not already running
    if (!this.running) {
      this.start();
    }
    
    return animation;
  }

  // Remove an animation
  remove(animation) {
    const index = this.animations.indexOf(animation);
    if (index > -1) {
      this.animations.splice(index, 1);
    }
  }

  // Clear all animations
  clear() {
    this.animations = [];
  }

  // Update all animations with deltaTime
  update(currentTime) {
    const deltaTime = Math.min(currentTime - this.lastTime, 33); // Cap at ~30fps minimum
    this.lastTime = currentTime;
    
    // Process animations backwards to safely remove completed ones
    for (let i = this.animations.length - 1; i >= 0; i--) {
      const animation = this.animations[i];
      const elapsed = currentTime - animation.startTime;
      const progress = Math.min(elapsed / animation.duration, 1);
      
      // Apply easing
      const easedProgress = animation.easing(progress);
      
      // Interpolate values
      for (const key in animation.to) {
        const from = animation.from[key];
        const to = animation.to[key];
        
        if (typeof from === 'number' && typeof to === 'number') {
          animation.object[key] = from + (to - from) * easedProgress;
        } else if (key === 'style' && typeof animation.object.style === 'object') {
          // Handle style properties
          for (const styleKey in to) {
            const styleFrom = from[styleKey] || 0;
            const styleTo = to[styleKey];
            animation.object.style[styleKey] = styleFrom + (styleTo - styleFrom) * easedProgress;
          }
        }
      }
      
      // Check if animation is complete
      if (progress >= 1) {
        // Ensure final values are set exactly
        for (const key in animation.to) {
          if (key === 'style') {
            Object.assign(animation.object.style, animation.to[key]);
          } else {
            animation.object[key] = animation.to[key];
          }
        }
        
        // Remove from active animations
        this.animations.splice(i, 1);
        
        // Call completion callback
        if (animation.onComplete) {
          animation.onComplete();
        }
      }
    }
    
    // Continue animation loop if there are active animations
    if (this.animations.length > 0) {
      this.frameId = requestAnimationFrame((time) => this.update(time));
    } else {
      this.stop();
    }
  }

  // Start the animation loop
  start() {
    if (!this.running) {
      this.running = true;
      this.lastTime = performance.now();
      this.frameId = requestAnimationFrame((time) => this.update(time));
    }
  }

  // Stop the animation loop
  stop() {
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
    this.running = false;
  }

  // Get easing function
  getEasingFunction(type) {
    const easings = {
      linear: (t) => t,
      easeIn: (t) => t * t,
      easeOut: (t) => t * (2 - t),
      easeInOut: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
      easeInCubic: (t) => t * t * t,
      easeOutCubic: (t) => (--t) * t * t + 1,
      easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
      easeInQuart: (t) => t * t * t * t,
      easeOutQuart: (t) => 1 - (--t) * t * t * t,
      easeInOutQuart: (t) => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
      easeInElastic: (t) => {
        if (t === 0 || t === 1) return t;
        const p = 0.3;
        return -Math.pow(2, 10 * (t - 1)) * Math.sin(((t - 1) - p / 4) * (2 * Math.PI) / p);
      },
      easeOutElastic: (t) => {
        if (t === 0 || t === 1) return t;
        const p = 0.3;
        return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
      },
      easeOutBounce: (t) => {
        if (t < 1 / 2.75) {
          return 7.5625 * t * t;
        } else if (t < 2 / 2.75) {
          return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
        } else if (t < 2.5 / 2.75) {
          return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
        } else {
          return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
        }
      }
    };
    
    return easings[type] || easings.linear;
  }

  // Animate DOM element with CSS transforms (GPU accelerated)
  animateElement(element, props) {
    const { x = 0, y = 0, scale = 1, rotation = 0, opacity = 1, duration = 300, onComplete } = props;
    
    // Set will-change for optimization
    element.style.willChange = 'transform, opacity';
    
    // Create animation object for transform values
    const transformObj = {
      x: parseFloat(element.dataset.x || 0),
      y: parseFloat(element.dataset.y || 0),
      scale: parseFloat(element.dataset.scale || 1),
      rotation: parseFloat(element.dataset.rotation || 0),
      opacity: parseFloat(element.style.opacity || 1)
    };
    
    this.add(transformObj, {
      duration,
      to: { x, y, scale, rotation, opacity },
      onComplete: () => {
        // Update data attributes
        element.dataset.x = x;
        element.dataset.y = y;
        element.dataset.scale = scale;
        element.dataset.rotation = rotation;
        
        // Apply final transform
        element.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale}) rotate(${rotation}deg)`;
        element.style.opacity = opacity;
        
        // Clean up will-change
        element.style.willChange = 'auto';
        
        if (onComplete) onComplete();
      }
    });
    
    // Update transform during animation
    const updateTransform = () => {
      if (this.animations.some(a => a.object === transformObj)) {
        element.style.transform = `translate3d(${transformObj.x}px, ${transformObj.y}px, 0) scale(${transformObj.scale}) rotate(${transformObj.rotation}deg)`;
        element.style.opacity = transformObj.opacity;
        requestAnimationFrame(updateTransform);
      }
    };
    updateTransform();
  }

  // Chain multiple animations
  chain(animations) {
    let index = 0;
    
    const runNext = () => {
      if (index < animations.length) {
        const { object, props } = animations[index];
        const originalOnComplete = props.onComplete;
        
        props.onComplete = () => {
          if (originalOnComplete) originalOnComplete();
          index++;
          runNext();
        };
        
        this.add(object, props);
      }
    };
    
    runNext();
  }

  // Create a spring animation
  spring(object, props) {
    const { to, stiffness = 100, damping = 10, onComplete } = props;
    const from = {};
    
    for (const key in to) {
      from[key] = object[key];
    }
    
    // Simple spring physics simulation
    const velocity = {};
    for (const key in to) {
      velocity[key] = 0;
    }
    
    const springAnimation = {
      object,
      from,
      to,
      velocity,
      stiffness,
      damping,
      onComplete,
      startTime: performance.now()
    };
    
    const updateSpring = () => {
      const deltaTime = 0.016; // 60fps
      let stillMoving = false;
      
      for (const key in to) {
        const distance = to[key] - object[key];
        const acceleration = (distance * stiffness - velocity[key] * damping) / 100;
        velocity[key] += acceleration * deltaTime;
        object[key] += velocity[key] * deltaTime;
        
        if (Math.abs(distance) > 0.01 || Math.abs(velocity[key]) > 0.01) {
          stillMoving = true;
        }
      }
      
      if (stillMoving) {
        requestAnimationFrame(updateSpring);
      } else {
        // Snap to final values
        for (const key in to) {
          object[key] = to[key];
        }
        if (onComplete) onComplete();
      }
    };
    
    updateSpring();
    return springAnimation;
  }
}

// Create singleton instance
const animationManager = new AnimationManager();

export default animationManager;