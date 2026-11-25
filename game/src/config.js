// Every recipe, ingredient and tuning number for Hearth & Hurry lives here.
// The playfield is a fixed 1280x720 stage; the renderer fits it to any window.

export const FIELD = { width: 1280, height: 720 };
export const STEP = 1 / 60;

export const SHIFT = {
  hearts: 3,
  activeOrders: 3,
  waveSeconds: 48,
  maxWave: 6,
};

export const CHEF = {
  speed: 340,
  startX: 830,
  radius: 34,
};

// Stations sit along one counter so a route is a real choice: bins on the left,
// then the board, the stove and the pass on the right.
export const STATIONS = [
  { id: 'tomato', kind: 'bin', label: 'TOMATO', key: '1', x: 330 },
  { id: 'mushroom', kind: 'bin', label: 'SHROOM', key: '2', x: 410 },
  { id: 'noodle', kind: 'bin', label: 'NOODLE', key: '3', x: 490 },
  { id: 'chili', kind: 'bin', label: 'CHILI', key: '4', x: 570 },
  { id: 'egg', kind: 'bin', label: 'EGG', key: '5', x: 650 },
  { id: 'herb', kind: 'bin', label: 'HERB', key: '6', x: 730 },
  { id: 'board', kind: 'board', label: 'CHOP', key: 'C', x: 850 },
  { id: 'stove', kind: 'stove', label: 'COOK', key: 'V', x: 970 },
  { id: 'pass', kind: 'pass', label: 'PLATE', key: 'B', x: 1130 },
];

export const INGREDIENTS = {
  tomato: { label: 'TOMATO', short: 'TOM', color: '#e8503a', dark: '#a52c22' },
  mushroom: { label: 'SHROOM', short: 'SHR', color: '#d9b38c', dark: '#8f6f52' },
  noodle: { label: 'NOODLE', short: 'NOO', color: '#f2c94c', dark: '#b58a1e' },
  chili: { label: 'CHILI', short: 'CHI', color: '#ef3b2c', dark: '#a71f18' },
  egg: { label: 'EGG', short: 'EGG', color: '#fff1c9', dark: '#d8c48d' },
  herb: { label: 'HERB', short: 'HRB', color: '#55c57a', dark: '#2e8a4d' },
};

export const RECIPES = [
  {
    id: 'ember-noodles',
    name: 'EMBER NOODLES',
    need: ['noodle', 'chili', 'herb'],
    seconds: 42,
    points: 120,
    color: '#ff8a3d',
  },
  {
    id: 'sunrise-skillet',
    name: 'SUNRISE SKILLET',
    need: ['egg', 'tomato', 'herb'],
    seconds: 44,
    points: 130,
    color: '#ffc857',
  },
  {
    id: 'mushroom-halo',
    name: 'MUSHROOM HALO',
    need: ['mushroom', 'egg', 'herb'],
    seconds: 46,
    points: 140,
    color: '#d9b38c',
  },
  {
    id: 'garden-fire',
    name: 'GARDEN FIRE',
    need: ['tomato', 'mushroom', 'chili'],
    seconds: 48,
    points: 150,
    color: '#ef5b4c',
  },
  {
    id: 'midnight-special',
    name: 'MIDNIGHT SPECIAL',
    need: ['noodle', 'egg', 'mushroom', 'chili'],
    seconds: 58,
    points: 220,
    color: '#b388ff',
  },
];

export const COOK = {
  readyAt: 2.0,
  burnAt: 4.6,
  maxBoard: 4,
};

export const PALETTE = {
  night: '#0b1219',
  wall: '#16343a',
  wallLine: '#235159',
  wood: '#a06a3c',
  woodDark: '#674026',
  steel: '#9fb3c8',
  steelDark: '#536779',
  paper: '#fff3d1',
  paperShade: '#e8d3a2',
  ink: '#17222e',
  cream: '#fff8e7',
  muted: '#95a9b8',
  neon: '#ffb347',
  hot: '#ff5d5d',
  good: '#4fd18b',
  cool: '#62d6e8',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
