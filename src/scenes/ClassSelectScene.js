/**
 * ClassSelectScene — Pick a racing class (operation) before the race.
 * Shows all 4 classes; locked ones are grayed with price tag.
 * All positions proportional, 20px safe padding, 48dp touch targets.
 */
import { CLASSES } from '../config/tracks.js';
import { SAFE_PADDING } from '../config/constants.js';

const CLASS_ORDER = ['addition', 'subtraction', 'multiplication', 'division', 'advanced'];

export class ClassSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ClassSelectScene' });
  }

  create() {
    this.w = this.scale.width;
    this.h = this.scale.height;
    const { w, h } = this;

    this.progress = this.registry.get('progress');

    this._drawBackground();

    // ── Title ──────────────────────────────────────────────────────────────
    this.add.text(w / 2, SAFE_PADDING + 20, 'SELECT CLASS', {
      fontSize: `${Math.min(36, w * 0.05)}px`,
      fontStyle: 'bold',
      color: '#ffffff',
      fontFamily: 'Arial Black, Arial',
      stroke: '#000066',
      strokeThickness: 5,
    }).setOrigin(0.5, 0);

    // ── Bucks display ─────────────────────────────────────────────────────
    this._bucksText = this.add.text(w - SAFE_PADDING, SAFE_PADDING + 20, `💷 ${this.progress ? this.progress.bucks : 0}`, {
      fontSize: `${Math.min(20, w * 0.025)}px`,
      color: '#ffdd00',
      fontFamily: 'Arial',
    }).setOrigin(1, 0);

    // ── Class cards ───────────────────────────────────────────────────────
    this._buildCards();

    // ── Back button ───────────────────────────────────────────────────────
    const btnH = Math.max(48, h * 0.07);
    this._makeButton(
      SAFE_PADDING + 60, h - SAFE_PADDING - btnH / 2,
      '← Back', 0x555577,
      () => this.scene.start('TitleScene')
    );
  }

  _buildCards() {
    const { w, h } = this;
    const count = CLASS_ORDER.length;

    // Layout: 2-column grid; last row is centered if it has only 1 card
    const cols = 2;
    const rows = Math.ceil(count / cols);
    const btnH = Math.max(48, h * 0.07);
    const startY = Math.max(80, h * 0.17);
    const bottomReserve = SAFE_PADDING + btnH + 8; // safe pad + button + gap
    const availH = h - startY - bottomReserve;
    const cardW = Math.min(320, (w - SAFE_PADDING * 2 - 20) / cols);
    const cardH = Math.min(120, (availH - (rows - 1) * 12) / rows);
    const gapX = (w - SAFE_PADDING * 2 - cardW * cols) / (cols + 1);
    const gapY = Math.min(16, (availH - cardH * rows) / Math.max(1, rows - 1));

    for (let i = 0; i < count; i++) {
      const classId = CLASS_ORDER[i];
      const row = Math.floor(i / cols);
      const itemsInRow = Math.min(cols, count - row * cols);
      const colInRow = i % cols;

      let cx;
      if (itemsInRow < cols) {
        // Last row with a single card — center it horizontally
        cx = w / 2;
      } else {
        cx = SAFE_PADDING + gapX + colInRow * (cardW + gapX) + cardW / 2;
      }

      const cy = startY + row * (cardH + gapY) + cardH / 2;
      this._buildCard(classId, cx, cy, cardW, cardH);
    }
  }

  _buildCard(classId, cx, cy, cardW, cardH) {
    const cls = CLASSES[classId];
    const unlocked = this.progress ? this.progress.isClassUnlocked(classId) : classId === 'addition';

    const bgColor = unlocked ? 0x223355 : 0x1a1a2a;
    const borderColor = unlocked ? cls.color : 0x444455;
    const alpha = unlocked ? 1 : 0.7;

    const bg = this.add.rectangle(cx, cy, cardW, cardH, bgColor)
      .setStrokeStyle(3, borderColor)
      .setAlpha(alpha);

    if (unlocked) {
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerover', () => {
        bg.setFillStyle(0x334466);
        this.tweens.add({ targets: bg, scaleX: 1.03, scaleY: 1.03, duration: 80 });
      });
      bg.on('pointerout', () => {
        bg.setFillStyle(0x223355);
        this.tweens.add({ targets: bg, scaleX: 1, scaleY: 1, duration: 80 });
      });
      bg.on('pointerdown', () => bg.setFillStyle(0x112233));
      bg.on('pointerup', () => {
        this.cameras.main.flash(200, 255, 255, 255);
        this.time.delayedCall(220, () => {
          this.scene.start('TrackSelectScene', { classId });
        });
      });
    }

    const emojiSize = Math.min(28, cardH * 0.22);
    const nameSize = Math.min(20, cardH * 0.16);
    const subSize = Math.min(14, cardH * 0.1);

    // Emoji + name row
    this.add.text(cx, cy - cardH * 0.22, `${cls.emoji}  ${cls.name}`, {
      fontSize: `${nameSize}px`,
      fontStyle: 'bold',
      color: unlocked ? '#ffffff' : '#888899',
      fontFamily: 'Arial Black, Arial',
    }).setOrigin(0.5).setAlpha(alpha);

    // Car type
    this.add.text(cx, cy + cardH * 0.02, cls.carType, {
      fontSize: `${subSize + 2}px`,
      color: unlocked ? '#aaccff' : '#666677',
      fontFamily: 'Arial',
    }).setOrigin(0.5).setAlpha(alpha);

    // Operation symbol (big)
    this.add.text(cx + cardW * 0.35, cy, cls.operationSymbol, {
      fontSize: `${Math.min(40, cardH * 0.4)}px`,
      fontStyle: 'bold',
      color: unlocked ? `#${cls.color.toString(16).padStart(6, '0')}` : '#555566',
      fontFamily: 'Arial Black, Arial',
    }).setOrigin(0.5).setAlpha(alpha);

    if (!unlocked) {
      // Lock + price
      this.add.text(cx - cardW * 0.1, cy + cardH * 0.26, `🔒 💷 ${cls.unlockCost.toLocaleString()}`, {
        fontSize: `${subSize}px`,
        color: '#ffdd44',
        fontFamily: 'Arial',
      }).setOrigin(0.5).setAlpha(0.9);

      // BUY button if affordable
      if (this.progress && this.progress.bucks >= cls.unlockCost) {
        this._makeBuyButton(cx, cy, cardW, cardH, classId, cls);
      }
    } else {
      // Show track completion dots
      this._drawTrackDots(cx, cy + cardH * 0.28, classId, cls, cardW);
    }
  }

  _makeBuyButton(cx, cy, cardW, cardH, classId, cls) {
    const btnW = Math.min(100, cardW * 0.4);
    const btnH = Math.max(32, cardH * 0.22);
    const btnX = cx + cardW * 0.25;
    const btnY = cy + cardH * 0.27;

    const btn = this.add.rectangle(btnX, btnY, btnW, btnH, 0x228833)
      .setStrokeStyle(2, 0x44ff66)
      .setInteractive({ useHandCursor: true });

    const btnTxt = this.add.text(btnX, btnY, 'BUY', {
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ffffff',
      fontFamily: 'Arial Black, Arial',
    }).setOrigin(0.5);

    btn.on('pointerdown', () => btn.setFillStyle(0x115522));
    btn.on('pointerup', () => {
      const ok = this.progress.purchaseClass(classId);
      if (ok) {
        this._bucksText.setText(`💷 ${this.progress.bucks}`);
        // Rebuild cards
        this.scene.restart();
      }
    });
  }

  _drawTrackDots(x, y, classId, cls, cardW) {
    const tracks = cls.tracks;
    const dotR = 6;
    const spacing = Math.min(20, (cardW * 0.8) / tracks.length);
    const startX = x - spacing * (tracks.length - 1) / 2;

    for (let i = 0; i < tracks.length; i++) {
      const trackId = tracks[i];
      const trophy = this.progress ? this.progress.getTrackTrophy(trackId) : null;
      const unlocked = this.progress ? this.progress.isTrackUnlocked(trackId) : i === 0;

      let color;
      if (trophy === 'gold') color = 0xffd700;
      else if (trophy === 'silver') color = 0xcccccc;
      else if (trophy === 'bronze') color = 0xcc8833;
      else if (unlocked) color = 0x4488ff;
      else color = 0x333344;

      const gfx = this.add.graphics();
      gfx.fillStyle(color);
      gfx.fillCircle(startX + i * spacing, y, dotR);
      if (!unlocked) {
        gfx.lineStyle(1, 0x666677);
        gfx.strokeCircle(startX + i * spacing, y, dotR);
      }
    }
  }

  _makeButton(x, y, label, color, callback) {
    const btnW = Math.max(120, label.length * 12);
    const btnH = Math.max(48, this.h * 0.07);

    const bg = this.add.rectangle(x, y, btnW, btnH, color)
      .setStrokeStyle(2, 0xaaaacc)
      .setInteractive({ useHandCursor: true });

    const txt = this.add.text(x, y, label, {
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#ffffff',
      fontFamily: 'Arial',
    }).setOrigin(0.5);

    bg.on('pointerover', () => this.tweens.add({ targets: [bg, txt], scaleX: 1.05, scaleY: 1.05, duration: 80 }));
    bg.on('pointerout', () => this.tweens.add({ targets: [bg, txt], scaleX: 1, scaleY: 1, duration: 80 }));
    bg.on('pointerdown', () => bg.setFillStyle(0x333355));
    bg.on('pointerup', callback);
  }

  _drawBackground() {
    const { w, h } = this;
    const gfx = this.add.graphics();
    gfx.fillGradientStyle(0x0a0a2e, 0x0a0a2e, 0x1a1a4e, 0x1a1a4e, 1);
    gfx.fillRect(0, 0, w, h);

    // Decorative road strip at bottom
    gfx.fillStyle(0x333344);
    gfx.fillRect(0, h * 0.88, w, h * 0.12);
    gfx.lineStyle(3, 0xffffff, 0.3);
    for (let x = 0; x < w; x += 60) {
      gfx.lineBetween(x, h * 0.94, x + 30, h * 0.94);
    }
  }
}
