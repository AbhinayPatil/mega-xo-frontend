import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { WaitingRoomComponent } from './pages/waiting-room/waiting-room.component';
import { GameBoardComponent } from './pages/game-board/game-board.component';
import { RulesComponent } from './pages/rules/rules.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'waiting-room', component: WaitingRoomComponent },
  { path: 'game', component: GameBoardComponent },
  { path: 'rules', component: RulesComponent },
  { path: '**', redirectTo: '' }
];
