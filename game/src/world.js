// The rules of the night shift. One chef walks the counter, a board holds a
// dish mid-assembly, a pan cooks it, the pass holds plates ready to serve, and
// the ticket rail keeps asking for the next route.

import { CHEF, COOK, SHIFT, STATIONS } from './config.js';
import { createRandom } from './random.js';
import { cycleFocus, dishMatches, ensureFocus, makeOrder, recipeOf, serveQuality, tickOrders } from './orders.js';

export const EVENT_SERVE = 1;
export const EVENT_FAIL = 2;
export const EVENT_LOSE = 4;
export const EVENT_WAVE = 8;

/** A small visual puff, spark or ring. Effects are cosmetic and never change the rules. */
function emit(state, kind, x, y, tint) {
  state.effects.push({ kind, x, y, tint, life: 0.9, age: 0 });
  if (state.effects.length > 40) state.effects.shift();
}

/** Say one thing at a time, with a short lifetime. */
function say(state, text, tint = '#fff8e7') {
  state.message = text;
  state.messageTint = tint;
  state.messageTime = 2.4;
}

/** Closest station to the chef, or null when the chef is between stations. */
export function nearestStation(state) {
  let best = null;
  let distance = Infinity;
  for (const station of STATIONS) {
    const d = Math.abs(station.x - state.chefX);
    if (d < distance) {
      distance = d;
      best = station;
    }
  }
  return distance <= 46 ? best : null;
}

/** The action a station performs when the chef reaches it. */
export function stationAction(station) {
  if (station.kind === 'bin') return { kind: 'pick', id: station.id };
  if (station.kind === 'board') return { kind: 'chop' };
  if (station.kind === 'stove') return { kind: 'cook' };
  return { kind: 'plate' };
}

/** Walk somewhere before doing the thing: this is what a click does. */
export function queueStation(state, station, action = stationAction(station)) {
  state.targetX = station.x;
  state.queued = action;
}

