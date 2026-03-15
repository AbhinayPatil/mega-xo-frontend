import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-rules',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './rules.component.html',
  styleUrls: ['./rules.component.scss']
})
export class RulesComponent {
  rules = [
    {
      num: 1,
      title: 'The Grand Arena',
      desc: 'The battlefield is a 3×3 grid of arenas. Each arena holds its own 3×3 grid of cells — 81 cells in total.'
    },
    {
      num: 2,
      title: 'The Glowing Arena',
      desc: 'The amber-glowing arena is the only one you may strike in. Your move is confined to its cells.'
    },
    {
      num: 3,
      title: 'You Choose Their Battlefield',
      desc: 'The cell you claim within your arena determines which arena your opponent must fight in next. Choose wisely.'
    },
    {
      num: 4,
      title: 'Full Board Access',
      desc: 'If your move points to an already-conquered or full arena, your opponent gains access to the entire board on their next turn.'
    },
    {
      num: 5,
      title: 'Claiming an Arena',
      desc: 'Win three cells in a row within an arena, and that arena is yours — marked with your giant symbol.'
    },
    {
      num: 6,
      title: 'The Final War',
      desc: 'The nine arenas form one last battlefield. Win three arenas in a row to claim ultimate victory.'
    },
    {
      num: 7,
      title: 'Honor in Draws',
      desc: 'If no warrior can claim three arenas in a row, the battle ends in an honorable draw.'
    },
    {
      num: 8,
      title: 'The Opening Strike',
      desc: 'The first move of the game is free — the entire board is your battlefield.'
    }
  ];
}
