import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useGameStore } from '../../store/useGameStore';
import { socketService } from '../../services/socket.service';
import { generateCleanBoard } from '../../utils/candyEngine';
import { LevelMapModal } from '../../components/game/LevelMapModal';
import { CANDY_LEVELS, getUnlockedLevel } from '../../utils/candyLevels';
import candyBg from '../../assets/candy_bg.jpg';

export const LobbyPage: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { isQueueing, setQueueing, startLevelGame } = useGameStore();
  const [isLevelMapOpen, setIsLevelMapOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(socketService.socket?.connected || false);

  useEffect(() => {
    const socket = socketService.socket;
    if (!socket) return;

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    setIsConnected(socket.connected);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  const unlockedLevel = getUnlockedLevel();

  const handleStartQueue = () => {
    if (!user) return;
    setQueueing(true);
    socketService.socket?.emit('match:join_queue', { userId: user.id, username: user.username });
  };

  const handleCancelQueue = () => {
    setQueueing(false);
    socketService.socket?.emit('match:leave_queue');
  };

  const handleStartInstantLevel = () => {
    setQueueing(false);
    const targetLevel = CANDY_LEVELS.find((l) => l.id === unlockedLevel) || CANDY_LEVELS[0];
    const board = generateCleanBoard();
    startLevelGame(targetLevel, board);
  };

  return (
    <div
      className="relative h-screen max-h-screen bg-cover bg-center flex flex-col items-center justify-center p-3 sm:p-6 overflow-hidden select-none"
      style={{ backgroundImage: `url(${candyBg})` }}
    >
      <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-[3px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg bg-slate-900/90 border-2 border-pink-500/30 rounded-3xl p-5 sm:p-7 flex flex-col items-center text-center shadow-[0_16px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl">
        <button onClick={logout} className="absolute top-4 right-4 text-xs text-rose-400 hover:underline cursor-pointer">
          Logout
        </button>

        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-2xl sm:text-3xl font-extrabold mb-3 shadow-cyan-500/20 shadow-lg border-2 border-white/30">
          {user?.username.charAt(0).toUpperCase()}
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">{user?.username}</h2>
        <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-slate-400 mb-3">
          <span>Rating: <strong className="text-cyan-400">{user?.eloRating} ELO</strong></span>
          <span>Wins: <strong className="text-emerald-400">{user?.matchesWon}</strong></span>
          <span>Losses: <strong className="text-rose-400">{user?.matchesLost}</strong></span>
        </div>

        {/* Backend Connection Status Badge */}
        <div className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full bg-slate-950/80 border border-slate-700/80 mb-6">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <span className={isConnected ? 'text-emerald-300' : 'text-amber-300'}>
            {isConnected ? 'Backend Online (Port 5000)' : 'Connecting to Backend...'}
          </span>
        </div>

        {isQueueing ? (
          <div className="flex flex-col items-center gap-4 w-full">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-cyan-400 font-semibold animate-pulse text-sm">Searching for Rival (Waiting for Player 2)...</p>
            <p className="text-xs text-slate-400 max-w-sm">
              Matchmaking requires two players. Open another window/incognito to pair against yourself, or fight the AI Bot instantly below:
            </p>
            <div className="flex gap-3 mt-2">
              <button
                onClick={handleStartInstantLevel}
                className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer shadow-lg"
              >
                🤖 Fight AI Bot Instantly
              </button>
              <button
                onClick={handleCancelQueue}
                className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                Cancel Queue
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-3.5">
            <button
              onClick={handleStartInstantLevel}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 text-lg font-black text-white shadow-[0_10px_30px_rgba(16,185,129,0.55)] hover:from-emerald-400 hover:to-teal-500 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-3 border-2 border-emerald-200/50"
            >
              <span className="text-2xl animate-bounce">🤖</span>
              <span>PLAY LEVEL {unlockedLevel} (VS AI BOSS)</span>
            </button>

            <button
              onClick={() => setIsLevelMapOpen(true)}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-pink-500 to-purple-600 text-base font-black text-white shadow-lg hover:scale-[1.02] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 border-2 border-amber-300/40"
            >
              <span>🗺️</span>
              <span>CANDY SAGA LEVEL MAP (1 - 8)</span>
            </button>

            <button
              onClick={handleStartQueue}
              className="w-full py-3 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 text-xs font-bold text-slate-300 border border-slate-700 hover:text-white transition-all cursor-pointer"
            >
              🌐 1v1 Online Multiplayer Queue
            </button>
          </div>
        )}
      </div>

      {/* Level Selection Modal */}
      <LevelMapModal isOpen={isLevelMapOpen} onClose={() => setIsLevelMapOpen(false)} />
    </div>
  );
};
