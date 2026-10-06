import React from 'react';
import { CANDY_LEVELS, getUnlockedLevel, getLevelStarsMap, type LevelConfig } from '../../utils/candyLevels';
import { generateCleanBoard } from '../../utils/candyEngine';
import { useGameStore } from '../../store/useGameStore';

interface LevelMapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LevelMapModal: React.FC<LevelMapModalProps> = ({ isOpen, onClose }) => {
  const { startLevelGame } = useGameStore();

  if (!isOpen) return null;

  const unlockedLevel = getUnlockedLevel();
  const starsMap = getLevelStarsMap();

  const handleSelectLevel = (level: LevelConfig) => {
    if (level.id > unlockedLevel) return;
    const board = generateCleanBoard();
    startLevelGame(level, board);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900/95 border-4 border-amber-400/80 rounded-3xl p-6 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.9)] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="text-3xl animate-bounce">🗺️</span>
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-pink-400 to-cyan-300">
                CANDY CRUSH SAGA LEVELS
              </h2>
              <p className="text-xs text-slate-400 font-medium">Select a Level & Defeat the Candy Boss!</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold text-lg cursor-pointer transition"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Levels Grid */}
        <div className="overflow-y-auto py-6 pr-2 grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
          {CANDY_LEVELS.map((level) => {
            const isUnlocked = level.id <= unlockedLevel;
            const stars = starsMap[level.id] || 0;
            const isCurrent = level.id === unlockedLevel;

            return (
              <div
                key={level.id}
                onClick={() => handleSelectLevel(level)}
                className={`relative flex flex-col items-center justify-between p-4 rounded-2xl border-2 transition-all text-center ${
                  isUnlocked
                    ? 'bg-slate-800/90 hover:bg-slate-750 border-amber-400/50 hover:border-amber-300 hover:scale-105 cursor-pointer shadow-lg'
                    : 'bg-slate-950/70 border-slate-800 opacity-60 cursor-not-allowed'
                } ${isCurrent ? 'ring-4 ring-yellow-400/60 shadow-[0_0_25px_rgba(250,204,21,0.6)] animate-pulse' : ''}`}
              >
                {/* Level Number Badge */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 font-black text-sm flex items-center justify-center shadow-md mb-2">
                  {level.id}
                </div>

                {/* Boss Avatar */}
                <div className="text-4xl my-1 drop-shadow-md">
                  {isUnlocked ? level.bossAvatar : '🔒'}
                </div>

                {/* Level Title & Boss */}
                <div className="my-1">
                  <h3 className="text-sm font-extrabold text-white truncate max-w-[110px]">
                    {level.name}
                  </h3>
                  <span className="text-[11px] text-slate-400 truncate block">
                    {level.bossName}
                  </span>
                </div>

                {/* Level Stats Pill */}
                <div className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-800/50 mb-2">
                  {level.bossHP} HP • {level.maxMoves} Moves
                </div>

                {/* Star Ratings */}
                <div className="flex gap-1 text-xs">
                  <span className={stars >= 1 ? 'text-yellow-400' : 'text-slate-700'}>⭐</span>
                  <span className={stars >= 2 ? 'text-yellow-400' : 'text-slate-700'}>⭐</span>
                  <span className={stars >= 3 ? 'text-yellow-400' : 'text-slate-700'}>⭐</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
          💡 Clear level objectives before moves run out to earn stars & unlock new worlds!
        </div>
      </div>
    </div>
  );
};
