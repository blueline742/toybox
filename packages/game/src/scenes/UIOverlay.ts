import * as Phaser from 'phaser';
import { Toy, Move } from '../types';
import { BattleScene } from './Battle';

export class UIOverlay extends Phaser.Scene {
  private battleScene!: BattleScene;
  private moveButtons: Phaser.GameObjects.Container[] = [];
  private currentToy: Toy | null = null;
  private targetSelectionMode: boolean = false;
  private selectedMove: Move | null = null;

  constructor() {
    super({ key: 'UIOverlay' });
  }

  init(data: { battleScene: BattleScene }): void {
    this.battleScene = data.battleScene;
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Turn indicator
    const turnText = this.add.text(width / 2, 30, 'BATTLE START', {
      fontSize: '24px',
      fontFamily: 'Arial Black',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 4
    });
    turnText.setOrigin(0.5);
    turnText.setName('turnText');
    
    // Move selection panel
    this.createMovePanel();
    
    // Listen for battle events
    this.battleScene.events.on('playerTurn', this.onPlayerTurn, this);
    this.battleScene.events.on('battleEnd', this.onBattleEnd, this);
  }

  private createMovePanel(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    const panel = this.add.container(width / 2, height - 100);
    panel.setName('movePanel');
    panel.setVisible(false);
    
    // Panel background
    const bg = this.add.rectangle(0, 0, 400, 120, 0x000000, 0.8);
    bg.setStrokeStyle(3, 0xFFFFFF);
    panel.add(bg);
    
    // Move buttons will be added dynamically
  }

  private onPlayerTurn(toy: Toy): void {
    this.currentToy = toy;
    this.updateTurnText(`${toy.name}'s Turn`);
    this.showMoveSelection(toy);
  }

  private showMoveSelection(toy: Toy): void {
    const panel = this.children.getByName('movePanel') as Phaser.GameObjects.Container;
    if (!panel) return;
    
    // Clear old buttons
    this.moveButtons.forEach(btn => btn.destroy());
    this.moveButtons = [];
    
    // Create move buttons
    toy.moves.forEach((move, index) => {
      const x = index === 0 ? -100 : 100;
      const button = this.createMoveButton(move, x, 0);
      panel.add(button);
      this.moveButtons.push(button);
    });
    
    panel.setVisible(true);
  }

  private createMoveButton(move: Move, x: number, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    
    // Button background
    const bg = this.add.rectangle(0, 0, 180, 50, 0x4A90E2);
    bg.setStrokeStyle(2, 0xFFFFFF);
    bg.setInteractive({ useHandCursor: true });
    
    // Move name
    const nameText = this.add.text(0, -10, move.name, {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#FFFFFF'
    });
    nameText.setOrigin(0.5);
    
    // Damage text
    const damageText = this.add.text(0, 10, `DMG: ${move.damage}`, {
      fontSize: '12px',
      fontFamily: 'Arial',
      color: '#FFD700'
    });
    damageText.setOrigin(0.5);
    
    // Special indicator
    if (move.special) {
      const specialBadge = this.add.text(60, -20, '★', {
        fontSize: '16px',
        color: '#FFD700'
      });
      container.add(specialBadge);
    }
    
    container.add([bg, nameText, damageText]);
    
    // Hover effects
    bg.on('pointerover', () => {
      bg.setFillStyle(0x5BA0F2);
      this.tweens.add({
        targets: container,
        scale: 1.05,
        duration: 100
      });
    });
    
    bg.on('pointerout', () => {
      bg.setFillStyle(0x4A90E2);
      this.tweens.add({
        targets: container,
        scale: 1,
        duration: 100
      });
    });
    
    // Click handler
    bg.on('pointerdown', () => {
      this.onMoveSelected(move);
      // Button press animation
      this.tweens.add({
        targets: container,
        scale: 0.95,
        duration: 50,
        yoyo: true
      });
    });
    
    return container;
  }

