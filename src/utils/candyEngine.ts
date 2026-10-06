import type { BoardGrid, ElementType, SpecialType, Tile } from '../types/game.types';

export const CANDY_ELEMENTS: ElementType[] = ['FIRE', 'WATER', 'EARTH', 'ELECTRIC', 'SHIELD'];

export const createTile = (row: number, col: number, type?: ElementType, special?: SpecialType): Tile => ({
  id: `tile_${row}_${col}_${Math.random().toString(36).substring(2, 9)}`,
  type: type || CANDY_ELEMENTS[Math.floor(Math.random() * CANDY_ELEMENTS.length)],
  row,
  col,
  special,
});

/**
 * Checks if placing a candidate type at (r, c) would form an immediate 3-match
 * with already-placed tiles to the left or above.
 */
const createsInitialMatch = (board: (ElementType | null)[][], r: number, c: number, candidate: ElementType): boolean => {
  if (c >= 2 && board[r][c - 1] === candidate && board[r][c - 2] === candidate) {
    return true;
  }
  if (r >= 2 && board[r - 1][c] === candidate && board[r - 2][c] === candidate) {
    return true;
  }
  return false;
};

/**
 * Generates an initial 8x8 Candy Crush board with NO pre-existing 3-matches.
 */
export const generateCleanBoard = (): BoardGrid => {
  const typeGrid: (ElementType | null)[][] = Array.from({ length: 8 }, () => Array(8).fill(null));
  const board: BoardGrid = [];

  for (let r = 0; r < 8; r++) {
    const row: (Tile | null)[] = [];
    for (let c = 0; c < 8; c++) {
      const shuffled = [...CANDY_ELEMENTS].sort(() => Math.random() - 0.5);
      let chosen = shuffled[0];
      for (const candidate of shuffled) {
        if (!createsInitialMatch(typeGrid, r, c, candidate)) {
          chosen = candidate;
          break;
        }
      }
      typeGrid[r][c] = chosen;
      row.push(createTile(r, c, chosen));
    }
    board.push(row);
  }

  return board;
};

export interface MatchGroupInfo {
  coords: { row: number; col: number }[];
  type: ElementType;
  orientation: 'H' | 'V';
  length: number;
}

export interface MatchScanResult {
  matchedKeys: Set<string>; // "row,col"
  createdSpecials: Map<string, { special: SpecialType; type: ElementType }>; // key -> special to spawn
  rocketRows: number[];
  rocketCols: number[];
  bombPositions: { row: number; col: number }[];
  colorBombsBlasted: number;
}

/**
 * Scans the board for 3, 4, and 5-in-a-row matches and detects Special Candy creation
 * (5 in a line -> Color Bomb, 4 in a line -> Rocket, L/T -> Bomb).
 */
