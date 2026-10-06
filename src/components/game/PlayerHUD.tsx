import React from 'react';

interface PlayerHUDProps {
  name: string;
  avatar?: string;
  hp: number;
  maxHP?: number;
  shield: number;
  isOpponent?: boolean;
}

export const PlayerHUD: React.FC<PlayerHUDProps> = ({
  name,
  avatar,
  hp = 100,
  maxHP = 100,
  shield = 0,
  isOpponent = false,
}) => {
  const displayHP = Math.max(0, hp);
  const percent = Math.min(100, (displayHP / (maxHP || 100)) * 100);

  return (
    <div className={`flex items-center gap-3 w-full max-w-sm ${isOpponent ? 'flex-row-reverse text-right' : 'flex-row text-left'}`}>
      {/* Avatar Badge */}
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 flex items-center justify-center text-2xl shadow-lg border-2 border-white/40 shrink-0">
        {avatar || (isOpponent ? '🤖' : '🍬')}
      </div>

      <div className="flex-1 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="font-extrabold tracking-wider text-sm md:text-base text-white uppercase drop-shadow-sm truncate">
            {name}
          </span>
          {shield > 0 && (
            <span className="bg-purple-900/90 text-purple-200 border border-purple-400/50 px-2 py-0.5 rounded-full text-xs font-bold shadow-md shadow-purple-900/50 flex items-center gap-1 animate-pulse">
              🛡️ {shield}
            </span>
          )}
        </div>

        {/* Glossy HP Bar */}
        <div className="w-full h-4 bg-slate-950/80 rounded-full overflow-hidden border-2 border-slate-700/80 relative p-0.5 shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-500 shadow-md ${
              percent > 50
                ? 'bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-300'
                : percent > 20
                ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300'
                : 'bg-gradient-to-r from-rose-600 via-red-500 to-rose-400'
            }`}
            style={{ width: `${percent}%` }}
          />
          <div className="absolute top-0.5 left-2 right-2 h-1 bg-white/25 rounded-full pointer-events-none" />
        </div>

        <span className="text-[11px] text-slate-300 font-bold font-mono">
          {displayHP} / {maxHP} HP
        </span>
      </div>
    </div>
  );
};