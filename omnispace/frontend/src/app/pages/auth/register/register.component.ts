import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
          <p>Join OmniSpace to list properties and design virtual spaces</p>
        </div>

        <div *ngIf="returnUrl.includes('properties/new')" class="info-alert">
          <i class="fa-solid fa-circle-info"></i>
          <span>Create an account to publish your property listing. Your name and email will be linked as the verified owner.</span>
        </div>

        <form (ngSubmit)="onRegister()">
          <div class="form-group">
            <label>Full Name</label>
            <input type="text" [(ngModel)]="name" name="name" required placeholder="Abhay Kumar">
          </div>

          <div class="form-group">
            <label>Email Address</label>
            <input type="email" [(ngModel)]="email" name="email" required placeholder="ak24nov2002@gmail.com">
          </div>

          <div class="form-group">
            <label>Password</label>
            <input type="password" [(ngModel)]="password" name="password" required placeholder="••••••••">
          </div>

          <button type="submit" class="btn btn-primary btn-full mt-3">
            Register & Continue <i class="fa-solid fa-arrow-right"></i>
          </button>
        </form>

        <div class="auth-footer">
          Already have an account? <a [routerLink]="['/login']" [queryParams]="{ returnUrl: returnUrl }">Log in here</a>
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
        margin-bottom: 24px;

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

      .info-alert {
        background: rgba(0, 166, 153, 0.1);
        border: 1px solid var(--secondary);
        color: #007a70;
        padding: 12px 14px;
        border-radius: var(--radius-sm);
        font-size: 0.85rem;
        display: flex;
        align-items: flex-start;
        gap: 10px;
        margin-bottom: 20px;

        i { margin-top: 3px; font-size: 1rem; color: var(--secondary); }
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
export class RegisterComponent implements OnInit {
  auth = inject(AuthService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  name = '';
  email = '';
  password = '';
  returnUrl = '/';

  ngOnInit() {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  onRegister() {
    if (!this.name || !this.email || !this.password) return;

    this.auth.setUser({
      id: 'u-' + Date.now(),
      name: this.name,
      email: this.email,
      role: 'USER',
      token: 'mock-jwt-token-new'
    });

    this.router.navigateByUrl(this.returnUrl);
  }
}
