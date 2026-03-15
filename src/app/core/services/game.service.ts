import { Injectable, signal, inject } from '@angular/core';
import { GameState, MoveRequest, GameMessage } from '../models/game.model';
import { WebsocketService } from './websocket.service';
import { RoomService } from './room.service';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private wsService = inject(WebsocketService);
  private roomService = inject(RoomService);
  
  public gameState = signal<GameState | null>(null);
  public gameMessages = signal<GameMessage[]>([]);

  async joinGame(roomCode: string): Promise<void> {
    await this.wsService.connect();
    
    this.wsService.subscribe(`/topic/game/${roomCode}`).subscribe((msg: GameMessage) => {
      this.handleGameMessage(msg);
    });
    
    this.wsService.subscribe(`/topic/room/${roomCode}`).subscribe((msg: GameMessage) => {
      this.handleGameMessage(msg);
    });

    if (roomCode && roomCode !== 'init') {
      try {
        const state = await this.roomService.getGameState(roomCode).toPromise();
        if (state) {
          this.gameState.set(state);
        }
      } catch (err) {
        console.error('[GameService] Error fetching initial state:', err);
      }
    }
  }

  leaveGame(roomCode: string): void {
    this.wsService.unsubscribeTopic(`/topic/game/${roomCode}`);
    this.wsService.unsubscribeTopic(`/topic/room/${roomCode}`);
  }

  startGame(roomCode: string): void {
    this.wsService.send(`/app/room/${roomCode}/start`, {});
  }

  makeMove(roomCode: string, move: MoveRequest): void {
    this.wsService.send(`/app/game/${roomCode}/move`, move);
  }

  private handleGameMessage(msg: GameMessage): void {
    if (msg.gameState) {
      this.gameState.set(msg.gameState);
    }
    this.gameMessages.update(msgs => [...msgs, msg]);
  }
  
  disconnect(): void {
    this.wsService.disconnect();
  }

  resetGameState(): void {
    this.gameState.set(null);
    this.gameMessages.set([]);
  }
}
