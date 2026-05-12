/**
 * TrackSelectScene — Pick a track within the chosen class.
 * Shows 5 tracks; locked ones are grayed, completed show trophy icons.
 * All positions proportional, 20px safe padding, 48dp touch targets.
 */
import { CLASSES, TRACKS } from '../config/tracks.js';
import { SAFE_PADDING } from '../config/constants.js';

export class TrackSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TrackSelectScene' });
  }

  init(data) {
    this.classId = data.classId || 'addition';
  }

  create() {
    this.w = this.scale.width;
    this.h = this.scale.height;
    const { w, h } = this;

    this.progress = this.registry.get('progress');
    this.cls = CLASSES[this.classId];

    this._drawBackground();

    // ── Header — single compact line to preserve vertical space ───────────
    const headerFont = Math.min(26, w * 0.038, h * 0.08);
    this.add.text(w / 2, SAFE_PADDING + headerFont * 0.6,
      `${this.cls.emoji}  ${this.cls.name}  ·  Select Track`, {
      fontSize: `${headerFont}px`,
      fontStyle: 'bold',
      color: `#${this.cls.color.toString(16).padStart(6, '0')}`,
      fontFamily: 'Arial Black, Arial',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5, 0.5);

    // ── Bucks display ─────────────────────────────────────────────────────
    this.add.text(w - SAFE_PADDING, SAFE_PADDING + 6, `💷 ${this.progress ? this.progress.bucks : 0}`, {
      fontSize: `${Math.min(16, w * 0.02)}px`,
      color: '#ffdd00',
      fontFamily: 'Arial',
    }).setOrigin(1, 0);

    // ── Track cards ────────────────────────────────────────────────────────
    this._buildTrackCards(SAFE_PADDING + headerFont * 1.2 + 6);

    // ── Back button ───────────────────────────────────────────────────────
    const btnH = Math.max(36, Math.min(48, h * 0.11));
    this._makeButton(
      SAFE_PADDING + 60, h - SAFE_PADDING - btnH / 2,
      '← Back', 0x555577,
      () => this.scene.start('ClassSelectScene')
    );
  }

  _buildTrackCards(startY) {
    const { w, h } = this;
    const trackIds = this.cls.tracks;
    const count = trackIds.length;

    const cardW = Math.min(w - SAFE_PADDING * 2, 700);
    const backBtnH = Math.max(36, Math.min(48, h * 0.11));
    const bottomReserve = SAFE_PADDING + backBtnH + 4;
    const availH = h - startY - bottomReserve;
    const gap = Math.max(4, Math.min(8, (availH * 0.02)));
    const cardH = Math.max(36, Math.min(70, (availH - gap * (count - 1)) / count));
    const startX = w / 2 - cardW / 2;

    for (let i = 0; i < count; i++) {
      const trackId = trackIds[i];
      const track = TRACKS[trackId];
      const cy = startY + i * (cardH + gap) + cardH / 2;
      this._buildTrackCard(track, startX, cy, cardW, cardH);
    }
  }

  _buildTrackCard(track, startX, cy, cardW, cardH) {
    const unlocked = this.progress ? this.progress.isTrackUnlocked(track.id) : track.trackIndex === 0;
    const trophy = this.progress ? this.progress.getTrackTrophy(track.id) : null;
    const bestPos = this.progress ? this.progress.getTrackBestPosition(track.id) : null;

    const cx = startX + cardW / 2;
    const bgColor = unlocked ? 0x1e2d4a : 0x12121e;
    const borderColor = unlocked ? this.cls.color : 0x333344;
    const textAlpha = unlocked ? 1 : 0.45;

    const bg = this.add.rectangle(cx, cy, cardW, cardH, bgColor)
      .setStrokeStyle(2, borderColor)
      .setAlpha(unlocked ? 1 : 0.8);

    if (unlocked) {
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerover', () => {
        bg.setFillStyle(0x2a3d60);
        this.tweens.add({ targets: bg, scaleX: 1.015, scaleY: 1.015, duration: 70 });
      });
      bg.on('pointerout', () => {
        bg.setFillStyle(0x1e2d4a);
        this.tweens.add({ targets: bg, scaleX: 1, scaleY: 1, duration: 70 });
      });
      bg.on('pointerdown', () => bg.setFillStyle(0x111e33));
      bg.on('pointerup', () => {
        this.cameras.main.flash(200, 255, 255, 255);
        this.time.delayedCall(220, () => {
          this.scene.start('RaceScene', { classId: this.classId, trackId: track.id });
        });
      });
    }

    const fontSize = Math.min(17, cardH * 0.28);
    const subFontSize = Math.min(12, cardH * 0.18);

    // Track number badge
    this.add.text(startX + 28, cy, `${track.trackIndex + 1}`, {
      fontSize: `${Math.min(20, cardH * 0.32)}px`,
      fontStyle: 'bold',
      color: unlocked ? `#${this.cls.color.toString(16).padStart(6, '0')}` : '#444455',
      fontFamily: 'Arial Black, Arial',
    }).setOrigin(0.5).setAlpha(textAlpha);

    // Track name
    this.add.text(startX + 58, cy - cardH * 0.14, track.name, {
      fontSize: `${fontSize}px`,
      fontStyle: 'bold',
      color: unlocked ? '#ffffff' : '#555566',
      fontFamily: 'Arial Black, Arial',
    }).setOrigin(0, 0.5).setAlpha(textAlpha);

    // Description
    this.add.text(startX + 58, cy + cardH * 0.2, track.description, {
      fontSize: `${subFontSize}px`,
      color: unlocked ? '#8899bb' : '#444455',
      fontFamily: 'Arial',
    }).setOrigin(0, 0.5).setAlpha(textAlpha);

    // Trophy / lock on right side
    const rightX = startX + cardW - 24;

    if (!unlocked) {
      this.add.text(rightX, cy, '🔒', {
        fontSize: `${Math.min(22, cardH * 0.35)}px`,
        fontFamily: 'Arial',
      }).setOrigin(0.5).setAlpha(0.6);
    } else if (trophy) {
      const trophyEmoji = trophy === 'gold' ? '🥇' : trophy === 'silver' ? '🥈' : '🥉';
      this.add.text(rightX, cy, trophyEmoji, {
        fontSize: `${Math.min(26, cardH * 0.4)}px`,
        fontFamily: 'Arial',
      }).setOrigin(0.5);

      if (bestPos) {
        const posLabel = ['1st', '2nd', '3rd', '4th'][bestPos - 1] || '';
        this.add.text(rightX, cy + cardH * 0.32, `Best: ${posLabel}`, {
          fontSize: `${subFontSize}px`,
          color: '#aabbcc',
          fontFamily: 'Arial',
        }).setOrigin(0.5);
      }
    } else {
      // Unlocked but never raced — show "GO!"
      this.add.text(rightX, cy, '▶', {
        fontSize: `${Math.min(24, cardH * 0.38)}px`,
        color: `#${this.cls.color.toString(16).padStart(6, '0')}`,
        fontFamily: 'Arial Black, Arial',
      }).setOrigin(0.5);
    }
  }

  _makeButton(x, y, label, color, callback) {
    const btnW = Math.max(120, label.length * 12);
    const btnH = Math.max(36, Math.min(48, this.h * 0.11));

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
    gfx.fillGradientStyle(0x08082a, 0x08082a, 0x16163e, 0x16163e, 1);
    gfx.fillRect(0, 0, w, h);

    // Subtle class-color accent bar at top
    const accentColor = this.cls.color;
    gfx.fillStyle(accentColor, 0.15);
    gfx.fillRect(0, 0, w, 6);
    gfx.fillRect(0, h - 6, w, 6);
  }
}
