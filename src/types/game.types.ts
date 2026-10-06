export type ElementType = 'FIRE' | 'WATER' | 'EARTH' | 'ELECTRIC' | 'SHIELD';

export type SpecialType = 'ROW_ROCKET' | 'COL_ROCKET' | 'BOMB' | 'COLOR_BOMB';

export interface LevelTask {
  id: string;
  icon: string;
  label: string;
  target: number;
  current: number;
  kind: 'COLLECT_COLOR' | 'DETONATE_ROCKET' | 'DETONATE_BOMB' | 'DETONATE_COLOR_BOMB';
  color?: ElementType;
}

export interface Tile {
  id: string;
  type: ElementType;
  row: number;
  col: number;
  special?: SpecialType;
}

export type BoardGrid = (Tile | null)[][];

export interface SwapAction {
  from: { row: number; col: number };
  to: { row: number; col: number };
}

export interface MatchGroup {
  type: ElementType;
  tiles: Tile[];
}

export interface CascadeStep {
  board: BoardGrid;
  clearedMatches: MatchGroup[];
  damage: number;
  shieldGain: number;
}