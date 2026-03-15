import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Room, RoomStatus } from '../models/room.model';
import { GameState } from '../models/game.model';
import { Player } from '../models/player.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RoomService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/rooms';

  createRoom(creator: Player): Observable<Room> {
    return this.http.post<Room>(`${this.apiUrl}/create`, creator);
  }

  joinRoom(code: string, player: Player): Observable<Room> {
    return this.http.post<Room>(`${this.apiUrl}/join/${code}`, player);
  }

  getRoomStatus(code: string): Observable<RoomStatus> {
    return this.http.get<RoomStatus>(`${this.apiUrl}/${code}/status`);
  }

  getGameState(roomCode: string): Observable<GameState | null> {
    return this.http
      .get<GameState>(`${this.apiUrl}/${roomCode}/gamestate`)
      .pipe(
        catchError(err => {
          if (err.status === 204) return of(null); // No content yet
          if (err.status === 404) return of(null); // Room not found
          return throwError(() => err);
        })
      );
  }

  clearRoomState(): void {
    // Cleanup any room specific state here if needed
  }
}
