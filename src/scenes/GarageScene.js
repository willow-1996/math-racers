/**
 * GarageScene — car customization: recolor and attach cosmetics.
 *
 * Two internal states:
 *   'picker'    — scroll through unlocked car classes, tap CUSTOMIZE
 *   'customize' — tabbed panel: 🎨 COLOR | ⭐ GEAR
 *
 * Layout target: 800×480 landscape
 */
import Phaser from 'phaser';
import { SAFE_PADDING } from '../config/constants.js';
import { CLASSES } from '../config/tracks.js';
import { CAR_DRAW_FN } from '../systems/CarRenderer.js';
import { ATTACHMENTS, ATTACHMENTS_BY_CLASS } from '../config/attachments.js';
import { CAR_COLORS_BY_CLASS } from '../config/cars.js';

const CLASS_ORDER = ['addition', 'subtraction', 'multiplication', 'division', 'advanced'];

// 8 preset recolor options
const PALETTE = [0x00cccc, 0xff4444, 0x44ff44, 0xffaa00, 0xcc44ff, 0xff88cc, 0x4488ff, 0xffffff];

export class GarageScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GarageScene' });
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  create() {
    this.w = this.scale.width;
    this.h = this.scale.height;
    this.progress = this.registry.get('progress');
    this._objects = [];
    this._carContainer = null;
    this._customTab = 'color';
    this._accessoryPage = 0;
    this._previewColor = null;

    // Build list of unlocked classes (always at least 'addition')
    this._unlockedClasses = CLASS_ORDER.filter(id => {
      if (!this.progress) return id === 'addition';
      return this.progress.isClassUnlocked(id);
    });
    if (this._unlockedClasses.length === 0) this._unlockedClasses = ['addition'];
    this._classIndex = 0;

    // Persistent background (never destroyed)
    this._drawBackground();

    // Persistent bucks display (top-right, updated in place)
    this._bucksText = this.add.text(
      this.w - SAFE_PADDING,
      SAFE_PADDING,
      `💷 ${this._getBucks()}`,
      { fontSize: '18px', color: '#ffdd00', fontFamily: 'Arial' }
    ).setOrigin(1, 0).setDepth(50);

    this._showPicker();
  }

  // ─── Object tracking helpers ──────────────────────────────────────────────

  _track(obj) {
    this._objects.push(obj);
    return obj;
  }

  _clearObjects() {
    this._objects.forEach(o => { try { o.destroy?.(); } catch (_) {} });
    this._objects = [];
  }

  // ─── Background ───────────────────────────────────────────────────────────

  _drawBackground() {
    const { w, h } = this;
    const gfx = this.add.graphics();
    gfx.fillGradientStyle(0x0a0a2a, 0x0a0a2a, 0x1a1a4a, 0x1a1a4a, 1);
    gfx.fillRect(0, 0, w, h);
    gfx.fillStyle(0x111133, 0.8);
    gfx.fillRect(0, h * 0.72, w, h * 0.28);
    gfx.setDepth(-10);
  }

  // ─── Car preview builder ──────────────────────────────────────────────────

  _buildCarPreview(cx, cy, scale = 3.5) {
    if (this._carContainer) {
      this._carContainer.destroy();
      this._carContainer = null;
    }

    const classId = this._getCurrentClassId();
    const color = this._getPreviewColor();
    const custom = this.progress
      ? this.progress.getCarCustomization(classId)
      : { color: null, equipped: [] };

    const container = this.add.container(cx, cy);
    const gfx = this.add.graphics();

    const drawFn = CAR_DRAW_FN[classId] || CAR_DRAW_FN['addition'];
    drawFn(gfx, color, true);

    for (const attachId of (custom.equipped || [])) {
      const def = ATTACHMENTS.find(a => a.id === attachId);
      if (def) def.draw(gfx, color);
    }

    container.add(gfx);
    container.setScale(scale);
    container.setDepth(4);
    this._carContainer = container;
    return container;
  }

  // ─── STATE: Picker ────────────────────────────────────────────────────────

  _showPicker() {
    this._clearObjects();
    const { w, h } = this;
    const cx = w / 2;

    // Title
    this._track(this.add.text(cx, SAFE_PADDING + 6, 'GARAGE', {
      fontSize: '32px',
      fontStyle: 'bold',
      color: '#ffffff',
      fontFamily: 'Arial Black, Arial',
      stroke: '#003399',
      strokeThickness: 5,
    }).setOrigin(0.5, 0).setDepth(5));

    // Car preview (centered at ~y=190)
    this._buildCarPreview(cx, h * 0.40, 3.5);

    // Class name
    const classId = this._getCurrentClassId();
    const classCfg = CLASSES[classId];
    this._track(this.add.text(cx, h * 0.67, `${classCfg.emoji} ${classCfg.carType}`, {
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#aaddff',
      fontFamily: 'Arial',
    }).setOrigin(0.5).setDepth(5));

    // League name (smaller, below car type)
    this._track(this.add.text(cx, h * 0.67 + 28, classCfg.name, {
      fontSize: '14px',
      color: '#778899',
      fontFamily: 'Arial',
    }).setOrigin(0.5).setDepth(5));

    // Dot indicators
    if (this._unlockedClasses.length > 1) {
      this._drawDots(cx, h * 0.77);
    }

    // Left / right arrows
    if (this._unlockedClasses.length > 1) {
      this._makeArrow(SAFE_PADDING + 35, h * 0.40, 'left', () => this._prevCar());
      this._makeArrow(w - SAFE_PADDING - 35, h * 0.40, 'right', () => this._nextCar());
    }

    // CUSTOMIZE button
    const btnW = 200, btnH = 52;
    const btnX = cx;
    const btnY = h * 0.88;
    const custBg = this._track(
      this.add.rectangle(btnX, btnY, btnW, btnH, 0x116611)
        .setStrokeStyle(3, 0x44ff44)
        .setInteractive({ useHandCursor: true })
        .setDepth(6)
    );
    this._track(this.add.text(btnX, btnY, '🎨 CUSTOMISE', {
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#ffffff',
      fontFamily: 'Arial Black, Arial',
    }).setOrigin(0.5).setDepth(7));

    custBg.on('pointerover', () => { custBg.setFillStyle(0x228822); this.tweens.add({ targets: custBg, scaleX: 1.05, scaleY: 1.05, duration: 80, ease: 'Power1' }); });
    custBg.on('pointerout',  () => { custBg.setFillStyle(0x116611); this.tweens.add({ targets: custBg, scaleX: 1, scaleY: 1, duration: 80, ease: 'Power1' }); });
    custBg.on('pointerdown', () => custBg.setFillStyle(0x0a4a0a));
    custBg.on('pointerup',   () => {
      this._previewColor = null;
      this._customTab = 'color';
      this._accessoryPage = 0;
      this._clearObjects();
      if (this._carContainer) { this._carContainer.destroy(); this._carContainer = null; }
      this._showCustomize();
    });

    // Back button
    this._makeBackBtn('← Back', () => this.scene.start('TitleScene'));

    this._updateBucksDisplay();
  }

  _drawDots(cx, y) {
    const count = this._unlockedClasses.length;
    const dotR = 6;
    const gap = 18;
    const totalW = count * (dotR * 2) + (count - 1) * (gap - dotR * 2);
    let startX = cx - totalW / 2 + dotR;
    for (let i = 0; i < count; i++) {
      const color = i === this._classIndex ? 0xffffff : 0x445566;
      const dot = this._track(
        this.add.circle(startX + i * gap, y, dotR, color).setDepth(5)
      );
      void dot; // used via _track
    }
  }

  _makeArrow(x, y, dir, callback) {
    const bg = this._track(
      this.add.rectangle(x, y, 70, 70, 0x334466, 0.9)
        .setStrokeStyle(3, 0x6688aa)
        .setInteractive({ useHandCursor: true })
        .setDepth(10)
    );
    const label = dir === 'left' ? '◀' : '▶';
    const txt = this._track(
      this.add.text(x, y, label, {
        fontSize: '28px', color: '#ffffff', fontFamily: 'Arial',
      }).setOrigin(0.5).setDepth(11)
    );
    bg.on('pointerover', () => { this.tweens.add({ targets: [bg, txt], scaleX: 1.08, scaleY: 1.08, duration: 80 }); });
    bg.on('pointerout',  () => { this.tweens.add({ targets: [bg, txt], scaleX: 1,    scaleY: 1,    duration: 80 }); bg.setFillStyle(0x334466, 0.9); });
    bg.on('pointerdown', () => bg.setFillStyle(0x112233));
    bg.on('pointerup',   () => { bg.setFillStyle(0x334466, 0.9); callback(); });
  }

  _prevCar() {
    this._classIndex = (this._classIndex - 1 + this._unlockedClasses.length) % this._unlockedClasses.length;
    this._previewColor = null;
    this._clearObjects();
    if (this._carContainer) { this._carContainer.destroy(); this._carContainer = null; }
    this._showPicker();
  }

  _nextCar() {
    this._classIndex = (this._classIndex + 1) % this._unlockedClasses.length;
    this._previewColor = null;
    this._clearObjects();
    if (this._carContainer) { this._carContainer.destroy(); this._carContainer = null; }
    this._showPicker();
  }

  // ─── STATE: Customize ─────────────────────────────────────────────────────

  _showCustomize() {
    this._clearObjects();
    const { w, h } = this;
    const cx = w / 2;

    // Title
    const classId = this._getCurrentClassId();
    const classCfg = CLASSES[classId];
    this._track(this.add.text(cx, SAFE_PADDING + 4, `${classCfg.emoji} ${classCfg.carType}`, {
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#aaddff',
      fontFamily: 'Arial Black, Arial',
    }).setOrigin(0.5, 0).setDepth(5));

    // Car preview at top-center (smaller scale)
    this._buildCarPreview(cx, h * 0.22, 2.5);

    // Tab buttons (color / accessories) — centered, below car
    const tabY = h * 0.43;
    this._drawTabButtons(tabY);

    // Panel content below tabs
    const panelY = tabY + 32;
    if (this._customTab === 'color') {
      this._showColorTab(panelY);
    } else {
      this._showAccessoriesTab(panelY);
    }

    // Back button → returns to picker
    this._makeBackBtn('← Car', () => {
      this._previewColor = null;
      this._clearObjects();
      if (this._carContainer) { this._carContainer.destroy(); this._carContainer = null; }
      this._showPicker();
    });

    this._updateBucksDisplay();
  }

  _drawTabButtons(cy) {
    const { w } = this;
    const cx = w / 2;
    const tabW = 130, tabH = 44, gap = 12;

    const tabs = [
      { id: 'color',       label: '🎨 COLOUR' },
      { id: 'accessories', label: '⭐ GEAR'  },
    ];

    tabs.forEach((tab, i) => {
      const tx = cx + (i - 0.5) * (tabW + gap);
      const isActive = this._customTab === tab.id;

      const bg = this._track(
        this.add.rectangle(tx, cy, tabW, tabH,
          isActive ? 0x224488 : 0x1a1a3a)
          .setStrokeStyle(isActive ? 3 : 1, isActive ? 0x66aaff : 0x334466)
          .setInteractive({ useHandCursor: true })
          .setDepth(6)
      );
      this._track(this.add.text(tx, cy, tab.label, {
        fontSize: '16px',
        fontStyle: 'bold',
        color: isActive ? '#ffffff' : '#8899aa',
        fontFamily: 'Arial',
      }).setOrigin(0.5).setDepth(7));

      if (!isActive) {
        bg.on('pointerover', () => { bg.setFillStyle(0x1e2a44); this.tweens.add({ targets: bg, scaleX: 1.05, scaleY: 1.05, duration: 60 }); });
        bg.on('pointerout',  () => { bg.setFillStyle(0x1a1a3a); this.tweens.add({ targets: bg, scaleX: 1,    scaleY: 1,    duration: 60 }); });
        bg.on('pointerup',   () => {
          this._customTab = tab.id;
          this._accessoryPage = 0;
          this._clearObjects();
          if (this._carContainer) { this._carContainer.destroy(); this._carContainer = null; }
          this._showCustomize();
        });
      }
    });
  }

  // ─── Color tab ────────────────────────────────────────────────────────────

  _showColorTab(panelY) {
    const { w } = this;
    const classId = this._getCurrentClassId();
    const classCfg = CLASSES[classId];
    const colorCost = classCfg.colorCost || 10000;

    // How much the current saved color (or default) costs
    const custom = this.progress ? this.progress.getCarCustomization(classId) : { color: null, equipped: [] };
    const savedColor = custom.color;
    const defaultColor = (CAR_COLORS_BY_CLASS[classId] || [])[0] ?? 0x00cccc;

    // Color swatches: 4×2 grid, centered
    const diam = 56;
    const gap = 12;
    const cols = 4;
    const totalW = cols * diam + (cols - 1) * gap;
    const startX = w / 2 - totalW / 2 + diam / 2;

    for (let i = 0; i < PALETTE.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = startX + col * (diam + gap);
      const cy = panelY + row * (diam + gap) + diam / 2;
      const color = PALETTE[i];

      // Determine status
      const isCurrentSaved = (color === savedColor) || (savedColor === null && color === defaultColor);
      const isPreview = this._previewColor === color && !isCurrentSaved;
      const canAfford = (this.progress?.bucks ?? 0) >= colorCost;

      // Circle background
      const alpha = (!isCurrentSaved && !canAfford) ? 0.4 : 1;
      const circle = this._track(
        this.add.circle(cx, cy, diam / 2, color, alpha)
          .setInteractive({ useHandCursor: true })
          .setDepth(6)
      );

      // Border
      let strokeColor = 0x333344, strokeWidth = 2;
      if (isCurrentSaved) { strokeColor = 0xffffff; strokeWidth = 4; }
      else if (isPreview)  { strokeColor = 0xffdd00; strokeWidth = 3; }
      circle.setStrokeStyle(strokeWidth, strokeColor);

      // Checkmark or lock
      if (isCurrentSaved) {
        this._track(this.add.text(cx, cy, '✓', {
          fontSize: '22px', fontStyle: 'bold', color: '#ffffff',
          fontFamily: 'Arial', stroke: '#000000', strokeThickness: 3,
        }).setOrigin(0.5).setDepth(7));
      } else if (!canAfford) {
        this._track(this.add.text(cx, cy - 4, '🔒', {
          fontSize: '16px', fontFamily: 'Arial',
        }).setOrigin(0.5).setDepth(7));
        this._track(this.add.text(cx, cy + 14, `💷${(colorCost / 1000).toFixed(0)}k`, {
          fontSize: '10px', color: '#ffdd00', fontFamily: 'Arial',
        }).setOrigin(0.5).setDepth(7));
      }

      // Hover/click
      circle.on('pointerover', () => {
        if (!isCurrentSaved) this.tweens.add({ targets: circle, scaleX: 1.12, scaleY: 1.12, duration: 70 });
      });
      circle.on('pointerout', () => {
        this.tweens.add({ targets: circle, scaleX: 1, scaleY: 1, duration: 70 });
      });
      circle.on('pointerup', () => this._onColorTap(color, colorCost, isCurrentSaved, canAfford));
    }

    // Hint text
    const hintY = panelY + 2 * (diam + gap) + diam / 2 + 14;
    this._track(this.add.text(w / 2, hintY, `Colour: 💷 ${colorCost.toLocaleString()} each`, {
      fontSize: '13px', color: '#778899', fontFamily: 'Arial',
    }).setOrigin(0.5).setDepth(5));
  }

  _onColorTap(color, colorCost, isCurrentSaved, canAfford) {
    if (isCurrentSaved) return; // already this color, nothing to do

    if (!canAfford) {
      const needed = colorCost - (this.progress?.bucks ?? 0);
      this._showToast(`Need 💷${needed.toLocaleString()} more!`, '#ff6644');
      return;
    }

    if (!this.progress) return;

    // Purchase & immediately apply
    const success = this.progress.purchaseColor(this._getCurrentClassId(), color);
    if (success) {
      this._previewColor = color;
      this._updateBucksDisplay(true); // bounce
      this._showToast(`New colour! 💷-${colorCost.toLocaleString()}`, '#44ff88');
      // Rebuild to refresh borders / checkmarks + car preview
      this._clearObjects();
      if (this._carContainer) { this._carContainer.destroy(); this._carContainer = null; }
      this._showCustomize();
    } else {
      this._showToast('Not enough bucks! 💷', '#ff4444');
    }
  }

  // ─── Accessories tab ──────────────────────────────────────────────────────

  _showAccessoriesTab(panelY) {
    const { w, h } = this;
    const classId = this._getCurrentClassId();
    const attachments = ATTACHMENTS_BY_CLASS[classId] || [];
    const garageData = this.progress ? (this.progress.data.garage[classId] || {}) : {};
    const ownedList = garageData.ownedAttachments || [];
    const equippedList = garageData.equipped || [];
    const bucks = this.progress?.bucks ?? 0;

    // 2-column grid, 6 per page (3 rows × 2 cols)
    const PAGE_SIZE = 6;
    const totalPages = Math.ceil(attachments.length / PAGE_SIZE);
    const page = Math.max(0, Math.min(this._accessoryPage, totalPages - 1));
    const pageItems = attachments.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

    const availW = w - 2 * SAFE_PADDING;
    const cardGap = 10;
    const cardW = (availW - cardGap) / 2;
    const cardH = 68;
    const rowGap = 8;

    for (let i = 0; i < pageItems.length; i++) {
      const att = pageItems[i];
      const col = i % 2;
      const row = Math.floor(i / 2);
      const cardX = SAFE_PADDING + col * (cardW + cardGap) + cardW / 2;
      const cardY = panelY + row * (cardH + rowGap) + cardH / 2;

      if (cardY + cardH / 2 > h - SAFE_PADDING - 50) continue;

      const isOwned    = ownedList.includes(att.id);
      const isEquipped = equippedList.includes(att.id);
      const canAfford  = bucks >= att.cost;

      const fillColor   = isEquipped ? 0x1a3a1a : (isOwned ? 0x222233 : 0x16162a);
      const strokeColor = isEquipped ? 0x44ff44 : (isOwned ? 0x5566aa : 0x2a2a44);
      const strokeW     = isEquipped ? 3 : 2;

      const card = this._track(
        this.add.rectangle(cardX, cardY, cardW, cardH, fillColor)
          .setStrokeStyle(strokeW, strokeColor)
          .setInteractive({ useHandCursor: true })
          .setDepth(6)
      );

      // Emoji + name
      const emojiX = cardX - cardW / 2 + 12;
      this._track(this.add.text(emojiX, cardY - 18, att.emoji || '🔧', {
        fontSize: '20px', fontFamily: 'Arial',
      }).setOrigin(0, 0.5).setDepth(7));

      const nameX = emojiX + 30;
      this._track(this.add.text(nameX, cardY - 16, att.name, {
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#ffffff',
        fontFamily: 'Arial',
        wordWrap: { width: cardW - 50 },
      }).setOrigin(0, 0.5).setDepth(7));

      // Status line
      let statusStr, statusColor;
      if (isEquipped) {
        statusStr  = '✅ Equipped';
        statusColor = '#44ff88';
      } else if (isOwned) {
        statusStr  = '○ Tap to equip';
        statusColor = '#aaaaaa';
      } else if (canAfford) {
        statusStr  = `💷 ${att.cost.toLocaleString()}`;
        statusColor = '#ffdd00';
      } else {
        statusStr  = `🔒 💷${att.cost.toLocaleString()}`;
        statusColor = '#665544';
      }

      this._track(this.add.text(cardX - cardW / 2 + 8, cardY + 12, statusStr, {
        fontSize: '12px',
        color: statusColor,
        fontFamily: 'Arial',
      }).setOrigin(0, 0.5).setDepth(7));

      // Hover
      card.on('pointerover', () => {
        this.tweens.add({ targets: card, scaleX: 1.03, scaleY: 1.03, duration: 60 });
      });
      card.on('pointerout', () => {
        this.tweens.add({ targets: card, scaleX: 1, scaleY: 1, duration: 60 });
      });
      card.on('pointerup',  () => this._onAttachmentTap(att, isOwned, isEquipped, canAfford));
    }

    // Pagination controls
    if (totalPages > 1) {
      const pageY = h - SAFE_PADDING - 24;
      this._track(this.add.text(w / 2, pageY, `Page ${page + 1} / ${totalPages}`, {
        fontSize: '13px', color: '#778899', fontFamily: 'Arial',
      }).setOrigin(0.5).setDepth(6));

      if (page > 0) {
        const prevBtn = this._track(this.add.text(w / 2 - 80, pageY, '◀ PREV', {
          fontSize: '13px', fontStyle: 'bold', color: '#aaccff', fontFamily: 'Arial',
        }).setOrigin(0.5).setDepth(6).setInteractive({ useHandCursor: true }));
        prevBtn.on('pointerup', () => {
          this._accessoryPage = page - 1;
          this._clearObjects();
          if (this._carContainer) { this._carContainer.destroy(); this._carContainer = null; }
          this._showCustomize();
        });
      }

      if (page < totalPages - 1) {
        const nextBtn = this._track(this.add.text(w / 2 + 80, pageY, 'NEXT ▶', {
          fontSize: '13px', fontStyle: 'bold', color: '#aaccff', fontFamily: 'Arial',
        }).setOrigin(0.5).setDepth(6).setInteractive({ useHandCursor: true }));
        nextBtn.on('pointerup', () => {
          this._accessoryPage = page + 1;
          this._clearObjects();
          if (this._carContainer) { this._carContainer.destroy(); this._carContainer = null; }
          this._showCustomize();
        });
      }
    }
  }

  _onAttachmentTap(att, isOwned, isEquipped, canAfford) {
    if (!this.progress) return;
    const classId = this._getCurrentClassId();

    if (!isOwned) {
      if (!canAfford) {
        const needed = att.cost - (this.progress.bucks ?? 0);
        this._showToast(`Need 💷${needed.toLocaleString()} more!`, '#ff6644');
        return;
      }
      const success = this.progress.purchaseAttachment(classId, att.id);
      if (success) {
        // Auto-equip on first purchase
        this.progress.toggleAttachment(classId, att.id);
        this._updateBucksDisplay(true);
        this._showToast(`Got ${att.emoji} ${att.name}!`, '#44ff88');
      } else {
        this._showToast('Not enough bucks! 💷', '#ff4444');
        return;
      }
    } else {
      // Toggle equip/unequip
      this.progress.toggleAttachment(classId, att.id);
      if (isEquipped) {
        this._showToast(`${att.emoji} unequipped`, '#aaaaaa');
      } else {
        this._showToast(`${att.emoji} equipped!`, '#44ff88');
      }
    }

    // Rebuild to show updated state
    this._clearObjects();
    if (this._carContainer) { this._carContainer.destroy(); this._carContainer = null; }
    this._showCustomize();
  }

  // ─── Back button ──────────────────────────────────────────────────────────

  _makeBackBtn(label, callback) {
    const btnW = 120, btnH = 44;
    const bx = SAFE_PADDING + btnW / 2;
    const by = this.h - SAFE_PADDING - btnH / 2;

    const bg = this._track(
      this.add.rectangle(bx, by, btnW, btnH, 0x334455)
        .setStrokeStyle(2, 0x6688aa)
        .setInteractive({ useHandCursor: true })
        .setDepth(8)
    );
    this._track(this.add.text(bx, by, label, {
      fontSize: '18px', fontStyle: 'bold', color: '#ffffff', fontFamily: 'Arial',
    }).setOrigin(0.5).setDepth(9));

    bg.on('pointerover', () => { bg.setFillStyle(0x445566); this.tweens.add({ targets: bg, scaleX: 1.06, scaleY: 1.06, duration: 60 }); });
    bg.on('pointerout',  () => { bg.setFillStyle(0x334455); this.tweens.add({ targets: bg, scaleX: 1,    scaleY: 1,    duration: 60 }); });
    bg.on('pointerdown', () => bg.setFillStyle(0x112233));
    bg.on('pointerup',   () => { bg.setFillStyle(0x334455); callback(); });
  }

  // ─── Toast ────────────────────────────────────────────────────────────────

  _showToast(text, color = '#ffffff') {
    const toast = this.add.text(this.w / 2, this.h * 0.5, text, {
      fontSize: '20px',
      fontStyle: 'bold',
      color,
      fontFamily: 'Arial Black, Arial',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(100);
    this._track(toast);
    this.tweens.add({
      targets: toast,
      y: this.h * 0.38,
      alpha: 0,
      duration: 1200,
      ease: 'Power2',
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  _getCurrentClassId() {
    return this._unlockedClasses[this._classIndex];
  }

  _getPreviewColor() {
    const classId = this._getCurrentClassId();
    const custom = this.progress
      ? this.progress.getCarCustomization(classId)
      : { color: null, equipped: [] };
    return this._previewColor
      ?? custom.color
      ?? (CAR_COLORS_BY_CLASS[classId]?.[0] ?? 0x00cccc);
  }

  _getBucks() {
    return this.progress ? this.progress.bucks : 0;
  }

  _updateBucksDisplay(bounce = false) {
    if (!this._bucksText || !this._bucksText.active) return;
    this._bucksText.setText(`💷 ${this._getBucks().toLocaleString()}`);
    if (bounce) {
      this.tweens.add({
        targets: this._bucksText,
        scaleX: 1.3, scaleY: 1.3,
        duration: 120,
        ease: 'Power2',
        yoyo: true,
      });
    }
  }
}
