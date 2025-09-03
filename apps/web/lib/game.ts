import * as Phaser from 'phaser';

// Simple types for the game
export interface Toy {
  id: string;
  name: string;
  rarity: string;
  stats: {
    hp: number;
    maxHp: number;
    atk: number;
    def: number;
    speed: number;
    critChance: number;
  };
  sprite: string;
  moves: any[];
  statusEffects: string[];
  statusDuration: number;
  isNFT?: boolean;
}

interface ToySprite extends Phaser.GameObjects.Container {
  toy: Toy;
  sprite: Phaser.GameObjects.Graphics;
  shadow: Phaser.GameObjects.Ellipse;
  healthBar: Phaser.GameObjects.Rectangle;
  healthBg: Phaser.GameObjects.Rectangle;
}

class SimpleBattleScene extends Phaser.Scene {
  playerTeam: Toy[] = [];
  enemyTeam: Toy[] = [];
  playerSprites: ToySprite[] = [];
  enemySprites: ToySprite[] = [];
  currentTurn: 'player' | 'enemy' = 'player';
  selectedPlayerToy: number = 0;
  selectedEnemyToy: number = 0;
  battleActive: boolean = false;
  turnText!: Phaser.GameObjects.Text;
  
  constructor() {
    super({ key: 'SimpleBattle' });
  }

  preload() {
    // Create colorful toy sprites using graphics
    this.createToySprites();
  }
  
  createToySprites() {
    // Create different toy sprites with more detail
    const sprites = [
      { key: 'robot', shape: 'box', color1: 0x6B7280, color2: 0x374151, accent: 0xFF0000 },
      { key: 'dino', shape: 'round', color1: 0x10B981, color2: 0x059669, accent: 0xFFFFFF },
      { key: 'duck', shape: 'round', color1: 0xFBBF24, color2: 0xF59E0B, accent: 0xFF6B00 },
      { key: 'soldier', shape: 'box', color1: 0x059669, color2: 0x047857, accent: 0x000000 },
      { key: 'car', shape: 'box', color1: 0xEF4444, color2: 0xDC2626, accent: 0xFFFF00 },
      { key: 'bear', shape: 'round', color1: 0x92400E, color2: 0x78350F, accent: 0xFFFFFF },
      { key: 'plane', shape: 'triangle', color1: 0x3B82F6, color2: 0x2563EB, accent: 0xFFFFFF },
      { key: 'ball', shape: 'circle', color1: 0xEC4899, color2: 0xDB2777, accent: 0xFFFFFF }
    ];
    
    sprites.forEach(({ key, shape, color1, color2, accent }) => {
      const graphics = this.add.graphics();
      
      // Main body
      graphics.fillStyle(color1);
      if (shape === 'box') {
        graphics.fillRoundedRect(4, 4, 56, 56, 8);
      } else if (shape === 'round') {
        graphics.fillCircle(32, 32, 28);
      } else if (shape === 'triangle') {
        graphics.fillTriangle(32, 8, 8, 56, 56, 56);
      } else {
        graphics.fillCircle(32, 32, 28);
      }
      
      // Inner detail
      graphics.fillStyle(color2);
      if (shape === 'box') {
        graphics.fillRoundedRect(12, 12, 40, 40, 4);
      } else if (shape === 'round') {
        graphics.fillCircle(32, 32, 20);
      } else if (shape === 'triangle') {
        graphics.fillTriangle(32, 20, 20, 44, 44, 44);
      } else {
        graphics.fillCircle(32, 32, 20);
      }
      
      // Eyes/details
      graphics.fillStyle(accent);
      graphics.fillCircle(24, 28, 3);
      graphics.fillCircle(40, 28, 3);
      
      graphics.generateTexture(key, 64, 64);
      graphics.destroy();
    });
  }
  
