import * as Phaser from 'phaser';
import { BattleState, Toy, Move } from '../types';
import { CombatSystem } from '../systems/combat';
import { AISystem } from '../systems/ai';
import { EffectsSystem } from '../systems/effects';
import { createToy } from '../data/toys';

export class BattleScene extends Phaser.Scene {
  private battleState!: BattleState;
  private combat!: CombatSystem;
  private ai!: AISystem;
  private effects!: EffectsSystem;
  
  private playerSprites: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private enemySprites: Map<string, Phaser.GameObjects.Sprite> = new Map();
  
  private isProcessingTurn: boolean = false;
  private battleSpeed: number = 1000; // ms between turns

  constructor() {
    super({ key: 'BattleScene' });
  }

  init(data: { playerTeam: Toy[], enemyTeam: Toy[] }): void {
    this.combat = new CombatSystem(Date.now());
    this.ai = new AISystem(this.combat);
    this.effects = new EffectsSystem(this);
    
    // Initialize battle state
    this.battleState = this.combat.initBattleState(
      data.playerTeam || this.createDefaultTeam(),
      data.enemyTeam || this.createDefaultEnemyTeam()
    );
  }

  preload(): void {
    // Assets are loaded in Preload scene
  }

  create(): void {
    // Background
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;
    
    // Wood floor background
    this.add.rectangle(0, 0, 1920, 1080, 0x8B4513).setOrigin(0);
    
    // Create toy sprites
    this.createTeamSprites();
    
    // Initialize effects
    this.effects.init();
    
    // Start battle
    this.time.delayedCall(500, () => {
      this.processTurn();
    });

    // Create UI overlay
    this.scene.launch('UIOverlay', { battleScene: this });
  }

  private createTeamSprites(): void {
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;
    
    // Player team positions (left side)
    this.battleState.playerTeam.forEach((toy, index) => {
      const x = centerX - 300;
      const y = centerY - 100 + (index * 120);
      
      const sprite = this.createToySprite(toy, x, y);
      this.playerSprites.set(toy.id, sprite);
    });
    
    // Enemy team positions (right side)
    this.battleState.enemyTeam.forEach((toy, index) => {
      const x = centerX + 300;
      const y = centerY - 100 + (index * 120);
      
      const sprite = this.createToySprite(toy, x, y, true);
      this.enemySprites.set(toy.id, sprite);
    });
  }

  private createToySprite(
    toy: Toy, 
    x: number, 
    y: number, 
    flipX: boolean = false
  ): Phaser.GameObjects.Sprite {
    // Use placeholder rectangle if sprite doesn't exist
    if (!this.textures.exists(toy.sprite)) {
      const graphics = this.make.graphics({});
      graphics.fillStyle(0xFF0000 + Math.random() * 0xFFFFFF);
      graphics.fillRoundedRect(0, 0, 80, 80, 10);
      graphics.generateTexture(toy.sprite, 80, 80);
      graphics.destroy();
    }
    
    const sprite = this.add.sprite(x, y, toy.sprite);
    sprite.setScale(1);
    sprite.setFlipX(flipX);
    sprite.setData('toy', toy);
    
    // Add floating name
    const nameText = this.add.text(x, y - 60, toy.name, {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 3
    });
    nameText.setOrigin(0.5);
    sprite.setData('nameText', nameText);
    
    // Add health bar
    this.updateHealthBar(sprite, toy);
    
    return sprite;
  }

  private updateHealthBar(sprite: Phaser.GameObjects.Sprite, toy: Toy): void {
    const x = sprite.x;
    const y = sprite.y + 50;
    
    // Remove old health bar if exists
    const oldBar = sprite.getData('healthBar');
    if (oldBar) {
      oldBar.bg.destroy();
      oldBar.fill.destroy();
      oldBar.text.destroy();
    }
    
    // Background
    const bg = this.add.rectangle(x, y, 80, 12, 0x333333);
    bg.setStrokeStyle(2, 0x000000);
    
    // Health fill
    const healthPercent = toy.stats.hp / toy.stats.maxHp;
    const fillColor = healthPercent > 0.5 ? 0x00FF00 : 
                      healthPercent > 0.25 ? 0xFFFF00 : 0xFF0000;
    const fill = this.add.rectangle(
      x - 40 + (40 * healthPercent),
      y,
      80 * healthPercent,
      12,
      fillColor
    );
    
    // HP text
    const text = this.add.text(x, y, `${toy.stats.hp}/${toy.stats.maxHp}`, {
      fontSize: '10px',
      fontFamily: 'Arial',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 2
    });
    text.setOrigin(0.5);
    
    sprite.setData('healthBar', { bg, fill, text });
  }

