import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { AuthResponseDto } from './models/auth.models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <ng-container *ngIf="currentUser$ | async as user; else noNav">
      <nav role="navigation" aria-label="Main navigation">
        <a routerLink="/campaigns" class="brand">Campaign Analytics</a>
        <ul>
          <li>
            <a routerLink="/campaigns" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: false }">
              Campaigns
            </a>
          </li>
          <li>
            <a routerLink="/campaigns/report" routerLinkActive="active">
              Reports
            </a>
          </li>
          <li>
            <span style="color:#b0b8cc; font-size:0.85rem;">{{ user.fullName }}</span>
          </li>
          <li>
            <button class="logout-btn" (click)="logout()" type="button" aria-label="Sign out">
              Sign Out
            </button>
          </li>
        </ul>
      </nav>
    </ng-container>
    <ng-template #noNav></ng-template>
    <main>
      <router-outlet></router-outlet>
    </main>
  `
})
export class AppComponent implements OnInit {
  currentUser$!: Observable<AuthResponseDto | null>;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser$ = this.authService.currentUser$;
  }

  logout(): void {
    this.authService.logout();
    void this.router.navigate(['/login']);
  }
}