export const findMatchesWithSpecials = (
  grid: BoardGrid,
  swapPivot?: { row: number; col: number }
): MatchScanResult => {
  const matchedKeys = new Set<string>();
  const createdSpecials = new Map<string, { special: SpecialType; type: ElementType }>();
  const groups: MatchGroupInfo[] = [];

  // 1. Horizontal scan
  for (let r = 0; r < 8; r++) {
    let matchLen = 1;
    for (let c = 0; c < 8; c++) {
      const current = grid[r][c]?.type;
      const next = c < 7 ? grid[r][c + 1]?.type : null;

      if (current && next && current === next) {
        matchLen++;
      } else {
        if (matchLen >= 3 && current) {
          const coords: { row: number; col: number }[] = [];
          for (let k = 0; k < matchLen; k++) {
            coords.push({ row: r, col: c - k });
            matchedKeys.add(`${r},${c - k}`);
          }
          groups.push({ coords, type: current, orientation: 'H', length: matchLen });
        }
        matchLen = 1;
      }
    }
  }

  // 2. Vertical scan
  for (let c = 0; c < 8; c++) {
    let matchLen = 1;
    for (let r = 0; r < 8; r++) {
      const current = grid[r][c]?.type;
      const next = r < 7 ? grid[r + 1][c]?.type : null;

      if (current && next && current === next) {
        matchLen++;
      } else {
        if (matchLen >= 3 && current) {
          const coords: { row: number; col: number }[] = [];
          for (let k = 0; k < matchLen; k++) {
            coords.push({ row: r - k, col: c });
            matchedKeys.add(`${r - k},${c}`);
          }
          groups.push({ coords, type: current, orientation: 'V', length: matchLen });
        }
        matchLen = 1;
      }
    }
  }

  // 3. Determine if any specials are created from matches
  for (const group of groups) {
    // Decide pivot position where the special candy should appear
    let pivot = group.coords[0];
    if (swapPivot) {
      const found = group.coords.find((coord) => coord.row === swapPivot.row && coord.col === swapPivot.col);
      if (found) pivot = found;
      else pivot = group.coords[Math.floor(group.coords.length / 2)];
    } else {
      pivot = group.coords[Math.floor(group.coords.length / 2)];
    }

    const key = `${pivot.row},${pivot.col}`;

    if (group.length >= 5) {
      // 5 in a row -> Rainbow COLOR BOMB!
      createdSpecials.set(key, { special: 'COLOR_BOMB', type: group.type });
    } else if (group.length === 4) {
      // 4 in a row -> Rocket!
      const rocketSpecial: SpecialType = group.orientation === 'H' ? 'COL_ROCKET' : 'ROW_ROCKET';
      createdSpecials.set(key, { special: rocketSpecial, type: group.type });
    }
  }

  // 4. Check for L or T shape intersections (Wrapped Candy / Bomb)
  const hCoords = new Set(groups.filter((g) => g.orientation === 'H').flatMap((g) => g.coords.map((c) => `${c.row},${c.col}`)));
  const vCoords = new Set(groups.filter((g) => g.orientation === 'V').flatMap((g) => g.coords.map((c) => `${c.row},${c.col}`)));

  for (const hKey of hCoords) {
    if (vCoords.has(hKey)) {
      const [r, c] = hKey.split(',').map(Number);
      const existing = grid[r][c];
      if (existing) {
        createdSpecials.set(hKey, { special: 'BOMB', type: existing.type });
      }
    }
  }

  // 5. Check if any matched tiles were ALREADY special candies (Rockets, Bombs, Color Bombs) and expand destruction
  const rocketRows: number[] = [];
  const rocketCols: number[] = [];
  const bombPositions: { row: number; col: number }[] = [];
  let colorBombsBlasted = 0;

  const queue = Array.from(matchedKeys);
  const processed = new Set<string>();

  while (queue.length > 0) {
    const key = queue.shift()!;
    if (processed.has(key)) continue;
    processed.add(key);

    const [r, c] = key.split(',').map(Number);
    const tile = grid[r]?.[c];
    if (!tile || !tile.special) continue;

    if (tile.special === 'ROW_ROCKET') {
      rocketRows.push(r);
      for (let col = 0; col < 8; col++) {
        const k = `${r},${col}`;
        matchedKeys.add(k);
        if (!processed.has(k)) queue.push(k);
      }
    } else if (tile.special === 'COL_ROCKET') {
      rocketCols.push(c);
      for (let row = 0; row < 8; row++) {
        const k = `${row},${c}`;
        matchedKeys.add(k);
        if (!processed.has(k)) queue.push(k);
      }
    } else if (tile.special === 'BOMB') {
      bombPositions.push({ row: r, col: c });
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            const k = `${nr},${nc}`;
            matchedKeys.add(k);
            if (!processed.has(k)) queue.push(k);
          }
        }
      }
    } else if (tile.special === 'COLOR_BOMB') {
      colorBombsBlasted++;
      // Cascade-triggered color bomb clears the most common candy type on board
      const counts: Record<string, number> = {};
      for (let cr = 0; cr < 8; cr++) {
        for (let cc = 0; cc < 8; cc++) {
          const cand = grid[cr]?.[cc];
          if (cand && !cand.special) counts[cand.type] = (counts[cand.type] || 0) + 1;
        }
      }
      const topColor = (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] as ElementType) || 'FIRE';
      for (let cr = 0; cr < 8; cr++) {
        for (let cc = 0; cc < 8; cc++) {
          if (grid[cr]?.[cc]?.type === topColor) {
            const k = `${cr},${cc}`;
            matchedKeys.add(k);
            if (!processed.has(k)) queue.push(k);
          }
        }
      }
    }
  }

  return { matchedKeys, createdSpecials, rocketRows, rocketCols, bombPositions, colorBombsBlasted };
};

