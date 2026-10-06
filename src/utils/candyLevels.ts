import type { LevelTask } from '../types/game.types';

export interface LevelConfig {
  id: number;
  name: string;
  subtitle: string;
  bossName: string;
  bossAvatar: string;
  bossHP: number;
  bossShield: number;
  maxMoves: number;
  targetScore: number;
  starThresholds: [number, number, number]; // 1-star, 2-star, 3-star
  badgeColor: string;
  tasks: LevelTask[];
}

export const CANDY_LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: 'Strawberry Valley',
    subtitle: 'Harvest the Sweet Red Berries',
    bossName: 'Gummy Bear King',
    bossAvatar: '🐻',
    bossHP: 100,
    bossShield: 0,
    maxMoves: 25,
    targetScore: 2000,
    starThresholds: [1200, 2500, 4000],
    badgeColor: 'from-amber-400 to-yellow-500',
    tasks: [
      { id: 't1_1', icon: '🍓', label: 'Strawberries', target: 15, current: 0, kind: 'COLLECT_COLOR', color: 'FIRE' },
      { id: 't1_2', icon: '🍏', label: 'Green Apples', target: 10, current: 0, kind: 'COLLECT_COLOR', color: 'EARTH' },
    ],
  },
  {
    id: 2,
    name: 'Lemon Soda Falls',
    subtitle: 'Fizzy Lemon Drops',
    bossName: 'Cupcake Knight',
    bossAvatar: '🧁',
    bossHP: 140,
    bossShield: 20,
    maxMoves: 25,
    targetScore: 2800,
    starThresholds: [1800, 3200, 5000],
    badgeColor: 'from-sky-400 to-blue-600',
    tasks: [
      { id: 't2_1', icon: '🍋', label: 'Lemon Drops', target: 18, current: 0, kind: 'COLLECT_COLOR', color: 'ELECTRIC' },
      { id: 't2_2', icon: '🍬', label: 'Blue Candies', target: 15, current: 0, kind: 'COLLECT_COLOR', color: 'WATER' },
    ],
  },
  {
    id: 3,
    name: 'Rocket Mountain',
    subtitle: 'Launch Row & Col Blasters',
    bossName: 'Cocoa Dragon',
    bossAvatar: '🍫',
    bossHP: 180,
    bossShield: 35,
    maxMoves: 25,
    targetScore: 3600,
    starThresholds: [2400, 4200, 6500],
    badgeColor: 'from-amber-700 to-amber-950',
    tasks: [
      { id: 't3_1', icon: '🍇', label: 'Grape Jewels', target: 16, current: 0, kind: 'COLLECT_COLOR', color: 'SHIELD' },
      { id: 't3_2', icon: '🚀', label: 'Rocket Lasers', target: 2, current: 0, kind: 'DETONATE_ROCKET' },
    ],
  },
  {
    id: 4,
    name: 'Bombastic Jungle',
    subtitle: 'Double Tap to Detonate Bombs',
    bossName: 'Jelly Kraken',
    bossAvatar: '🐙',
    bossHP: 220,
    bossShield: 50,
    maxMoves: 30,
    targetScore: 4800,
    starThresholds: [3200, 5800, 8500],
    badgeColor: 'from-emerald-400 to-teal-600',
    tasks: [
      { id: 't4_1', icon: '🍓', label: 'Strawberries', target: 20, current: 0, kind: 'COLLECT_COLOR', color: 'FIRE' },
      { id: 't4_2', icon: '💣', label: 'Candy Bombs', target: 2, current: 0, kind: 'DETONATE_BOMB' },
    ],
  },
  {
    id: 5,
    name: 'Rainbow Disco Lagoon',
    subtitle: 'Harness the Color Bomb Magic',
    bossName: 'Empress Swirl',
    bossAvatar: '🍭',
    bossHP: 260,
    bossShield: 40,
    maxMoves: 30,
    targetScore: 6500,
    starThresholds: [4500, 8000, 12000],
    badgeColor: 'from-fuchsia-400 to-pink-600',
    tasks: [
      { id: 't5_1', icon: '🌈', label: 'Color Bomb', target: 1, current: 0, kind: 'DETONATE_COLOR_BOMB' },
      { id: 't5_2', icon: '🍬', label: 'Blue Candies', target: 22, current: 0, kind: 'COLLECT_COLOR', color: 'WATER' },
    ],
  },
  {
    id: 6,
    name: 'Citadel of Blasts',
    subtitle: 'Rockets & Bombs Havoc',
    bossName: 'Sugar Unicorn',
    bossAvatar: '🦄',
    bossHP: 300,
    bossShield: 60,
    maxMoves: 30,
    targetScore: 8000,
    starThresholds: [5500, 9500, 14000],
    badgeColor: 'from-purple-400 to-indigo-600',
    tasks: [
      { id: 't6_1', icon: '🚀', label: 'Rockets', target: 3, current: 0, kind: 'DETONATE_ROCKET' },
      { id: 't6_2', icon: '💣', label: 'Bombs', target: 2, current: 0, kind: 'DETONATE_BOMB' },
      { id: 't6_3', icon: '🍏', label: 'Apples', target: 18, current: 0, kind: 'COLLECT_COLOR', color: 'EARTH' },
    ],
  },
  {
    id: 7,
    name: 'Caramel Core Eruption',
    subtitle: 'High Score Extravaganza',
    bossName: 'Caramel Golem',
    bossAvatar: '🌋',
    bossHP: 350,
    bossShield: 70,
    maxMoves: 30,
    targetScore: 10000,
    starThresholds: [7000, 12000, 18000],
    badgeColor: 'from-orange-500 to-red-600',
    tasks: [
      { id: 't7_1', icon: '🍓', label: 'Strawberries', target: 25, current: 0, kind: 'COLLECT_COLOR', color: 'FIRE' },
      { id: 't7_2', icon: '🍋', label: 'Lemon Drops', target: 25, current: 0, kind: 'COLLECT_COLOR', color: 'ELECTRIC' },
      { id: 't7_3', icon: '🌈', label: 'Color Bomb', target: 2, current: 0, kind: 'DETONATE_COLOR_BOMB' },
    ],
  },
  {
    id: 8,
    name: 'Rainbow Galaxy Finale',
    subtitle: 'The Grandmaster Challenge',
    bossName: 'Emperor Sugar Rex',
    bossAvatar: '👑',
    bossHP: 450,
    bossShield: 80,
    maxMoves: 30,
    targetScore: 15000,
    starThresholds: [9000, 15000, 22000],
    badgeColor: 'from-rose-500 via-purple-500 to-cyan-400',
    tasks: [
      { id: 't8_1', icon: '🍓', label: 'Strawberries', target: 30, current: 0, kind: 'COLLECT_COLOR', color: 'FIRE' },
      { id: 't8_2', icon: '🍇', label: 'Grapes', target: 25, current: 0, kind: 'COLLECT_COLOR', color: 'SHIELD' },
      { id: 't8_3', icon: '🚀', label: 'Rockets', target: 3, current: 0, kind: 'DETONATE_ROCKET' },
      { id: 't8_4', icon: '💣', label: 'Bombs', target: 3, current: 0, kind: 'DETONATE_BOMB' },
    ],
  },
];

