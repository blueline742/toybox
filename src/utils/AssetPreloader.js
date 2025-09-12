// AssetPreloader.js - Preload all game assets to prevent runtime hitches
class AssetPreloader {
  constructor() {
    this.assets = {
      images: new Map(),
      audio: new Map(),
      fonts: new Set()
    };
    this.loadingProgress = 0;
    this.totalAssets = 0;
    this.loadedAssets = 0;
    this.onProgressCallbacks = [];
    this.onCompleteCallbacks = [];
  }

  // Preload image with caching
  async loadImage(src, name) {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (this.assets.images.has(name)) {
        this.loadedAssets++;
        this.updateProgress();
        resolve(this.assets.images.get(name));
        return;
      }

      const img = new Image();
      
      // Enable crossOrigin for canvas usage
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        this.assets.images.set(name, img);
        this.loadedAssets++;
        this.updateProgress();
        
        // Decode image for immediate GPU upload
        if ('decode' in img) {
          img.decode().then(() => resolve(img)).catch(() => resolve(img));
        } else {
          resolve(img);
        }
      };
      
      img.onerror = () => {
        console.error(`Failed to load image: ${src}`);
        this.loadedAssets++;
        this.updateProgress();
        reject(new Error(`Failed to load image: ${src}`));
      };
      