  private onMoveSelected(move: Move): void {
    this.selectedMove = move;
    
    // Hide move panel
    const panel = this.children.getByName('movePanel') as Phaser.GameObjects.Container;
    if (panel) panel.setVisible(false);
    
    // If move targets self, execute immediately
    if (move.targetSelf && this.currentToy) {
      this.battleScene.executePlayerMove(move, this.currentToy);
      this.currentToy = null;
      return;
    }
    
    // Show target selection
    this.updateTurnText('Select Target');
    this.targetSelectionMode = true;
    
    // Make enemy sprites interactive
    this.battleScene['enemySprites'].forEach((sprite: Phaser.GameObjects.Sprite) => {
      const toy = sprite.getData('toy') as Toy;
      if (toy.stats.hp > 0) {
        sprite.setInteractive({ useHandCursor: true });
        
        // Add selection glow
        const glow = this.add.rectangle(
          sprite.x, sprite.y,
          sprite.width + 20, sprite.height + 20,
          0xFF0000, 0
        );
        glow.setStrokeStyle(3, 0xFF0000, 0.5);
        glow.setName(`glow_${toy.id}`);
        
        // Pulse animation
        this.tweens.add({
          targets: glow,
          alpha: 0.8,
          duration: 500,
          yoyo: true,
          repeat: -1
        });
        
        sprite.on('pointerdown', () => {
          if (this.targetSelectionMode && this.selectedMove) {
            this.onTargetSelected(toy);
          }
        });
        
        sprite.on('pointerover', () => {
          glow.setStrokeStyle(3, 0xFFFF00, 1);
        });
        
        sprite.on('pointerout', () => {
          glow.setStrokeStyle(3, 0xFF0000, 0.5);
        });
      }
    });
  }

  private onTargetSelected(target: Toy): void {
    if (!this.selectedMove) return;
    
    // Remove target selection UI
    this.cleanupTargetSelection();
    
    // Execute move
    this.battleScene.executePlayerMove(this.selectedMove, target);
    
    // Reset state
    this.selectedMove = null;
    this.currentToy = null;
    this.targetSelectionMode = false;
  }

  private cleanupTargetSelection(): void {
    // Remove glows
    this.children.list.forEach(child => {
      if (child.name?.startsWith('glow_')) {
        child.destroy();
      }
    });
    
    // Remove interactivity
    this.battleScene['enemySprites'].forEach((sprite: Phaser.GameObjects.Sprite) => {
      sprite.removeInteractive();
      sprite.removeAllListeners();
    });
  }

  private updateTurnText(text: string): void {
    const turnText = this.children.getByName('turnText') as Phaser.GameObjects.Text;
    if (turnText) {
      turnText.setText(text);
      
      // Pop animation
      this.tweens.add({
        targets: turnText,
        scale: 1.2,
        duration: 200,
        yoyo: true,
        ease: 'Bounce.out'
      });
    }
  }

  private onBattleEnd(winner: 'player' | 'enemy'): void {
    this.cleanupTargetSelection();
    
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Victory/Defeat overlay
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.7);
    overlay.setOrigin(0);
    
    const resultText = this.add.text(width / 2, height / 2 - 50, 
      winner === 'player' ? 'VICTORY!' : 'DEFEAT', {
      fontSize: '64px',
      fontFamily: 'Arial Black',
      color: winner === 'player' ? '#FFD700' : '#FF0000',
      stroke: '#000000',
      strokeThickness: 8
    });
    resultText.setOrigin(0.5);
    
    // Reward text (placeholder)
    const rewardText = this.add.text(width / 2, height / 2 + 30,
      winner === 'player' ? '+100 Tokens!' : 'Try Again!', {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 4
    });
    rewardText.setOrigin(0.5);
    
    // Continue button
    const continueBtn = this.add.rectangle(width / 2, height / 2 + 100, 200, 60, 0x4A90E2);
    continueBtn.setStrokeStyle(3, 0xFFFFFF);
    continueBtn.setInteractive({ useHandCursor: true });
    
    const btnText = this.add.text(width / 2, height / 2 + 100, 'Continue', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#FFFFFF'
    });
    btnText.setOrigin(0.5);
    
    continueBtn.on('pointerdown', () => {
      // Return to menu or restart
      window.location.reload();
    });
    
    // Animations
    overlay.setAlpha(0);
    resultText.setScale(0);
    rewardText.setAlpha(0);
    continueBtn.setScale(0);
    btnText.setScale(0);
    
    this.tweens.add({
      targets: overlay,
      alpha: 0.7,
      duration: 500
    });
    
    this.tweens.add({
      targets: resultText,
      scale: 1,
      duration: 800,
      ease: 'Bounce.out',
      delay: 200
    });
    
    this.tweens.add({
      targets: rewardText,
      alpha: 1,
      duration: 500,
      delay: 600
    });
    
    this.tweens.add({
      targets: [continueBtn, btnText],
      scale: 1,
      duration: 400,
      ease: 'Back.out',
      delay: 800
    });
  }
}