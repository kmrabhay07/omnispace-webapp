import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { User } from '../models/user.model';
import { environment } from '../../../environments/environment';

export interface AuthResponse { token: string; type: string; id: string; name: string; email: string; role: string; }
export function validSession(user: User | null): boolean {
  try {
    if (!user?.id || !user.token) return false;
    const payload = JSON.parse(atob(user.token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now();
  } catch { return false; }
}
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSignal = signal<User | null>(this.getStoredUser());
  readonly currentUser = this.currentUserSignal.asReadonly();
  private getStoredUser(): User | null {
    try {
      const value = JSON.parse(localStorage.getItem('omni_user') || 'null');
      if (validSession(value)) return value;
      localStorage.removeItem('omni_user');
    } catch { /* An unavailable browser store must not create a session. */ }
    return null;
  }
  private setUser(user: User | null): void {
    this.currentUserSignal.set(user);
    try {
      if (user) localStorage.setItem('omni_user', JSON.stringify(user));
      else localStorage.removeItem('omni_user');
    } catch { /* The authenticated session still works in memory. */ }
  }
  isLoggedIn(): boolean {
    if (validSession(this.currentUser())) return true;
    this.logout(); return false;
  }
  register(data: { name: string; email: string; password: string }): Observable<AuthResponse> {
    this.logout();
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(tap(res => this.accept(res)));
  }
  login(data: { email: string; password: string }): Observable<AuthResponse> {
    this.logout();
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, data).pipe(tap(res => this.accept(res)));
  }
  private accept(res: AuthResponse) {
    const user: User = { id: res.id, name: res.name, email: res.email, role: res.role, token: res.token };
    if (!validSession(user)) throw new Error('The server did not return a valid session. Please try again.');
    this.setUser(user);
  }
  logout(): void { this.setUser(null); }
}
