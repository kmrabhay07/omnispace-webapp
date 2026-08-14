import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="auth-page animate-fade-in">
      <div class="auth-card">
        <div class="auth-header">
          <div class="logo-icon"><i class="fa-solid fa-cube"></i></div>
          <h2>Create Your Account</h2>
          <p>Join OmniSpace to explore listings and build virtual designs</p>
        </div>

        <form (ngSubmit)="onRegister()">
          <div class="form-group">
            <label>Full Name</label>
            <input type="text" [(ngModel)]="name" name="name" required placeholder="Alex Johnson">
          </div>

          <div class="form-group">
            <label>Email Address</label>
            <input type="email" [(ngModel)]="email" name="email" required placeholder="alex@example.com">
          </div>

          <div class="form-group">
            <label>Password</label>
            <input type="password" [(ngModel)]="password" name="password" required placeholder="••••••••">
          </div>

          <button type="submit" class="btn btn-primary btn-full mt-3">
            Register Account <i class="fa-solid fa-arrow-right"></i>
          </button>
        </form>

        <div class="auth-footer">
          Already have an account? <a routerLink="/login">Log in here</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: calc(100vh - 72px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      background: var(--gray-light);

      .auth-card {
        background: var(--white);
        border: 1px solid var(--gray-border);
        border-radius: var(--radius-lg);
        padding: 40px;
        width: 100%;
        max-width: 440px;
        box-shadow: var(--shadow-md);
      }

      .auth-header {
        text-align: center;
        margin-bottom: 28px;

        .logo-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          color: white;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          margin: 0 auto 16px;
        }

        h2 { font-size: 1.8rem; margin-bottom: 6px; }
        p { color: var(--gray-muted); font-size: 0.9rem; }
      }

      .btn-full { width: 100%; }
      .mt-3 { margin-top: 16px; }

      .auth-footer {
        text-align: center;
        margin-top: 24px;
        font-size: 0.9rem;
        color: var(--gray-muted);
        a { color: var(--primary); font-weight: 600; }
      }
    }
  `]
})
export class RegisterComponent {
  auth = inject(AuthService);
  router = inject(Router);

  name = '';
  email = '';
  password = '';

  onRegister() {
    if (!this.name || !this.email || !this.password) return;

    this.auth.setUser({
      id: 'u-' + Date.now(),
      name: this.name,
      email: this.email,
      role: 'USER',
      token: 'mock-jwt-token-new'
    });

    alert('Account created successfully!');
    this.router.navigate(['/']);
  }
}
