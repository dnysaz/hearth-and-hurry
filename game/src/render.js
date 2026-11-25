// The canvas renderer. It paints the whole kitchen from paths: tile wall,
// ticket rail, ingredient crates, board, stove, pass, chef and the effects.

import { FIELD, INGREDIENTS, PALETTE, RECIPES, STATIONS } from './config.js';
import { drawChef, drawIngredient, drawPlate, drawSteam, fillRound, heart, roundRect, sparkle, strokePath, text } from './art.js';
import { nearestStation } from './world.js';
import { recipeOf } from './orders.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

/** How much of a ticket's bar is left, colour-coded for a rising panic. */
function timerColor(ratio) {
  if (ratio > 0.5) return PALETTE.good;
  if (ratio > 0.24) return PALETTE.neon;
  return PALETTE.hot;
}

/** The tiled wall, hood, lamps and floor behind the counter. */
function drawBackdrop(ctx, state) {
  ctx.fillStyle = PALETTE.night;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);

  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 80, FIELD.width, 360);
  ctx.strokeStyle = 'rgba(98,214,232,0.14)';
  ctx.lineWidth = 2;
  for (let x = 0; x <= FIELD.width; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 80);
    ctx.lineTo(x, 440);
    ctx.stroke();
  }
  for (let y = 80; y <= 440; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(FIELD.width, y);
    ctx.stroke();
  }

  // Copper range hood over the stove.
  ctx.fillStyle = '#374b55';
  ctx.beginPath();
  ctx.moveTo(860, 80);
  ctx.lineTo(1090, 80);
  ctx.lineTo(1050, 160);
  ctx.lineTo(900, 160);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#7f98a5';
  ctx.lineWidth = 3;
  ctx.stroke();
  fillRound(ctx, 885, 152, 180, 16, 6, '#8fa7b4', '#c4d3da', 2);

  // Warm hanging lamps.
  for (const x of [420, 650, 1200]) {
    strokePath(ctx, [[x, 80], [x, 148]], '#536779', 3);
    ctx.fillStyle = '#ffb347';
    ctx.beginPath();
    ctx.arc(x, 162, 13, 0, Math.PI * 2);
    ctx.fill();
    const glow = ctx.createRadialGradient(x, 162, 6, x, 162, 90);
    glow.addColorStop(0, 'rgba(255,179,71,0.22)');
    glow.addColorStop(1, 'rgba(255,179,71,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - 90, 72, 180, 180);
  }

  ctx.fillStyle = '#25343b';
  ctx.fillRect(0, 440, FIELD.width, 280);
  ctx.fillStyle = '#2f4148';
  ctx.fillRect(0, 440, FIELD.width, 12);
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 2;
  for (let x = 0; x <= FIELD.width; x += 96) {
    ctx.beginPath();
    ctx.moveTo(x, 452);
    ctx.lineTo(x - 30, 720);
    ctx.stroke();
  }
}

/** The left rail: paper tickets with recipe icons and large countdown bars. */
function drawOrderRail(ctx, state) {
  fillRound(ctx, 18, 104, 258, 596, 18, '#1b2a31', '#3e5a63', 3);
  text(ctx, 'ORDER RAIL', 147, 142, 24, PALETTE.neon, { align: 'center', weight: 900, spacing: 2 });
  strokePath(ctx, [[40, 156], [254, 156]], '#4b6670', 2);

  const tickets = state.orders.slice(0, 3);
  for (let i = 0; i < tickets.length; i += 1) {
    drawTicket(ctx, tickets[i], 38, 174 + i * 158, 218, 142);
  }
  text(ctx, 'CLICK A TICKET TO FOCUS  ·  TAB CYCLES', 147, 674, 12, PALETTE.muted, { align: 'center', weight: 700 });
}

