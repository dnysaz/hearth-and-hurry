// Order tickets: which recipe is wanted, how long it has left, and whether a
// finished plate answers it. Timers are the pressure; focus is the route plan.

import { RECIPES, SHIFT } from './config.js';
import { pickOne } from './random.js';

/** The recipe an order names. */
export function recipeOf(order) {
  return RECIPES.find((recipe) => recipe.id === order.recipeId) ?? RECIPES[0];
}

/** A fresh ticket. Later waves shrink the clock a little and favour harder dishes. */
export function makeOrder(random, wave, id) {
  const pool = wave >= 3 ? RECIPES : RECIPES.slice(0, 4);
  const recipe = pickOne(random, pool);
  const total = Math.max(22, recipe.seconds - (wave - 1) * 3);
  return {
    id,
    recipeId: recipe.id,
    total,
    remaining: total,
    focus: false,
  };
}

/** Sort keys so ingredient order never matters when a plate is checked. */
export function dishKey(items) {
  return [...items].sort().join('+');
}

/** A plate answers a ticket only when every ingredient matches, once each. */
export function dishMatches(items, order) {
  return dishKey(items) === dishKey(recipeOf(order).need);
}

/** How generous the score is for a plate served with time still on the clock. */
export function serveQuality(order) {
  const ratio = order.remaining / order.total;
  if (ratio > 0.55) return 'perfect';
  if (ratio > 0.25) return 'good';
  return 'rushed';
}

/** Focus the oldest ticket when nothing else has been chosen. */
export function ensureFocus(state) {
  if (state.orders.length === 0) {
    state.focusId = null;
    return;
  }
  if (!state.orders.some((order) => order.id === state.focusId)) {
    state.focusId = state.orders[0].id;
  }
  for (const order of state.orders) order.focus = order.id === state.focusId;
}

/** Move the focus to the next ticket, wrapping around. */
export function cycleFocus(state) {
  if (state.orders.length === 0) return;
  const at = state.orders.findIndex((order) => order.id === state.focusId);
  state.focusId = state.orders[(at + 1) % state.orders.length].id;
  ensureFocus(state);
}

/**
 * Advance every ticket by dt. Expired tickets leave the rail and cost a heart;
 * the rail stays filled so the player always has a route to plan.
 */
export function tickOrders(state, dt, random, nextId) {
  let expired = 0;
  for (let i = state.orders.length - 1; i >= 0; i -= 1) {
    const order = state.orders[i];
    order.remaining -= dt;
    if (order.remaining <= 0) {
      state.orders.splice(i, 1);
      expired += 1;
    }
  }
  while (state.orders.length < SHIFT.activeOrders) {
    state.orders.push(makeOrder(random, state.wave, nextId()));
  }
  ensureFocus(state);
  return expired;
}