      img.src = src;
    });
  }

  // Preload audio with caching
  async loadAudio(src, name) {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (this.assets.audio.has(name)) {
        this.loadedAssets++;
        this.updateProgress();
        resolve(this.assets.audio.get(name));
        return;
      }

      const audio = new Audio();
      audio.preload = 'auto';
      
      audio.addEventListener('canplaythrough', () => {
        this.assets.audio.set(name, audio);
        this.loadedAssets++;
        this.updateProgress();
        resolve(audio);
      }, { once: true });
      
      audio.addEventListener('error', () => {
        console.error(`Failed to load audio: ${src}`);
        this.loadedAssets++;
        this.updateProgress();
        reject(new Error(`Failed to load audio: ${src}`));
      }, { once: true });
      
      audio.src = src;
      audio.load();
    });
  }

  // Preload font
  async loadFont(fontFamily, src) {
    if (this.assets.fonts.has(fontFamily)) {
      this.loadedAssets++;
      this.updateProgress();
      return Promise.resolve();
    }

    try {
      const font = new FontFace(fontFamily, `url(${src})`);
      await font.load();
      document.fonts.add(font);
      this.assets.fonts.add(fontFamily);
      this.loadedAssets++;
      this.updateProgress();
      return font;
    } catch (error) {
      console.error(`Failed to load font: ${fontFamily}`, error);
      this.loadedAssets++;
      this.updateProgress();
      throw error;
    }
  }

  // Batch load multiple assets
  async loadAssets(assetList) {
    this.totalAssets = assetList.length;
    this.loadedAssets = 0;
    this.loadingProgress = 0;

    const promises = assetList.map(asset => {
      switch (asset.type) {
        case 'image':
          return this.loadImage(asset.src, asset.name);
        case 'audio':
          return this.loadAudio(asset.src, asset.name);
        case 'font':
          return this.loadFont(asset.name, asset.src);
        default:
          console.warn(`Unknown asset type: ${asset.type}`);
          this.loadedAssets++;
          this.updateProgress();
          return Promise.resolve();
      }
    });

    try {
      await Promise.all(promises);
      this.onComplete();
      return true;
    } catch (error) {
      console.error('Some assets failed to load:', error);
      this.onComplete();
      return false;
    }
  }

  // Update loading progress
  updateProgress() {
    this.loadingProgress = this.totalAssets > 0 
      ? (this.loadedAssets / this.totalAssets) * 100 
      : 0;
    
    this.onProgressCallbacks.forEach(callback => {
      callback(this.loadingProgress, this.loadedAssets, this.totalAssets);
    });
  }

  // Called when all assets are loaded
  onComplete() {
    this.onCompleteCallbacks.forEach(callback => {
      callback(this.assets);
    });
  }

  // Register progress callback
  onProgress(callback) {
    this.onProgressCallbacks.push(callback);
    return this;
  }

  // Register completion callback
  onLoadComplete(callback) {
    this.onCompleteCallbacks.push(callback);
    return this;
  }

  // Get loaded asset
  getImage(name) {
    return this.assets.images.get(name);
  }

  getAudio(name) {
    return this.assets.audio.get(name);
  }

  // Clear all loaded assets
  clear() {
    this.assets.images.clear();
    this.assets.audio.clear();
    this.assets.fonts.clear();
    this.loadingProgress = 0;
    this.totalAssets = 0;
    this.loadedAssets = 0;
  }

  // Create texture atlas for WebGL/Canvas optimization
  async createTextureAtlas(images, atlasSize = 2048) {
    // Reduce atlas size on mobile for memory constraints
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      atlasSize = Math.min(atlasSize, 1024);
    }
    
    const canvas = document.createElement('canvas');
    canvas.width = atlasSize;
    canvas.height = atlasSize;
    const ctx = canvas.getContext('2d', { alpha: true });
    
    const atlas = {
      texture: null,
      frames: {},
      canvas: canvas // Keep canvas for direct WebGL usage
    };
    
    // Sort images by height for better packing
    const sortedImages = Array.from(images.entries()).sort((a, b) => b[1].height - a[1].height);
    
    let x = 0;
    let y = 0;
    let rowHeight = 0;
    
    for (const [name, img] of sortedImages) {
      // Add 2px padding to prevent texture bleeding
      const padding = 2;
      const imgWidth = img.width + padding * 2;
      const imgHeight = img.height + padding * 2;
      
      // Check if image fits in current row
      if (x + imgWidth > atlasSize) {
        x = 0;
        y += rowHeight;
        rowHeight = 0;
      }
      
      // Check if image fits in atlas
      if (y + imgHeight > atlasSize) {
        console.warn(`Texture atlas full, skipping ${name}`);
        continue;
      }
      
      // Draw image to atlas with padding
      ctx.drawImage(img, x + padding, y + padding);
      
      // Store frame data (excluding padding from coordinates)
      atlas.frames[name] = {
        x: x + padding,
        y: y + padding,
        width: img.width,
        height: img.height,
        // UV coordinates for WebGL
        uvX: (x + padding) / atlasSize,
        uvY: (y + padding) / atlasSize,
        uvWidth: img.width / atlasSize,
        uvHeight: img.height / atlasSize
      };
      
      // Update position
      x += imgWidth;
      rowHeight = Math.max(rowHeight, imgHeight);
    }
    
    // Convert canvas to image and create WebGL texture
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const atlasImg = new Image();
        atlasImg.onload = () => {
          atlas.texture = atlasImg;
          atlas.url = url;
          console.log(`Texture atlas created: ${Object.keys(atlas.frames).length} sprites packed`);
          resolve(atlas);
        };
        atlasImg.src = url;
      }, 'image/png');
    });
  }
  
  // Auto-create atlas from loaded images
  async createAtlasFromLoadedImages() {
    if (this.assets.images.size === 0) return null;
    
    // Filter out large images to prevent atlas overflow
    const smallImages = new Map();
    const largeImages = new Set();
    
    for (const [name, img] of this.assets.images.entries()) {
      // Skip images larger than 512px in either dimension
      if (img.width > 512 || img.height > 512) {
        largeImages.add(name);
        console.log(`Excluding large image from atlas: ${name} (${img.width}x${img.height})`);
      } else {
        smallImages.set(name, img);
      }
    }
    
    console.log(`Creating atlas with ${smallImages.size} images, excluded ${largeImages.size} large images`);
    
    // Only create atlas if we have images to pack
    if (smallImages.size > 0) {
      const atlas = await this.createTextureAtlas(smallImages);
      this.atlas = atlas;
      return atlas;
    }
    
    return null;
  }
}

