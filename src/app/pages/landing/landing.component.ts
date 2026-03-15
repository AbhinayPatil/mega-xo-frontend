import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { generateAnimalName } from '../../shared/utils/animal-names.util';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent {
  private router = inject(Router);

  startLocalDuel(): void {
    const player1 = generateAnimalName();
    const player2 = generateAnimalName();
    this.router.navigate(['/game'], {
      queryParams: { mode: 'local', p1: player1, p2: player2 }
    });
  }

  gotoBattleOnline(): void {
    this.router.navigate(['/waiting-room']);
  }
}