export interface SpecialSwapResult {
  isSpecialSwap: boolean;
  clearedKeys: Set<string>;
  laserRows: number[];
  laserCols: number[];
  bombBursts: { row: number; col: number }[];
  isRainbowLightning: boolean;
  phrase: string;
  rocketsBlasted: number;
  bombsBlasted: number;
  colorBombsBlasted: number;
  soundType: 'swap' | 'rocket' | 'bomb' | 'colorBomb';
}

/**
 * Handles swapping when one or both candies are Special Candies
 * (Color Bomb, Rocket, Bomb), triggering explosive combos!
 */
export const executeSpecialSwap = (
  grid: BoardGrid,
  posA: { row: number; col: number },
  posB: { row: number; col: number }
): SpecialSwapResult => {
  const tileA = grid[posA.row]?.[posA.col];
  const tileB = grid[posB.row]?.[posB.col];

  if (!tileA || !tileB || (!tileA.special && !tileB.special)) {
    return {
      isSpecialSwap: false,
      clearedKeys: new Set(),
      laserRows: [],
      laserCols: [],
      bombBursts: [],
      isRainbowLightning: false,
      phrase: '',
      rocketsBlasted: 0,
      bombsBlasted: 0,
      colorBombsBlasted: 0,
      soundType: 'swap',
    };
  }

  const clearedKeys = new Set<string>();
  clearedKeys.add(`${posA.row},${posA.col}`);
  clearedKeys.add(`${posB.row},${posB.col}`);

  // 1. DOUBLE COLOR BOMB: Wipes the entire board!
  if (tileA.special === 'COLOR_BOMB' && tileB.special === 'COLOR_BOMB') {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        clearedKeys.add(`${r},${c}`);
      }
    }
    return {
      isSpecialSwap: true,
      clearedKeys,
      laserRows: [],
      laserCols: [],
      bombBursts: [{ row: posB.row, col: posB.col }],
      isRainbowLightning: true,
      phrase: '🌈 DOUBLE COLOR BOMB DISCO! 🌟',
      rocketsBlasted: 0,
      bombsBlasted: 0,
      colorBombsBlasted: 2,
      soundType: 'colorBomb',
    };
  }

  // 2. COLOR BOMB + ROCKET: Turns all tiles of that color into rockets & blasts!
  if (
    (tileA.special === 'COLOR_BOMB' && (tileB.special === 'ROW_ROCKET' || tileB.special === 'COL_ROCKET')) ||
    (tileB.special === 'COLOR_BOMB' && (tileA.special === 'ROW_ROCKET' || tileA.special === 'COL_ROCKET'))
  ) {
    const rocketTile = tileA.special === 'COLOR_BOMB' ? tileB : tileA;
    const laserRows: number[] = [];
    const laserCols: number[] = [];
    let converted = 0;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (grid[r]?.[c]?.type === rocketTile.type) {
          converted++;
          laserRows.push(r);
          laserCols.push(c);
          for (let col = 0; col < 8; col++) clearedKeys.add(`${r},${col}`);
          for (let row = 0; row < 8; row++) clearedKeys.add(`${row},${c}`);
        }
      }
    }

    return {
      isSpecialSwap: true,
      clearedKeys,
      laserRows,
      laserCols,
      bombBursts: [],
      isRainbowLightning: true,
      phrase: '🚀🌈 SUPER ROCKET STORM! ⚡',
      rocketsBlasted: Math.max(1, converted),
      bombsBlasted: 0,
      colorBombsBlasted: 1,
      soundType: 'colorBomb',
    };
  }

  // 3. COLOR BOMB + BOMB: Turns all tiles of that color into bombs & blasts!
  if (
    (tileA.special === 'COLOR_BOMB' && tileB.special === 'BOMB') ||
    (tileB.special === 'COLOR_BOMB' && tileA.special === 'BOMB')
  ) {
    const bombTile = tileA.special === 'COLOR_BOMB' ? tileB : tileA;
    const bombBursts: { row: number; col: number }[] = [];
    let converted = 0;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (grid[r]?.[c]?.type === bombTile.type) {
          converted++;
          bombBursts.push({ row: r, col: c });
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) clearedKeys.add(`${nr},${nc}`);
            }
          }
        }
      }
    }

    return {
      isSpecialSwap: true,
      clearedKeys,
      laserRows: [],
      laserCols: [],
      bombBursts,
      isRainbowLightning: true,
      phrase: '💣🌈 COLOR BOMB APOCALYPSE! 💥',
      rocketsBlasted: 0,
      bombsBlasted: Math.max(1, converted),
      colorBombsBlasted: 1,
      soundType: 'colorBomb',
    };
  }

  // 4. COLOR BOMB + NORMAL CANDY: Clears all of that candy's color
  if (tileA.special === 'COLOR_BOMB' || tileB.special === 'COLOR_BOMB') {
    const targetTile = tileA.special === 'COLOR_BOMB' ? tileB : tileA;
    const targetType = targetTile.type;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (grid[r]?.[c]?.type === targetType) {
          clearedKeys.add(`${r},${c}`);
        }
      }
    }

    return {
      isSpecialSwap: true,
      clearedKeys,
      laserRows: [],
      laserCols: [],
      bombBursts: [],
      isRainbowLightning: true,
      phrase: '🌈 COLOR BOMB BLAST! ⚡',
      rocketsBlasted: 0,
      bombsBlasted: 0,
      colorBombsBlasted: 1,
      soundType: 'colorBomb',
    };
  }

  // 5. ROCKET + ROCKET: Cross Laser (Entire row and column)
  const isRocketA = tileA.special === 'ROW_ROCKET' || tileA.special === 'COL_ROCKET';
  const isRocketB = tileB.special === 'ROW_ROCKET' || tileB.special === 'COL_ROCKET';

  if (isRocketA && isRocketB) {
    for (let c = 0; c < 8; c++) clearedKeys.add(`${posB.row},${c}`);
    for (let r = 0; r < 8; r++) clearedKeys.add(`${r},${posB.col}`);

    return {
      isSpecialSwap: true,
      clearedKeys,
      laserRows: [posB.row],
      laserCols: [posB.col],
      bombBursts: [],
      isRainbowLightning: false,
      phrase: '🚀 CROSS LASER BLAST! ⚡',
      rocketsBlasted: 2,
      bombsBlasted: 0,
      colorBombsBlasted: 0,
      soundType: 'rocket',
    };
  }

  // 6. ROCKET + BOMB: Giant 3-row & 3-column laser beam!
  if ((isRocketA && tileB.special === 'BOMB') || (isRocketB && tileA.special === 'BOMB')) {
    const laserRows: number[] = [];
    const laserCols: number[] = [];

    for (let dr = -1; dr <= 1; dr++) {
      const r = posB.row + dr;
      if (r >= 0 && r < 8) {
        laserRows.push(r);
        for (let c = 0; c < 8; c++) clearedKeys.add(`${r},${c}`);
      }
    }
    for (let dc = -1; dc <= 1; dc++) {
      const c = posB.col + dc;
      if (c >= 0 && c < 8) {
        laserCols.push(c);
        for (let r = 0; r < 8; r++) clearedKeys.add(`${r},${c}`);
      }
    }

    return {
      isSpecialSwap: true,
      clearedKeys,
      laserRows,
      laserCols,
      bombBursts: [{ row: posB.row, col: posB.col }],
      isRainbowLightning: false,
      phrase: '🚀💣 MEGA CROSS BEAM! 💥',
      rocketsBlasted: 1,
      bombsBlasted: 1,
      colorBombsBlasted: 0,
      soundType: 'bomb',
    };
  }

  // 7. BOMB + BOMB: Giant 5x5 Mega Explosion!
  if (tileA.special === 'BOMB' && tileB.special === 'BOMB') {
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        const nr = posB.row + dr;
        const nc = posB.col + dc;
        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) clearedKeys.add(`${nr},${nc}`);
      }
    }

    return {
      isSpecialSwap: true,
      clearedKeys,
      laserRows: [],
      laserCols: [],
      bombBursts: [{ row: posB.row, col: posB.col }],
      isRainbowLightning: false,
      phrase: '💥 MEGA BOMB BLAST! 💥',
      rocketsBlasted: 0,
      bombsBlasted: 2,
      colorBombsBlasted: 0,
      soundType: 'bomb',
    };
  }

  // 8. ROCKET + NORMAL CANDY: Swap and fire the rocket immediately!
  if (isRocketA || isRocketB) {
    const rocket = isRocketA ? tileA : tileB;
    const isRow = rocket.special === 'ROW_ROCKET';
    const laserRows = isRow ? [posB.row] : [];
    const laserCols = !isRow ? [posB.col] : [];

    if (isRow) {
      for (let c = 0; c < 8; c++) clearedKeys.add(`${posB.row},${c}`);
    } else {
      for (let r = 0; r < 8; r++) clearedKeys.add(`${r},${posB.col}`);
    }

    return {
      isSpecialSwap: true,
      clearedKeys,
      laserRows,
      laserCols,
      bombBursts: [],
      isRainbowLightning: false,
      phrase: '🚀 ROCKET LASER! ⚡',
      rocketsBlasted: 1,
      bombsBlasted: 0,
      colorBombsBlasted: 0,
      soundType: 'rocket',
    };
  }

  // 9. BOMB + NORMAL CANDY: Swap and detonate the 3x3 bomb!
  if (tileA.special === 'BOMB' || tileB.special === 'BOMB') {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = posB.row + dr;
        const nc = posB.col + dc;
        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) clearedKeys.add(`${nr},${nc}`);
      }
    }

    return {
      isSpecialSwap: true,
      clearedKeys,
      laserRows: [],
      laserCols: [],
      bombBursts: [{ row: posB.row, col: posB.col }],
      isRainbowLightning: false,
      phrase: '💣 BOMB BLAST! 💥',
      rocketsBlasted: 0,
      bombsBlasted: 1,
      colorBombsBlasted: 0,
      soundType: 'bomb',
    };
  }

  return {
    isSpecialSwap: false,
    clearedKeys: new Set(),
    laserRows: [],
    laserCols: [],
    bombBursts: [],
    isRainbowLightning: false,
    phrase: '',
    rocketsBlasted: 0,
    bombsBlasted: 0,
    colorBombsBlasted: 0,
    soundType: 'swap',
  };
};

