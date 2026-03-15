import { Component, inject, OnInit, OnDestroy, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { GameService } from '../../core/services/game.service';
import { WebsocketService } from '../../core/services/websocket.service';
import { GameState, MoveRequest, MessageType } from '../../core/models/game.model';
import { generateAnimalName } from '../../shared/utils/animal-names.util';

@Component({
  selector: 'app-game-board',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-board.component.html',
  styleUrls: ['./game-board.component.scss']
})
export class GameBoardComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private gameService = inject(GameService);
  private websocketService = inject(WebsocketService);

  mode: 'local' | 'online' = 'local';
  roomCode: string | null = null;
  playerId: string | null = null; // My ID in online mode
  
  // Local mode state
  localPlayerXName = 'Player 1';
  localPlayerOName = 'Player 2';
  
  // Global state signals
  gameState = signal<GameState | null>(null);

  constructor() {
    effect(() => {
      const state = this.gameService.gameState();
      if (state) {
        this.gameState.set(state);
      }
    }, { allowSignalWrites: true });
  }

  async ngOnInit() {
    this.gameService.resetGameState();

    this.route.queryParams.subscribe(async params => {
      this.mode = params['mode'] || 'local';
      
      if (this.mode === 'local') {
        this.websocketService.disconnect();
        this.localPlayerXName = generateAnimalName();
        this.localPlayerOName = generateAnimalName();
        while (this.localPlayerOName === this.localPlayerXName) {
          this.localPlayerOName = generateAnimalName();
        }
        this.initLocalGame();
      } else {
        this.roomCode = params['room'];
        this.playerId = sessionStorage.getItem('playerId') || params['pId'];
        if (!this.roomCode || !this.playerId) {
          this.router.navigate(['/']);
          return;
        }
        
        // BUG 7 fix setup: join game handles subscriptions and REST fallback
        await this.gameService.joinGame(this.roomCode); 
      }
    });
  }

  ngOnDestroy() {
    if (this.mode === 'online' && this.roomCode) {
      this.gameService.leaveGame(this.roomCode);
    } else {
      this.websocketService.disconnect();
    }
    this.gameService.resetGameState();
  }

  initLocalGame() {
    const emptyBoard = Array(9).fill(null).map(() => Array(9).fill(null));
    const emptyPlayable = Array(9).fill(null).map(() => Array(9).fill(true));
    
    const initialState: GameState = {
      roomId: 'local',
      board: emptyBoard,
      cellPlayable: emptyPlayable,
      activeMacro: null,
      currentPlayerId: 'p1',
      playerX: 'p1',
      playerO: 'p2',
      playerXName: this.localPlayerXName,
      playerOName: this.localPlayerOName,
      winner: null,
      gameOver: false,
      macroCellWinners: {}
    };
    
    this.gameState.set(initialState);
  }

  onCellClick(macroRow: number, macroCol: number, microRow: number, microCol: number) {
    const state = this.gameState();
    if (!state || state.gameOver) return;

    // Is it my turn?
    if (this.mode === 'online' && state.currentPlayerId !== this.playerId) return;

    const absR = macroRow * 3 + microRow;
    const absC = macroCol * 3 + microCol;

    if (!state.cellPlayable[absR]?.[absC]) return;

    if (this.mode === 'online' && this.roomCode) {
      const move: MoveRequest = {
        playerId: this.playerId!,
        macroRow, macroCol, microRow, microCol
      };
      this.gameService.makeMove(this.roomCode, move);
    } else {
      this.processLocalMove(macroRow, macroCol, microRow, microCol);
    }
  }

  // Purely frontend logic for local mode
  processLocalMove(macroRow: number, macroCol: number, microRow: number, microCol: number) {
    const state = JSON.parse(JSON.stringify(this.gameState())) as GameState; // Deep copy
    const absR = macroRow * 3 + microRow;
    const absC = macroCol * 3 + microCol;

    const symbol = state.currentPlayerId === state.playerX ? 'X' : 'O';
    state.board[absR][absC] = symbol;

    // Check Macro Winner
    const macroGrid = [];
    for (let i = 0; i < 3; i++) {
        const row = [];
        for (let j = 0; j < 3; j++) {
            row.push(state.board[macroRow * 3 + i][macroCol * 3 + j]);
        }
        macroGrid.push(row);
    }
    const macroWinnerId = this.checkMacroWinner(macroGrid) ? state.currentPlayerId : null;
    if (macroWinnerId) {
      state.macroCellWinners[`${macroRow},${macroCol}`] = macroWinnerId;
    }

    // Check Game Winner
    const gameWinnerId = this.checkGameWinner(state.macroCellWinners);
    if (gameWinnerId) {
      state.winner = gameWinnerId;
      state.gameOver = true;
    } else if (this.isBoardFull(state)) {
      state.winner = 'DRAW';
      state.gameOver = true;
    } else {
      // Determine next macro
      const nextMacroWinner = state.macroCellWinners[`${microRow},${microCol}`];
      if (nextMacroWinner || this.isMacroFull(state, microRow, microCol)) {
        state.activeMacro = null;
      } else {
        state.activeMacro = [microRow, microCol];
      }
      
      // Swap turn
      state.currentPlayerId = state.currentPlayerId === state.playerX ? state.playerO : state.playerX;
    }

    this.updatePlayableCells(state);
    this.gameState.set(state);
  }

  // Local helper methods
  checkMacroWinner(grid: any[][]): string | null {
    // Check rows/cols
    for (let i = 0; i < 3; i++) {
      if (grid[i][0] && grid[i][0] === grid[i][1] && grid[i][1] === grid[i][2]) return grid[i][0];
      if (grid[0][i] && grid[0][i] === grid[1][i] && grid[1][i] === grid[2][i]) return grid[0][i];
    }
    // Diagonals
    if (grid[0][0] && grid[0][0] === grid[1][1] && grid[1][1] === grid[2][2]) return grid[0][0];
    if (grid[0][2] && grid[0][2] === grid[1][1] && grid[1][1] === grid[2][0]) return grid[0][2];
    return null;
  }

  checkGameWinner(winners: { [key: string]: string }): string | null {
    const grid: any[][] = [[null,null,null],[null,null,null],[null,null,null]];
    for(let r=0; r<3; r++) {
      for(let c=0; c<3; c++) {
        grid[r][c] = winners[`${r},${c}`] || null;
      }
    }
    return this.checkMacroWinner(grid); // reuse logic!
  }

  isMacroFull(state: GameState, maR: number, maC: number): boolean {
    for(let r=0; r<3; r++) {
      for(let c=0; c<3; c++) {
        if (!state.board[maR*3 + r][maC*3 + c]) return false;
      }
    }
    return true;
  }
  
  isBoardFull(state: GameState): boolean {
    for(let r=0; r<9; r++) {
      for(let c=0; c<9; c++) {
        if (!state.board[r][c]) return false;
      }
    }
    return true;
  }

  updatePlayableCells(state: GameState) {
    if (state.gameOver) {
      for(let r=0; r<9; r++) {
        for(let c=0; c<9; c++) state.cellPlayable[r][c] = false;
      }
      return;
    }
    
    for (let maR = 0; maR < 3; maR++) {
      for (let maC = 0; maC < 3; maC++) {
        const isActive = !state.activeMacro || (state.activeMacro[0] === maR && state.activeMacro[1] === maC);
        const isWonOrFull = state.macroCellWinners[`${maR},${maC}`] || this.isMacroFull(state, maR, maC);
        
        for (let miR = 0; miR < 3; miR++) {
          for (let miC = 0; miC < 3; miC++) {
            const absR = maR * 3 + miR;
            const absC = maC * 3 + miC;
            if (isActive && !isWonOrFull && !state.board[absR][absC]) {
              state.cellPlayable[absR][absC] = true;
            } else {
              state.cellPlayable[absR][absC] = false;
            }
          }
        }
      }
    }
  }

  // Template Helpers
  get macroRows() { return [0, 1, 2]; }
  get microRows() { return [0, 1, 2]; }

  isActiveMacro(r: number, c: number): boolean {
    const state = this.gameState();
    if (!state || state.gameOver) return false;
    if (!state.activeMacro) return true; // all open
    return state.activeMacro[0] === r && state.activeMacro[1] === c;
  }

  getMacroWinner(r: number, c: number): string | null {
    const state = this.gameState();
    return state ? state.macroCellWinners[`${r},${c}`] : null;
  }
  
  getMacroWinnerSymbol(r: number, c: number): string {
    const winnerId = this.getMacroWinner(r, c);
    return winnerId === this.gameState()?.playerX ? 'X' : 'O';
  }

  getMicroCellSymbol(maR: number, maC: number, miR: number, miC: number): string {
    const state = this.gameState();
    if (!state) return '';
    return state.board[maR * 3 + miR][maC * 3 + miC] || '';
  }

  isMicroCellPlayable(maR: number, maC: number, miR: number, miC: number): boolean {
    const state = this.gameState();
    if (!state) return false;
    
    // In online mode, don't show playable hover if it's not my turn
    if (this.mode === 'online' && state.currentPlayerId !== this.playerId) return false;

    return state.cellPlayable[maR * 3 + miR][maC * 3 + miC] || false;
  }

  // Turn Indication
  isPlayerXTurn(): boolean {
    const state = this.gameState();
    return state ? state.currentPlayerId === state.playerX : false;
  }

  getPlayerXName(): string {
    const state = this.gameState();
    if (this.mode === 'online' && state && state.playerXName) {
      return state.playerXName;
    }
    return this.mode === 'local' ? this.localPlayerXName : 'Player X';
  }

  getPlayerOName(): string {
    const state = this.gameState();
    if (this.mode === 'online' && state && state.playerOName) {
      return state.playerOName;
    }
    return this.mode === 'local' ? this.localPlayerOName : 'Player O';
  }
  
  // Bug 1 Fix: popupType
  get popupType(): 'victory' | 'defeat' | 'draw' | null {
    const state = this.gameState();
    if (!state || !state.winner) return null;
    if (state.winner === 'DRAW') return 'draw';
    
    if (this.mode === 'local') return 'victory';
    
    if (state.winner === this.playerId) return 'victory';
    return 'defeat';
  }

  // Bug 5 Fix: Local winner name
  get winnerName(): string | null {
    const state = this.gameState();
    if (this.mode !== 'local' || !state || !state.winner || state.winner === 'DRAW') return null;
    
    if (state.winner === state.playerX) return this.localPlayerXName;
    if (state.winner === state.playerO) return this.localPlayerOName;
    return null;
  }

  // Bug 6 Fix: Return Home Reset
  goHome() {
    sessionStorage.removeItem('playerId');
    sessionStorage.removeItem('roomCode');
    this.websocketService.disconnect();
    this.gameService.resetGameState();
    this.router.navigate(['/']);
  }
}
