/**
 * NameEntryScene — shown once on first launch to collect the player's name.
 *
 * Uses an HTML <input> element overlaid on the canvas since Phaser has no
 * native text input. The element is destroyed on scene shutdown.
 *
 * Flow: BootScene → NameEntryScene → TitleScene
 */
import Phaser from 'phaser';
import { SAFE_PADDING } from '../config/constants.js';

export class NameEntryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'NameEntryScene' });
    this._input = null;
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;
    const cx = w / 2;
    const cy = h / 2;

    // ── Background ────────────────────────────────────────────────────────
    const gfx = this.add.graphics();
    gfx.fillGradientStyle(0x1a1a3e, 0x1a1a3e, 0x0a0a2e, 0x0a0a2e, 1);
    gfx.fillRect(0, 0, w, h);

    // Decorative top stripe
    gfx.fillStyle(0x00aaff, 0.3);
    gfx.fillRect(0, 0, w, 4);

    // ── Heading ───────────────────────────────────────────────────────────
    this.add.text(cx, cy - h * 0.28, '🏎️', {
      fontSize: `${Math.min(56, w * 0.07)}px`,
    }).setOrigin(0.5);

    this.add.text(cx, cy - h * 0.16, "What's your name, racer?", {
      fontSize: `${Math.min(32, w * 0.04)}px`,
      fontStyle: 'bold',
      color: '#ffffff',
      fontFamily: 'Arial Black, Arial',
      stroke: '#003399',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // ── HTML input overlay ────────────────────────────────────────────────
    // Detect portrait mode — the game container is CSS-rotated 90° clockwise
    // when innerWidth < innerHeight. The input must be counter-rotated and
    // repositioned to appear visually centered on the rotated canvas.
    const isPortrait = window.innerWidth < window.innerHeight;

    const inputW = Math.min(360, w * 0.6);
    const inputH = Math.max(56, h * 0.1);

    // Canvas center in CSS-pixel page coordinates.
    // In portrait: the game container is rotated 90° CW, so the visual
    // center of the canvas maps to a different point in page space.
    let pageCX, pageCY;
    if (isPortrait) {
      // With transform `translateX(vw) rotate(90deg)`, canvas (cx,cy) maps to
      // portrait page coordinates: pageX = vw - cy, pageY = cx (when no scaling).
      const scaleX = window.innerHeight / w; // canvas landscape-width → portrait-height
      const scaleY = window.innerWidth  / h; // canvas landscape-height → portrait-width
      pageCX = window.innerWidth - cy * scaleY;
      pageCY = cx * scaleY;
    } else {
      const canvas = this.game.canvas;
      const rect   = canvas.getBoundingClientRect();
      pageCX = rect.left + rect.width  * 0.5;
      pageCY = rect.top  + rect.height * 0.42; // slightly above center
    }

    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 16;
    input.placeholder = 'Enter your name…';
    input.autocomplete = 'off';
    input.autocorrect = 'off';
    input.autocapitalize = 'words';
    input.spellcheck = false;

    Object.assign(input.style, {
      position:        'fixed',
      left:            `${pageCX - inputW / 2}px`,
      top:             `${pageCY - inputH / 2}px`,
      width:           `${inputW}px`,
      height:          `${inputH}px`,
      // Counter-rotate so text appears upright on rotated canvas
      transform:       isPortrait ? 'rotate(-90deg)' : 'none',
      transformOrigin: 'center center',
      fontSize:        `${Math.min(28, inputH * 0.5)}px`,
      fontFamily:      'Arial Black, Arial, sans-serif',
      fontWeight:      'bold',
      color:           '#ffffff',
      background:      '#1a1a4e',
      border:          '3px solid #4488ff',
      borderRadius:    '10px',
      padding:         '0 16px',
      outline:         'none',
      textAlign:       'center',
      boxSizing:       'border-box',
      zIndex:          '1000',
    });

    document.body.appendChild(input);
    this._input = input;

    // Focus immediately; also retry on next frame for browsers that defer keyboard
    input.focus();
    this.time.delayedCall(100, () => { if (input.parentNode) input.focus(); });

    // Submit on Enter key
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this._submit();
    });

    // ── "Let's Race!" button ──────────────────────────────────────────────
    const btnY = cy + h * 0.22;
    const btnW = Math.min(280, w * 0.4);
    const btnH = Math.max(56, h * 0.11);

    const btnBg = this.add.rectangle(cx, btnY, btnW, btnH, 0xff4400)
      .setStrokeStyle(3, 0xffffff)
      .setInteractive({ useHandCursor: true });

    const btnTxt = this.add.text(cx, btnY, "🏁  Let's Race!", {
      fontSize: `${Math.min(26, btnW * 0.09)}px`,
      fontStyle: 'bold',
      color: '#ffffff',
      fontFamily: 'Arial Black, Arial',
    }).setOrigin(0.5);

    btnBg.on('pointerover', () => {
      this.tweens.add({ targets: [btnBg, btnTxt], scaleX: 1.06, scaleY: 1.06, duration: 90 });
    });
    btnBg.on('pointerout', () => {
      this.tweens.add({ targets: [btnBg, btnTxt], scaleX: 1, scaleY: 1, duration: 90 });
    });
    btnBg.on('pointerdown', () => btnBg.setFillStyle(0xcc3300));
    btnBg.on('pointerup', () => this._submit());

    // ── Hint text ─────────────────────────────────────────────────────────
    this.add.text(cx, btnY + btnH * 0.75, 'Up to 16 characters', {
      fontSize: `${Math.min(14, w * 0.018)}px`,
      color: '#8888aa',
      fontFamily: 'Arial',
    }).setOrigin(0.5);

    // ── Remove input on scene shutdown ────────────────────────────────────
    this.events.on('shutdown', () => this._removeInput());
    this.events.on('destroy',  () => this._removeInput());
  }

  _removeInput() {
    if (this._input && this._input.parentNode) {
      this._input.parentNode.removeChild(this._input);
    }
    this._input = null;
  }

  _submit() {
    const raw = this._input ? this._input.value : '';
    const progress = this.registry.get('progress');
    if (progress) {
      progress.setPlayerName(raw);
    }
    this._removeInput();
    this.cameras.main.flash(300, 255, 255, 255);
    this.time.delayedCall(320, () => this.scene.start('TitleScene'));
  }
}
