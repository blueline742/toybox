import * as Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    const baseUrl = '/assets/';
    
    // Load toy sprites
    const toys = ['robot', 'dino', 'duck', 'army', 'yoyo', 'rc', 'jack', 'teddy'];
    toys.forEach(toy => {
      // Create placeholder if image doesn't exist
      this.load.image(toy + '.png', baseUrl + 'sprites/' + toy + '.png');
    });
    
    // Load effect sprites
    const effects = ['hit_flash', 'starburst', 'shockwave', 'spark', 'confetti', 'yo_trail'];
    effects.forEach(effect => {
      this.load.image(effect, baseUrl + 'sprites/' + effect + '.png');
    });
    
    // Load backgrounds
    this.load.image('floor_bg', baseUrl + 'sprites/floor_bg.png');
    this.load.image('toybox_chest', baseUrl + 'sprites/toybox_chest.png');
    this.load.image('ray_cone', baseUrl + 'sprites/ray_cone.png');
    
    // Load audio
    this.load.audio('musicbox_loop', [baseUrl + 'audio/musicbox_loop.mp3']);
    this.load.audio('click', [baseUrl + 'audio/click.wav']);
    this.load.audio('open', [baseUrl + 'audio/open.wav']);
    this.load.audio('reward', [baseUrl + 'audio/reward.wav']);
    this.load.audio('win', [baseUrl + 'audio/win.wav']);
    
    // Load sound effects
    const sfx = ['zap', 'chomp', 'roar', 'squeak', 'clack', 'whoosh', 'engine', 'boom', 'boing', 'thud'];
    sfx.forEach(sound => {
      this.load.audio(sound + '.wav', [baseUrl + 'audio/' + sound + '.wav']);
    });
  }

  create(): void {
    // Create placeholder graphics for missing assets
    this.createPlaceholderAssets();
    
    // Start background music
    if (this.sound.get('musicbox_loop')) {
      const music = this.sound.add('musicbox_loop', { 
        loop: true, 
        volume: 0.3 
      });
      music.play();
    }
    
    // Proceed to main game
    this.scene.start('BattleScene');
  }

  private createPlaceholderAssets(): void {
    // Create placeholder toy sprites if they don't exist
    const toys = [
      { key: 'robot.png', color: 0x4A90E2 },
      { key: 'dino.png', color: 0x2ECC71 },
      { key: 'duck.png', color: 0xF1C40F },
      { key: 'army.png', color: 0x27AE60 },
      { key: 'yoyo.png', color: 0xE74C3C },
      { key: 'rc.png', color: 0x9B59B6 },
      { key: 'jack.png', color: 0xE67E22 },
      { key: 'teddy.png', color: 0x8B4513 }
    ];
    
    toys.forEach(toy => {
      if (!this.textures.exists(toy.key)) {
        const graphics = this.make.graphics({});
        graphics.fillStyle(toy.color);
        graphics.fillRoundedRect(0, 0, 80, 80, 15);
        graphics.fillStyle(0xFFFFFF, 0.3);
        graphics.fillCircle(25, 25, 8);
        graphics.fillCircle(55, 25, 8);
        graphics.generateTexture(toy.key, 80, 80);
        graphics.destroy();
      }
    });
    
    // Create placeholder effect sprites
    if (!this.textures.exists('hit_flash')) {
      const graphics = this.make.graphics({});
      graphics.fillStyle(0xFFFFFF, 0.8);
      graphics.fillCircle(40, 40, 40);
      graphics.generateTexture('hit_flash', 80, 80);
      graphics.destroy();
    }
    
    if (!this.textures.exists('starburst')) {
      const graphics = this.make.graphics({});
      graphics.fillStyle(0xFFD700);
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        graphics.fillTriangle(
          64, 64,
          64 + Math.cos(angle) * 60, 64 + Math.sin(angle) * 60,
          64 + Math.cos(angle + 0.2) * 60, 64 + Math.sin(angle + 0.2) * 60
        );
      }
      graphics.generateTexture('starburst', 128, 128);
      graphics.destroy();
    }
    
    if (!this.textures.exists('shockwave')) {
      const graphics = this.make.graphics({});
      graphics.lineStyle(4, 0xFFFFFF, 0.8);
      graphics.strokeCircle(64, 64, 60);
      graphics.generateTexture('shockwave', 128, 128);
      graphics.destroy();
    }
    
    if (!this.textures.exists('spark')) {
      const graphics = this.make.graphics({});
      graphics.fillStyle(0xFFFF00);
      graphics.fillCircle(8, 8, 8);
      graphics.generateTexture('spark', 16, 16);
      graphics.destroy();
    }
    
    if (!this.textures.exists('confetti')) {
      const graphics = this.make.graphics({});
      graphics.fillStyle(0xFF0000);
      graphics.fillRect(0, 0, 8, 12);
      graphics.generateTexture('confetti', 8, 12);
      graphics.destroy();
    }
    
    if (!this.textures.exists('yo_trail')) {
      const graphics = this.make.graphics({});
      const gradient = graphics.createLinearGradient(0, 0, 100, 0);
      gradient.addColorStop(0, 'rgba(255,255,255,0)');
      gradient.addColorStop(0.5, 'rgba(255,255,255,0.8)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      graphics.fillGradientStyle(gradient);
      graphics.fillRect(0, 0, 100, 4);
      graphics.generateTexture('yo_trail', 100, 4);
      graphics.destroy();
    }
    
    // Create floor background
    if (!this.textures.exists('floor_bg')) {
      const graphics = this.make.graphics({});
      graphics.fillStyle(0x8B4513);
      graphics.fillRect(0, 0, 1920, 1080);
      // Add wood grain effect
      graphics.lineStyle(1, 0x654321, 0.3);
      for (let i = 0; i < 20; i++) {
        graphics.lineBetween(0, i * 60, 1920, i * 60 + Math.random() * 20);
      }
      graphics.generateTexture('floor_bg', 1920, 1080);
      graphics.destroy();
    }
    
    // Create toybox chest
    if (!this.textures.exists('toybox_chest')) {
      const graphics = this.make.graphics({});
      graphics.fillStyle(0x654321);
      graphics.fillRoundedRect(0, 20, 120, 80, 10);
      graphics.fillStyle(0x8B4513);
      graphics.fillRoundedRect(0, 0, 120, 40, 10);
      graphics.fillStyle(0xFFD700);
      graphics.fillRect(55, 40, 10, 20);
      graphics.generateTexture('toybox_chest', 120, 100);
      graphics.destroy();
    }
  }
}