  create(data: { playerTeam?: Toy[], enemyTeam?: Toy[] } = {}) {
    const { width, height } = this.cameras.main;
    
    // Load teams from data or localStorage
    this.playerTeam = data.playerTeam || JSON.parse(localStorage.getItem('tbb_selected_team') || '[]').slice(0, 3);
    if (this.playerTeam.length === 0) {
      this.playerTeam = JSON.parse(localStorage.getItem('tbb_starters_v1') || '[]').slice(0, 3);
    }
    
    // Generate enemy team
    this.enemyTeam = this.generateEnemyTeam();
    
    // Create animated gradient background
    const bg = this.add.graphics();
    const colors = [0x667EEA, 0x764BA2, 0xF093FB, 0xF5576C];
    bg.fillGradientStyle(colors[0], colors[1], colors[2], colors[3], 1);
    bg.fillRect(0, 0, width, height);
    
    // Animated background orbs
    for (let i = 0; i < 5; i++) {
      const orb = this.add.circle(
        Math.random() * width,
        Math.random() * height,
        20 + Math.random() * 40,
        0xFFFFFF,
        0.05
      );
      
      this.tweens.add({
        targets: orb,
        x: Math.random() * width,
        y: Math.random() * height,
        alpha: 0.1,
        scale: 1.5,
        duration: 10000 + Math.random() * 5000,
        repeat: -1,
        yoyo: true,
        ease: 'Sine.inOut'
      });
    }

    // Battle arena platform
    const platform = this.add.graphics();
    platform.fillStyle(0x2D3748, 0.8);
    platform.fillRoundedRect(50, height - 120, width - 100, 100, 20);
    
    // Grid lines on platform
    platform.lineStyle(1, 0x4A5568, 0.5);
    for (let x = 70; x < width - 70; x += 30) {
      platform.moveTo(x, height - 120);
      platform.lineTo(x, height - 20);
    }

    // Title with better effects
    const title = this.add.text(width/2, 40, '⚔️ TOY BOX BRAWL ⚔️', {
      fontSize: '42px',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 8,
      fontFamily: 'Arial Black',
      shadow: {
        offsetX: 0,
        offsetY: 4,
        color: '#000000',
        blur: 10,
        fill: true
      }
    }).setOrigin(0.5);
    
    // Title bounce
    this.tweens.add({
      targets: title,
      y: 45,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });

    // Create player toys
    this.createToySprites2(true);
    
    // Create enemy toys
    this.createToySprites2(false);

    // VS burst effect
    const vsBurst = this.add.graphics();
    vsBurst.fillStyle(0xFFD700, 0.3);
    vsBurst.fillStar(width/2, height/2, 8, 100, 50);
    
    this.tweens.add({
      targets: vsBurst,
      rotation: Math.PI * 2,
      alpha: 0.1,
      scale: 1.5,
      duration: 4000,
      repeat: -1,
      ease: 'Linear'
    });
    
    const vsText = this.add.text(width/2, height/2, 'VS', {
      fontSize: '72px',
      color: '#FFD700',
      stroke: '#FF0000',
      strokeThickness: 10,
      fontFamily: 'Arial Black',
      shadow: {
        offsetX: 0,
        offsetY: 0,
        color: '#FFD700',
        blur: 30,
        fill: true
      }
    }).setOrigin(0.5);
    
    // VS pulsing
    this.tweens.add({
      targets: vsText,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Power2'
    });

    // Turn indicator
    this.turnText = this.add.text(width/2, height - 140, 'YOUR TURN!', {
      fontSize: '24px',
      color: '#00FF00',
      stroke: '#000000',
      strokeThickness: 4,
      fontFamily: 'Arial Black'
    }).setOrigin(0.5);
    
    this.tweens.add({
      targets: this.turnText,
      alpha: 0.5,
      duration: 500,
      yoyo: true,
      repeat: -1
    });

    // Start battle
    this.time.delayedCall(1000, () => {
      this.startBattle();
    });
  }
  
