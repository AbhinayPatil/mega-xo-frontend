import { GameState } from './game.model';
import { Player } from './player.model';

export interface Room {
  roomCode: string;
  players: Player[];
  gameState: GameState;
}

export interface RoomStatus {
  players: Player[];
  bothJoined: boolean;
  gameState: GameState;
}
