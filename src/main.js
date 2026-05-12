import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { NameEntryScene } from './scenes/NameEntryScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { ClassSelectScene } from './scenes/ClassSelectScene.js';
import { TrackSelectScene } from './scenes/TrackSelectScene.js';
import { RaceScene } from './scenes/RaceScene.js';
import { ResultsScene } from './scenes/ResultsScene.js';
import { GarageScene } from './scenes/GarageScene.js';
import { CheatScene } from './scenes/CheatScene.js';
import { ProgressManager } from './systems/ProgressManager.js';

// Instantiate global progress manager and share via Phaser registry
const progress = new ProgressManager();

// Always initialise Phaser with landscape dimensions.
// The #game-container is CSS-rotated 90° when the device is in portrait so the
// canvas's logical (landscape) size must be set explicitly — Phaser uses
// getBoundingClientRect() on its parent which returns the rotated (portrait)
// size and would create the canvas at the wrong dimensions.
const _isPortrait = window.innerHeight > window.innerWidth;
const _gameW = _isPortrait ? window.innerHeight : window.innerWidth;
const _gameH = _isPortrait ? window.innerWidth  : window.innerHeight;

const config = {
  type: Phaser.AUTO,
  backgroundColor: '#1a1a2e',
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.NONE,
    width: _gameW,
    height: _gameH,
  },
  scene: [BootScene, NameEntryScene, TitleScene, ClassSelectScene, TrackSelectScene, RaceScene, ResultsScene, GarageScene, CheatScene],
  callbacks: {
    preBoot: (game) => {
      game.registry.set('progress', progress);
    },
  },
};

const game = new Phaser.Game(config);

// Expose the game instance globally so ProgressManager can emit events
// to active scenes (e.g. after async IDB recovery on first load).
globalThis.__phaserGame = game;
