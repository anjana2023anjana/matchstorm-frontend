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

  // 5. Check if any matched tiles were ALREADY special candies (Rockets, Bombs) and expand destruction
  const rocketRows: number[] = [];
  const rocketCols: number[] = [];
  const bombPositions: { row: number; col: number }[] = [];

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
    }
  }

  return { matchedKeys, createdSpecials, rocketRows, rocketCols, bombPositions };
};

/**
 * Handles swapping a COLOR BOMB with another candy:
 * Destroys all candies of that color across the entire board with rainbow lightning!
 */
export const executeColorBombSwap = (
  grid: BoardGrid,
  colorBombPos: { row: number; col: number },
  targetPos: { row: number; col: number }
): { clearedKeys: Set<string>; targetType: ElementType | 'ALL'; isDoubleColorBomb: boolean } => {
  const clearedKeys = new Set<string>();
  const colorBombTile = grid[colorBombPos.row][colorBombPos.col];
  const targetTile = grid[targetPos.row][targetPos.col];

  clearedKeys.add(`${colorBombPos.row},${colorBombPos.col}`);
  clearedKeys.add(`${targetPos.row},${targetPos.col}`);

  if (!colorBombTile || !targetTile) {
    return { clearedKeys, targetType: 'FIRE', isDoubleColorBomb: false };
  }

  // Double Color Bomb swap: CLEARS ENTIRE BOARD!
  if (targetTile.special === 'COLOR_BOMB') {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        clearedKeys.add(`${r},${c}`);
      }
    }
    return { clearedKeys, targetType: 'ALL', isDoubleColorBomb: true };
  }

  // Single Color Bomb swap: Target ALL tiles of the target candy's color
  const targetType = targetTile.type;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (grid[r][c]?.type === targetType) {
        clearedKeys.add(`${r},${c}`);
      }
    }
  }

  return { clearedKeys, targetType, isDoubleColorBomb: false };
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
