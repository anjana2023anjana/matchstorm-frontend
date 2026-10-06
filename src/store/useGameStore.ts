import { create } from 'zustand';
import type { BoardGrid, ElementType, LevelTask } from '../types/game.types';
import type { LevelConfig } from '../utils/candyLevels';

interface GameState {
  roomId: string | null;
  opponentName: string | null;
  opponentAvatar?: string;
  playerBoard: BoardGrid | null;
  opponentBoard: BoardGrid | null;
  playerHP: number;
  playerShield: number;
  opponentHP: number;
  opponentShield: number;
  opponentMaxHP: number;
  selectedTile: { row: number; col: number } | null;
  isQueueing: boolean;
  isGameOver: boolean;
  winnerId: string | null;

  // Level Progression & Objectives
  currentLevelId: number;
  maxMoves: number;
  movesLeft: number;
  score: number;
  tasks: LevelTask[];
  activeBooster: 'HAMMER' | 'SHUFFLE' | null;

  setMatchStarted: (roomId: string, board: BoardGrid, opponentName: string) => void;
  startLevelGame: (level: LevelConfig, board: BoardGrid) => void;
  setPlayerBoard: (board: BoardGrid) => void;
  setOpponentBoard: (board: BoardGrid) => void;
  setSelectedTile: (pos: { row: number; col: number } | null) => void;
  updateStats: (pHP: number, pShield: number, oHP: number, oShield?: number) => void;
  decrementMoves: () => number;
  addScore: (pts: number) => void;
  updateTasksProgress: (
    clearedColors: Map<ElementType, number>,
    rocketsBlasted: number,
    bombsBlasted: number,
    colorBombsBlasted: number
  ) => boolean;
  setActiveBooster: (booster: 'HAMMER' | 'SHUFFLE' | null) => void;
  setQueueing: (status: boolean) => void;
  setGameOver: (winnerId: string) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  roomId: null,
  opponentName: null,
  opponentAvatar: '🤖',
  playerBoard: null,
  opponentBoard: null,
  playerHP: 100,
  playerShield: 0,
  opponentHP: 100,
  opponentShield: 0,
  opponentMaxHP: 100,
  selectedTile: null,
  isQueueing: false,
  isGameOver: false,
  winnerId: null,

  currentLevelId: 1,
  maxMoves: 25,
  movesLeft: 25,
  score: 0,
  tasks: [],
  activeBooster: null,

  setMatchStarted: (roomId, board, opponentName) =>
    set({
      roomId,
      playerBoard: board,
      opponentName,
      opponentAvatar: '🤖',
      isQueueing: false,
      isGameOver: false,
      winnerId: null,
      playerHP: 100,
      opponentHP: 100,
      opponentMaxHP: 100,
      playerShield: 0,
      opponentShield: 0,
      movesLeft: 25,
      maxMoves: 25,
      score: 0,
      tasks: [],
      activeBooster: null,
    }),

  startLevelGame: (level: LevelConfig, board: BoardGrid) =>
    set({
      roomId: `level_${level.id}_room`,
      currentLevelId: level.id,
      playerBoard: board,
      opponentName: level.bossName,
      opponentAvatar: level.bossAvatar,
      playerHP: 100,
      playerShield: 0,
      opponentHP: level.bossHP,
      opponentMaxHP: level.bossHP,
      opponentShield: level.bossShield,
      movesLeft: level.maxMoves,
      maxMoves: level.maxMoves,
      score: 0,
      tasks: level.tasks.map((t) => ({ ...t, current: 0 })),
      isQueueing: false,
      isGameOver: false,
      winnerId: null,
      selectedTile: null,
      activeBooster: null,
    }),

  setPlayerBoard: (playerBoard) => set({ playerBoard }),
  setOpponentBoard: (opponentBoard) => set({ opponentBoard }),
  setSelectedTile: (selectedTile) => set({ selectedTile }),

  updateStats: (playerHP, playerShield, opponentHP, opponentShield) =>
    set((state) => ({
      playerHP,
      playerShield,
      opponentHP,
      opponentShield: opponentShield !== undefined ? opponentShield : state.opponentShield,
    })),

  decrementMoves: () => {
    const next = Math.max(0, get().movesLeft - 1);
    set({ movesLeft: next });
    return next;
  },

  addScore: (pts) => set((s) => ({ score: s.score + pts })),

  updateTasksProgress: (clearedColors, rocketsBlasted, bombsBlasted, colorBombsBlasted) => {
    const currentTasks = get().tasks;
    if (currentTasks.length === 0) return false;

    let allCompleted = true;
    const updated = currentTasks.map((task) => {
      let add = 0;
      if (task.kind === 'COLLECT_COLOR' && task.color) {
        add = clearedColors.get(task.color) || 0;
      } else if (task.kind === 'DETONATE_ROCKET') {
        add = rocketsBlasted;
      } else if (task.kind === 'DETONATE_BOMB') {
        add = bombsBlasted;
      } else if (task.kind === 'DETONATE_COLOR_BOMB') {
        add = colorBombsBlasted;
      }

      const newCount = Math.min(task.target, task.current + add);
      if (newCount < task.target) allCompleted = false;
      return { ...task, current: newCount };
    });

    set({ tasks: updated });
    return allCompleted;
  },

  setActiveBooster: (activeBooster) => set({ activeBooster }),

  setQueueing: (isQueueing) => set({ isQueueing }),
  setGameOver: (winnerId) => set({ isGameOver: true, winnerId }),

  resetGame: () =>
    set({
      roomId: null,
      opponentName: null,
      opponentAvatar: '🤖',
      playerBoard: null,
      opponentBoard: null,
      playerHP: 100,
      playerShield: 0,
      opponentHP: 100,
      opponentShield: 0,
      opponentMaxHP: 100,
      selectedTile: null,
      isQueueing: false,
      isGameOver: false,
      winnerId: null,
      movesLeft: 25,
      score: 0,
      tasks: [],
      activeBooster: null,
    }),
}));