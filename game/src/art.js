// Small drawing primitives and the food icons. Everything is painted from
// paths: the game ships no images, fonts or audio files and loads nothing.

import { INGREDIENTS, PALETTE } from './config.js';

/** A rounded rectangle path that works in every current desktop browser. */
export function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

/** Fill a rounded rectangle, optionally with a stroke. */
export function fillRound(ctx, x, y, w, h, r, fill, stroke = null, width = 1) {
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.stroke();
  }
}

/** Text with a dark halo so it stays legible over a busy counter. */
export function text(ctx, value, x, y, size, color, opts = {}) {
  const { align = 'left', weight = 700, halo = null, baseline = 'alphabetic', spacing = 0 } = opts;
  ctx.save();
  ctx.font = `${weight} ${size}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  if (spacing && ctx.letterSpacing !== undefined) ctx.letterSpacing = `${spacing}px`;
  if (halo) {
    ctx.lineWidth = Math.max(2, size * 0.12);
    ctx.strokeStyle = halo;
    ctx.lineJoin = 'round';
    ctx.strokeText(value, x, y);
  }
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
  ctx.restore();
}

/** A polyline through the given points. */
export function strokePath(ctx, points, color, width, close = false) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i][0], points[i][1]);
  if (close) ctx.closePath();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.restore();
}

/** A five-point sparkle. */
export function sparkle(ctx, x, y, r, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 8; i += 1) {
    const angle = -Math.PI / 2 + i * Math.PI / 4;
    const radius = i % 2 === 0 ? r : r * 0.3;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** A tiny heart used for the remaining lives. */
export function heart(ctx, x, y, size, filled) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 20, size / 20);
  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.bezierCurveTo(-16, -4, -10, -16, 0, -8);
  ctx.bezierCurveTo(10, -16, 16, -4, 0, 6);
  ctx.closePath();
  ctx.fillStyle = filled ? '#ff5d5d' : 'rgba(255,255,255,0.12)';
  ctx.fill();
  ctx.strokeStyle = filled ? '#ffd0c4' : 'rgba(255,255,255,0.28)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

/**
 * Draw one ingredient as a small piece of food. `chopped` breaks it into
 * bite-size pieces, which is how the board shows a dish mid-assembly.
 */
export function drawIngredient(ctx, id, x, y, size, chopped = false) {
  const info = INGREDIENTS[id];
  if (!info) return;
  const s = size / 24;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.lineJoin = 'round';

  if (chopped) {
    const pieces = [
      [-7, 2, 7], [2, -2, 6], [8, 4, 5], [-2, 7, 5],
    ];
    for (let i = 0; i < pieces.length; i += 1) {
      const [px, py, r] = pieces[i];
      ctx.beginPath();
      ctx.ellipse(px, py, r, r * 0.62, i * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 ? info.dark : info.color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(12,18,24,0.45)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  if (id === 'tomato') {
    ctx.beginPath();
    ctx.arc(0, 2, 10, 0, Math.PI * 2);
    ctx.fillStyle = info.color;
    ctx.fill();
    ctx.strokeStyle = info.dark;
    ctx.lineWidth = 2;
    ctx.stroke();
    strokePath(ctx, [[-6, -3], [-2, 1], [3, -2], [7, 2]], '#ffb3a0', 2);
    ctx.fillStyle = '#4faa63';
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.ellipse(i * 4, -8, 4, 2.2, i * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'mushroom') {
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.quadraticCurveTo(-8, -11, 0, -11);
    ctx.quadraticCurveTo(9, -11, 10, 0);
    ctx.closePath();
    ctx.fillStyle = info.color;
    ctx.fill();
    ctx.strokeStyle = info.dark;
    ctx.lineWidth = 2;
    ctx.stroke();
    fillRound(ctx, -4, -1, 8, 11, 3, '#f0dfc4', info.dark, 1.5);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.arc(-3, -5, 2, 0, Math.PI * 2);
    ctx.arc(4, -4, 1.6, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'noodle') {
    strokePath(ctx, [[-10, -7], [9, -7]], '#c99b25', 5);
    strokePath(ctx, [[-10, -7], [9, -7]], info.color, 3);
    strokePath(ctx, [[-10, -1], [8, -1]], '#c99b25', 5);
    strokePath(ctx, [[-10, -1], [8, -1]], info.color, 3);
    strokePath(ctx, [[-9, 5], [10, 5]], '#c99b25', 5);
    strokePath(ctx, [[-9, 5], [10, 5]], info.color, 3);
  } else if (id === 'chili') {
    ctx.beginPath();
    ctx.moveTo(-9, -6);
    ctx.quadraticCurveTo(8, -10, 10, 4);
    ctx.quadraticCurveTo(9, 11, 2, 10);
    ctx.quadraticCurveTo(-4, 9, -3, 3);
    ctx.quadraticCurveTo(-2, -1, -9, -6);
    ctx.closePath();
    ctx.fillStyle = info.color;
    ctx.fill();
    ctx.strokeStyle = info.dark;
    ctx.lineWidth = 2;
    ctx.stroke();
    strokePath(ctx, [[-9, -6], [-12, -10]], '#4faa63', 3);
  } else if (id === 'egg') {
    ctx.beginPath();
    ctx.ellipse(0, 1, 12, 9, 0, 0, Math.PI * 2);
    ctx.fillStyle = info.color;
    ctx.fill();
    ctx.strokeStyle = info.dark;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(1, 0, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#f2a93b';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-1, -2, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fill();
  } else if (id === 'herb') {
    strokePath(ctx, [[0, 10], [0, -7]], '#2e8a4d', 2.5);
    ctx.fillStyle = info.color;
    ctx.beginPath();
    ctx.ellipse(-5, -4, 5, 2.8, -0.6, 0, Math.PI * 2);
    ctx.ellipse(5, -4, 5, 2.8, 0.6, 0, Math.PI * 2);
    ctx.ellipse(-4, 3, 4.5, 2.5, -0.5, 0, Math.PI * 2);
    ctx.ellipse(4, 3, 4.5, 2.5, 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** A finished plate: rim, sauce, food and an optional green readiness glow. */
export function drawPlate(ctx, x, y, radius, items, ready = false) {
  ctx.save();
  if (ready) {
    ctx.shadowColor = '#4fd18b';
    ctx.shadowBlur = 20;
  }
  ctx.beginPath();
  ctx.arc(x, y + 4, radius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#f7f4e8';
  ctx.fill();
  ctx.strokeStyle = '#c9d2d8';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.72, 0, Math.PI * 2);
  ctx.strokeStyle = '#dfe5e8';
  ctx.lineWidth = 2;
  ctx.stroke();

  const count = items.length;
  for (let i = 0; i < count; i += 1) {
    const angle = -Math.PI / 2 + (i * Math.PI * 2) / Math.max(count, 1);
    const dist = count === 1 ? 0 : radius * 0.38;
    drawIngredient(ctx, items[i], x + Math.cos(angle) * dist, y + Math.sin(angle) * dist, radius * 0.72, false);
  }
  if (count === 0) {
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = '#e4e8e8';
    ctx.fill();
  }
  ctx.restore();
}

/** The chef: bandana, apron and mitts, sliding along the counter. */
export function drawChef(ctx, x, y, time, selected) {
  ctx.save();
  ctx.translate(x, y);
  const bob = Math.sin(time * 5) * 2;
  ctx.translate(0, bob);

  ctx.beginPath();
  ctx.ellipse(0, 30, 30, 7, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fill();

  fillRound(ctx, -18, -8, 36, 42, 10, '#f2f4ef', '#cbd6d8', 2);
  fillRound(ctx, -13, 4, 26, 28, 6, '#e4584b', '#a9332b', 2);
  ctx.fillStyle = '#ffd3b1';
  ctx.beginPath();
  ctx.arc(0, -18, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2a3945';
  ctx.beginPath();
  ctx.arc(-5, -19, 1.8, 0, Math.PI * 2);
  ctx.arc(5, -19, 1.8, 0, Math.PI * 2);
  ctx.fill();
  strokePath(ctx, [[-4, -12], [0, -10], [4, -12]], '#a86a50', 1.6);

  fillRound(ctx, -17, -34, 34, 14, 6, '#fff8e7', '#cfd9d9', 2);
  fillRound(ctx, -13, -39, 26, 9, 4, '#fff8e7', '#cfd9d9', 2);
  fillRound(ctx, -16, -27, 32, 5, 2, '#e4584b');

  ctx.fillStyle = '#ffd3b1';
  ctx.beginPath();
  ctx.arc(-22, -2, 6, 0, Math.PI * 2);
  ctx.arc(22, -2, 6, 0, Math.PI * 2);
  ctx.fill();
  fillRound(ctx, -29, -2, 12, 12, 4, '#4fd18b', '#278e5b', 1.5);
  fillRound(ctx, 17, -2, 12, 12, 4, '#4fd18b', '#278e5b', 1.5);

  if (selected) {
    text(ctx, selected.toUpperCase(), 0, 57, 12, PALETTE.neon, { align: 'center', halo: '#0b1219', weight: 800 });
  }
  ctx.restore();
}

/** Three curls of steam; the phase decides how lively they are. */
export function drawSteam(ctx, x, y, time, phase) {
  const lively = phase === 'cooking' ? 1 : phase === 'cooked' ? 0.5 : 0.15;
  ctx.save();
  ctx.strokeStyle = `rgba(220,240,245,${0.3 + lively * 0.35})`;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i += 1) {
    const ox = x + (i - 1) * 13;
    const sway = Math.sin(time * 2.4 + i * 1.3) * 6 * lively;
    ctx.beginPath();
    ctx.moveTo(ox, y);
    ctx.bezierCurveTo(ox - 8 + sway, y - 14, ox + 9 + sway, y - 25, ox + sway, y - 42);
    ctx.stroke();
  }
  ctx.restore();
}
