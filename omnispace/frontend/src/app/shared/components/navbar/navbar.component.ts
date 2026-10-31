import { Component, DestroyRef, ElementRef, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { MotionService } from '../../../core/services/motion.service';

@Component({
  selector: 'app-navbar', standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html', styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  readonly auth = inject(AuthService);
  readonly motion = inject(MotionService);
  private readonly router = inject(Router);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly mobileOpen = signal(false);
  readonly profileOpen = signal(false);
  constructor() {
    this.router.events.pipe(filter(event => event instanceof NavigationEnd), takeUntilDestroyed(inject(DestroyRef))).subscribe(() => this.closeMenus());
  }
  closeMenus() { this.mobileOpen.set(false); this.profileOpen.set(false); }
  toggleMobile() { this.profileOpen.set(false); this.mobileOpen.update(open => !open); }
  toggleProfile() { this.mobileOpen.set(false); this.profileOpen.update(open => !open); }
  getUserInitial() { return (this.auth.currentUser()?.name || 'U').charAt(0).toUpperCase(); }
  logout() { this.closeMenus(); this.auth.logout(); this.router.navigate(['/']); }
  @HostListener('document:click', ['$event']) outside(event: Event) { if (!this.element.nativeElement.contains(event.target as Node)) this.closeMenus(); }
  @HostListener('document:keydown.escape') escape() {
    const selector = this.mobileOpen() ? '.menu-toggle' : this.profileOpen() ? '.profile-toggle' : '';
    this.closeMenus();
    if (selector) this.element.nativeElement.querySelector<HTMLButtonElement>(selector)?.focus();
  }
}
