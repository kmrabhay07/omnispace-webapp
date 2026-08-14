import { Injectable, signal } from '@angular/core';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSignal = signal<User | null>(this.getStoredUser());

  readonly currentUser = this.currentUserSignal.asReadonly();

  constructor() {}

  private getStoredUser(): User | null {
    const data = localStorage.getItem('omni_user');
    return data ? JSON.parse(data) : null;
  }

  setUser(user: User | null): void {
    if (user) {
      localStorage.setItem('omni_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('omni_user');
    }
    this.currentUserSignal.set(user);
  }

  isLoggedIn(): boolean {
    return this.currentUserSignal() !== null;
  }

  logout(): void {
    this.setUser(null);
  }
}
