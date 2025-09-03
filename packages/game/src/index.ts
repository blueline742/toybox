import * as Phaser from 'phaser';
import { BootScene } from './scenes/Boot';
import { PreloadScene } from './scenes/Preload';
import { BattleScene } from './scenes/Battle';
import { UIOverlay } from './scenes/UIOverlay';

export function createGame(parent: string | HTMLElement): Phaser.Game {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: parent,
    width: 960,
    height: 640,
    backgroundColor: '#2C3E50',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 960,
      height: 640,
      min: {
        width: 480,
        height: 320
      },
      max: {
        width: 1920,
        height: 1080
      }
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0 },
        debug: false
      }
    },
    scene: [BootScene, PreloadScene, BattleScene, UIOverlay],
    fps: {
      target: 60,
      forceSetTimeOut: false
    },
    render: {
      antialias: true,
      pixelArt: false,
      roundPixels: true
    },
    audio: {
      disableWebAudio: false
    }
  };

  return new Phaser.Game(config);
}

export { BootScene, PreloadScene, BattleScene, UIOverlay };