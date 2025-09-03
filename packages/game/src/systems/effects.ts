import * as Phaser from 'phaser';

export class EffectsSystem {
  private scene: Phaser.Scene;
  private particles: Phaser.GameObjects.Particles.ParticleEmitterManager | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  init(): void {
    // Initialize particle system if needed
    if (!this.particles && this.scene.textures.exists('spark')) {
      this.particles = this.scene.add.particles('spark');
    }
  }

  flash(sprite: Phaser.GameObjects.Sprite, duration: number = 80): void {
    sprite.setTintFill(0xffffff);
    
    this.scene.time.delayedCall(duration, () => {
      sprite.clearTint();
    });
  }

  scalePunch(
    sprite: Phaser.GameObjects.Sprite,
    scale: number = 1.12,
    duration: number = 160
  ): void {
    const originalScale = sprite.scale;
    
    this.scene.tweens.add({
      targets: sprite,
      scaleX: scale,
      scaleY: scale,
      duration: duration / 2,
      ease: 'Power2',
      yoyo: true,
      onComplete: () => {
        sprite.setScale(originalScale);
      }
    });
  }

  critBurst(x: number, y: number): void {
    if (!this.scene.textures.exists('starburst')) return;

    const burst = this.scene.add.sprite(x, y, 'starburst');
    burst.setScale(0);
    burst.setAlpha(1);

    this.scene.tweens.add({
      targets: burst,
      scale: 1.5,
      alpha: 0,
      duration: 400,
      ease: 'Power2',
      onComplete: () => {
        burst.destroy();
      }
    });

    // Add CRIT text
    this.floatText('CRIT!', x, y - 30, 0xFFD700, 24);
  }

