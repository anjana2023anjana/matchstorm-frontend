import React, { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useGameStore } from '../store/useGameStore';
import { socketService } from '../services/socket.service';
import { AuthPage } from '../pages/Auth/AuthPage';
import { LobbyPage } from '../pages/Lobby/LobbyPage';
import { ArenaPage } from '../pages/Arena/ArenaPage';

export const App: React.FC = () => {
  const token = useAuthStore((state) => state.token);
  const { roomId, setMatchStarted, setPlayerBoard, updateStats, setGameOver } = useGameStore();

  useEffect(() => {
    if (!token) return;

    const socket = socketService.connect(token);

    socket.on('match:started', ({ roomId, yourBoard, opponentName }) => {
      setMatchStarted(roomId, yourBoard, opponentName);
    });

    socket.on('game:cascade_resolved', (payload) => {
      setPlayerBoard(payload.finalBoard);
      updateStats(payload.playerHP, payload.playerShield, payload.opponentHP);
    });

    socket.on('game:opponent_attacked', (payload) => {
      updateStats(payload.myHP, 0, payload.opponentHP, payload.opponentShield);
    });

    socket.on('game:over', ({ winnerId }) => {
      setGameOver(winnerId);
    });

    return () => {
      socket.off('match:started');
      socket.off('game:cascade_resolved');
      socket.off('game:opponent_attacked');
      socket.off('game:over');
    };
  }, [token, setMatchStarted, setPlayerBoard, updateStats, setGameOver]);

  if (!token) {
    return <AuthPage />;
  }

  if (roomId) {
    return <ArenaPage />;
  }

  return <LobbyPage />;
};

export default App;