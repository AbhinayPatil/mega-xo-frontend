import { Component, inject, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { RoomService } from '../../core/services/room.service';
import { GameService } from '../../core/services/game.service';
import { Player } from '../../core/models/player.model';
import { MessageType } from '../../core/models/game.model';
import { generateAnimalName } from '../../shared/utils/animal-names.util';

@Component({
  selector: 'app-waiting-room',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './waiting-room.component.html',
  styleUrls: ['./waiting-room.component.scss']
})
export class WaitingRoomComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private roomService = inject(RoomService);
  private gameService = inject(GameService);

  activeTab: 'create' | 'join' = 'create';
  
  roomCode: string | null = null;
  joinCode: string = '';
  
  currentPlayer!: Player;
  players: Player[] = [];
  
  isHost: boolean = false;
  errorMsg: string = '';
  
  gameStarting: boolean = false;

  constructor() {
    effect(() => {
      const messages = this.gameService.gameMessages();
      if (messages.length > 0) {
        const lastMsg = messages[messages.length - 1];
        if (lastMsg.type === MessageType.PLAYER_JOINED) {
          if (this.roomCode) {
            this.roomService.getRoomStatus(this.roomCode).subscribe(status => {
              this.players = status.players;
            });
          }
        } else if (lastMsg.type === MessageType.GAME_STARTED) {
          this.gameStarting = true;
          this.router.navigate(['/game'], {
            queryParams: { mode: 'online', room: this.roomCode, pId: this.currentPlayer.id }
          });
        }
      }
    });
  }

  ngOnInit(): void {
    // Reset all room/websocket state on every visit to this page
    this.gameService.disconnect();
    this.roomService.clearRoomState();

    this.roomCode = null;
    this.players = [];
    this.isHost = false;
  }

  ngOnDestroy() {
    if (!this.gameStarting) {
      this.gameService.disconnect();
    }
  }

  setTab(tab: 'create' | 'join') {
    this.activeTab = tab;
    this.errorMsg = '';
  }

  async createRoom() {
    try {
      this.currentPlayer = { id: '', name: generateAnimalName() };
      
      // Step 1: Connect WebSocket first — AWAIT it
      await this.gameService.joinGame('init'); // Connects the socket
      
      this.roomService.createRoom(this.currentPlayer).subscribe({
        next: (room) => {
          this.roomCode = room.roomCode;
          this.currentPlayer = room.players[0]; 
          this.players = room.players;
          this.isHost = true;
          
          sessionStorage.setItem('playerId', this.currentPlayer.id);
          sessionStorage.setItem('roomCode', this.roomCode);
          sessionStorage.setItem('playerName', this.currentPlayer.name);

          // Step 3: Subscribe AFTER connection is confirmed
          this.gameService.joinGame(this.roomCode);
        },
        error: () => this.errorMsg = 'Failed to create room.'
      });
    } catch (err) {
      console.error('[Room] Failed to connect WebSocket:', err);
      this.errorMsg = 'Failed to connect to server.';
    }
  }

  async joinRoom() {
    if (!this.joinCode) return;
    this.joinCode = this.joinCode.toUpperCase().trim();
    
    try {
      this.currentPlayer = { id: '', name: generateAnimalName() };
      
      // Step 1: Connect WebSocket first — AWAIT it
      await this.gameService.joinGame('init'); 
      
      this.roomService.joinRoom(this.joinCode, this.currentPlayer).subscribe({
        next: (room) => {
          this.roomCode = room.roomCode;
          this.currentPlayer = room.players[room.players.length - 1];
          this.players = room.players;
          this.isHost = false;
          
          sessionStorage.setItem('playerId', this.currentPlayer.id);
          sessionStorage.setItem('roomCode', this.roomCode);
          sessionStorage.setItem('playerName', this.currentPlayer.name);

          // Step 3: Subscribe AFTER connection is confirmed
          this.gameService.joinGame(this.roomCode);
        },
        error: (err) => {
          this.errorMsg = err.error?.error || 'Room not found or full.';
        }
      });
    } catch (err) {
      console.error('[Room] Failed to connect WebSocket:', err);
      this.errorMsg = 'Failed to connect to server.';
    }
  }

  startBattle() {
    if (this.isHost && this.players.length === 2 && this.roomCode) {
      this.gameService.startGame(this.roomCode);
    }
  }

  copyCode() {
    if (this.roomCode) {
      navigator.clipboard.writeText(this.roomCode);
    }
  }
}
