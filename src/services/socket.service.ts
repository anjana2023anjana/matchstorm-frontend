import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '../types/socket.types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  private static instance: SocketService;
  public socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  public connect(token?: string): Socket<ServerToClientEvents, ClientToServerEvents> {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        autoConnect: true,
        transports: ['websocket'],
        auth: token ? { token } : undefined,
        reconnection: true,
        reconnectionAttempts: 4,
        reconnectionDelay: 5000,
        timeout: 4000,
      });

      this.socket.on('connect_error', () => {
        // Handled gracefully to prevent flooding browser console
      });
    }
    return this.socket;
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = SocketService.getInstance();