  createToySprites2(isPlayer: boolean) {
    const { width, height } = this.cameras.main;
    const team = isPlayer ? this.playerTeam : this.enemyTeam;
    const sprites = isPlayer ? this.playerSprites : this.enemySprites;
    const xPos = isPlayer ? width * 0.25 : width * 0.75;
    
    for (let i = 0; i < team.length; i++) {
      const y = 200 + i * 120;
      const toyData = team[i];
      
      // Container for the toy
      const container = this.add.container(xPos, y) as ToySprite;
      container.toy = toyData;
      
      // Shadow
      const shadow = this.add.ellipse(0, 35, 60, 20, 0x000000, 0.3);
      container.add(shadow);
      container.shadow = shadow;
      
      // Main sprite
      const spriteKey = this.getSpriteKey(toyData.name);
      const sprite = this.add.graphics();
      
      // Draw toy based on type with more detail
      const rarityGlow = this.getRarityColor(toyData.rarity);
      sprite.fillStyle(rarityGlow, 0.3);
      sprite.fillCircle(0, 0, 45);
      
      // Use texture
      const texture = this.add.image(0, 0, spriteKey);
      texture.setScale(1.3);
      if (!isPlayer) texture.setFlipX(true);
      container.add(texture);
      
      container.sprite = sprite;
      
      // Name with background
      const nameBg = this.add.rectangle(0, -70, 100, 20, 0x000000, 0.7);
      nameBg.setStrokeStyle(2, rarityGlow);
      container.add(nameBg);
      
      const nameText = this.add.text(0, -70, toyData.name, {
        fontSize: '12px',
        color: '#FFFFFF',
        fontFamily: 'Arial Black'
      }).setOrigin(0.5);
      container.add(nameText);
      
      // Stats badge
      const statsBg = this.add.circle(isPlayer ? -50 : 50, -30, 15, 0x000000, 0.8);
      container.add(statsBg);
      
      const statsText = this.add.text(isPlayer ? -50 : 50, -30, `${toyData.stats.atk}`, {
        fontSize: '14px',
        color: '#FF0000',
        fontFamily: 'Arial Black'
      }).setOrigin(0.5);
      container.add(statsText);
      
      // Health bar container
      const healthBg = this.add.rectangle(0, 55, 80, 12, 0x000000, 0.8);
      healthBg.setStrokeStyle(2, 0xFFFFFF);
      container.add(healthBg);
      container.healthBg = healthBg;
      
      const healthBar = this.add.rectangle(0, 55, 76, 8, 0x00FF00);
      container.add(healthBar);
      container.healthBar = healthBar;
      
      // HP text
      const hpText = this.add.text(0, 55, `${toyData.stats.hp}/${toyData.stats.maxHp}`, {
        fontSize: '10px',
        color: '#FFFFFF',
        fontFamily: 'Arial'
      }).setOrigin(0.5);
      container.add(hpText);
      
      // Idle animation
      this.tweens.add({
        targets: container,
        y: y - 10,
        duration: 1500 + i * 200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut'
      });
      
      // Wobble animation
      this.tweens.add({
        targets: texture,
        rotation: isPlayer ? -0.1 : 0.1,
        duration: 2000 + i * 300,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut'
      });
      
      sprites.push(container);
    }
  }
  
  startBattle() {
    this.battleActive = true;
    this.autoPlay();
  }
  