  floatText(
    text: string,
    x: number,
    y: number,
    color: number = 0xFFFFFF,
    size: number = 18
  ): void {
    const floatingText = this.scene.add.text(x, y, text, {
      fontSize: `${size}px`,
      fontFamily: 'Arial Black',
      color: `#${color.toString(16).padStart(6, '0')}`,
      stroke: '#000000',
      strokeThickness: 4
    });

    floatingText.setOrigin(0.5);

    this.scene.tweens.add({
      targets: floatingText,
      y: y - 50,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        floatingText.destroy();
      }
    });
  }

  shake(intensity: number = 8, duration: number = 120): void {
    if (!this.scene.cameras.main) return;
    
    this.scene.cameras.main.shake(duration, intensity * 0.01);
  }

  emitConfetti(x: number, y: number): void {
    if (!this.particles) return;

    const colors = [0xFF0000, 0x00FF00, 0x0000FF, 0xFFFF00, 0xFF00FF];
    
    const emitter = this.particles.createEmitter({
      x: x,
      y: y,
      speed: { min: 200, max: 400 },
      scale: { start: 0.5, end: 0 },
      angle: { min: 0, max: 360 },
      rotate: { min: 0, max: 360 },
      lifespan: 1000,
      quantity: 5,
      frequency: 50,
      tint: colors
    });

    this.scene.time.delayedCall(500, () => {
      emitter.stop();
      this.scene.time.delayedCall(1000, () => {
        emitter.remove();
      });
    });
  }

  trailYoYo(
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ): void {
    if (!this.scene.textures.exists('yo_trail')) return;

    const trail = this.scene.add.sprite(startX, startY, 'yo_trail');
    trail.setAlpha(0.7);
    
    const angle = Phaser.Math.Angle.Between(startX, startY, endX, endY);
    trail.setRotation(angle);
    
    const distance = Phaser.Math.Distance.Between(startX, startY, endX, endY);
    trail.setScale(distance / 100, 0.2);

    this.scene.tweens.add({
      targets: trail,
      alpha: 0,
      scaleY: 0,
      duration: 300,
      onComplete: () => {
        trail.destroy();
      }
    });
  }

  shockwave(x: number, y: number): void {
    if (!this.scene.textures.exists('shockwave')) return;

    const wave = this.scene.add.sprite(x, y, 'shockwave');
    wave.setScale(0.1);
    wave.setAlpha(0.8);
    wave.setBlendMode(Phaser.BlendModes.ADD);

    this.scene.tweens.add({
      targets: wave,
      scale: 2,
      alpha: 0,
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        wave.destroy();
      }
    });

    // Add camera shake
    this.shake(12, 150);
  }

  screenVignette(color: number = 0x000000, duration: number = 120): void {
    const vignette = this.scene.add.rectangle(
      this.scene.cameras.main.centerX,
      this.scene.cameras.main.centerY,
      this.scene.cameras.main.width * 1.5,
      this.scene.cameras.main.height * 1.5,
      color,
      0
    );

    vignette.setBlendMode(Phaser.BlendModes.MULTIPLY);

    this.scene.tweens.add({
      targets: vignette,
      alpha: 0.3,
      duration: duration / 2,
      yoyo: true,
      onComplete: () => {
        vignette.destroy();
      }
    });
  }

  hitCombo(
    sprite: Phaser.GameObjects.Sprite,
    isCrit: boolean = false,
    damage: number = 0
  ): void {
    // White flash
    this.flash(sprite, isCrit ? 90 : 60);
    
    // Scale punch
    this.scalePunch(sprite, isCrit ? 1.15 : 1.08);
    
    // Damage text
    if (damage > 0) {
      const color = isCrit ? 0xFFD700 : 0xFF4444;
      this.floatText(`-${damage}`, sprite.x, sprite.y - 20, color);
    }
    
    // Crit effects
    if (isCrit) {
      this.critBurst(sprite.x, sprite.y);
      this.shake(10);
    } else {
      this.shake(5);
    }
  }

  statusEffectVisual(
    sprite: Phaser.GameObjects.Sprite,
    effect: string
  ): void {
    switch (effect) {
      case 'burn':
        // Orange tint pulse
        this.scene.tweens.add({
          targets: sprite,
          tint: 0xFF6600,
          duration: 300,
          yoyo: true,
          repeat: 2
        });
        this.floatText('BURN', sprite.x, sprite.y - 30, 0xFF6600);
        break;
        
      case 'stun':
        // Stars circling
        for (let i = 0; i < 3; i++) {
          const star = this.scene.add.text(sprite.x, sprite.y - 40, '⭐', {
            fontSize: '16px'
          });
          
          this.scene.tweens.add({
            targets: star,
            x: sprite.x + Math.cos(i * Math.PI * 2 / 3) * 30,
            y: sprite.y - 40 + Math.sin(i * Math.PI * 2 / 3) * 30,
            angle: 360,
            duration: 1000,
            repeat: 1,
            onComplete: () => star.destroy()
          });
        }
        this.floatText('STUNNED', sprite.x, sprite.y - 30, 0xFFFF00);
        break;
        
      case 'shield':
        // Blue bubble effect
        const shield = this.scene.add.ellipse(
          sprite.x, sprite.y,
          sprite.width * 1.5,
          sprite.height * 1.5,
          0x4A90E2, 0.3
        );
        shield.setStrokeStyle(2, 0x4A90E2);
        
        this.scene.tweens.add({
          targets: shield,
          alpha: 0,
          scale: 1.2,
          duration: 500,
          onComplete: () => shield.destroy()
        });
        this.floatText('SHIELD', sprite.x, sprite.y - 30, 0x4A90E2);
        break;
    }
  }

  victoryAnimation(sprite: Phaser.GameObjects.Sprite): void {
    // Victory wiggle dance
    this.scene.tweens.add({
      targets: sprite,
      angle: 10,
      duration: 100,
      yoyo: true,
      repeat: 10,
      ease: 'Sine.inOut'
    });

    // Bounce
    this.scene.tweens.add({
      targets: sprite,
      y: sprite.y - 20,
      duration: 200,
      yoyo: true,
      repeat: 5,
      ease: 'Bounce.out'
    });

    // Emit confetti around winner
    for (let i = 0; i < 3; i++) {
      this.scene.time.delayedCall(i * 200, () => {
        this.emitConfetti(
          sprite.x + Phaser.Math.Between(-50, 50),
          sprite.y + Phaser.Math.Between(-50, 50)
        );
      });
    }
  }

  packOpeningRays(x: number, y: number): void {
    const rays: Phaser.GameObjects.Graphics[] = [];
    const numRays = 12;
    
    for (let i = 0; i < numRays; i++) {
      const ray = this.scene.add.graphics();
      ray.fillStyle(0xFFD700, 0.3);
      
      const angle = (i / numRays) * Math.PI * 2;
      ray.fillTriangle(
        x, y,
        x + Math.cos(angle) * 500, y + Math.sin(angle) * 500,
        x + Math.cos(angle + 0.1) * 500, y + Math.sin(angle + 0.1) * 500
      );
      
      ray.setAlpha(0);
      rays.push(ray);
      
      this.scene.tweens.add({
        targets: ray,
        alpha: 0.5,
        duration: 500,
        delay: i * 50,
        yoyo: true,
        onComplete: () => ray.destroy()
      });
    }
  }
}