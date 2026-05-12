/**
 * ResultsScene — Post-race results: position, accuracy, bucks earned.
 * Shows "Next Track" when a new track was unlocked, or "Race Again" / "Change Track".
 * All positions proportional to actual screen size.
 */
import Phaser from 'phaser';
import { CLASSES, TRACKS } from '../config/tracks.js';
import {
  SAFE_PADDING,
  BUCKS_BY_POSITION, BUCKS_ACCURACY_BONUS, BUCKS_STREAK_BONUS,
} from '../config/constants.js';

export class ResultsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ResultsScene' });
  }

  init(data) {
    this.raceData = data;
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;
    const cx = w / 2;

    const { position, correct, answered, streak, totalAnswerTimeMs, classId, trackId } = this.raceData;
    const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;

    // ── Calculate bucks (scaled by class multiplier + track index) ────────
    const cls = CLASSES[classId] || CLASSES['addition'];
    const track = TRACKS[trackId] || null;
    const multiplier = cls.bucksMultiplier || 1;
    const trackIndex = track ? (track.trackIndex || 0) : 0;

    // Base payout for this position, scaled by class multiplier
    const basePosition = BUCKS_BY_POSITION[position - 1] || 5;
    const scaledPosition = Math.round(basePosition * multiplier);
    // Per-track escalation: +10% of the scaled 1st-place value per track index
    const trackBonus = Math.round(Math.round(BUCKS_BY_POSITION[0] * multiplier) * 0.1 * trackIndex);
    const positionPayout = scaledPosition + trackBonus;

    // Bonuses also scale with class multiplier
    const accuracyBonus = accuracy === 100 ? Math.round(BUCKS_ACCURACY_BONUS * multiplier) : 0;
    const streakBonus   = streak >= 5      ? Math.round(BUCKS_STREAK_BONUS * multiplier)   : 0;

    // Win streak bonus — based on consecutive 1st-place finishes BEFORE this race
    // Formula: (streakLength - 1) * Math.round(firstPlaceBucks / 2)
    // We read the CURRENT streak before recordRace increments it.
    const progress = this.registry.get('progress');
    const prevWinStreak = (position === 1 && progress) ? progress.winStreak : 0;
    const firstPlaceBucks = Math.round(BUCKS_BY_POSITION[0] * multiplier) + trackBonus;
    const winStreakBonus  = prevWinStreak > 0
      ? prevWinStreak * Math.round(firstPlaceBucks / 2)
      : 0;

    const bucksEarned = positionPayout + accuracyBonus + streakBonus + winStreakBonus;

    // Save progress and get next track if unlocked
    let nextTrackId = null;
    if (progress) {
      nextTrackId = progress.recordRace({
        position, correct, answered, streak, bucksEarned, totalAnswerTimeMs,
        trackId: trackId || null,
        classId: classId || null,
      });
    }

    // ── Background ────────────────────────────────────────────────────────
    const gfx = this.add.graphics();
    gfx.fillGradientStyle(0x1a1a3e, 0x1a1a3e, 0x2a2a5e, 0x2a2a5e, 1);
    gfx.fillRect(0, 0, w, h);

    // Class color accent (cls already set above)
    gfx.fillStyle(cls.color, 0.12);
    gfx.fillRect(0, 0, w, 5);

    let y = SAFE_PADDING + 16;

    // ── Position header ───────────────────────────────────────────────────
    const posLabels = ['🥇 1st Place!', '🥈 2nd Place!', '🥉 3rd Place!', '🏅 4th Place'];
    const posColors = ['#ffd700', '#c0c0c0', '#cd7f32', '#88aacc'];

    this.add.text(cx, y, posLabels[position - 1], {
      fontSize: `${Math.min(44, w * 0.056)}px`,
      fontStyle: 'bold',
      color: posColors[position - 1],
      fontFamily: 'Arial Black, Arial',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Personalized subtitle
    const playerName = progress?.data?.player?.name || 'Racer';
    const greeting = position === 1 ? `🏆 Amazing, ${playerName}!` : `Great race, ${playerName}!`;
    this.add.text(cx, y + Math.min(44, w * 0.056) * 0.7, greeting, {
      fontSize: `${Math.min(22, w * 0.028)}px`,
      color: position === 1 ? '#ffdd00' : '#ffffff',
      fontFamily: 'Arial',
    }).setOrigin(0.5);

    y += h * 0.14;

    // ── Track name ────────────────────────────────────────────────────────
    if (trackId && TRACKS[trackId]) {
      this.add.text(cx, y, `${cls.emoji}  ${TRACKS[trackId].name}`, {
        fontSize: `${Math.min(18, w * 0.023)}px`,
        color: `#${cls.color.toString(16).padStart(6, '0')}`,
        fontFamily: 'Arial',
      }).setOrigin(0.5);
      y += h * 0.065;
    }

    // ── Stats ─────────────────────────────────────────────────────────────
    const statsStyle = {
      fontSize: `${Math.min(22, w * 0.028)}px`,
      color: '#ffffff',
      fontFamily: 'Arial',
    };

    this.add.text(cx, y, `Accuracy: ${accuracy}%  (${correct}/${answered})`, statsStyle).setOrigin(0.5);
    y += h * 0.075;
    this.add.text(cx, y, `Best Streak: ${streak} 🔥`, statsStyle).setOrigin(0.5);
    y += h * 0.1;

    // ── Bucks breakdown ───────────────────────────────────────────────────
    const bucksStyle = { fontSize: `${Math.min(18, w * 0.023)}px`, color: '#aaccff', fontFamily: 'Arial' };
    const breakdownLines = [`Race finish: 💷 ${positionPayout}`];
    if (accuracyBonus > 0) breakdownLines.push(`Perfect accuracy: 💷 +${accuracyBonus}`);
    if (streakBonus > 0)   breakdownLines.push(`Streak bonus: 💷 +${streakBonus}`);
    // Win streak bonus line: shows new streak length after this race
    const newWinStreak = position === 1 ? prevWinStreak + 1 : 0;
    if (winStreakBonus > 0) {
      breakdownLines.push(`🔥 Win streak ×${newWinStreak}: 💷 +${winStreakBonus}`);
    }

    for (const line of breakdownLines) {
      this.add.text(cx, y, line, bucksStyle).setOrigin(0.5);
      y += h * 0.055;
    }

    y += h * 0.02;

    this.add.text(cx, y, `Total: 💷 ${bucksEarned}`, {
      fontSize: `${Math.min(28, w * 0.036)}px`,
      fontStyle: 'bold',
      color: '#ffdd00',
      fontFamily: 'Arial Black, Arial',
      stroke: '#886600',
      strokeThickness: 3,
    }).setOrigin(0.5);

    y += h * 0.055;

    const totalBucks = progress ? progress.bucks : bucksEarned;
    this.add.text(cx, y, `Wallet: 💷 ${totalBucks}`, {
      fontSize: `${Math.min(16, w * 0.02)}px`,
      color: '#88aa88',
      fontFamily: 'Arial',
    }).setOrigin(0.5);

    // ── Unlock notification ───────────────────────────────────────────────
    if (nextTrackId && TRACKS[nextTrackId]) {
      y += h * 0.055;
      this.add.text(cx, y, `🔓 Unlocked: ${TRACKS[nextTrackId].name}!`, {
        fontSize: `${Math.min(18, w * 0.023)}px`,
        fontStyle: 'bold',
        color: '#44ff88',
        fontFamily: 'Arial',
        stroke: '#004422',
        strokeThickness: 3,
      }).setOrigin(0.5);
    }

    // ── Win streak cue ────────────────────────────────────────────────────
    if (newWinStreak >= 2) {
      y += h * 0.045;
      this.add.text(cx, y, `🔥 ${newWinStreak} wins in a row!`, {
        fontSize: `${Math.min(20, w * 0.026)}px`,
        fontStyle: 'bold',
        color: '#ff8800',
        fontFamily: 'Arial Black, Arial',
        stroke: '#331100',
        strokeThickness: 3,
      }).setOrigin(0.5);
    }

    // ── Buttons ───────────────────────────────────────────────────────────
    const btnY = h - SAFE_PADDING - 36;
    const hasNext = nextTrackId && TRACKS[nextTrackId];

    if (hasNext) {
      // Three buttons: Next Track | Race Again | Change Track
      this._makeButton(cx - w * 0.28, btnY, '▶ Next Track', 0x228833, () => {
        this.scene.start('RaceScene', { classId, trackId: nextTrackId });
      });
      this._makeButton(cx, btnY, '🔄 Race Again', 0x334488, () => {
        this.scene.start('RaceScene', { classId, trackId });
      });
      this._makeButton(cx + w * 0.28, btnY, '🏁 Tracks', 0x555577, () => {
        this.scene.start('TrackSelectScene', { classId });
      });
    } else {
      // Two buttons: Race Again | Change Track
      this._makeButton(cx - w * 0.18, btnY, '🔄 Race Again', 0xff4400, () => {
        this.scene.start('RaceScene', { classId, trackId });
      });
      this._makeButton(cx + w * 0.18, btnY, '🏁 Tracks', 0x334488, () => {
        this.scene.start('TrackSelectScene', { classId });
      });
    }

    // ── Celebrate if 1st place ────────────────────────────────────────────
    if (position === 1) {
      this.cameras.main.flash(400, 255, 215, 0);
      for (let i = 0; i < 30; i++) {
        const px = Phaser.Math.Between(SAFE_PADDING, w - SAFE_PADDING);
        const py = Phaser.Math.Between(-20, -200);
        const colors = [0xffd700, 0xff4444, 0x44ff44, 0x4488ff, 0xff88ff];
        const c = colors[i % colors.length];
        const particle = this.add.rectangle(px, py, 8, 8, c).setDepth(50);
        this.tweens.add({
          targets: particle,
          y: h + 20,
          x: px + Phaser.Math.Between(-60, 60),
          angle: Phaser.Math.Between(0, 360),
          duration: Phaser.Math.Between(1500, 3000),
          ease: 'Quad.easeIn',
        });
      }
    }
  }

  _makeButton(x, y, label, color, callback) {
    const btnW = Math.max(140, label.length * 11);
    const btnH = Math.max(52, this.scale.height * 0.09);

    const bg = this.add.rectangle(x, y, btnW, btnH, color)
      .setStrokeStyle(3, 0xffffff)
      .setInteractive({ useHandCursor: true });

    const txt = this.add.text(x, y, label, {
      fontSize: `${Math.min(20, btnW * 0.13)}px`,
      fontStyle: 'bold',
      color: '#ffffff',
      fontFamily: 'Arial Black, Arial',
    }).setOrigin(0.5);

    bg.on('pointerover', () => {
      this.tweens.add({ targets: [bg, txt], scaleX: 1.06, scaleY: 1.06, duration: 90 });
    });
    bg.on('pointerout', () => {
      this.tweens.add({ targets: [bg, txt], scaleX: 1, scaleY: 1, duration: 90 });
    });
    bg.on('pointerdown', () => bg.setFillStyle(color & 0xbbbbbb));
    bg.on('pointerup', callback);
  }
}