  autoPlay() {
    if (!this.battleActive) return;
    
    // Check for victory
    const playerAlive = this.playerTeam.filter(t => t.stats.hp > 0).length;
    const enemyAlive = this.enemyTeam.filter(t => t.stats.hp > 0).length;
    
    if (playerAlive === 0 || enemyAlive === 0) {
      this.endBattle(playerAlive > 0);
      return;
    }
    
    if (this.currentTurn === 'player') {
      // Find alive player toy
      while (this.playerTeam[this.selectedPlayerToy].stats.hp <= 0) {
        this.selectedPlayerToy = (this.selectedPlayerToy + 1) % this.playerTeam.length;
      }
      
      // Find alive enemy target
      const aliveEnemies: number[] = [];
      this.enemyTeam.forEach((toy, i) => {
        if (toy.stats.hp > 0) aliveEnemies.push(i);
      });
      
      if (aliveEnemies.length > 0) {
        const targetIndex = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
        this.performAttack(this.selectedPlayerToy, targetIndex, true);
      }
    } else {
      // Enemy turn
      const aliveEnemies: number[] = [];
      this.enemyTeam.forEach((toy, i) => {
        if (toy.stats.hp > 0) aliveEnemies.push(i);
      });
      
      if (aliveEnemies.length > 0) {
        const attackerIndex = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
        
        const alivePlayer: number[] = [];
        this.playerTeam.forEach((toy, i) => {
          if (toy.stats.hp > 0) alivePlayer.push(i);
        });
        
        if (alivePlayer.length > 0) {
          const targetIndex = alivePlayer[Math.floor(Math.random() * alivePlayer.length)];
          this.performAttack(attackerIndex, targetIndex, false);
        }
      }
    }
  }
  
  performAttack(attackerIndex: number, targetIndex: number, isPlayerAttacking: boolean) {
    const attacker = isPlayerAttacking ? this.playerSprites[attackerIndex] : this.enemySprites[attackerIndex];
    const target = isPlayerAttacking ? this.enemySprites[targetIndex] : this.playerSprites[targetIndex];
    const attackerToy = attacker.toy;
    const targetToy = target.toy;
    
    // Calculate damage
    const baseDamage = attackerToy.stats.atk;
    const defense = targetToy.stats.def * 0.5;
    const damage = Math.max(1, Math.floor(baseDamage - defense + Math.random() * 10));
    
    // Get attack type based on toy
    const attackType = this.getAttackType(attackerToy.name);
    
    // Attack animation based on type
    if (attackType === 'laser') {
      this.laserAttack(attacker, target, damage);
    } else if (attackType === 'bite') {
      this.biteAttack(attacker, target, damage);
    } else if (attackType === 'squeak') {
      this.squeakAttack(attacker, target, damage);
    } else {
      this.basicAttack(attacker, target, damage);
    }
    
    // Update health
    targetToy.stats.hp = Math.max(0, targetToy.stats.hp - damage);
    
    // Update health bar
    const healthPercent = targetToy.stats.hp / targetToy.stats.maxHp;
    this.tweens.add({
      targets: target.healthBar,
      scaleX: healthPercent,
      duration: 500,
      ease: 'Power2',
      onUpdate: () => {
        // Change color based on health
        if (healthPercent > 0.6) {
          target.healthBar.setFillStyle(0x00FF00);
        } else if (healthPercent > 0.3) {
          target.healthBar.setFillStyle(0xFFFF00);
        } else {
          target.healthBar.setFillStyle(0xFF0000);
        }
      }
    });
    
    // Check if toy is defeated
    if (targetToy.stats.hp <= 0) {
      this.defeatToy(target);
    }
    
    // Switch turn after delay
    this.time.delayedCall(1500, () => {
      this.currentTurn = this.currentTurn === 'player' ? 'enemy' : 'player';
      this.turnText.setText(this.currentTurn === 'player' ? 'YOUR TURN!' : 'ENEMY TURN!');
      this.turnText.setColor(this.currentTurn === 'player' ? '#00FF00' : '#FF0000');
      
      // Continue battle
      this.autoPlay();
    });
  }
  
  laserAttack(attacker: ToySprite, target: ToySprite, damage: number) {
    // Charge up effect
    const chargeCircle = this.add.circle(attacker.x, attacker.y, 10, 0xFF0000, 0.8);
    
    this.tweens.add({
      targets: chargeCircle,
      scale: 3,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        chargeCircle.destroy();
        
        // Laser beam
        const laser = this.add.rectangle(
          (attacker.x + target.x) / 2,
          (attacker.y + target.y) / 2,
          Phaser.Math.Distance.Between(attacker.x, attacker.y, target.x, target.y),
          5,
          0xFF0000
        );
        
        const angle = Phaser.Math.Angle.Between(attacker.x, attacker.y, target.x, target.y);
        laser.setRotation(angle);
        
        // Laser flash
        this.tweens.add({
          targets: laser,
          scaleY: 3,
          alpha: 0,
          duration: 200,
          onComplete: () => laser.destroy()
        });
        
        // Impact
        this.createImpact(target, damage, 0xFF0000);
      }
    });
    