// Define game assets to preload - ACTUAL ASSETS THAT EXIST
export const gameAssets = [
  // Character/Toy images
  { type: 'image', name: 'robot', src: '/robot.png' },
  { type: 'image', name: 'mechadino', src: '/mechadinopp.jpg' },
  { type: 'image', name: 'duckie', src: '/duckiepp.jpg' },
  { type: 'image', name: 'cosmicjack', src: '/cosmicjackpp.jpg' },
  { type: 'image', name: 'greensoldiers', src: '/greensoldierspp.png' },
  { type: 'image', name: 'rockinghorse', src: '/rockinghorsepp.jpg' },
  { type: 'image', name: 'winduppp', src: '/winduppp.jpg' },
  { type: 'image', name: 'voodoo', src: '/voodoopp.png' },
  { type: 'image', name: 'puppet', src: '/puppetpp.png' },
  { type: 'image', name: 'jackinbox', src: '/jackinboxpp.png' },
  { type: 'image', name: 'spitfire', src: '/spitfirepp.png' },
  { type: 'image', name: 'doctor', src: '/doctorpp.png' },
  { type: 'image', name: 'toydoll', src: '/toydollpp.jpg' },
  { type: 'image', name: 'rubiks', src: '/rubikspp.png' },
  { type: 'image', name: 'rocket', src: '/rocketpp.png' },
  
  // Backgrounds
  { type: 'image', name: 'main_bg', src: '/finalwebpbackground.webp' },
  { type: 'image', name: 'pvp_arena', src: '/pvp-arena-bg.jpg' },
  { type: 'image', name: 'toyboxarena', src: '/assets/backgrounds/toyboxarena.png' },
  { type: 'image', name: 'cardback', src: '/assets/cardback.png' },
  
  // Spell Effects - NEW!
  { type: 'image', name: 'fireball', src: '/assets/effects/fireball.png' },
  { type: 'image', name: 'explosion', src: '/assets/effects/explosion.png' },
  { type: 'image', name: 'lightning', src: '/assets/effects/lightning.png' },
  { type: 'image', name: 'frost1', src: '/assets/effects/frost1.png' },
  { type: 'image', name: 'frost2', src: '/assets/effects/frost2.png' },
  { type: 'image', name: 'icecube', src: '/assets/effects/icecube.png' },
  { type: 'image', name: 'shield-neon', src: '/assets/effects/neon.png' },
  
  // UI Buttons
  { type: 'image', name: 'freeplay_btn', src: '/freeplaybutton.svg' },
  { type: 'image', name: 'pvpbattle_btn', src: '/pvpbattlebutton.svg' },
  { type: 'image', name: 'minttoys_btn', src: '/minttoysbutton.svg' },
  { type: 'image', name: 'mytoybox_btn', src: '/mytoyboxbutton.svg' },
  
  // Sound effects
  { type: 'audio', name: 'button_click', src: '/button.wav' },
  { type: 'audio', name: 'battle_start', src: '/battlestart.wav' },
  { type: 'audio', name: 'victory', src: '/gamewin.wav' },
  { type: 'audio', name: 'defeat', src: '/gamelose.wav' },
  { type: 'audio', name: 'your_turn', src: '/yourturn.wav' },
  { type: 'audio', name: 'select_card', src: '/selectcard.wav' },
  { type: 'audio', name: 'heal', src: '/heal.wav' },
  { type: 'audio', name: 'freeze', src: '/freeze.wav' },
  { type: 'audio', name: 'pyroblast', src: '/pyroblast.wav' },
  { type: 'audio', name: 'chainlightning', src: '/chainlightning.wav' },
  
  // Character sounds
  { type: 'audio', name: 'duckie_sound', src: '/duckie.wav' },
  { type: 'audio', name: 'robot_sound', src: '/robot.wav' },
  { type: 'audio', name: 'train_sound', src: '/train.wav' },
  { type: 'audio', name: 'mechadino_sound', src: '/mechadino.wav' },
  { type: 'audio', name: 'greensoldier_sound', src: '/greensoldier.wav' },
  { type: 'audio', name: 'rockinghorse_sound', src: '/rockinghorse.wav' },
  { type: 'audio', name: 'cosmicjack_sound', src: '/cosmicjack.wav' },
  { type: 'audio', name: 'phoenix_sound', src: '/phoenix.wav' },
  
  // Music
  { type: 'audio', name: 'menu_music', src: '/menumusic.mp3' },
  { type: 'audio', name: 'battle_music', src: '/battlemusic.mp3' },
  { type: 'audio', name: 'blue_wins', src: '/blueteamwins.mp3' },
  { type: 'audio', name: 'red_wins', src: '/redteamwins.mp3' }
];

// Create singleton instance
const assetPreloader = new AssetPreloader();

export default assetPreloader;