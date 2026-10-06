import type { BoardGrid, SwapAction, CascadeStep } from './game.types';

export interface ServerToClientEvents {
  'match:queued': () => void;
  'match:started': (payload: { roomId: string; yourBoard: BoardGrid; opponentName: string }) => void;
  'game:swap_rejected': (payload: { swap: SwapAction }) => void;
  'game:cascade_resolved': (payload: {
    steps: CascadeStep[];
    finalBoard: BoardGrid;
    damageDealt: number;
    playerHP: number;
    playerShield: number;
    opponentHP: number;
  }) => void;
  'game:opponent_attacked': (payload: {
    damageTaken: number;
    opponentBoard: BoardGrid;
    opponentHP: number;
    opponentShield: number;
    myHP: number;
  }) => void;
  'game:over': (payload: { winnerId: string; reason: string }) => void;
}

export interface ClientToServerEvents {
  'match:join_queue': (payload: { userId: string; username: string }) => void;
  'match:leave_queue': () => void;
  'game:request_swap': (swap: SwapAction) => void;
  'game:forfeit': () => void;
}