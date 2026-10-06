import React, { useState, useRef, useEffect } from 'react';
import type { BoardGrid, ElementType, SwapAction } from '../../types/game.types';
import { TileComponent } from './Tile';
import { useGameStore } from '../../store/useGameStore';
import { useAuthStore } from '../../store/useAuthStore';
import { socketService } from '../../services/socket.service';
import {
  findMatchesWithSpecials,
  swapInGrid,
  dropAndRefillWithSpecials,
  executeColorBombSwap,
  generateCleanBoard,
  COMBO_PHRASES,
} from '../../utils/candyEngine';
import { candyAudio } from '../../utils/candySounds';
import { saveLevelCompletion } from '../../utils/candyLevels';

interface BoardProps {
  grid: BoardGrid;
}

export const Board: React.FC<BoardProps> = ({ grid }) => {
  const {
    selectedTile,
    setSelectedTile,
    roomId,
    updateStats,
    setPlayerBoard,
    setGameOver,
    currentLevelId,
    movesLeft,
    decrementMoves,
    score,
    addScore,
    tasks,
    updateTasksProgress,
    activeBooster,
    setActiveBooster,
  } = useGameStore();

  const [matchedKeys, setMatchedKeys] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [comboBanner, setComboBanner] = useState<{ text: string; score: number } | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [activeLaserRows, setActiveLaserRows] = useState<number[]>([]);
  const [activeLaserCols, setActiveLaserCols] = useState<number[]>([]);
  const [activeBombBursts, setActiveBombBursts] = useState<{ row: number; col: number }[]>([]);
  const [activeRainbowLightning, setActiveRainbowLightning] = useState<boolean>(false);
  const dragSource = useRef<{ row: number; col: number } | null>(null);
  const lastTapTimeRef = useRef<{ row: number; col: number; time: number } | null>(null);

  // Watchdog: If isProcessing stays stuck for > 1.2s, force-reset it
  useEffect(() => {
    if (isProcessing) {
      const timer = setTimeout(() => {
        setIsProcessing(false);
        setMatchedKeys(new Set());
        setActiveRainbowLightning(false);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [isProcessing]);

  // Trigger floating Candy Crush combo banner
  const triggerComboBanner = (text: string, scoreGain: number) => {
    setComboBanner({ text, score: scoreGain });
    setTimeout(() => setComboBanner(null), 1400);
  };

  // Perform cascading matches, special candy triggers, and gravity drops recursively
  const processCascades = async (currentBoard: BoardGrid, cascadeIndex = 1): Promise<void> => {
    if (cascadeIndex > 10) {
      setIsProcessing(false);
      return;
    }

    try {
      const scan = findMatchesWithSpecials(currentBoard);
      if (scan.matchedKeys.size === 0) {
        setIsProcessing(false);

        // Check if out of moves after cascades finish
        const currentMoves = useGameStore.getState().movesLeft;
        const currentOpponentHP = useGameStore.getState().opponentHP;
        const currentTasks = useGameStore.getState().tasks;
        const allDone = currentTasks.length > 0 ? currentTasks.every((t) => t.current >= t.target) : false;

        if (allDone || currentOpponentHP <= 0) {
          saveLevelCompletion(currentLevelId, useGameStore.getState().score);
          setGameOver(useAuthStore.getState().user?.id || 'player');
        } else if (currentMoves <= 0) {
          setGameOver('opponent');
        }
        return;
      }

      // Check if any rockets or bombs were triggered in this scan
      if (scan.rocketRows.length > 0 || scan.rocketCols.length > 0) {
        candyAudio.playRocket();
        setActiveLaserRows(scan.rocketRows);
        setActiveLaserCols(scan.rocketCols);
        setTimeout(() => {
          setActiveLaserRows([]);
          setActiveLaserCols([]);
        }, 400);
      }

      if (scan.bombPositions.length > 0) {
        candyAudio.playBomb();
        setActiveBombBursts(scan.bombPositions);
        setTimeout(() => setActiveBombBursts([]), 450);
      }

      // Step 1: Count color categories for tasks progress
      const colorCounts = new Map<ElementType, number>();
      for (const key of scan.matchedKeys) {
        const [r, c] = key.split(',').map(Number);
        const t = currentBoard[r]?.[c];
        if (t) {
          colorCounts.set(t.type, (colorCounts.get(t.type) || 0) + 1);
        }
      }

      // Step 2: Highlight & explode matched tiles
      setMatchedKeys(scan.matchedKeys);
      candyAudio.playPop(520 + cascadeIndex * 80);

      const damage = scan.matchedKeys.size * 5 * cascadeIndex;
      const pts = damage * 15;
      addScore(pts);

      const phrase = scan.createdSpecials.size > 0
        ? 'SPECIAL CANDY CREATED! 🍬'
        : COMBO_PHRASES[Math.min(cascadeIndex - 1, COMBO_PHRASES.length - 1)];

      triggerComboBanner(phrase, pts);
      candyAudio.playCombo(cascadeIndex);

      // Update Tasks Progress
      const allTasksDone = updateTasksProgress(
        colorCounts,
        scan.rocketRows.length + scan.rocketCols.length,
        scan.bombPositions.length,
        0
      );

      // Read fresh stats from store directly
      const currentStats = useGameStore.getState();
      const remainingOpponentHP = Math.max(0, currentStats.opponentHP - damage);
      updateStats(
        currentStats.playerHP,
        currentStats.playerShield + (scan.matchedKeys.size >= 4 ? 12 : 0),
        remainingOpponentHP
      );

      // Check Victory Condition (Either all tasks completed or Boss defeated)
      if (allTasksDone || remainingOpponentHP <= 0) {
        saveLevelCompletion(currentLevelId, score + pts);
        setTimeout(() => setGameOver(useAuthStore.getState().user?.id || 'player'), 500);
      }

      // Wait for pop animation to finish
      await new Promise((res) => setTimeout(res, 320));

      // Step 3: Gravity drop and refill top with any newly spawned specials
      const nextBoard = dropAndRefillWithSpecials(currentBoard, scan.matchedKeys, scan.createdSpecials);
      setMatchedKeys(new Set());
      setPlayerBoard(nextBoard);

      // Step 4: Wait for drop animation settle
      await new Promise((res) => setTimeout(res, 220));

      // Step 5: Cascade check
      await processCascades(nextBoard, cascadeIndex + 1);
    } catch (err) {
      console.error('Cascade error:', err);
      setIsProcessing(false);
    }
  };

  /**
   * Double-Tap / Instant Detonation of Special Candies (Bombs, Rockets, Color Bombs)
   */
  const handleSpecialDetonation = async (row: number, col: number) => {
    const tile = grid[row][col];
    if (!tile || !tile.special || isProcessing) return;

    setIsProcessing(true);
    setSelectedTile(null);
    decrementMoves();

    const keysToBlast = new Set<string>();

    if (tile.special === 'BOMB') {
      // Detonate 3x3 surrounding radius with punchy screen shake
      candyAudio.playBomb();
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 300);
      setActiveBombBursts([{ row, col }]);
      setTimeout(() => setActiveBombBursts([]), 550);

      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = row + dr;
          const nc = col + dc;
          if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            keysToBlast.add(`${nr},${nc}`);
          }
        }
      }
      triggerComboBanner('💣 BOOM! BOMB BLAST!', 350);
    } else if (tile.special === 'ROW_ROCKET') {
      candyAudio.playRocket();
      setActiveLaserRows([row]);
      setTimeout(() => setActiveLaserRows([]), 400);

      for (let c = 0; c < 8; c++) keysToBlast.add(`${row},${c}`);
      triggerComboBanner('🚀 ROW LASER BLAST!', 250);
    } else if (tile.special === 'COL_ROCKET') {
      candyAudio.playRocket();
      setActiveLaserCols([col]);
      setTimeout(() => setActiveLaserCols([]), 400);

      for (let r = 0; r < 8; r++) keysToBlast.add(`${r},${col}`);
      triggerComboBanner('🚀 COL LASER BLAST!', 250);
    } else if (tile.special === 'COLOR_BOMB') {
      // Find most common color on board and wipe it out!
      candyAudio.playColorBomb();
      setActiveRainbowLightning(true);

      const counts: Record<string, number> = {};
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const t = grid[r][c];
          if (t) counts[t.type] = (counts[t.type] || 0) + 1;
        }
      }
      const mostCommon = (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] as ElementType) || 'FIRE';

      keysToBlast.add(`${row},${col}`);
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (grid[r][c]?.type === mostCommon) {
            keysToBlast.add(`${r},${c}`);
          }
        }
      }
      triggerComboBanner('🌈 COLOR BOMB BLAST!', 400);
      setTimeout(() => setActiveRainbowLightning(false), 500);
    }

    // Collect all fruits/candies blasted by the explosion and count towards tasks!
    const colorCounts = new Map<ElementType, number>();
    keysToBlast.forEach((k) => {
      const [r, c] = k.split(',').map(Number);
      const t = grid[r][c];
      if (t && t.type) {
        colorCounts.set(t.type, (colorCounts.get(t.type) || 0) + 1);
      }
    });

    const isBomb = tile.special === 'BOMB';
    const isRocket = tile.special === 'ROW_ROCKET' || tile.special === 'COL_ROCKET';
    const isColorBomb = tile.special === 'COLOR_BOMB';

    const allTasksDone = updateTasksProgress(
      colorCounts,
      isRocket ? 1 : 0,
      isBomb ? 1 : 0,
      isColorBomb ? 1 : 0
    );

    setMatchedKeys(keysToBlast);
    const pts = keysToBlast.size * 25;
    addScore(pts);

    const stats = useGameStore.getState();
    const remHP = Math.max(0, stats.opponentHP - keysToBlast.size * 8);
    updateStats(stats.playerHP, stats.playerShield + 15, remHP);

    if (allTasksDone || remHP <= 0) {
      saveLevelCompletion(currentLevelId, stats.score + pts);
      setTimeout(() => setGameOver(useAuthStore.getState().user?.id || 'player'), 500);
    }

    await new Promise((res) => setTimeout(res, 350));

    const nextBoard = dropAndRefillWithSpecials(grid, keysToBlast);
    setMatchedKeys(new Set());
    setPlayerBoard(nextBoard);

    await new Promise((res) => setTimeout(res, 220));
    await processCascades(nextBoard, 1);
  };

  const handleTileSwap = async (from: { row: number; col: number }, to: { row: number; col: number }) => {
    if (isProcessing) return;

    const rowDiff = Math.abs(from.row - to.row);
    const colDiff = Math.abs(from.col - to.col);

    // Only allow adjacent cardinal swaps
    if (rowDiff + colDiff !== 1) {
      setSelectedTile(to);
      return;
    }

    setIsProcessing(true);
    setSelectedTile(null);
    candyAudio.playSwap();

    try {
      const tileA = grid[from.row][from.col];
      const tileB = grid[to.row][to.col];

      // Decrement move counter
      decrementMoves();

      // Check for COLOR BOMB Swap (5 in a line special!)
      if (tileA?.special === 'COLOR_BOMB' || tileB?.special === 'COLOR_BOMB') {
        const colorBombPos = tileA?.special === 'COLOR_BOMB' ? from : to;
        const targetPos = tileA?.special === 'COLOR_BOMB' ? to : from;

        const { clearedKeys, isDoubleColorBomb } = executeColorBombSwap(grid, colorBombPos, targetPos);

        candyAudio.playColorBomb();
        setActiveRainbowLightning(true);
        setMatchedKeys(clearedKeys);

        const phrase = isDoubleColorBomb ? '🌈 DOUBLE COLOR BOMB DISCO! 🌟' : '🌈 RAINBOW COLOR BOMB! ⚡';
        const damage = clearedKeys.size * 8;
        const pts = damage * 20;
        addScore(pts);
        triggerComboBanner(phrase, pts);

        const stats = useGameStore.getState();
        const remOpponentHP = Math.max(0, stats.opponentHP - damage);
        updateStats(stats.playerHP, stats.playerShield + 20, remOpponentHP);

        // Update tasks for color bomb and collect all wiped colors
        const colorCounts = new Map<ElementType, number>();
        clearedKeys.forEach((k) => {
          const [r, c] = k.split(',').map(Number);
          const t = grid[r][c];
          if (t && t.type) {
            colorCounts.set(t.type, (colorCounts.get(t.type) || 0) + 1);
          }
        });

        const allTasksDone = updateTasksProgress(colorCounts, 0, 0, isDoubleColorBomb ? 2 : 1);

        if (allTasksDone || remOpponentHP <= 0) {
          saveLevelCompletion(currentLevelId, score + pts);
          setTimeout(() => setGameOver(useAuthStore.getState().user?.id || 'player'), 500);
        }

        await new Promise((res) => setTimeout(res, 500));
        setActiveRainbowLightning(false);

        const nextBoard = dropAndRefillWithSpecials(grid, clearedKeys);
        setMatchedKeys(new Set());
        setPlayerBoard(nextBoard);

        await new Promise((res) => setTimeout(res, 220));
        await processCascades(nextBoard, 1);
        return;
      }

      // Normal Swap check
      const tentativeBoard = swapInGrid(grid, from, to);
      const scan = findMatchesWithSpecials(tentativeBoard, to);

      if (scan.matchedKeys.size === 0) {
        // Invalid Swap: show wiggle and swap back (Classic Candy Crush behavior)
        candyAudio.playInvalid();
        setPlayerBoard(tentativeBoard);
        setIsShaking(true);

        setTimeout(() => {
          setPlayerBoard(grid); // Revert back
          setIsShaking(false);
          setIsProcessing(false);
        }, 280);
        return;
      }

      // Valid Swap: update board and cascade!
      setPlayerBoard(tentativeBoard);

      // If connected to multiplayer server, also notify backend
      if (roomId && roomId !== 'practice_bot_room' && !roomId.startsWith('level_')) {
        const swap: SwapAction = { from, to };
        socketService.socket?.emit('game:request_swap', swap);
      }

      // Trigger explosive cascade drops with special creation
      await processCascades(tentativeBoard, 1);
    } catch (err) {
      console.error('Swap error:', err);
      setIsProcessing(false);
    }
  };

  const handleTileClick = (row: number, col: number) => {
    if (isProcessing) return;

    // Check if Booster is active (e.g. Lollipop Hammer)
    if (activeBooster === 'HAMMER') {
      candyAudio.playBomb();
      const keys = new Set<string>([`${row},${col}`]);
      setMatchedKeys(keys);
      setActiveBooster(null);
      addScore(100);

      setTimeout(() => {
        const nextBoard = dropAndRefillWithSpecials(grid, keys);
        setMatchedKeys(new Set());
        setPlayerBoard(nextBoard);
        processCascades(nextBoard, 1);
      }, 250);
      return;
    }

    const current = grid[row][col];
    const now = Date.now();
    const lastTap = lastTapTimeRef.current;

    // Direct rapid double-tap (within 400ms) on a special candy detonates it immediately!
    if (lastTap && lastTap.row === row && lastTap.col === col && now - lastTap.time < 400) {
      if (current?.special) {
        lastTapTimeRef.current = null;
        handleSpecialDetonation(row, col);
        return;
      }
    }
    lastTapTimeRef.current = { row, col, time: now };

    // DOUBLE TAP / SECOND TAP ON A SELECTED SPECIAL CANDY (BOMB, ROCKET, COLOR BOMB)!
    if (selectedTile && selectedTile.row === row && selectedTile.col === col) {
      if (current?.special) {
        handleSpecialDetonation(row, col);
        return;
      }
      setSelectedTile(null);
      return;
    }

    if (!selectedTile) {
      candyAudio.playPop(700, 0.08);
      setSelectedTile({ row, col });
      return;
    }

    handleTileSwap(selectedTile, { row, col });
  };

  const handleDragStart = (r: number, c: number) => {
    if (isProcessing) return;
    dragSource.current = { row: r, col: c };
    setSelectedTile({ row: r, col: c });
  };

  const handleDrop = (r: number, c: number, e: React.DragEvent) => {
    e.preventDefault();
    if (dragSource.current) {
      handleTileSwap(dragSource.current, { row: r, col: c });
      dragSource.current = null;
    }
  };

  // Booster action: Free shuffle
  const handleShuffleBooster = () => {
    if (isProcessing) return;
    candyAudio.playSwap();
    const newBoard = generateCleanBoard();
    setPlayerBoard(newBoard);
    setActiveBooster(null);
    triggerComboBanner('🔀 SHUFFLED!', 50);
  };

  return (
    <div className="relative flex flex-col items-center">
      {/* Floating Candy Crush Sweet/Tasty Banner */}
      {comboBanner && (
        <div className="absolute -top-14 z-40 pointer-events-none animate-bounce flex flex-col items-center">
          <span className="text-3xl md:text-4xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-400 to-cyan-300 drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
            {comboBanner.text}
          </span>
          <span className="text-base font-extrabold text-emerald-300 drop-shadow-md bg-emerald-950/80 px-3 py-0.5 rounded-full border border-emerald-400/50 mt-1">
            +{comboBanner.score} PTS
          </span>
        </div>
      )}

      {/* Target Objectives Header Panel */}
      {tasks.length > 0 && (
        <div className="mb-1.5 flex items-center justify-center gap-2 flex-wrap bg-slate-900/90 border border-amber-400/60 px-3 py-1 rounded-xl shadow-md backdrop-blur-md">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 mr-1">
            TARGETS:
          </span>
          {tasks.map((task) => {
            const isDone = task.current >= task.target;
            return (
              <div
                key={task.id}
                className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border text-xs font-black transition-all ${
                  isDone
                    ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300 shadow-emerald-500/30 shadow-sm animate-pulse'
                    : 'bg-slate-800/80 border-slate-700 text-slate-200'
                }`}
              >
                <span className="text-sm">{task.icon}</span>
                <span className="font-mono text-xs">
                  {task.current}/{task.target}
                </span>
                {isDone && <span className="text-emerald-400 font-bold text-[10px]">✓</span>}
              </div>
            );
          })}
        </div>
      )}

      {/* Board Container with Candy Frame */}
      <div
        className={`relative p-2 sm:p-2.5 rounded-2xl bg-slate-900/85 border-2 sm:border-3 border-amber-400/70 shadow-[0_12px_40px_rgba(0,0,0,0.85)] backdrop-blur-xl transition-transform ${
          isShaking ? 'scale-95 duration-100' : 'duration-200'
        } ${activeBooster === 'HAMMER' ? 'cursor-crosshair ring-4 ring-rose-500' : ''}`}
      >
        {/* Rocket Laser Beam Visual Overlays */}
        {activeLaserRows.map((row) => (
          <div
            key={`laser_r_${row}`}
            style={{ top: `${row * 12.5 + 2}%` }}
            className="absolute left-0 right-0 h-8 bg-gradient-to-r from-transparent via-cyan-400 to-transparent z-30 pointer-events-none animate-ping shadow-[0_0_20px_#22d3ee]"
          />
        ))}
        {activeLaserCols.map((col) => (
          <div
            key={`laser_c_${col}`}
            style={{ left: `${col * 12.5 + 2}%` }}
            className="absolute top-0 bottom-0 w-8 bg-gradient-to-b from-transparent via-pink-400 to-transparent z-30 pointer-events-none animate-ping shadow-[0_0_20px_#f43f5e]"
          />
        ))}

        {/* Bomb Radial Shockwave Visuals */}
        {activeBombBursts.map((b, i) => (
          <div
            key={`bomb_${i}`}
            style={{ top: `${b.row * 12.5 + 6.25}%`, left: `${b.col * 12.5 + 6.25}%` }}
            className="absolute w-40 h-40 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-yellow-300 bg-gradient-to-tr from-amber-500/40 via-yellow-400/60 to-rose-500/40 z-40 pointer-events-none animate-ping shadow-[0_0_60px_#f59e0b] flex items-center justify-center"
          >
            <span className="font-black text-xl text-yellow-200 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] animate-pulse">
              💥 BOOM!
            </span>
          </div>
        ))}

        {/* Rainbow Lightning Full-Board Flash */}
        {activeRainbowLightning && (
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/40 via-purple-500/50 to-pink-500/40 rounded-2xl z-30 pointer-events-none animate-pulse border-4 border-yellow-300 shadow-[0_0_40px_#f59e0b]" />
        )}

        {/* Grid of Candies (Dynamic Viewport Size) */}
        <div className="grid grid-cols-8 gap-1 sm:gap-1.5 bg-slate-950/70 p-1.5 sm:p-2 rounded-xl border border-slate-800/80">
          {grid.map((row, rIdx) =>
            row.map((tile, cIdx) => {
              const isMatched = matchedKeys.has(`${rIdx},${cIdx}`);
              const isSelected = selectedTile?.row === rIdx && selectedTile?.col === cIdx;

              return (
                <div
                  key={tile ? tile.id : `empty_${rIdx}_${cIdx}`}
                  className="w-[min(11vw,5.6vh,48px)] h-[min(11vw,5.6vh,48px)] flex items-center justify-center relative"
                >
                  {tile && (
                    <TileComponent
                      type={tile.type}
                      special={tile.special}
                      isSelected={isSelected}
                      isMatched={isMatched}
                      onClick={() => handleTileClick(rIdx, cIdx)}
                      onDoubleClick={() => {
                        if (tile.special) {
                          handleSpecialDetonation(rIdx, cIdx);
                        }
                      }}
                      onDragStart={() => handleDragStart(rIdx, cIdx)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDrop(rIdx, cIdx, e)}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Innovative Boosters Bar & Level Info */}
      <div className="mt-2 flex items-center justify-between w-full max-w-sm px-1">
        {/* Moves & Score Pill */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 px-3 py-1 rounded-full shadow-md text-xs font-bold text-white">
          <span className="text-amber-400 font-extrabold font-mono text-xs sm:text-sm">🎯 {movesLeft} Moves</span>
          <span className="text-slate-500">•</span>
          <span className="text-cyan-300 font-mono text-xs">⭐ {score.toLocaleString()}</span>
        </div>

        {/* Boosters */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveBooster(activeBooster === 'HAMMER' ? null : 'HAMMER')}
            className={`px-2.5 py-1 rounded-full text-xs font-extrabold flex items-center gap-1 border transition cursor-pointer shadow-md ${
              activeBooster === 'HAMMER'
                ? 'bg-rose-600 text-white border-rose-300 ring-2 ring-rose-400 animate-pulse'
                : 'bg-slate-900/90 text-slate-200 border-slate-700 hover:border-amber-400'
            }`}
            title="Lollipop Hammer: Smash any 1 tile!"
          >
            <span>🔨</span> Hammer
          </button>
          <button
            onClick={handleShuffleBooster}
            className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-slate-900/90 text-slate-200 border border-slate-700 hover:border-cyan-400 flex items-center gap-1 transition cursor-pointer shadow-md"
            title="Reshuffle Board"
          >
            <span>🔀</span> Shuffle
          </button>
        </div>
      </div>

      {/* Helper text */}
      <p className="mt-1 text-[10px] text-amber-200/80 font-medium">
        💡 Double-Tap any Bomb 💣 or Rocket 🚀 to detonate instantly!
      </p>
    </div>
  );
};