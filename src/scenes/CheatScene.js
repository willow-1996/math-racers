/**
 * CheatScene — secret developer/parent tool screen.
 * Accessed via 10-tap cheat on the title screen build SHA.
 */
import Phaser from 'phaser';
import { SAFE_PADDING } from '../config/constants.js';

export class CheatScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CheatScene' });
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;
    const cx = w / 2;

    this.progress = this.registry.get('progress');
    this._resetConfirm = false;

    // ── Background ────────────────────────────────────────────────────────
    const gfx = this.add.graphics();
    gfx.fillGradientStyle(0x0a0a1e, 0x0a0a1e, 0x1a0a2e, 0x1a0a2e, 1);
    gfx.fillRect(0, 0, w, h);
    // subtle warning stripe
    gfx.fillStyle(0xff8800, 0.08);
    gfx.fillRect(0, 0, w, h);

    // ── Header ────────────────────────────────────────────────────────────
    this.add.text(cx, SAFE_PADDING + 14, '🔧 SECRET MENU', {
      fontSize: `${Math.min(28, w * 0.036)}px`,
      fontStyle: 'bold',
      color: '#ffaa00',
      fontFamily: 'Arial Black, Arial',
      stroke: '#331100',
      strokeThickness: 4,
    }).setOrigin(0.5, 0);

    // ── Bucks display (live) ──────────────────────────────────────────────
    this._bucksText = this.add.text(cx, SAFE_PADDING + 52, '', {
      fontSize: `${Math.min(20, w * 0.026)}px`,
      color: '#ffdd00',
      fontFamily: 'Arial',
    }).setOrigin(0.5, 0);
    this._refreshBucks();

    // ── Layout ────────────────────────────────────────────────────────────
    const btnH = Math.max(60, h * 0.11);
    const btnW = w - SAFE_PADDING * 4;
    const gap  = 14;
    const sectionStart = h * 0.22;

    // ── 1. Unlock All ─────────────────────────────────────────────────────
    this._makeActionButton(cx, sectionStart, btnW, btnH,
      '🔓  Unlock All Classes & Tracks', 0x1a6633,
      () => {
        this.progress.unlockAll();
        this._showToast('🔓 All unlocked!', '#44ff88');
      }
    );

    // ── 2. Bucks adjustment ───────────────────────────────────────────────
    const bucksY = sectionStart + btnH + gap + 10;
    this.add.text(cx, bucksY, 'Adjust Bucks', {
      fontSize: '15px', color: '#aaaacc', fontFamily: 'Arial',
    }).setOrigin(0.5, 0);

    const bucksBtnH = Math.max(52, h * 0.095);
    const bucksBtnW = (btnW - gap * 3) / 4;
    const bucksBtnY = bucksY + 26;
    const bucksOps = [
      { label: '➕1k',  delta:  1000, color: 0x228833 },
      { label: '➕10k', delta: 10000, color: 0x226633 },
      { label: '➖1k',  delta: -1000, color: 0x883322 },
      { label: '➖10k', delta:-10000, color: 0x662222 },
    ];

    bucksOps.forEach((op, i) => {
      const bx = SAFE_PADDING * 2 + i * (bucksBtnW + gap) + bucksBtnW / 2;
      const bg = this.add.rectangle(bx, bucksBtnY, bucksBtnW, bucksBtnH, op.color)
        .setStrokeStyle(2, 0x889999)
        .setInteractive({ useHandCursor: true });
      this.add.text(bx, bucksBtnY, op.label, {
        fontSize: `${Math.min(15, bucksBtnW * 0.12)}px`,
        fontStyle: 'bold', color: '#ffffff', fontFamily: 'Arial',
      }).setOrigin(0.5);
      bg.on('pointerdown', () => bg.setAlpha(0.7));
      bg.on('pointerout',  () => bg.setAlpha(1));
      bg.on('pointerup', () => {
        bg.setAlpha(1);
        const cur = this.progress.bucks;
        const next = Math.max(0, cur + op.delta);
        this.progress.data.player.bucks = next;
        this.progress._save();
        this._refreshBucks();
        this._showToast(
          op.delta > 0 ? `+💷 ${op.delta.toLocaleString()}` : `-💷 ${Math.abs(op.delta).toLocaleString()}`,
          op.delta > 0 ? '#44ff88' : '#ff8844'
        );
      });
    });

    // ── 3. Reset All ──────────────────────────────────────────────────────
    const resetY = bucksBtnY + bucksBtnH / 2 + gap + 10;
    this._resetBtn = this._makeActionButton(cx, resetY, btnW, btnH,
      '💣  Reset All Save Data', 0x661111,
      () => this._onResetTap()
    );
    this._resetBtnText = this._resetBtn._txt; // reference for label change

    // ── Back button ───────────────────────────────────────────────────────
    const backBtnH = Math.max(48, h * 0.09);
    this._makeButton(SAFE_PADDING + 64, h - SAFE_PADDING - backBtnH / 2,
      '← Back', 0x444466, () => this.scene.start('TitleScene'));
  }

  _refreshBucks() {
    this._bucksText.setText(`💷 ${(this.progress?.bucks ?? 0).toLocaleString()} bucks`);
  }

  _onResetTap() {
    if (!this._resetConfirm) {
      this._resetConfirm = true;
      this._resetBtnText.setText('⚠️ Tap again to confirm reset!');
      this._resetBtn.setFillStyle(0xaa1111);
      this.time.delayedCall(3000, () => {
        if (this._resetConfirm) {
          this._resetConfirm = false;
          this._resetBtnText.setText('💣  Reset All Save Data');
          this._resetBtn.setFillStyle(0x661111);
        }
      });
    } else {
      this._resetConfirm = false;
      this.progress.reset();
      this._showToast('💥 Save data wiped!', '#ff4444');
      this.time.delayedCall(1200, () => this.scene.start('TitleScene'));
    }
  }

  /**
   * Creates a wide action button. Returns the bg rectangle.
   * Attaches `._txt` property for label access.
   */
  _makeActionButton(cx, y, w, h, label, color, callback) {
    const bg = this.add.rectangle(cx, y + h / 2, w, h, color)
      .setStrokeStyle(3, 0xaabbcc)
      .setInteractive({ useHandCursor: true });
    const txt = this.add.text(cx, y + h / 2, label, {
      fontSize: `${Math.min(18, w * 0.025)}px`,
      fontStyle: 'bold',
      color: '#ffffff',
      fontFamily: 'Arial Black, Arial',
    }).setOrigin(0.5);
    bg._txt = txt;
    bg.on('pointerover', () => this.tweens.add({ targets: [bg, txt], scaleX: 1.02, scaleY: 1.02, duration: 80 }));
    bg.on('pointerout',  () => this.tweens.add({ targets: [bg, txt], scaleX: 1, scaleY: 1, duration: 80 }));
    bg.on('pointerdown', () => bg.setAlpha(0.8));
    bg.on('pointerup',   () => { bg.setAlpha(1); callback(); });
    return bg;
  }

  _makeButton(x, y, label, color, callback) {
    const btnW = Math.max(120, label.length * 12);
    const btnH = Math.max(48, this.scale.height * 0.09);
    const bg = this.add.rectangle(x, y, btnW, btnH, color)
      .setStrokeStyle(2, 0xaaaacc)
      .setInteractive({ useHandCursor: true });
    const txt = this.add.text(x, y, label, {
      fontSize: '18px', fontStyle: 'bold', color: '#ffffff', fontFamily: 'Arial',
    }).setOrigin(0.5);
    bg.on('pointerover', () => this.tweens.add({ targets: [bg, txt], scaleX: 1.05, scaleY: 1.05, duration: 80 }));
    bg.on('pointerout',  () => this.tweens.add({ targets: [bg, txt], scaleX: 1, scaleY: 1, duration: 80 }));
    bg.on('pointerdown', () => bg.setFillStyle(color & 0x888888));
    bg.on('pointerup', callback);
  }

  _showToast(text, color = '#ffffff') {
    const w = this.scale.width;
    const h = this.scale.height;
    const toast = this.add.text(w / 2, h * 0.5, text, {
      fontSize: '22px', fontStyle: 'bold', color,
      fontFamily: 'Arial Black, Arial',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(100);
    this.tweens.add({ targets: toast, y: h * 0.38, alpha: 0, duration: 1200, ease: 'Power2' });
  }
}
