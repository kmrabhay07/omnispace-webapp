import { Component, inject, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
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
            <i class="fa-solid fa-wand-magic-sparkles"></i> 3D Studio
          </a>
        </nav>

        <div class="nav-actions">
          <a routerLink="/properties/new" class="btn btn-outline btn-sm">
            <i class="fa-solid fa-plus"></i> List Property
          </a>

          <!-- LOGGED IN USER PROFILE DROPDOWN -->
          <ng-container *ngIf="auth.currentUser(); else guestView">
            <div class="profile-dropdown-wrapper">
              <button 
                class="profile-toggle-btn" 
                (click)="toggleProfileDropdown($event)"
                [class.active]="isProfileDropdownOpen"
                title="Account Settings"
              >
                <span class="avatar-circle">
                  {{ getUserInitial() }}
                </span>
                <span class="user-display-name">{{ auth.currentUser()?.name }}</span>
                <i class="fa-solid fa-chevron-down chevron-icon" [class.rotate]="isProfileDropdownOpen"></i>
              </button>

              <!-- DROPDOWN MENU CARD -->
              <div class="profile-menu-card animate-fade-in" *ngIf="isProfileDropdownOpen" (click)="$event.stopPropagation()">
                <div class="menu-user-header">
                  <div class="menu-avatar-large">
                    {{ getUserInitial() }}
                  </div>
                  <div class="menu-user-info">
                    <div class="menu-user-name">{{ auth.currentUser()?.name }}</div>
                    <div class="menu-user-email">{{ auth.currentUser()?.email }}</div>
                    <span class="menu-role-tag"><i class="fa-solid fa-shield-halved"></i> Verified Host</span>
                  </div>
                </div>

                <div class="menu-divider"></div>

                <div class="menu-links-group">
                  <a routerLink="/properties/new" (click)="closeDropdown()" class="menu-item">
                    <i class="fa-solid fa-plus-circle"></i>
                    <span>List a Property</span>
                  </a>
                  <a routerLink="/properties" (click)="closeDropdown()" class="menu-item">
                    <i class="fa-solid fa-building"></i>
                    <span>Browse Properties</span>
                  </a>
                  <a routerLink="/designer" (click)="closeDropdown()" class="menu-item">
                    <i class="fa-solid fa-cube"></i>
                    <span>3D Interior Studio</span>
                  </a>
                </div>

                <div class="menu-divider"></div>

                <button class="menu-logout-btn" (click)="handleLogout()">
                  <i class="fa-solid fa-right-from-bracket"></i>
                  <span>Log Out</span>
                </button>
              </div>
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
      background: rgba(255, 255, 255, 0.96);
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

    .btn-sm {
      padding: 8px 16px;
      font-size: 0.88rem;
    }

    /* PROFILE DROPDOWN STYLES */
    .profile-dropdown-wrapper {
      position: relative;

      .profile-toggle-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 5px 12px 5px 6px;
        background: var(--gray-light);
        border: 1px solid var(--gray-border);
        border-radius: var(--radius-full);
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover, &.active {
          background: #e2e8f0;
          border-color: #cbd5e1;
        }

        .avatar-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary), #e07a5f);
          color: white;
          font-weight: 700;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          justify-content: center;
          text-transform: uppercase;
        }

        .user-display-name {
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--dark);
          max-width: 120px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .chevron-icon {
          font-size: 0.75rem;
          color: var(--gray-muted);
          transition: transform 0.2s ease;

          &.rotate {
            transform: rotate(180deg);
          }
        }
      }

      .profile-menu-card {
        position: absolute;
        top: calc(100% + 10px);
        right: 0;
        width: 270px;
        background: #ffffff;
        border: 1px solid var(--gray-border);
        border-radius: var(--radius-md);
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
        padding: 16px;
        z-index: 1100;

        .menu-user-header {
          display: flex;
          align-items: center;
          gap: 12px;

          .menu-avatar-large {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--primary), #e07a5f);
            color: white;
            font-size: 1.2rem;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
            text-transform: uppercase;
          }

          .menu-user-info {
            flex: 1;
            overflow: hidden;

            .menu-user-name {
              font-size: 0.95rem;
              font-weight: 800;
              color: var(--dark);
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }

            .menu-user-email {
              font-size: 0.8rem;
              color: var(--gray-muted);
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              margin-bottom: 4px;
            }

            .menu-role-tag {
              display: inline-block;
              font-size: 0.7rem;
              font-weight: 700;
              color: var(--secondary);
              background: rgba(0, 166, 153, 0.1);
              padding: 2px 6px;
              border-radius: 4px;
            }
          }
        }

        .menu-divider {
          height: 1px;
          background: var(--gray-border);
          margin: 12px 0;
        }

        .menu-links-group {
          display: flex;
          flex-direction: column;
          gap: 4px;

          .menu-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 10px;
            border-radius: 6px;
            color: var(--dark-soft);
            font-size: 0.88rem;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.15s ease;

            i {
              width: 16px;
              color: var(--gray-muted);
              font-size: 0.9rem;
            }

            &:hover {
              background: var(--gray-light);
              color: var(--primary);

              i { color: var(--primary); }
            }
          }
        }

        .menu-logout-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border-radius: 6px;
          border: none;
          background: transparent;
          color: #ef4444;
          font-size: 0.88rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;

          &:hover {
            background: #fee2e2;
          }
        }
      }
    }
  `]
})
export class NavbarComponent {
  auth = inject(AuthService);
  router = inject(Router);
  eRef = inject(ElementRef);

  isProfileDropdownOpen = false;

  toggleProfileDropdown(event: Event) {
    event.stopPropagation();
    this.isProfileDropdownOpen = !this.isProfileDropdownOpen;
  }

  closeDropdown() {
    this.isProfileDropdownOpen = false;
  }

  getUserInitial(): string {
    const name = this.auth.currentUser()?.name || 'U';
    return name.charAt(0).toUpperCase();
  }

  handleLogout() {
    this.closeDropdown();
    this.auth.logout();
    this.router.navigate(['/']);
  }

  @HostListener('document:click', ['$event'])
  clickout(event: Event) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.isProfileDropdownOpen = false;
    }
  }
}