    // Screen flash
    this.cameras.main.flash(100, 255, 0, 0, false);
  }
  
  biteAttack(attacker: ToySprite, target: ToySprite, damage: number) {
    // Jump to target
    this.tweens.add({
      targets: attacker,
      x: target.x + (attacker.x > target.x ? 60 : -60),
      y: target.y,
      duration: 200,
      ease: 'Power2',
      yoyo: true,
      onYoyo: () => {
        // Bite effect
        const biteText = this.add.text(target.x, target.y - 40, 'CHOMP!', {
          fontSize: '32px',
          color: '#FFFFFF',
          stroke: '#FF0000',
          strokeThickness: 6,
          fontFamily: 'Arial Black'
        }).setOrigin(0.5);
        
        this.tweens.add({
          targets: biteText,
          y: biteText.y - 30,
          scale: 1.5,
          alpha: 0,
          duration: 800,
          onComplete: () => biteText.destroy()
        });
        
        // Impact
        this.createImpact(target, damage, 0x00FF00);
        
        // Big shake
        this.cameras.main.shake(200, 0.02);
      }
    });
  }
  
  squeakAttack(attacker: ToySprite, target: ToySprite, damage: number) {
    // Squeak waves
    for (let i = 0; i < 3; i++) {
      this.time.delayedCall(i * 100, () => {
        const wave = this.add.circle(attacker.x, attacker.y, 20, 0xFFFF00, 0.5);
        
        this.tweens.add({
          targets: wave,
          scale: 4,
          alpha: 0,
          duration: 500,
          onComplete: () => wave.destroy()
        });
      });
    }
    
    // Squeak text
    const squeakText = this.add.text(attacker.x, attacker.y - 40, 'SQUEAK!', {
      fontSize: '24px',
      color: '#FFFF00',
      stroke: '#000000',
      strokeThickness: 4,
      fontFamily: 'Arial Black'
    }).setOrigin(0.5);
    
    this.tweens.add({
      targets: squeakText,
      y: squeakText.y - 20,
      scale: 1.2,
      alpha: 0,
      duration: 1000,
      onComplete: () => squeakText.destroy()
    });
    
    // Target wobble
    this.tweens.add({
      targets: target,
      rotation: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        target.setRotation(0);
        this.createImpact(target, damage, 0xFFFF00);
      }
    });
  }
  
  basicAttack(attacker: ToySprite, target: ToySprite, damage: number) {
    // Basic tackle
    const originalX = attacker.x;
    
    this.tweens.add({
      targets: attacker,
      x: target.x + (attacker.x > target.x ? 60 : -60),
      duration: 150,
      ease: 'Power2',
      yoyo: true,
      onYoyo: () => {
        this.createImpact(target, damage, 0xFFFFFF);
        this.cameras.main.shake(100, 0.01);
      }
    });
  }
  
  createImpact(target: ToySprite, damage: number, color: number) {
    // Flash effect
    const flash = this.add.circle(target.x, target.y, 40, color, 0.8);
    
    this.tweens.add({
      targets: flash,
      scale: 2,
      alpha: 0,
      duration: 300,
      onComplete: () => flash.destroy()
    });
    
    // Damage number
    const damageText = this.add.text(target.x, target.y - 20, `-${damage}`, {
      fontSize: '36px',
      color: '#FF0000',
      stroke: '#FFFFFF',
      strokeThickness: 4,
      fontFamily: 'Arial Black'
    }).setOrigin(0.5);
    
    this.tweens.add({
      targets: damageText,
      y: damageText.y - 50,
      scale: 0.5,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => damageText.destroy()
    });
    
    // Target flash red
    const originalTint = target.getAll()[1].tint;
    target.getAll()[1].setTint(0xFF0000);
    
    this.time.delayedCall(100, () => {
      target.getAll()[1].clearTint();
    });
    
    // Shake target
    this.tweens.add({
      targets: target,
      x: target.x + 10,
      duration: 50,
      yoyo: true,
      repeat: 3
    });
    
    // Particles
    for (let i = 0; i < 10; i++) {
      const particle = this.add.circle(
        target.x,
        target.y,
        Math.random() * 3 + 2,
        color
      );
      
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 50 + 30;
      
      this.tweens.add({
        targets: particle,
        x: target.x + Math.cos(angle) * distance,
        y: target.y + Math.sin(angle) * distance,
        alpha: 0,
        duration: 500,
        onComplete: () => particle.destroy()
      });
    }
  }
  
  defeatToy(toy: ToySprite) {
    // Defeat animation
    this.tweens.add({
      targets: toy,
      alpha: 0.3,
      scale: 0.8,
      y: toy.y + 30,
      rotation: 0.5,
      duration: 500,
      ease: 'Power2'
    });
    
    // KO text
    const koText = this.add.text(toy.x, toy.y, 'K.O.!', {
      fontSize: '48px',
      color: '#FF0000',
      stroke: '#FFFFFF',
      strokeThickness: 6,
      fontFamily: 'Arial Black'
    }).setOrigin(0.5);
    
    this.tweens.add({
      targets: koText,
      scale: 2,
      alpha: 0,
      duration: 1000,
      onComplete: () => koText.destroy()
    });
  }
  
  endBattle(playerWon: boolean) {
    this.battleActive = false;
    
    const { width, height } = this.cameras.main;
    
    // Victory/Defeat screen
    const overlay = this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.7);
    overlay.setAlpha(0);
    
    this.tweens.add({
      targets: overlay,
      alpha: 0.7,
      duration: 500
    });
    
    if (playerWon) {
      // Victory!
      const victoryText = this.add.text(width/2, height/2 - 50, 'VICTORY!', {
        fontSize: '72px',
        color: '#FFD700',
        stroke: '#000000',
        strokeThickness: 10,
        fontFamily: 'Arial Black'
      }).setOrigin(0.5).setAlpha(0);
      
      this.tweens.add({
        targets: victoryText,
        alpha: 1,
        scale: 1.2,
        duration: 500,
        ease: 'Back.out'
      });
      
      // Confetti
      for (let i = 0; i < 50; i++) {
        this.time.delayedCall(Math.random() * 1000, () => {
          const colors = [0xFF0000, 0x00FF00, 0x0000FF, 0xFFFF00, 0xFF00FF, 0x00FFFF];
          const confetti = this.add.rectangle(
            Math.random() * width,
            -20,
            10,
            20,
            colors[Math.floor(Math.random() * colors.length)]
          );
          confetti.setRotation(Math.random() * Math.PI);
          
          this.tweens.add({
            targets: confetti,
            y: height + 20,
            rotation: confetti.rotation + Math.PI * 4,
            duration: 2000 + Math.random() * 1000,
            onComplete: () => confetti.destroy()
          });
        });
      }
      
      // Dancing toys
      this.playerSprites.forEach((sprite, i) => {
        if (sprite.toy.stats.hp > 0) {
          this.tweens.add({
            targets: sprite,
            y: sprite.y - 30,
            rotation: Math.PI * 0.2,
            duration: 200,
            yoyo: true,
            repeat: 5,
            delay: i * 100
          });
        }
      });
    } else {
      // Defeat
      const defeatText = this.add.text(width/2, height/2 - 50, 'DEFEAT...', {
        fontSize: '72px',
        color: '#FF0000',
        stroke: '#000000',
        strokeThickness: 10,
        fontFamily: 'Arial Black'
      }).setOrigin(0.5).setAlpha(0);
      
      this.tweens.add({
        targets: defeatText,
        alpha: 1,
        y: defeatText.y + 20,
        duration: 1000,
        ease: 'Power2'
      });
    }
    
    // Restart button
    this.time.delayedCall(2000, () => {
      const restartBtn = this.add.text(width/2, height/2 + 50, 'TAP TO CONTINUE', {
        fontSize: '24px',
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 4,
        fontFamily: 'Arial Black'
      }).setOrigin(0.5).setInteractive();
      
      this.tweens.add({
        targets: restartBtn,
        alpha: 0.5,
        duration: 500,
        yoyo: true,
        repeat: -1
      });
      
      restartBtn.on('pointerdown', () => {
        window.location.reload();
      });
    });
  }
  
  getAttackType(name: string): string {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('robot')) return 'laser';
    if (lowerName.includes('dino')) return 'bite';
    if (lowerName.includes('duck')) return 'squeak';
    return 'basic';
  }
  
  getSpriteKey(name: string): string {
    const nameMap: { [key: string]: string } = {
      'Wind-Up Robot': 'robot',
      'Plastic Dino': 'dino',
      'Squeaky Duck': 'duck',
      'Army Soldier': 'soldier',
      'RC Car': 'car',
      'Teddy Bear': 'bear',
      'Toy Plane': 'plane',
      'Bouncy Ball': 'ball'
    };
    
    if (nameMap[name]) return nameMap[name];
    
    const lowerName = name.toLowerCase();
    if (lowerName.includes('robot')) return 'robot';
    if (lowerName.includes('dino')) return 'dino';
    if (lowerName.includes('duck')) return 'duck';
    if (lowerName.includes('soldier') || lowerName.includes('army')) return 'soldier';
    if (lowerName.includes('car')) return 'car';
    if (lowerName.includes('bear') || lowerName.includes('teddy')) return 'bear';
    if (lowerName.includes('plane')) return 'plane';
    if (lowerName.includes('ball')) return 'ball';
    
    const sprites = ['robot', 'dino', 'duck', 'soldier', 'car', 'bear', 'plane', 'ball'];
    return sprites[Math.floor(Math.random() * sprites.length)];
  }
  
  getRarityColor(rarity: string): number {
    const colors: { [key: string]: number } = {
      common: 0x9CA3AF,
      rare: 0x3B82F6,
      epic: 0xA855F7,
      legendary: 0xF59E0B,
      mythic: 0xEF4444
    };
    return colors[rarity] || 0xFFFFFF;
  }
  
  generateEnemyTeam(): Toy[] {
    const enemyNames = [
      'Evil Robot', 'Shadow Dino', 'Dark Duck',
      'Enemy Soldier', 'Rival Car', 'Angry Bear',
      'Sky Menace', 'Chaos Ball'
    ];
    
    const team: Toy[] = [];
    for (let i = 0; i < 3; i++) {
      const rarity = Math.random() < 0.7 ? 'common' : Math.random() < 0.9 ? 'rare' : 'epic';
      team.push({
        id: `enemy_${i}`,
        name: enemyNames[Math.floor(Math.random() * enemyNames.length)],
        rarity,
        stats: {
          hp: 25 + Math.floor(Math.random() * 20),
          maxHp: 45,
          atk: 15 + Math.floor(Math.random() * 15),
          def: 10 + Math.floor(Math.random() * 15),
          speed: 15 + Math.floor(Math.random() * 20),
          critChance: 10
        },
        sprite: '',
        moves: [],
        statusEffects: [],
        statusDuration: 0
      });
    }
    return team;
  }
}

export function createGame(parent: string | HTMLElement): Phaser.Game {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: parent,
    width: 960,
    height: 640,
    backgroundColor: '#2C3E50',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [SimpleBattleScene]
  };

  return new Phaser.Game(config);
}