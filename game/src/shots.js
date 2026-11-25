// Deterministic screenshot scenes, each built by playing real rules from a
// fresh world. They exist only for taking the required screenshots; normal play
// runs main.js's fixed-step loop with a human at keyboard and mouse.
//
// ?shot=cover — kitchen, order rail, counter ingredients, dish mid-assembly, timer
// ?shot=order — three urgent tickets with countdown bars in the red
// ?shot=cook  — board mid-assembly and a pan actively sizzling
// ?shot=serve — a cooked plate at the pass, ready to ring the bell

import { RECIPES, STEP, STATIONS } from './config.js';
import { dishKey } from './orders.js';
import { createWorld, stationAction } from './world.js';
import { SCREEN_PLAY } from './render.js';

const SCENES = { cover: 0, order: 1, cook: 2, serve: 3 };

/** Move the chef to a station and perform that station's real action. */
function at(world, id) {
  const station = STATIONS.find((s) => s.id === id);
  world.state.chefX = station.x;
  world.perform(world.state, stationAction(station));
}

/** Advance the simulation with no input. */
function run(world, seconds) {
  const steps = Math.round(seconds / STEP);
  for (let i = 0; i < steps; i += 1) world.step(world.state, STEP, 0);
}

/** Select a recipe on the focused ticket so a plate can really answer it. */
function focusRecipe(world, recipeId) {
  const order = world.state.orders.find((o) => o.id === world.state.focusId) ?? world.state.orders[0];
  if (order) order.recipeId = recipeId;
}

/** Pick, chop, cook and plate a real dish, using only the game's own rules. */
function buildPlate(world, items) {
  for (const id of items) at(world, id);
  at(world, 'board');
  at(world, 'stove');
  run(world, 2.2);
  at(world, 'pass');
}

/** Paint a visual message without changing the simulation. */
function say(world, text, tint) {
  world.say(world.state, text, tint);
  world.state.messageTime = 4;
}

/** Build one staged scene from the seed. */
export function stageShot(name, seed) {
  const which = SCENES[name] ?? 0;
  const world = createWorld(seed);
  const s = world.state;
  const recipe = RECIPES[s.orders[0] ? RECIPES.findIndex((r) => r.id === s.orders[0].recipeId) : 0] ?? RECIPES[0];

  if (which === 0) {
    // A ticket's first two ingredients are on the board, chopped; the third is
    // in hand. The counter crates, order rail and timer all stay visible.
    at(world, recipe.need[0]);
    at(world, recipe.need[1]);
    at(world, 'board');
    world.perform(s, { kind: 'select', id: recipe.need[2] });
    s.chefX = 745;
    s.time = 36;
    s.score = 1640;
    s.combo = 4;
    s.orders[0].remaining = s.orders[0].total * 0.62;
    if (s.orders[1]) s.orders[1].remaining = s.orders[1].total * 0.44;
    if (s.orders[2]) s.orders[2].remaining = s.orders[2].total * 0.78;
    say(world, 'CHOPPED — TAKE TO STOVE', '#4fd18b');
  } else if (which === 1) {
    // A rail about to expire: every countdown bar is visibly in the red.
    at(world, recipe.need[0]);
    s.chefX = 470;
    s.time = 91;
    s.wave = 3;
    s.score = 3820;
    s.combo = 7;
    s.orders.forEach((order, i) => { order.remaining = order.total * (0.1 + i * 0.05); });
    world.perform(s, { kind: 'cycleFocus' });
    say(world, 'HURRY — TICKETS CLOSING', '#ff5d5d');
  } else if (which === 2) {
    // One dish is sizzling, another is mid-assembly on the board.
    const first = recipe.need.slice(0, Math.min(3, recipe.need.length));
    for (const id of first) at(world, id);
    at(world, 'board');
    at(world, 'stove');
    run(world, 1.15);
    const next = RECIPES[(RECIPES.indexOf(recipe) + 1) % RECIPES.length];
    at(world, next.need[0]);
    at(world, next.need[1]);
    s.chefX = 820;
    s.time = 72;
    s.wave = 2;
    s.score = 2460;
    s.combo = 5;
    say(world, 'SIZZLING — CHOP THE NEXT', '#ffb347');
  } else {
    // Serve one plate for a real score gain, then ready another at the pass.
    const items = [...recipe.need];
    buildPlate(world, items);
    const matching = RECIPES.find((r) => dishKey(r.need) === dishKey(items)) ?? recipe;
    focusRecipe(world, matching.id);
    world.perform(s, { kind: 'serve' });
    buildPlate(world, items);
    focusRecipe(world, matching.id);
    s.chefX = 1050;
    s.time = 143;
    s.wave = 4;
    s.score = Math.max(s.score, 5240);
    s.combo = 9;
    say(world, 'PLATED — RING THE BELL', '#4fd18b');
  }
  return { world, screen: SCREEN_PLAY };
}
