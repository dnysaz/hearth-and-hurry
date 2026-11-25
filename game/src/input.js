// Keyboard and mouse input. A key acts at the chef's current station; a click
// queues a walk to that station first, which makes the mouse a route planner.

import { INGREDIENTS, STATIONS } from './config.js';

export const ACTION_CONFIRM = 'confirm';
export const ACTION_PAUSE = 'pause';
export const ACTION_RESTART = 'restart';
export const ACTION_CYCLE = 'cycle';

/** The station under a canvas point in logical 1280x720 coordinates. */
export function stationAt(x, y) {
  if (x >= 22 && x <= 288 && y >= 168 && y <= 662) return { kind: 'ticket', index: Math.floor((y - 174) / 158) };
  for (const station of STATIONS) {
    if (station.kind === 'bin' && x >= station.x - 40 && x <= station.x + 40 && y >= 426 && y <= 540) return station;
    if (station.kind === 'board' && x >= station.x - 104 && x <= station.x + 104 && y >= 552 && y <= 670) return station;
    if (station.kind === 'stove' && x >= station.x - 96 && x <= station.x + 96 && y >= 556 && y <= 670) return station;
    if (station.kind === 'pass' && x >= station.x - 92 && x <= station.x + 92 && y >= 520 && y <= 672) return station;
  }
  if (y > 500 && x >= 300) {
    // A click anywhere on the counter near a station walks there.
    let best = null;
    let distance = Infinity;
    for (const station of STATIONS) {
      const d = Math.abs(station.x - x);
      if (d < distance) { distance = d; best = station; }
    }
    if (distance < 110) return best;
  }
  return null;
}

/** Translate a keydown into a game action, or null when it is not one. */
export function actionFor(event) {
  const key = event.key.toLowerCase();
  if (key === ' ' || key === 'enter' || key === 'spacebar') return ACTION_CONFIRM;
  if (key === 'p' || key === 'escape') return ACTION_PAUSE;
  if (key === 'r') return ACTION_RESTART;
  if (key === 'tab') return ACTION_CYCLE;
  const bin = STATIONS.find((station) => station.kind === 'bin' && station.key === key);
  if (bin) return { kind: 'select', id: bin.id };
  if (key === 'c') return { kind: 'chop' };
  if (key === 'v') return { kind: 'cook' };
  if (key === 'b') return { kind: 'plate' };
  if (key === 'x') return { kind: 'scrape' };
  if (key === 'e') return { kind: 'near' };
  if (key === 'm') return 'm';
  return null;
}

/** Held left/right keys for continuous walking. */
export function createInput(canvas, toLogical) {
  const held = { left: false, right: false };
  const handlers = { action: null, pointer: null };

  window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (key === 'a' || key === 'arrowleft') { held.left = true; event.preventDefault(); return; }
    if (key === 'd' || key === 'arrowright') { held.right = true; event.preventDefault(); return; }
    if (key === 'tab') event.preventDefault();
    const action = actionFor(event);
    if (action && handlers.action) handlers.action(action, event);
  });
  window.addEventListener('keyup', (event) => {
    const key = event.key.toLowerCase();
    if (key === 'a' || key === 'arrowleft') held.left = false;
    if (key === 'd' || key === 'arrowright') held.right = false;
  });
  window.addEventListener('blur', () => { held.left = false; held.right = false; });

  canvas.addEventListener('pointerdown', (event) => {
    const point = toLogical(event.clientX, event.clientY);
    if (handlers.pointer) handlers.pointer(point, event);
  });

  return {
    get direction() { return (held.right ? 1 : 0) - (held.left ? 1 : 0); },
    onAction(fn) { handlers.action = fn; },
    onPointer(fn) { handlers.pointer = fn; },
  };
}

/** The ingredient a number key selects, if any. */
export function ingredientFor(key) {
  const station = STATIONS.find((s) => s.kind === 'bin' && s.key === key);
  return station ? INGREDIENTS[station.id] : null;
}
