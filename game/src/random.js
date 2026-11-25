// A tiny seeded generator: the same seed gives the same orders, sparks and
// steam, so a screenshot scene can be replayed exactly.

/** mulberry32: fast, deterministic and good enough for a game's cosmetic luck. */
export function createRandom(seed) {
  let value = seed >>> 0;
  function next() {
    value = (value + 0x6d2b79f5) >>> 0;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  return { next };
}

/** An integer in [min, max), never depending on Math.random. */
export function between(random, min, max) {
  return min + Math.floor(random.next() * (max - min));
}

/** One item from a non-empty array. */
export function pickOne(random, list) {
  return list[between(random, 0, list.length)];
}