  private async processTurn(): Promise<void> {
    if (this.isProcessingTurn) return;
    this.isProcessingTurn = true;
    
    // Check win condition
    const winner = this.combat.checkWinCondition(this.battleState);
    if (winner) {
      this.endBattle(winner);
      return;
    }
    
    // Get current toy
    const currentToy = this.battleState.turnOrder[this.battleState.currentToyIndex];
    if (!currentToy || currentToy.stats.hp <= 0) {
      this.combat.nextTurn(this.battleState);
      this.isProcessingTurn = false;
      this.processTurn();
      return;
    }
    
    // Highlight current toy
    const sprite = this.getToySprite(currentToy);
    if (sprite) {
      this.tweens.add({
        targets: sprite,
        scale: 1.1,
        duration: 200,
        yoyo: true
      });
    }
    
    // Check if stunned
    if (!this.combat.canAct(currentToy)) {
      this.effects.floatText('STUNNED', sprite?.x || 0, sprite?.y || 0, 0xFFFF00);
      this.time.delayedCall(this.battleSpeed, () => {
        this.combat.nextTurn(this.battleState);
        this.isProcessingTurn = false;
        this.processTurn();
      });
      return;
    }
    
    // Process turn based on team
    if (this.battleState.currentTurn === 'enemy') {
      // AI turn
      const decision = this.ai.makeDecision(this.battleState);
      this.executeMove(currentToy, decision.target, decision.move);
    } else {
      // Player turn - wait for input
      this.isProcessingTurn = false;
      this.events.emit('playerTurn', currentToy);
    }
  }

  public executePlayerMove(move: Move, target: Toy): void {
    const currentToy = this.battleState.turnOrder[this.battleState.currentToyIndex];
    this.executeMove(currentToy, target, move);
  }

  private executeMove(attacker: Toy, target: Toy, move: Move): void {
    const attackerSprite = this.getToySprite(attacker);
    const targetSprite = this.getToySprite(target);
    
    if (!attackerSprite || !targetSprite) return;
    
    // Move animation
    const originalX = attackerSprite.x;
    const moveDirection = attackerSprite.x < targetSprite.x ? 1 : -1;
    
    this.tweens.add({
      targets: attackerSprite,
      x: originalX + (moveDirection * 30),
      duration: 150,
      yoyo: true,
      ease: 'Power2',
      onYoyo: () => {
        // Execute combat logic at impact
        const result = this.combat.executeMove(attacker, target, move);
        
        // Apply effects
        if (result.damage > 0) {
          this.effects.hitCombo(targetSprite, result.isCrit, result.damage);
        }
        
        if (result.statusApplied) {
          this.effects.statusEffectVisual(targetSprite, result.statusApplied);
        }
        
        // Update health bars
        this.updateHealthBar(targetSprite, target);
        this.updateHealthBar(attackerSprite, attacker);
        
        // Play sound if available
        if (this.sound.get(move.soundEffect)) {
          this.sound.play(move.soundEffect, { volume: 0.5 });
        }
      },
      onComplete: () => {
        // Check if target died
        if (target.stats.hp <= 0) {
          this.defeatToy(target);
        }
        
        // Continue to next turn
        this.time.delayedCall(this.battleSpeed, () => {
          this.combat.nextTurn(this.battleState);
          this.isProcessingTurn = false;
          this.processTurn();
        });
      }
    });
  }

  private defeatToy(toy: Toy): void {
    const sprite = this.getToySprite(toy);
    if (!sprite) return;
    
    // Fade out animation
    this.tweens.add({
      targets: [sprite, sprite.getData('nameText'), 
                sprite.getData('healthBar').bg,
                sprite.getData('healthBar').fill,
                sprite.getData('healthBar').text],
      alpha: 0.3,
      duration: 500
    });
  }

  private getToySprite(toy: Toy): Phaser.GameObjects.Sprite | undefined {
    return this.playerSprites.get(toy.id) || this.enemySprites.get(toy.id);
  }

  private endBattle(winner: 'player' | 'enemy'): void {
    this.battleState.winner = winner;
    
    // Victory animation
    const winningTeam = winner === 'player' ? this.playerSprites : this.enemySprites;
    winningTeam.forEach(sprite => {
      if (sprite.getData('toy').stats.hp > 0) {
        this.effects.victoryAnimation(sprite);
      }
    });
    
    // Play victory sound
    if (this.sound.get('win.wav')) {
      this.sound.play('win.wav', { volume: 0.7 });
    }
    
    // Show results after delay
    this.time.delayedCall(2000, () => {
      this.events.emit('battleEnd', winner);
      this.scene.stop('UIOverlay');
    });
  }

  private createDefaultTeam(): Toy[] {
    // Create default starter team
    return [
      createToy('robot', 'common'),
      createToy('dino', 'common'),
      createToy('duck', 'common')
    ];
  }

  private createDefaultEnemyTeam(): Toy[] {
    // Create random enemy team
    const enemies = ['army', 'yoyo', 'rc'];
    return enemies.map(id => createToy(id, 'common'));
  }
}