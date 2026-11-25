// Boot and the single loop. Browser frames drive a fixed 1/60 s simulation step,
// so the rules run identically at any refresh rate. Screens: title, play,
// paused, over. ?shot=cover|order|serve&seed=N stages a deterministic scene.

import { FIELD, SHIFT, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_FAIL, EVENT_LOSE, EVENT_SERVE, EVENT_WAVE, nearestStation, stationAction } from './world.js';
import { ensureFocus } from './orders.js';
import { createInput, stationAt, ACTION_CONFIRM, ACTION_PAUSE, ACTION_RESTART, ACTION_CYCLE } from './input.js';
import { createRenderer, SCREEN_TITLE, SCREEN_PLAY, SCREEN_PAUSED, SCREEN_OVER } from './render.js';
import { stageShot } from './shots.js';
import { SOUND, toggleMute, isMuted } from './audio.js';

const BEST_KEY = 'hearth-and-hurry-best';
const MAX_FRAME = 0.25;

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const renderer = createRenderer(canvas);
const params = new URLSearchParams(window.location.search);
const seed = Number(params.get('seed') ?? 4) || 4;

function readBest() {
  try { return Number(window.localStorage.getItem(BEST_KEY)) || 0; } catch { return 0; }
}
function saveBest(value) {
  try { window.localStorage.setItem(BEST_KEY, String(value)); } catch { /* storage unavailable */ }
}

let best = readBest();
let screen = SCREEN_TITLE;
let accumulator = 0;
let last = performance.now();
let staged = null;
const world = createWorld(createRandom(seed));
const state = world.state;

/** Logical stage coordinates for a browser client point. */
function toLogical(clientX, clientY) {
  const scale = Math.min(canvas.width / FIELD.width, canvas.height / FIELD.height);
  return {
    x: (clientX - (canvas.width - FIELD.width * scale) / 2) / scale,
    y: (clientY - (canvas.height - FIELD.height * scale) / 2) / scale,
  };
}

const input = createInput(canvas, toLogical);

/** What the station under the chef does right now, for E and clicks nearby. */
function nearbyAction() {
  const station = nearestStation(state);
  if (!station) {
    world.say(state, 'WALK TO A STATION FIRST', '#95a9b8');
    return null;
  }
  return stationAction(station);
}

/** A click: focus a ticket, walk to a station, or confirm a title/over screen. */
function onPointer(point) {
  if (screen !== SCREEN_PLAY) { start(); return; }
  const target = stationAt(point.x, point.y);
  if (!target) return;
  SOUND.click();
  if (target.kind === 'ticket') {
    if (state.orders[target.index]) {
      state.focusId = state.orders[target.index].id;
      ensureFocus(state);
      world.say(state, 'TICKET FOCUSED', '#62d6e8');
    }
    return;
  }
  if (target.kind === 'pass' && state.ready.length > 0) {
    // A click at the pass with a plate rings the bell after the walk.
    state.targetX = target.x;
    state.queued = { kind: 'serve' };
    return;
  }
  state.targetX = target.x;
  state.queued = stationAction(target);
}

input.onPointer(onPointer);

/** Route a keyboard action to the right simulation call. */
function onAction(action, event) {
  if (action === ACTION_CONFIRM) {
    if (screen === SCREEN_PLAY) {
      if (state.ready.length > 0) { SOUND.serve(); world.perform(state, { kind: 'serve' }); }
      else if (nearestStation(state)) { const a = nearbyAction(); if (a) world.perform(state, a); }
    } else start();
    return;
  }
  if (action === ACTION_PAUSE) {
    if (screen === SCREEN_PLAY) screen = SCREEN_PAUSED;
    else if (screen === SCREEN_PAUSED) screen = SCREEN_PLAY;
    return;
  }
  if (action === ACTION_RESTART) { start(); return; }
  if (action === ACTION_CYCLE) { if (screen === SCREEN_PLAY) world.perform(state, { kind: 'cycleFocus' }); return; }
  if (action === 'm') {
    const muted = toggleMute();
    world.say(state, muted ? 'SOUND OFF' : 'SOUND ON', '#62d6e8');
    return;
  }
  if (screen !== SCREEN_PLAY) return;

  if (action.kind === 'select') {
    SOUND.pick();
    // Number keys change the held ingredient and drop it on the board when the
    // chef is at the crate; clicking a crate queues the same thing.
    world.perform(state, { kind: 'select', id: action.id });
    if (nearestStation(state)?.id === action.id) world.perform(state, { kind: 'pick', id: action.id });
    return;
  }
  if (action.kind === 'near') {
    const candidate = nearbyAction();
    if (candidate) world.perform(state, candidate);
    return;
  }
  if (action.kind === 'chop') { SOUND.chop(); world.perform(state, { kind: 'chop' }); return; }
  if (action.kind === 'cook') { SOUND.cook(); world.perform(state, { kind: 'cook' }); return; }
  if (action.kind === 'plate') { SOUND.plate(); world.perform(state, { kind: 'plate' }); return; }
  if (action.kind === 'scrape') { world.perform(state, { kind: 'scrape' }); return; }
  void event;
}

input.onAction(onAction);

/** Start a fresh shift, keeping the same seeded random sequence. */
function start() {
  world.reset();
  screen = SCREEN_PLAY;
  accumulator = 0;
  last = performance.now();
  status.textContent = 'Night shift started. Pick, chop, cook, plate, serve.';
  if (state.focusId === null) ensureFocus(state);
}

/** Handle gameplay events from one step: sound, score and fail states. */
function handleEvents(events) {
  if (events & EVENT_SERVE) SOUND.serve();
  if (events & EVENT_WAVE) SOUND.wave();
  if (events & (EVENT_FAIL | EVENT_LOSE)) {
    SOUND.bad();
    if (state.hearts <= 0) {
      screen = SCREEN_OVER;
      if (state.score > best) { best = state.score; saveBest(best); }
    }
  }
}

/** One fixed step of the real world. */
function advance(dt) {
  const events = world.step(state, dt, screen === SCREEN_PLAY ? input.direction : 0);
  if (screen === SCREEN_PLAY) handleEvents(events);
}

/** Paint plus an accessible status line. */
function paint() {
  renderer.draw(staged ? staged.world.state : state, staged ? staged.screen : screen, best);
  if (staged) return;
  const order = state.orders.find((o) => o.id === state.focusId);
  status.textContent = screen === SCREEN_PLAY && order
    ? `Score ${state.score}. ${order.remaining.toFixed(0)} seconds for ${order.recipeId.replaceAll('-', ' ')}. ${state.hearts} lives.`
    : screen === SCREEN_OVER ? `Shift over. Score ${state.score}. Press space to retry.` : screen === SCREEN_PAUSED ? 'Paused.' : 'Title. Press space to start.';
}

/** The normal frame loop. */
function frame(now) {
  if (!staged) {
    const elapsed = Math.min(MAX_FRAME, (now - last) / 1000);
    last = now;
    accumulator += elapsed;
    while (accumulator >= STEP) { advance(STEP); accumulator -= STEP; }
  }
  paint();
  requestAnimationFrame(frame);
}

// The three staged scenes are real renders of the game code. They paint twice
// so a screenshot taken on __shotReady always sees a complete frame.
if (params.has('shot')) {
  staged = stageShot(params.get('shot'), seed);
  paint();
  paint();
  window.__shotReady = true;
} else {
  requestAnimationFrame(frame);
}

window.__game = {
  world,
  state,
  start,
  get staged() { return staged; },
  get screen() { return screen; },
  get best() { return best; },
  get muted() { return isMuted(); },
};
