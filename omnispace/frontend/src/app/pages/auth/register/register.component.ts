import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

import { FluidBackdropComponent } from '../../../shared/components/fluid-backdrop/fluid-backdrop.component';

@Component({
  selector: 'app-register', standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, FluidBackdropComponent],
  templateUrl: './register.component.html', styleUrl: '../auth-panel.scss'
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

  busy = false;
  error = '';
  private cdr = inject(ChangeDetectorRef);
  onRegister() {
    if (this.busy) return;
    this.busy = true; this.error = '';
    this.auth.register({ name: this.name.trim(), email: this.email.trim(), password: this.password }).subscribe({
      next: () => { this.busy = false; this.router.navigateByUrl(this.returnUrl.startsWith('/') && !this.returnUrl.startsWith('//') ? this.returnUrl : '/'); },
      error: err => { this.busy = false; this.error = err.status === 0 ? 'Unable to connect to OmniSpace. Please try again in a moment. If this continues, contact support.' : (err.error?.message || 'Could not complete your request. Please try again.'); this.cdr.markForCheck(); }
    });
  }
}
