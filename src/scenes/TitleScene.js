/**
 * TitleScene — logo text + "RACE!" button.
 * All positions are proportional to actual screen size.
 */
import { SAFE_PADDING } from '../config/constants.js';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;
    const cx = w / 2;
    const cy = h / 2;

    // ── Background gradient (sky + road) ──────────────────────────────────
    this._drawBackground(w, h);

    // ── Logo — font capped by both width and height to avoid overflow ─────
    const logoFont = Math.min(64, w * 0.1, h * 0.15);
    const logoLineH = logoFont * 1.05;

    // Logo stacked from top, clear of safe padding
    const mathY    = SAFE_PADDING + logoFont * 0.8;
    const racersY  = mathY + logoLineH;
    const subtitleY = racersY + logoFont * 0.75;

    // Shadows
    this.add.text(cx + 3, mathY + 3,   'MATHS',  { fontSize: `${logoFont}px`, fontStyle: 'bold', color: '#00000055', fontFamily: 'Arial Black, Arial' }).setOrigin(0.5);
    this.add.text(cx + 3, racersY + 3, 'RACERS', { fontSize: `${logoFont}px`, fontStyle: 'bold', color: '#00000055', fontFamily: 'Arial Black, Arial' }).setOrigin(0.5);

    const mathText = this.add.text(cx, mathY, 'MATHS', {
      fontSize: `${logoFont}px`, fontStyle: 'bold', color: '#ffffff',
      fontFamily: 'Arial Black, Arial', stroke: '#003399', strokeThickness: 7,
    }).setOrigin(0.5);

    const racersText = this.add.text(cx, racersY, 'RACERS', {
      fontSize: `${logoFont}px`, fontStyle: 'bold', color: '#ffdd00',
      fontFamily: 'Arial Black, Arial', stroke: '#aa6600', strokeThickness: 7,
    }).setOrigin(0.5);

    this.add.text(cx, subtitleY, 'Solve maths · Race to win!', {
      fontSize: `${Math.min(18, w * 0.025)}px`, color: '#ffffff', fontFamily: 'Arial', alpha: 0.85,
    }).setOrigin(0.5);

    this.tweens.add({ targets: [mathText, racersText], scaleX: 1.04, scaleY: 1.04, yoyo: true, repeat: -1, duration: 900, ease: 'Sine.easeInOut' });

    // ── Buttons — anchored from the bottom of the safe area ───────────────
    // Sizing is proportional but capped so they don't balloon on tall screens.
    const raceBtnH   = Math.max(48, Math.min(62, h * 0.16));
    const garageBtnH = Math.max(38, Math.min(50, h * 0.12));
    const btnGap     = Math.max(6, h * 0.025);
    const raceBtnW   = Math.min(280, w * 0.38);
    const garageBtnW = Math.min(200, w * 0.28);

    // Place GARAGE flush against bottom safe edge, RACE! above it.
    const garageBtnY = h - SAFE_PADDING - garageBtnH / 2;
    const btnY       = garageBtnY - garageBtnH / 2 - btnGap - raceBtnH / 2;

    // ── Decorative cars — only if there's room above the RACE! button ─────
    const carSlot = btnY - raceBtnH / 2 - 8;
    if (carSlot > subtitleY + 24) {
      this._drawDecoCar(cx - w * 0.2, carSlot - 15, 0x00aaff);
      this._drawDecoCar(cx + w * 0.1, carSlot - 15, 0xff4444);
    }

    // ── Animated road lines ───────────────────────────────────────────────
    this._roadLines = [];
    for (let i = 0; i < 8; i++) {
      const line = this.add.rectangle(
        i * (w / 7) - 10, h * 0.85,
        70, 8, 0xffffff, 0.8
      );
      this._roadLines.push(line);
    }

    // ── RACE! button ──────────────────────────────────────────────────────
    const raceFontSize = Math.min(30, raceBtnH * 0.52);
    const btnBg = this.add.rectangle(cx, btnY, raceBtnW, raceBtnH, 0xff4400)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(4, 0xffffff);

    const btnText = this.add.text(cx, btnY, '🏁  RACE!', {
      fontSize: `${raceFontSize}px`, fontStyle: 'bold', color: '#ffffff',
      fontFamily: 'Arial Black, Arial',
    }).setOrigin(0.5);

    btnBg.on('pointerover', () => {
      btnBg.setFillStyle(0xff6622);
      this.tweens.add({ targets: [btnBg, btnText], scaleX: 1.07, scaleY: 1.07, duration: 100 });
    });
    btnBg.on('pointerout', () => {
      btnBg.setFillStyle(0xff4400);
      this.tweens.add({ targets: [btnBg, btnText], scaleX: 1, scaleY: 1, duration: 100 });
    });
    btnBg.on('pointerdown', () => {
      btnBg.setFillStyle(0xcc3300);
      this.tweens.add({ targets: [btnBg, btnText], scaleX: 0.96, scaleY: 0.96, duration: 80 });
    });
    btnBg.on('pointerup', () => {
      this.cameras.main.flash(300, 255, 255, 255);
      this.time.delayedCall(320, () => this.scene.start('ClassSelectScene'));
    });

    // ── GARAGE button ─────────────────────────────────────────────────────
    const garageFontSize = Math.min(20, garageBtnH * 0.46);
    const garageBg = this.add.rectangle(cx, garageBtnY, garageBtnW, garageBtnH, 0x334488)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(3, 0x8899cc);
    const garageTxt = this.add.text(cx, garageBtnY, '🔧 GARAGE', {
      fontSize: `${garageFontSize}px`, fontStyle: 'bold', color: '#ffffff',
      fontFamily: 'Arial Black, Arial',
    }).setOrigin(0.5);
    garageBg.on('pointerover', () => garageBg.setFillStyle(0x4455aa));
    garageBg.on('pointerout', () => garageBg.setFillStyle(0x334488));
    garageBg.on('pointerup', () => this.scene.start('GarageScene'));

    // ── Change User button — to the right of GARAGE ───────────────────────
    const changeBtnW = Math.min(120, w - SAFE_PADDING - (cx + garageBtnW / 2) - 12);
    if (changeBtnW >= 70) {
      const changeX = cx + garageBtnW / 2 + 8 + changeBtnW / 2;
      const changeFontSize = Math.min(14, garageBtnH * 0.38);
      const changeBg = this.add.rectangle(changeX, garageBtnY, changeBtnW, garageBtnH, 0x226644)
        .setStrokeStyle(2, 0x44aa66).setInteractive({ useHandCursor: true });
      this.add.text(changeX, garageBtnY, '👤 Change', {
        fontSize: `${changeFontSize}px`, fontStyle: 'bold', color: '#ffffff',
        fontFamily: 'Arial Black, Arial',
      }).setOrigin(0.5);
      changeBg.on('pointerover', () => changeBg.setFillStyle(0x338855));
      changeBg.on('pointerout',  () => changeBg.setFillStyle(0x226644));
      changeBg.on('pointerup',   () => this.scene.start('UserSelectScene'));
    }

    // ── Bucks display — top-centre, away from buttons ─────────────────────
    const progress = this.registry.get('progress');
    this._bucksText = this.add.text(cx, SAFE_PADDING + 4, `💷 ${progress ? progress.bucks : 0}`, {
      fontSize: `${Math.min(14, w * 0.018)}px`,
      color: '#ffdd00',
      fontFamily: 'Arial',
    }).setOrigin(0.5, 0);

    // Listen for async IDB recovery — update wallet text if data arrives late
    this.game.events.once('progressRestored', (data) => {
      if (this._bucksText && this._bucksText.active) {
        this._bucksText.setText(`💷 ${data.player.bucks} Bucks`);
      }
    });

    // ── Refresh button (upper-left, online only) ──────────────────────────
    this._refreshBtn = this.add.text(
      SAFE_PADDING,
      SAFE_PADDING,
      '↻ Refresh',
      {
        fontSize: '14px',
        color: '#ffffff',
        fontFamily: 'Arial',
        alpha: navigator.onLine ? 0.5 : 0,
      }
    ).setOrigin(0, 0).setInteractive({ useHandCursor: true, hitArea: new Phaser.Geom.Rectangle(-8, -8, 90, 48), hitAreaCallback: Phaser.Geom.Rectangle.Contains });

    this._refreshBtn.setVisible(navigator.onLine);

    this._refreshBtn.on('pointerover', () => this._refreshBtn.setAlpha(0.9));
    this._refreshBtn.on('pointerout',  () => this._refreshBtn.setAlpha(0.5));
    this._refreshBtn.on('pointerup', () => {
      this._refreshBtn.setText('Updating...').setAlpha(1).setColor('#ffdd00');
      // Unregister service workers, clear caches, then hard reload
      const doReload = () => { location.href = location.href; };
      const swPromise = ('serviceWorker' in navigator)
        ? navigator.serviceWorker.getRegistrations().then(regs => Promise.all(regs.map(r => r.unregister())))
        : Promise.resolve();
      const cachePromise = ('caches' in window)
        ? caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
        : Promise.resolve();
      Promise.all([swPromise, cachePromise]).then(doReload).catch(doReload);
    });

    // Show/hide based on connectivity changes
    this._onOnline  = () => { if (this._refreshBtn?.active) this._refreshBtn.setVisible(true).setAlpha(0.5); };
    this._onOffline = () => { if (this._refreshBtn?.active) this._refreshBtn.setVisible(false); };
    window.addEventListener('online',  this._onOnline);
    window.addEventListener('offline', this._onOffline);

    // ── Build SHA (upper right, long-press to reset) ───────────────────────
    // eslint-disable-next-line no-undef
    const sha = (typeof __BUILD_SHA__ !== 'undefined') ? __BUILD_SHA__ : 'dev';
    const buildLabel = this.add.text(
      w - SAFE_PADDING,
      SAFE_PADDING,
      `Build: ${sha}`,
      {
        fontSize: '11px',
        color: '#ffffff',
        fontFamily: 'Arial',
        alpha: 0.5,
      }
    ).setOrigin(1, 0).setInteractive({ useHandCursor: false });

    let resetTimer = null;
    const RESET_HOLD_MS = 5000;

    // Cheat code: 10 rapid taps on build SHA → open CheatScene
    let cheatTaps = 0;
    let cheatResetTimer = null;
    const CHEAT_TAPS_NEEDED = 10;
    const CHEAT_WINDOW_MS   = 2000;

    buildLabel.on('pointerdown', () => {
      buildLabel.setColor('#ff4444').setAlpha(1);
      resetTimer = this.time.delayedCall(RESET_HOLD_MS, () => {
        // Wipe save data
        const prog = this.registry.get('progress');
        if (prog) prog.reset();

        // Flash "RESET!" then restart title
        const flash = this.add.text(cx, cy, 'RESET!', {
          fontSize: '64px',
          fontStyle: 'bold',
          color: '#ff0000',
          fontFamily: 'Arial Black, Arial',
          stroke: '#660000',
          strokeThickness: 6,
        }).setOrigin(0.5).setDepth(100);

        this.time.delayedCall(800, () => this.scene.restart());
        this.tweens.add({ targets: flash, alpha: 0, duration: 700, ease: 'Power2' });
      });
    });

    buildLabel.on('pointerup', () => {
      // Only count as a cheat tap if the long-press timer is still pending
      // (i.e., the press was short, not a held reset)
      if (!resetTimer) return;

      cheatTaps++;
      // Restart the idle-reset window
      if (cheatResetTimer) cheatResetTimer.remove();
      cheatResetTimer = this.time.delayedCall(CHEAT_WINDOW_MS, () => {
        cheatTaps = 0;
        cheatResetTimer = null;
      });

      if (cheatTaps >= CHEAT_TAPS_NEEDED) {
        cheatTaps = 0;
        if (cheatResetTimer) { cheatResetTimer.remove(); cheatResetTimer = null; }
        this.scene.start('CheatScene');
      }
    });

    const cancelReset = () => {
      if (resetTimer) { resetTimer.remove(); resetTimer = null; }
      buildLabel.setColor('#ffffff').setAlpha(0.5);
    };
    buildLabel.on('pointerup', cancelReset);
    buildLabel.on('pointerout', cancelReset);

    // ── Animated road scroll ──────────────────────────────────────────────
    this.time.addEvent({
      delay: 16,
      loop: true,
      callback: () => {
        for (const line of this._roadLines) {
          line.x -= 4;
          if (line.x < -60) line.x += w + 100;
        }
      },
    });
  }

  shutdown() {
    window.removeEventListener('online',  this._onOnline);
    window.removeEventListener('offline', this._onOffline);
  }

  _drawBackground(w, h) {
    const gfx = this.add.graphics();

    // Sky gradient
    gfx.fillGradientStyle(0x1a1a6e, 0x1a1a6e, 0x4488cc, 0x4488cc, 1);
    gfx.fillRect(0, 0, w, h * 0.65);

    // Mountains
    gfx.fillStyle(0x336699, 0.7);
    gfx.fillTriangle(w * 0.12, h * 0.65, w * 0.35, h * 0.35, w * 0.57, h * 0.65);
    gfx.fillTriangle(w * 0.37, h * 0.65, w * 0.65, h * 0.28, w * 0.9, h * 0.65);
    gfx.fillTriangle(w * 0.68, h * 0.65, w * 0.93, h * 0.38, w * 1.1, h * 0.65);

    // Ground / road
    gfx.fillGradientStyle(0x228833, 0x228833, 0x115522, 0x115522, 1);
    gfx.fillRect(0, h * 0.63, w, h * 0.1);

    gfx.fillStyle(0x555566);
    gfx.fillRect(0, h * 0.70, w, h * 0.30);
  }

  _drawDecoCar(x, y, color) {
    const gfx = this.add.graphics();
    gfx.fillStyle(color);
    gfx.fillRoundedRect(x, y, 90, 30, 8);
    gfx.fillStyle(0xaaddff, 0.8);
    gfx.fillRoundedRect(x + 20, y - 12, 40, 16, 6);
    gfx.fillStyle(0x222222);
    gfx.fillCircle(x + 18, y + 30, 10);
    gfx.fillCircle(x + 72, y + 30, 10);
    gfx.fillStyle(0xff8800);
    gfx.fillTriangle(x, y + 15, x - 20, y + 10, x - 20, y + 20);
  }
}
