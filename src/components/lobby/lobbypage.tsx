import React from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useGameStore } from '../../store/useGameStore';
import { socketService } from '../../services/socket.service';

export const LobbyPage: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { isQueueing, setQueueing } = useGameStore();

  const handleStartQueue = () => {
    if (!user) return;
    setQueueing(true);
    socketService.socket?.emit('match:join_queue', { userId: user.id, username: user.username });
  };

  const handleCancelQueue = () => {
    setQueueing(false);
    socketService.socket?.emit('match:leave_queue');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col items-center text-center shadow-2xl relative">
        <button onClick={logout} className="absolute top-4 right-4 text-xs text-rose-400 hover:underline cursor-pointer">
          Logout
        </button>

        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-3xl font-extrabold mb-4 shadow-cyan-500/20 shadow-lg">
          {user?.username.charAt(0).toUpperCase()}
        </div>

        <h2 className="text-2xl font-bold text-white mb-1">{user?.username}</h2>
        <div className="flex items-center gap-4 text-sm text-slate-400 mb-8">
          <span>Rating: <strong className="text-cyan-400">{user?.eloRating} ELO</strong></span>
          <span>Wins: <strong className="text-emerald-400">{user?.matchesWon}</strong></span>
          <span>Losses: <strong className="text-rose-400">{user?.matchesLost}</strong></span>
        </div>

        {isQueueing ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-cyan-400 font-semibold animate-pulse text-sm">Searching for Rival...</p>
            <button
              onClick={handleCancelQueue}
              className="px-6 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition cursor-pointer"
            >
              Cancel Matchmaking
            </button>
          </div>
        ) : (
          <button
            onClick={handleStartQueue}
            className="w-full max-w-sm py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-lg font-bold text-white shadow-lg hover:from-cyan-400 hover:to-blue-500 active:scale-95 transition-all cursor-pointer"
          >
            FIND 1v1 MATCH
          </button>
        )}
      </div>
    </div>
  );
};