const STORAGE_KEY_UNLOCKED = 'matchstorm_unlocked_level';
const STORAGE_KEY_STARS = 'matchstorm_level_stars';
const STORAGE_KEY_SCORES = 'matchstorm_level_scores';

export const getUnlockedLevel = (): number => {
  if (typeof window === 'undefined') return 1;
  const val = localStorage.getItem(STORAGE_KEY_UNLOCKED);
  return val ? Math.max(1, parseInt(val, 10)) : 1;
};

export const getLevelStarsMap = (): Record<number, number> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STARS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const saveLevelCompletion = (levelId: number, score: number) => {
  if (typeof window === 'undefined') return;

  const level = CANDY_LEVELS.find((l) => l.id === levelId);
  let stars = 1;
  if (level) {
    if (score >= level.starThresholds[2]) stars = 3;
    else if (score >= level.starThresholds[1]) stars = 2;
  }

  // Update stars
  const starsMap = getLevelStarsMap();
  const prevStars = starsMap[levelId] || 0;
  starsMap[levelId] = Math.max(prevStars, stars);
  localStorage.setItem(STORAGE_KEY_STARS, JSON.stringify(starsMap));

  // Unlock next level
  const currentUnlocked = getUnlockedLevel();
  if (levelId >= currentUnlocked && levelId < CANDY_LEVELS.length) {
    localStorage.setItem(STORAGE_KEY_UNLOCKED, (levelId + 1).toString());
  }

  // Update high score
  try {
    const rawScores = localStorage.getItem(STORAGE_KEY_SCORES);
    const scoreMap = rawScores ? JSON.parse(rawScores) : {};
    scoreMap[levelId] = Math.max(scoreMap[levelId] || 0, score);
    localStorage.setItem(STORAGE_KEY_SCORES, JSON.stringify(scoreMap));
  } catch {}
};