/** One paper ticket. The timer is intentionally huge for the tiny contact sheet. */
function drawTicket(ctx, order, x, y, w, h) {
  const recipe = recipeOf(order);
  const ratio = Math.max(0, Math.min(1, order.remaining / order.total));
  const urgent = ratio < 0.24;
  const pulse = urgent ? 0.55 + 0.45 * Math.sin(order.remaining * 9) : 1;

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 5;
  fillRound(ctx, x, y, w, h, 8, PALETTE.paper);
  ctx.restore();

  if (order.focus) {
    roundRect(ctx, x - 3, y - 3, w + 6, h + 6, 10);
    ctx.strokeStyle = PALETTE.cool;
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  fillRound(ctx, x + w / 2 - 32, y - 9, 64, 18, 3, 'rgba(255,179,71,0.72)');
  text(ctx, recipe.name, x + 12, y + 30, 17, PALETTE.ink, { weight: 900 });

  for (let i = 0; i < recipe.need.length; i += 1) {
    drawIngredient(ctx, recipe.need[i], x + 26 + i * 42, y + 62, 30);
  }

  const barY = y + 96;
  fillRound(ctx, x + 12, barY, w - 24, 14, 7, '#d8cfb4');
  fillRound(ctx, x + 12, barY, Math.max(6, (w - 24) * ratio), 14, 7, timerColor(ratio));

  ctx.save();
  ctx.globalAlpha = pulse;
  text(ctx, `${Math.ceil(Math.max(0, order.remaining))}s`, x + w - 14, y + 84, 26, urgent ? '#c62f24' : PALETTE.ink, {
    align: 'right',
    weight: 900,
  });
  ctx.restore();

  if (order.focus) {
    text(ctx, 'COOKING THIS', x + 12, y + 132, 11, '#3d6f78', { weight: 800 });
  }
}

/** Ingredient crates along the back counter, numbered for the keyboard. */
function drawBins(ctx, state) {
  for (const station of STATIONS.filter((s) => s.kind === 'bin')) {
    const info = INGREDIENTS[station.id];
    const x = station.x;
    const active = state.selected === station.id;
    const near = Math.abs(state.chefX - x) <= 46;
    if (active || near) {
      ctx.save();
      ctx.shadowColor = active ? PALETTE.neon : PALETTE.cool;
      ctx.shadowBlur = 18;
      fillRound(ctx, x - 42, 424, 84, 76, 10, '#4a3524');
      ctx.restore();
    }
    fillRound(ctx, x - 38, 428, 76, 68, 8, '#7d5230', '#4c301d', 3);
    fillRound(ctx, x - 38, 428, 76, 14, 6, '#a06a3c');
    drawIngredient(ctx, station.id, x, 466, 40);
    fillRound(ctx, x - 15, 496, 30, 18, 5, active ? PALETTE.neon : '#24343c', active ? '#fff0c9' : '#56707a', 1);
    text(ctx, station.key, x, 509, 13, active ? '#24343c' : '#e7f0f3', { align: 'center', weight: 900 });
    text(ctx, info.short, x, 532, 12, '#ffe1ad', { align: 'center', weight: 900 });
  }
}

/** The chopping board and the knife: this is where a dish is mid-assembly. */
function drawBoard(ctx, state) {
  const x = 850;
  fillRound(ctx, x - 104, 552, 208, 108, 14, '#6d4426', '#3d2718', 4);
  fillRound(ctx, x - 96, 560, 192, 92, 12, '#b87c46', '#7c4d2b', 3);
  strokePath(ctx, [[x - 84, 574], [x + 80, 574]], 'rgba(255,255,255,0.12)', 2);

  const items = state.board.items;
  if (items.length === 0) {
    text(ctx, 'BOARD', x, 612, 20, 'rgba(255,248,231,0.35)', { align: 'center', weight: 900 });
  } else {
    for (let i = 0; i < items.length; i += 1) {
      const px = x - 54 + i * 37;
      drawIngredient(ctx, items[i], px, 604, 38, state.board.chopped);
    }
  }

  // Knife resting at the right edge, lifted when the board is chopped.
  ctx.save();
  ctx.translate(x + 62, state.board.chopped ? 575 : 588);
  ctx.rotate(state.board.chopped ? -0.45 : -0.12);
  fillRound(ctx, -26, -6, 48, 12, 3, '#d8e3e8', '#8fa3b0', 1.5);
  fillRound(ctx, 18, -8, 24, 16, 5, '#3b4b55', '#1c2b33', 1.5);
  ctx.restore();

  fillRound(ctx, x - 60, 668, 120, 22, 8, '#1e2c34', '#4d6570', 1);
  text(ctx, `CHOP  ${items.length}/${4}${state.board.chopped ? '  ✓' : ''}`, x, 683, 12, PALETTE.neon, {
    align: 'center',
    weight: 900,
  });
}

/** Burner, pan and the sizzle state. */
function drawStove(ctx, state) {
  const x = 970;
  fillRound(ctx, x - 96, 556, 192, 112, 12, '#3a4a52', '#1d2a31', 4);
  fillRound(ctx, x - 82, 566, 164, 70, 8, '#202e35', '#5e737e', 2);

  ctx.save();
  const flame = state.pan.phase === 'cooking' ? 1 : 0.35;
  ctx.globalAlpha = 0.45 + flame * 0.5;
  ctx.fillStyle = '#ff8a3d';
  ctx.beginPath();
  ctx.moveTo(x - 42, 630);
  ctx.quadraticCurveTo(x - 30, 604, x - 22, 630);
  ctx.quadraticCurveTo(x - 10, 598, x, 630);
  ctx.quadraticCurveTo(x + 12, 604, x + 22, 630);
  ctx.quadraticCurveTo(x + 32, 606, x + 42, 630);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.beginPath();
  ctx.ellipse(x, 596, 72, 26, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#25343b';
  ctx.fill();
  ctx.strokeStyle = '#8fa3b0';
  ctx.lineWidth = 4;
  ctx.stroke();
  strokePath(ctx, [[x + 68, 594], [x + 122, 586]], '#7f96a4', 9);

  const pan = state.pan;
  if (pan.items.length > 0) {
    const cooked = pan.phase === 'cooked';
    const burnt = pan.phase === 'burnt';
    for (let i = 0; i < pan.items.length; i += 1) {
      const px = x - 34 + i * 32;
      drawIngredient(ctx, pan.items[i], px, 588, 36, cooked || burnt);
    }
    if (burnt) {
      text(ctx, 'BURNT', x, 552, 18, PALETTE.hot, { align: 'center', weight: 900, halo: '#17222e' });
    }
    drawSteam(ctx, x, 566, state.time, pan.phase);
  }

  const label = pan.phase === 'cooking' ? 'SIZZLE' : pan.phase === 'cooked' ? 'READY' : pan.phase === 'burnt' ? 'SCRAPE' : 'STOVE';
  fillRound(ctx, x - 60, 668, 120, 22, 8, '#1e2c34', '#4d6570', 1);
  text(ctx, label, x, 683, 12, pan.phase === 'burnt' ? PALETTE.hot : PALETTE.neon, { align: 'center', weight: 900 });
}

/** The pass: a ready plate with a green chip, or an empty plate waiting. */
function drawPass(ctx, state) {
  const x = 1130;
  fillRound(ctx, x - 92, 520, 184, 152, 14, '#79502f', '#402719', 4);
  fillRound(ctx, x - 84, 528, 168, 136, 10, '#a06a3c', '#684027', 2);

  if (state.ready.length > 0) {
    const plate = state.ready[0];
    drawPlate(ctx, x, 588, 52, plate.items, true);
    fillRound(ctx, x - 44, 646, 88, 24, 9, PALETTE.good, '#227a4f', 2);
    text(ctx, 'READY', x, 663, 14, '#0d2b1d', { align: 'center', weight: 900 });
    sparkle(ctx, x + 62, 554, 10, PALETTE.neon);
  } else {
    drawPlate(ctx, x, 588, 48, [], false);
    text(ctx, 'PLATE HERE', x, 660, 13, '#ffe1ad', { align: 'center', weight: 800 });
  }

  // Service bell on the corner of the pass.
  ctx.save();
  ctx.fillStyle = '#e8b54d';
  ctx.beginPath();
  ctx.arc(x + 69, 548, 15, Math.PI, 0);
  ctx.lineTo(x + 84, 552);
  ctx.lineTo(x + 54, 552);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#8f6721';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

/** A glowing ring under whichever station the chef can use right now. */
function drawStationHighlight(ctx, state) {
  const near = nearestStation(state);
  if (!near) return;
  const y = near.kind === 'bin' ? 506 : 628;
  ctx.save();
  ctx.strokeStyle = near.kind === 'pass' ? PALETTE.good : PALETTE.cool;
  ctx.lineWidth = 4;
  ctx.globalAlpha = 0.7 + 0.3 * Math.sin(state.time * 7);
  ctx.beginPath();
  ctx.ellipse(near.x, y, 48, 14, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/** Cosmetic sparks, chips, rings and steam from the real actions. */
function drawEffects(ctx, state) {
  for (const effect of state.effects) {
    const t = 1 - effect.life / 0.9;
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - t);
    if (effect.kind === 'ring') {
      ctx.strokeStyle = effect.tint;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, 8 + t * 42, 0, Math.PI * 2);
      ctx.stroke();
    } else if (effect.kind === 'steam') {
      drawSteam(ctx, effect.x, effect.y - t * 24, state.time + effect.age, 'cooking');
    } else if (effect.kind === 'chip') {
      ctx.fillStyle = effect.tint;
      ctx.fillRect(effect.x - 3 + t * 18, effect.y - 3 - t * 26, 6, 6);
    } else {
      sparkle(ctx, effect.x + t * 14, effect.y - t * 20, 6, effect.tint);
    }
    ctx.restore();
  }
}

/** Top strip: title, wave clock, score, combo and hearts. */
function drawTopBar(ctx, state, best) {
  fillRound(ctx, 0, 0, FIELD.width, 82, 0, '#101c25');
  strokePath(ctx, [[0, 82], [FIELD.width, 82]], '#3a5a64', 3);

  ctx.save();
  ctx.shadowColor = PALETTE.neon;
  ctx.shadowBlur = 16;
  text(ctx, 'HEARTH & HURRY', 30, 50, 38, PALETTE.neon, { weight: 900, spacing: 1 });
  ctx.restore();
  text(ctx, 'NIGHT SHIFT  ·  COUNTER 7', 32, 72, 13, PALETTE.muted, { weight: 700 });

  const left = Math.max(0, 240 - state.time);
  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(Math.floor(left % 60)).padStart(2, '0');
  fillRound(ctx, 500, 16, 210, 50, 12, '#1b3038', '#3d616b', 2);
  text(ctx, `WAVE ${state.wave}  ·  ${mm}:${ss}`, 605, 49, 21, PALETTE.cool, { align: 'center', weight: 900 });

  text(ctx, `SCORE  ${state.score.toLocaleString('en-US')}`, 850, 42, 24, PALETTE.cream, { align: 'right', weight: 900 });
  text(ctx, `BEST  ${best.toLocaleString('en-US')}`, 850, 66, 13, PALETTE.muted, { align: 'right', weight: 700 });

  fillRound(ctx, 886, 16, 172, 50, 12, '#1b3038', '#3d616b', 2);
  text(ctx, `x${state.combo} COMBO`, 972, 49, 21, state.combo > 3 ? PALETTE.neon : PALETTE.cream, { align: 'center', weight: 900 });
  for (let i = 0; i < 3; i += 1) heart(ctx, 1082 + i * 32, 41, 22, i < state.hearts);
  text(ctx, 'LIVES', 1188, 46, 12, PALETTE.muted, { align: 'center', weight: 800 });
}

/** The one-line shout that tells the player what just happened. */
function drawMessage(ctx, state) {
  if (state.messageTime <= 0 || !state.message) return;
  const width = Math.min(560, 100 + state.message.length * 12);
  const x = 790 - width / 2;
  ctx.save();
  ctx.globalAlpha = Math.min(1, state.messageTime * 2.5);
  fillRound(ctx, x, 92, width, 34, 12, 'rgba(13,24,31,0.88)', state.messageTint, 2);
  text(ctx, state.message, 790, 115, 16, state.messageTint, { align: 'center', weight: 900 });
  ctx.restore();
}

/** Small key legend; readable enough in the large cover frame. */
function drawLegend(ctx) {
  fillRound(ctx, 300, 686, 540, 26, 9, 'rgba(12,22,29,0.78)', '#38525d', 1);
  text(
    ctx,
    '1–6 PICK   ·   A/D WALK   ·   E ACT   ·   C CHOP   ·   V COOK   ·   B PLATE   ·   ENTER SERVE   ·   X SCRAPE',
    570,
    704,
    12,
    '#cfe0e6',
    { align: 'center', weight: 700 },
  );
}

/** Title, pause and game-over veils. Screenshots are taken in play state. */
function drawOverlay(ctx, state, screen, best) {
  if (screen === SCREEN_PLAY) return;
  ctx.save();
  ctx.fillStyle = 'rgba(7,13,18,0.78)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  const title = screen === SCREEN_TITLE ? 'HEARTH & HURRY' : screen === SCREEN_PAUSED ? 'PAUSED' : 'SHIFT OVER';
  text(ctx, title, 640, 268, 72, PALETTE.neon, { align: 'center', weight: 900, halo: '#0b1219' });
  const sub = screen === SCREEN_TITLE
    ? 'Pick, chop, cook, plate, serve. Keep the rail happy.'
    : screen === SCREEN_PAUSED
      ? 'Press P to get back to the pass.'
      : `Score ${state.score.toLocaleString('en-US')}  ·  Best ${best.toLocaleString('en-US')}  ·  ${state.served} served`;
  text(ctx, sub, 640, 330, 24, PALETTE.cream, { align: 'center', weight: 700 });
  text(ctx, 'SPACE / CLICK TO START OR RETRY', 640, 400, 18, PALETTE.cool, { align: 'center', weight: 900 });
  ctx.restore();
}

/** Build the renderer and keep its backing store matched to the window. */
export function createRenderer(canvas) {
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
  }
  resize();
  window.addEventListener('resize', resize);

  function draw(state, screen, best) {
    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = PALETTE.night;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const scale = Math.min(canvas.width / FIELD.width, canvas.height / FIELD.height);
    const ox = (canvas.width - FIELD.width * scale) / 2;
    const oy = (canvas.height - FIELD.height * scale) / 2;
    ctx.setTransform(scale, 0, 0, scale, ox, oy);

    if (state.shake > 0) ctx.translate(Math.sin(state.time * 90) * 4, 0);
    drawBackdrop(ctx, state);
    drawOrderRail(ctx, state);
    drawBins(ctx, state);
    drawBoard(ctx, state);
    drawStove(ctx, state);
    drawPass(ctx, state);
    drawStationHighlight(ctx, state);
    ctx.save();
    drawChef(ctx, state.chefX, 620, state.time, INGREDIENTS[state.selected]?.short ?? '');
    ctx.restore();
    drawEffects(ctx, state);
    drawTopBar(ctx, state, best);
    drawMessage(ctx, state);
    drawLegend(ctx);
    drawOverlay(ctx, state, screen, best);
  }

  return { draw };
}
