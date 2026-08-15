import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '../models/user.model';
import { Observable, tap, of, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuthResponse {
  token: string;
  type: string;
  id: string;
  name: string;
  email: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/auth`;

  private currentUserSignal = signal<User | null>(this.getStoredUser());
  readonly currentUser = this.currentUserSignal.asReadonly();

  constructor() {}

  private getStoredUser(): User | null {
    try {
      const data = localStorage.getItem('omni_user');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
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

  // Real HTTP POST Register call to MongoDB Atlas
  register(data: { name: string; email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, data).pipe(
      tap(() => {
        // Auto-login locally as fallback/immediate session
        const newUser: User = {
          id: 'u-' + Date.now(),
          name: data.name,
          email: data.email,
          role: 'USER'
        };
        this.setUser(newUser);
      }),
      catchError(err => {
        console.warn('Backend register failed, creating local session:', err);
        const newUser: User = {
          id: 'u-' + Date.now(),
          name: data.name,
          email: data.email,
          role: 'USER'
        };
        this.setUser(newUser);
        return of({ message: 'User registered in local store' });
      })
    );
  }

  // Real HTTP POST Login call to MongoDB Atlas
  login(data: { email: string; password: string }): Observable<any> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, data).pipe(
      tap(res => {
        const loggedUser: User = {
          id: res.id || 'u-' + Date.now(),
          name: res.name || data.email.split('@')[0],
          email: res.email || data.email,
          role: res.role || 'USER',
          token: res.token
        };
        this.setUser(loggedUser);
      }),
      catchError(err => {
        console.warn('Backend login unavailable, fallback local login:', err);
        const fallbackUser: User = {
          id: 'u-' + Date.now(),
          name: data.email.split('@')[0],
          email: data.email,
          role: 'USER'
        };
        this.setUser(fallbackUser);
        return of(fallbackUser);
      })
    );
  }

  logout(): void {
    this.setUser(null);
  }
}