/** Create the whole game world. The random source is injected so shots replay. */
export function createWorld(seedOrRandom) {
  const random = typeof seedOrRandom === 'number' ? createRandom(seedOrRandom) : seedOrRandom;
  let nextOrderId = 1;
  const nextId = () => nextOrderId;

  const state = {
    time: 0,
    wave: 1,
    score: 0,
    combo: 0,
    bestCombo: 0,
    hearts: SHIFT.hearts,
    served: 0,
    missed: 0,
    chefX: CHEF.startX,
    targetX: null,
    queued: null,
    selected: 'noodle',
    board: { items: [], chopped: false },
    pan: { items: [], phase: 'idle', timer: 0 },
    ready: [],
    orders: [],
    focusId: null,
    message: 'PICK • CHOP • COOK • PLATE • SERVE',
    messageTint: '#fff8e7',
    messageTime: 3,
    effects: [],
    shake: 0,
  };

  function reset() {
    nextOrderId = 1;
    state.time = 0;
    state.wave = 1;
    state.score = 0;
    state.combo = 0;
    state.bestCombo = 0;
    state.hearts = SHIFT.hearts;
    state.served = 0;
    state.missed = 0;
    state.chefX = CHEF.startX;
    state.targetX = null;
    state.queued = null;
    state.selected = 'noodle';
    state.board = { items: [], chopped: false };
    state.pan = { items: [], phase: 'idle', timer: 0 };
    state.ready = [];
    state.orders = [];
    state.focusId = null;
    state.message = 'PICK • CHOP • COOK • PLATE • SERVE';
    state.messageTint = '#fff8e7';
    state.messageTime = 3;
    state.effects = [];
    state.shake = 0;
    for (let i = 0; i < SHIFT.activeOrders; i += 1) {
      state.orders.push(makeOrder(random, 1, nextId()));
      nextOrderId += 1;
    }
    ensureFocus(state);
  }

  /** Apply one station action. Shots call this too, so staged frames use real rules. */
  function perform(current, action) {
    let events = 0;
    if (action.kind === 'select') {
      current.selected = action.id;
      say(current, `${action.id.toUpperCase()} SELECTED`, '#62d6e8');
      return events;
    }
    if (action.kind === 'focus') {
      current.focusId = action.id;
      ensureFocus(current);
      say(current, 'TICKET FOCUSED', '#62d6e8');
      return events;
    }
    if (action.kind === 'cycleFocus') {
      cycleFocus(current);
      return events;
    }
    if (action.kind === 'pick') {
      if (current.board.chopped) {
        say(current, 'CHOP THE BOARD FIRST', '#ff5d5d');
      } else if (current.board.items.length >= COOK.maxBoard) {
        say(current, 'BOARD IS FULL', '#ff5d5d');
      } else {
        current.board.items.push(action.id);
        current.selected = action.id;
        emit(current, 'spark', 850, 548, '#ffb347');
        say(current, `${action.id.toUpperCase()} ON BOARD`, '#ffb347');
      }
      return events;
    }
    if (action.kind === 'chop') {
      if (current.board.items.length === 0) {
        say(current, 'BOARD IS EMPTY', '#ff5d5d');
      } else if (current.board.chopped) {
        say(current, 'ALREADY CHOPPED', '#ff5d5d');
      } else {
        current.board.chopped = true;
        for (let i = 0; i < 6; i += 1) emit(current, 'chip', 830 + i * 8, 545, '#fff1c9');
        say(current, 'CHOPPED — TAKE TO STOVE', '#4fd18b');
      }
      return events;
    }
    if (action.kind === 'cook') {
      if (current.pan.phase === 'burnt') {
        say(current, 'BURNT — SCRAPE WITH X', '#ff5d5d');
      } else if (current.pan.phase === 'cooking') {
        say(current, 'STILL COOKING', '#ffb347');
      } else if (current.board.items.length === 0) {
        say(current, 'NOTHING TO COOK', '#ff5d5d');
      } else if (!current.board.chopped) {
        say(current, 'CHOP FIRST', '#ff5d5d');
      } else {
        current.pan = { items: [...current.board.items], phase: 'cooking', timer: 0 };
        current.board = { items: [], chopped: false };
        for (let i = 0; i < 5; i += 1) emit(current, 'steam', 970 + i * 5, 520, '#cfe8f2');
        say(current, 'SIZZLING…', '#ffb347');
      }
      return events;
    }
    if (action.kind === 'scrape') {
      if (current.pan.phase === 'burnt') {
        current.pan = { items: [], phase: 'idle', timer: 0 };
        emit(current, 'spark', 970, 520, '#9fb3c8');
        say(current, 'PAN CLEAN — TRY AGAIN', '#62d6e8');
      } else {
        say(current, 'NOTHING TO SCRAPE', '#95a9b8');
      }
      return events;
    }
    if (action.kind === 'plate') {
      if (current.pan.phase === 'burnt') {
        say(current, 'BURNT — SCRAPE WITH X', '#ff5d5d');
      } else if (current.pan.phase === 'cooking') {
        say(current, 'WAIT FOR THE SIZZLE', '#ffb347');
      } else if (current.pan.phase === 'idle') {
        say(current, 'PAN IS EMPTY', '#ff5d5d');
      } else {
        current.ready.push({ items: [...current.pan.items], quality: 'fresh' });
        current.pan = { items: [], phase: 'idle', timer: 0 };
        emit(current, 'ring', 1130, 548, '#4fd18b');
        say(current, 'PLATED — RING THE BELL', '#4fd18b');
      }
      return events;
    }
    if (action.kind === 'serve') {
      if (current.ready.length === 0) {
        say(current, 'NO PLATE AT THE PASS', '#ff5d5d');
        return events;
      }
      const order = current.orders.find((ticket) => ticket.id === current.focusId) ?? current.orders[0];
      const plate = current.ready.shift();
      if (order && dishMatches(plate.items, order)) {
        const recipe = recipeOf(order);
        const quality = serveQuality(order);
        const factor = quality === 'perfect' ? 1.25 : quality === 'good' ? 1 : 0.8;
        const gain = Math.round(recipe.points * factor * (1 + Math.min(current.combo, 8) * 0.15));
        current.score += gain;
        current.combo += 1;
        current.bestCombo = Math.max(current.bestCombo, current.combo);
        current.served += 1;
        current.orders = current.orders.filter((ticket) => ticket.id !== order.id);
        for (let i = 0; i < 7; i += 1) emit(current, 'ring', 1130, 540, '#ffb347');
        say(current, `${quality.toUpperCase()} SERVE  +${gain}`, '#4fd18b');
        events |= EVENT_SERVE;
      } else {
        current.combo = 0;
        current.hearts -= 1;
        current.missed += 1;
        current.shake = 0.35;
        emit(current, 'chip', 1130, 540, '#ff5d5d');
        say(current, 'WRONG PLATE — HEART LOST', '#ff5d5d');
        events |= EVENT_FAIL;
      }
      while (current.orders.length < SHIFT.activeOrders) {
        current.orders.push(makeOrder(random, current.wave, nextId()));
        nextOrderId += 1;
      }
      ensureFocus(current);
      return events;
    }
    return events;
  }

  /** Advance movement, cooking, tickets and effects by one fixed step. */
  function step(current, dt, direction = 0) {
    let events = 0;
    current.time += dt;
    if (current.messageTime > 0) current.messageTime -= dt;
    if (current.shake > 0) current.shake -= dt;

    if (direction !== 0) {
      current.targetX = null;
      current.queued = null;
      current.chefX = Math.max(300, Math.min(1210, current.chefX + direction * CHEF.speed * dt));
    } else if (current.targetX !== null) {
      const delta = current.targetX - current.chefX;
      const move = Math.min(Math.abs(delta), CHEF.speed * dt);
      current.chefX += Math.sign(delta) * move;
      if (Math.abs(delta) <= move + 0.01) {
        current.chefX = current.targetX;
        current.targetX = null;
        const action = current.queued;
        current.queued = null;
        if (action) events |= perform(current, action);
      }
    }

    if (current.pan.phase === 'cooking') {
      current.pan.timer += dt;
      if (current.pan.timer >= COOK.burnAt) {
        current.pan.phase = 'burnt';
        emit(current, 'steam', 970, 510, '#6b7280');
        say(current, 'SMOKE! SCRAPE WITH X', '#ff5d5d');
        events |= EVENT_FAIL;
      } else if (current.pan.timer >= COOK.readyAt && current.pan.phase === 'cooking') {
        current.pan.phase = 'cooked';
        emit(current, 'ring', 970, 530, '#4fd18b');
        say(current, 'READY — PLATE IT', '#4fd18b');
      }
    }

    const expired = tickOrders(current, dt, random, () => {
      const id = nextOrderId;
      nextOrderId += 1;
      return id;
    });
    if (expired > 0) {
      current.hearts -= expired;
      current.combo = 0;
      current.missed += expired;
      current.shake = 0.4;
      say(current, 'ORDER LOST — HEART DOWN', '#ff5d5d');
      events |= EVENT_LOSE;
    }

    const nextWave = Math.min(SHIFT.maxWave, Math.floor(current.time / SHIFT.waveSeconds) + 1);
    if (nextWave > current.wave) {
      current.wave = nextWave;
      say(current, `WAVE ${current.wave} — FASTER TICKETS`, '#ffb347');
      events |= EVENT_WAVE;
    }

    for (let i = current.effects.length - 1; i >= 0; i -= 1) {
      const effect = current.effects[i];
      effect.age += dt;
      effect.life -= dt;
      if (effect.life <= 0) current.effects.splice(i, 1);
    }
    return events;
  }

  reset();
  return { state, reset, step, perform, say, emit };
}
