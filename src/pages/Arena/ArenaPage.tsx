import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Board } from '../../components/game/Board';
import { LevelMapModal } from '../../components/game/LevelMapModal';
import { socketService } from '../../services/socket.service';
import { CANDY_LEVELS } from '../../utils/candyLevels';
import { generateCleanBoard } from '../../utils/candyEngine';

export const ArenaPage: React.FC = () => {
  const { user } = useAuthStore();
  const {
    playerBoard,
    playerHP,
    playerShield,
    opponentHP,
    opponentShield,
    opponentName,
    opponentAvatar,
    opponentMaxHP,
    isGameOver,
    winnerId,
    resetGame,
    currentLevelId,
    startLevelGame,
    score,
  } = useGameStore();

  const [isLevelMapOpen, setIsLevelMapOpen] = useState(false);

  const currentLevel = CANDY_LEVELS.find((l) => l.id === currentLevelId) || CANDY_LEVELS[0];
  const isVictory = winnerId === user?.id || winnerId === 'player';

  // Calculate stars earned on victory
  let starsEarned = 1;
  if (score >= currentLevel.starThresholds[2]) starsEarned = 3;
  else if (score >= currentLevel.starThresholds[1]) starsEarned = 2;

  const handleForfeit = () => {
    socketService.socket?.emit('game:forfeit');
    resetGame();
  };

  const handleNextLevel = () => {
    const nextLevel = CANDY_LEVELS.find((l) => l.id === currentLevelId + 1);
    if (nextLevel) {
      const board = generateCleanBoard();
      startLevelGame(nextLevel, board);
    } else {
      resetGame();
    }
  };

  const handleReplayLevel = () => {
    const board = generateCleanBoard();
    startLevelGame(currentLevel, board);
  };

  return (
    <div
      className="fixed inset-0 w-full h-full flex flex-col items-center justify-between p-2 md:p-3 select-none touch-none game-touch-surface bg-cover bg-center bg-no-repeat overflow-hidden"
      style={{
        backgroundImage: "url('/candy_bg.jpg')",
        backgroundColor: '#2e1065',
      }}
      onTouchMove={(e) => {
        if (e.cancelable) e.preventDefault();
      }}
    >
      {/* Light Fantasy Atmospheric Vignette (Clear View of Background) */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-950/20 via-transparent to-purple-950/40 pointer-events-none" />

      {/* Floating Whimsical Candy Sparkles / Bubbles in Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <span className="absolute top-[20%] left-[8%] text-3xl animate-bounce opacity-80 drop-shadow-[0_2px_8px_rgba(255,255,255,0.8)]">✨</span>
        <span className="absolute top-[35%] right-[10%] text-4xl animate-pulse opacity-75 drop-shadow-[0_2px_8px_rgba(255,255,255,0.8)]">🌟</span>
        <span className="absolute bottom-[22%] left-[18%] text-3xl animate-bounce opacity-80 drop-shadow-[0_2px_8px_rgba(255,255,255,0.8)]">🍬</span>
        <span className="absolute top-[65%] right-[22%] text-3xl animate-pulse opacity-70 drop-shadow-[0_2px_8px_rgba(255,255,255,0.8)]">✨</span>
        <span className="absolute top-[12%] left-[30%] text-2xl animate-bounce opacity-70 drop-shadow-[0_2px_8px_rgba(255,255,255,0.8)]">🍭</span>
      </div>

      {/* Unified Compact Top Status HUD (Player + Level + Boss) */}
      <div className="relative z-10 w-full max-w-3xl flex items-center justify-between bg-slate-900/90 px-3 py-1.5 rounded-2xl border-2 border-pink-400/50 backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.6)] shrink-0 gap-2">
        {/* Left: Player Profile & HP */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-sm font-black text-white shadow-md border border-white/30 shrink-0">
            {user?.username ? user.username.charAt(0).toUpperCase() : '🍬'}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-white truncate max-w-[70px] sm:max-w-[110px]">
                {user?.username || 'You'}
              </span>
              {playerShield > 0 && (
                <span className="text-[10px] text-purple-300 font-bold bg-purple-900/80 px-1 rounded shadow-sm">
                  🛡️{playerShield}
                </span>
              )}
            </div>
            {/* Player HP Bar */}
            <div className="w-16 sm:w-24 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-700 relative">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-green-500 transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, playerHP))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Center: Level Info & Target Score */}
        <div className="flex flex-col items-center px-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 whitespace-nowrap">
            LVL {currentLevel.id}: {currentLevel.name}
          </span>
          <span className="text-xs font-mono font-extrabold text-cyan-300 whitespace-nowrap">
            ⭐ {score.toLocaleString()} / {currentLevel.targetScore.toLocaleString()}
          </span>
          {/* Target Score Mini Progress */}
          <div className="w-20 sm:w-28 h-1 bg-slate-950 rounded-full overflow-hidden border border-slate-700/80 mt-0.5">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 transition-all duration-300"
              style={{
                width: `${Math.min(100, Math.round((score / currentLevel.targetScore) * 100))}%`,
              }}
            />
          </div>
        </div>

        {/* Right: Boss Profile & Controls */}
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end text-right">
            <div className="flex items-center gap-1.5">
              {opponentShield > 0 && (
                <span className="text-[10px] text-purple-300 font-bold bg-purple-900/80 px-1 rounded shadow-sm">
                  🛡️{opponentShield}
                </span>
              )}
              <span className="text-xs font-black text-white truncate max-w-[70px] sm:max-w-[110px]">
                {opponentName || currentLevel.bossName}
              </span>
            </div>
            {/* Boss HP Bar */}
            <div className="w-16 sm:w-24 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-700 relative">
              <div
                className={`h-full transition-all duration-300 ${
                  opponentHP / (opponentMaxHP || 100) > 0.5
                    ? 'bg-gradient-to-r from-rose-500 to-amber-500'
                    : 'bg-gradient-to-r from-red-600 to-rose-700'
                }`}
                style={{
                  width: `${Math.min(100, Math.max(0, (opponentHP / (opponentMaxHP || 100)) * 100))}%`,
                }}
              />
            </div>
          </div>

          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-sm shadow-md border border-white/30 shrink-0">
            {opponentAvatar || currentLevel.bossAvatar}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1 ml-0.5">
            <button
              onClick={() => setIsLevelMapOpen(true)}
              className="p-1.5 text-xs bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-400/50 rounded-xl transition cursor-pointer"
              title="Open Levels Map"
            >
              🗺️
            </button>
            <button
              onClick={handleForfeit}
              className="p-1.5 text-xs bg-rose-600/30 hover:bg-rose-600/60 text-rose-200 border border-rose-400/50 rounded-xl transition cursor-pointer"
              title="Back to Lobby"
            >
              🚪
            </button>
          </div>
        </div>
      </div>

      {/* Arena Center Playfield with Board (Centered without scrolling) */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center min-h-0 w-full overflow-hidden py-1">
        {playerBoard && <Board grid={playerBoard} />}
      </div>

      {/* Level Selection Map Modal */}
      <LevelMapModal isOpen={isLevelMapOpen} onClose={() => setIsLevelMapOpen(false)} />

      {/* Match Over Modal with Victory / Defeat Celebrations */}
      {isGameOver && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900/95 border-4 border-yellow-400 p-8 rounded-3xl max-w-sm w-full text-center flex flex-col items-center shadow-[0_0_60px_rgba(234,179,8,0.6)]">
            <span className="text-6xl mb-2 animate-bounce">
              {isVictory ? '🏆' : '💀'}
            </span>
            <h2
              className={`text-3xl md:text-4xl font-black mb-1 tracking-wider ${
                isVictory
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-400 to-cyan-300'
                  : 'text-rose-500'
              }`}
            >
              {isVictory ? 'SUGAR VICTORY!' : 'OUT OF MOVES!'}
            </h2>

            {/* Stars Awarded */}
            {isVictory && (
              <div className="flex gap-2 text-3xl my-3 animate-pulse">
                <span className={starsEarned >= 1 ? 'text-yellow-400' : 'text-slate-700'}>⭐</span>
                <span className={starsEarned >= 2 ? 'text-yellow-400' : 'text-slate-700'}>⭐</span>
                <span className={starsEarned >= 3 ? 'text-yellow-400' : 'text-slate-700'}>⭐</span>
              </div>
            )}

            <p className="text-slate-300 text-sm mb-2 font-medium">
              {isVictory
                ? `Level ${currentLevel.id} Completed! Score: ${score.toLocaleString()}`
                : `Defeated by ${currentLevel.bossName}. Try again!`}
            </p>

            <div className="flex flex-col gap-2.5 w-full mt-4">
              {isVictory && currentLevelId < CANDY_LEVELS.length && (
                <button
                  onClick={handleNextLevel}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-green-600 rounded-2xl font-black text-white text-base shadow-lg hover:scale-[1.02] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 border border-emerald-200/50"
                >
                  <span>🚀</span> NEXT LEVEL ({currentLevelId + 1})
                </button>
              )}

              <button
                onClick={handleReplayLevel}
                className="w-full py-3 bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl font-bold text-slate-950 text-sm shadow-md hover:scale-[1.02] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>🔄</span> Replay Level {currentLevelId}
              </button>

              <button
                onClick={() => {
                  setIsLevelMapOpen(true);
                }}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 rounded-2xl font-bold text-slate-300 text-xs border border-slate-700 cursor-pointer"
              >
                🗺️ Choose Level
              </button>

              <button
                onClick={resetGame}
                className="w-full py-2 text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                Return to Lobby
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};