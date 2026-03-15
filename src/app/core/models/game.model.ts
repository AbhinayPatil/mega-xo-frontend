export interface GameState {
  roomId: string;
  board: string[][];
  cellPlayable: boolean[][];
  activeMacro: number[] | null;
  currentPlayerId: string;
  playerX: string;
  playerO: string;
  playerXName?: string;
  playerOName?: string;
  winner: string | null;
  gameOver: boolean;
  macroCellWinners: { [key: string]: string };
}

export interface MoveRequest {
  playerId: string;
  macroRow: number;
  macroCol: number;
  microRow: number;
  microCol: number;
}

export enum MessageType {
  PLAYER_JOINED = 'PLAYER_JOINED',
  GAME_STARTED = 'GAME_STARTED',
  GAME_STATE_UPDATE = 'GAME_STATE_UPDATE',
  MOVE_MADE = 'MOVE_MADE',
  GAME_OVER = 'GAME_OVER',
  ERROR = 'ERROR'
}

export interface GameMessage {
  type: MessageType;
  gameState: GameState;
  playerId: string;
  message: string;
}
