import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="navbar-header">
      <div class="container navbar-container">
        <a routerLink="/" class="brand-logo">
          <div class="logo-icon"><i class="fa-solid fa-cube"></i></div>
          <span class="brand-name">Omni<span class="brand-accent">Space</span></span>
        </a>

        <nav class="nav-links">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">Home</a>
          <a routerLink="/properties" routerLinkActive="active">Browse Properties</a>
          <a routerLink="/designer" routerLinkActive="active" class="highlight-link">
            <i class="fa-solid fa-wand-magic-sparkles"></i> Design Studio
          </a>
        </nav>

        <div class="nav-actions">
          <a routerLink="/properties/new" class="btn btn-outline btn-sm">
            <i class="fa-solid fa-plus"></i> List Property
          </a>

          <ng-container *ngIf="auth.currentUser(); else guestView">
            <div class="user-menu">
              <span class="user-avatar"><i class="fa-solid fa-user"></i></span>
              <span class="user-name">{{ auth.currentUser()?.name }}</span>
              <button (click)="auth.logout()" class="btn-logout" title="Log out">
                <i class="fa-solid fa-right-from-bracket"></i>
              </button>
            </div>
          </ng-container>

          <ng-template #guestView>
            <a routerLink="/login" class="btn btn-primary btn-sm">Log In</a>
          </ng-template>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .navbar-header {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--gray-border);
      position: sticky;
      top: 0;
      z-index: 1000;
      height: 72px;
      display: flex;
      align-items: center;
    }

    .navbar-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
    }

    .brand-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 1.4rem;
      font-weight: 800;
      color: var(--dark);

      .logo-icon {
        width: 38px;
        height: 38px;
        background: linear-gradient(135deg, var(--primary), var(--accent));
        color: white;
        border-radius: var(--radius-sm);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        box-shadow: 0 4px 10px rgba(255, 90, 95, 0.3);
      }

      .brand-accent {
        color: var(--primary);
      }
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 28px;

      a {
        font-weight: 500;
        font-size: 0.95rem;
        color: var(--dark-soft);

        &:hover, &.active {
          color: var(--primary);
        }

        &.highlight-link {
          color: var(--secondary);
          font-weight: 700;
          background: rgba(0, 166, 153, 0.08);
          padding: 6px 14px;
          border-radius: var(--radius-full);

          &:hover {
            background: rgba(0, 166, 153, 0.16);
          }
        }
      }
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .user-menu {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 12px;
      background: var(--gray-light);
      border-radius: var(--radius-full);

      .user-avatar {
        width: 28px;
        height: 28px;
        background: var(--dark);
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.8rem;
      }

      .user-name {
        font-size: 0.9rem;
        font-weight: 600;
      }

      .btn-logout {
        background: transparent;
        color: var(--gray-muted);
        font-size: 0.9rem;

        &:hover {
          color: var(--primary);
        }
      }
    }

    .btn-sm {
      padding: 8px 16px;
      font-size: 0.88rem;
    }
  `]
})
export class NavbarComponent {
  auth = inject(AuthService);
}
