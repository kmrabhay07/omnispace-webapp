import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="auth-page animate-fade-in">
      <div class="auth-card">
        <div class="auth-header">
          <div class="logo-icon"><i class="fa-solid fa-cube"></i></div>
          <h2>Welcome Back</h2>
          <p>Log in to access your saved interior designs and property listings</p>
        </div>

        <div *ngIf="returnUrl.includes('properties/new')" class="info-alert">
          <i class="fa-solid fa-circle-info"></i>
          <span>Please log in or create an account to list your property. Your account details will be attached as the verified host.</span>
        </div>

        <!-- Social Login (Google & Apple) -->
        <div class="social-login-grid">
          <button type="button" class="btn-social btn-google" (click)="loginWithSocial('Google')">
            <svg class="social-icon" viewBox="0 0 24 24" width="18" height="18">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          <button type="button" class="btn-social btn-apple" (click)="loginWithSocial('Apple')">
            <i class="fa-brands fa-apple social-icon"></i>
            <span>Continue with Apple</span>
          </button>
        </div>

        <div class="auth-divider">
          <span>or sign in with email</span>
        </div>

        <form (ngSubmit)="onLogin()">
          <div class="form-group">
            <label>Email Address</label>
            <input type="email" [(ngModel)]="email" name="email" required placeholder="alex@example.com">
          </div>

          <div class="form-group">
            <label>Password</label>
            <input type="password" [(ngModel)]="password" name="password" required placeholder="••••••••">
          </div>

          <button type="submit" class="btn btn-primary btn-full mt-3">
            Log In & Continue <i class="fa-solid fa-arrow-right"></i>
          </button>
        </form>

        <div class="auth-footer">
          Don't have an account? <a [routerLink]="['/register']" [queryParams]="{ returnUrl: returnUrl }">Register here</a>
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

      .social-login-grid {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-bottom: 20px;

        .btn-social {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 10px 16px;
          border-radius: var(--radius-sm);
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;

          &.btn-google {
            background: #ffffff;
            border: 1.5px solid #e2e8f0;
            color: #334155;

            &:hover {
              background: #f8fafc;
              border-color: #cbd5e1;
              box-shadow: 0 2px 6px rgba(0,0,0,0.06);
            }
          }

          &.btn-apple {
            background: #000000;
            border: 1.5px solid #000000;
            color: #ffffff;

            .social-icon {
              font-size: 1.1rem;
            }

            &:hover {
              background: #1e293b;
              box-shadow: 0 2px 6px rgba(0,0,0,0.2);
            }
          }
        }
      }

      .auth-divider {
        position: relative;
        text-align: center;
        margin: 24px 0 20px;

        &::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: var(--gray-border);
        }

        span {
          position: relative;
          background: var(--white);
          padding: 0 12px;
          font-size: 0.8rem;
          color: var(--gray-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
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
export class LoginComponent implements OnInit {
  auth = inject(AuthService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  email = 'alex@omnispace.com';
  password = 'password123';
  returnUrl = '/';

  ngOnInit() {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  onLogin() {
    if (!this.email || !this.password) {
      alert('Please enter your email and password!');
      return;
    }

    this.auth.login({
      email: this.email,
      password: this.password
    }).subscribe(() => {
      this.router.navigateByUrl(this.returnUrl);
    });
  }

  loginWithSocial(provider: 'Google' | 'Apple') {
    const defaultEmail = provider === 'Google' ? 'ak24nov2002@gmail.com' : 'abhay.kumar@icloud.com';
    const defaultName = 'Abhay Kumar';

    this.auth.register({
      name: defaultName,
      email: defaultEmail,
      password: `oauth_${provider.toLowerCase()}_pass123`
    }).subscribe(() => {
      alert(`🎉 Successfully logged in with ${provider} (${defaultEmail})!`);
      this.router.navigateByUrl(this.returnUrl);
    });
  }
}
