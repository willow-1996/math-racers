import { SAFE_PADDING } from '../config/constants.js';

export class UserSelectScene extends Phaser.Scene {
  constructor() { super({ key: 'UserSelectScene' }); }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;
    const cx = w / 2;
    const progress = this.registry.get('progress');

    // Dark background
    const gfx = this.add.graphics();
    gfx.fillGradientStyle(0x0a0a2e, 0x0a0a2e, 0x1a1a4e, 0x1a1a4e, 1);
    gfx.fillRect(0, 0, w, h);

    // Title
    this.add.text(cx, SAFE_PADDING + 12, '👤 RACERS', {
      fontSize: `${Math.min(32, w * 0.045)}px`,
      fontStyle: 'bold', color: '#ffffff',
      fontFamily: 'Arial Black, Arial', stroke: '#000066', strokeThickness: 4,
    }).setOrigin(0.5, 0);

    // Profile grid
    const profiles = progress ? progress.getProfiles() : [];
    const cols = 2;
    const cardW = Math.min(260, (w - SAFE_PADDING * 2 - 16) / cols);
    const cardH = Math.max(64, h * 0.18);
    const startY = SAFE_PADDING + Math.min(32, w * 0.045) + 28;
    const gapX = (w - SAFE_PADDING * 2 - cardW * cols) / (cols + 1);
    const gapY = 12;

    profiles.forEach((prof, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const px = SAFE_PADDING + gapX + col * (cardW + gapX) + cardW / 2;
      const py = startY + row * (cardH + gapY) + cardH / 2;

      const borderColor = prof.isCurrent ? 0xffd700 : 0x4466aa;
      const bg = this.add.rectangle(px, py, cardW, cardH, 0x223355)
        .setStrokeStyle(prof.isCurrent ? 4 : 2, borderColor)
        .setInteractive({ useHandCursor: true });

      this.add.text(px, py - cardH * 0.15, prof.name, {
        fontSize: `${Math.min(20, cardH * 0.28)}px`,
        fontStyle: 'bold', color: '#ffffff', fontFamily: 'Arial Black, Arial',
      }).setOrigin(0.5);

      this.add.text(px, py + cardH * 0.2, `💷 ${prof.bucks.toLocaleString()}`, {
        fontSize: `${Math.min(14, cardH * 0.2)}px`,
        color: '#ffdd00', fontFamily: 'Arial',
      }).setOrigin(0.5);

      if (prof.isCurrent) {
        this.add.text(px + cardW * 0.38, py - cardH * 0.35, '✓', {
          fontSize: '14px', color: '#ffd700', fontFamily: 'Arial',
        }).setOrigin(0.5);
      }

      bg.on('pointerover', () => { bg.setFillStyle(0x334466); });
      bg.on('pointerout',  () => { bg.setFillStyle(0x223355); });
      bg.on('pointerdown', () => { bg.setFillStyle(0x112233); });
      bg.on('pointerup', () => {
        if (!prof.isCurrent && progress) progress.switchProfile(prof.name);
        this.cameras.main.flash(200, 255, 255, 255);
        this.time.delayedCall(220, () => this.scene.start('TitleScene'));
      });
    });

    // New Racer button
    const rows = Math.ceil(profiles.length / cols);
    const newBtnY = startY + rows * (cardH + gapY) + 16 + 28;
    const newBtnW = Math.min(200, w * 0.3);
    const newBtnH = Math.max(44, h * 0.12);
    const newBg = this.add.rectangle(cx, newBtnY, newBtnW, newBtnH, 0x226633)
      .setStrokeStyle(2, 0x44ff88).setInteractive({ useHandCursor: true });
    this.add.text(cx, newBtnY, '➕ New Racer', {
      fontSize: `${Math.min(18, newBtnH * 0.42)}px`,
      fontStyle: 'bold', color: '#ffffff', fontFamily: 'Arial Black, Arial',
    }).setOrigin(0.5);
    newBg.on('pointerover', () => newBg.setFillStyle(0x338844));
    newBg.on('pointerout',  () => newBg.setFillStyle(0x226633));
    newBg.on('pointerdown', () => newBg.setFillStyle(0x115522));
    newBg.on('pointerup',   () => this.scene.start('NameEntryScene', { addingProfile: true }));

    // Back button
    const backBtnH = Math.max(44, h * 0.11);
    const backBg = this.add.rectangle(SAFE_PADDING + 60, h - SAFE_PADDING - backBtnH / 2, 120, backBtnH, 0x555577)
      .setStrokeStyle(2, 0xaaaacc).setInteractive({ useHandCursor: true });
    this.add.text(SAFE_PADDING + 60, h - SAFE_PADDING - backBtnH / 2, '← Back', {
      fontSize: '18px', fontStyle: 'bold', color: '#ffffff', fontFamily: 'Arial',
    }).setOrigin(0.5);
    backBg.on('pointerover', () => backBg.setFillStyle(0x6666aa));
    backBg.on('pointerout',  () => backBg.setFillStyle(0x555577));
    backBg.on('pointerup',   () => this.scene.start('TitleScene'));
  }
}