/**
 * Clones a board grid.
 */
export const cloneBoard = (grid: BoardGrid): BoardGrid => {
  return grid.map((row) => row.map((tile) => (tile ? { ...tile } : null)));
};

/**
 * Swaps two adjacent positions in a cloned board.
 */
export const swapInGrid = (
  grid: BoardGrid,
  posA: { row: number; col: number },
  posB: { row: number; col: number }
): BoardGrid => {
  const next = cloneBoard(grid);
  const tileA = next[posA.row][posA.col];
  const tileB = next[posB.row][posB.col];

  if (!tileA || !tileB) return next;

  next[posA.row][posA.col] = { ...tileB, row: posA.row, col: posA.col };
  next[posB.row][posB.col] = { ...tileA, row: posB.row, col: posB.col };

  return next;
};

/**
 * Drops tiles downwards to fill empty (cleared) cells, places created special candies,
 * and spawns new candies on top.
 */
export const dropAndRefillWithSpecials = (
  grid: BoardGrid,
  clearedKeys: Set<string>,
  specialsToCreate: Map<string, { special: SpecialType; type: ElementType }> = new Map()
): BoardGrid => {
  const newGrid: BoardGrid = Array.from({ length: 8 }, () => Array(8).fill(null));

  // If a tile position is designated to become a special candy, keep it instead of clearing!
  const effectiveCleared = new Set(clearedKeys);
  for (const [key] of specialsToCreate) {
    effectiveCleared.delete(key);
  }

  for (let col = 0; col < 8; col++) {
    const surviving: Tile[] = [];
    for (let row = 7; row >= 0; row--) {
      const key = `${row},${col}`;

      if (specialsToCreate.has(key)) {
        // Spawn special candy here
        const info = specialsToCreate.get(key)!;
        surviving.push(createTile(row, col, info.type, info.special));
      } else if (!effectiveCleared.has(key) && grid[row][col]) {
        surviving.push(grid[row][col]!);
      }
    }

    // Place surviving tiles at bottom
    let writeRow = 7;
    for (const tile of surviving) {
      newGrid[writeRow][col] = {
        ...tile,
        row: writeRow,
        col,
      };
      writeRow--;
    }

    // Fill remaining top rows with fresh random candies
    while (writeRow >= 0) {
      newGrid[writeRow][col] = createTile(writeRow, col);
      writeRow--;
    }
  }

  return newGrid;
};

export const COMBO_PHRASES = [
  'Nice Match!',
  'Tasty!',
  'Sweet!',
  'Delicious!',
  'Divine!',
  'Sugar Crush!',
  'ROCKET BLAST! 🚀',
  'CANDY BOMB! 💣',
  'RAINBOW COLOR BOMB! 🌈',
];
