import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Property } from '../models/property.model';
import { MOCK_PROPERTIES } from '../data/mock-properties';
import { Observable, of, catchError, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PropertyService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/properties`;
  private localKey = 'omnispace_user_properties';

  private mockProperties: Property[] = MOCK_PROPERTIES;

  private propertiesSignal = signal<Property[]>(this.getInitialCombinedList());

  private getInitialCombinedList(): Property[] {
    try {
      const local = localStorage.getItem(this.localKey);
      const userProps: Property[] = local ? JSON.parse(local) : [];
      const userIds = new Set(userProps.map(p => p.id));
      const remainingMock = this.mockProperties.filter(p => !userIds.has(p.id));
      return [...userProps, ...remainingMock];
    } catch {
      return this.mockProperties;
    }
  }

  private persistUserProperties(prop: Property) {
    try {
      const local = localStorage.getItem(this.localKey);
      const userProps: Property[] = local ? JSON.parse(local) : [];
      const filtered = userProps.filter(p => p.id !== prop.id);
      localStorage.setItem(this.localKey, JSON.stringify([prop, ...filtered]));
    } catch (e) {
      console.warn('Could not persist to localStorage:', e);
    }
  }

  getProperties(): Observable<Property[]> {
    return this.http.get<Property[]>(this.apiUrl).pipe(
      map(serverProps => {
        if (serverProps && serverProps.length > 0) {
          const serverIds = new Set(serverProps.map(p => p.id));
          const localList = this.getInitialCombinedList().filter(p => !serverIds.has(p.id));
          const combined = [...serverProps, ...localList];
          this.propertiesSignal.set(combined);
          return combined;
        }
        const initial = this.getInitialCombinedList();
        this.propertiesSignal.set(initial);
        return initial;
      }),
      catchError(err => {
        console.warn('Backend API offline, using local store:', err);
        const fallback = this.getInitialCombinedList();
        this.propertiesSignal.set(fallback);
        return of(fallback);
      })
    );
  }

  getPropertyById(id: string): Observable<Property | undefined> {
    return this.http.get<Property>(`${this.apiUrl}/${id}`).pipe(
      map(res => {
        if (res && (res.id || res.title)) {
          return res;
        }
        return this.findPropertyInLocalOrMock(id);
      }),
      catchError(err => {
        console.warn(`Property ${id} not found in backend, fallback to local/mock:`, err);
        return of(this.findPropertyInLocalOrMock(id));
      })
    );
  }

  private findPropertyInLocalOrMock(id: string): Property | undefined {
    // 1. Check current signal
    const fromSignal = this.propertiesSignal().find(p => p.id === id);
    if (fromSignal) return fromSignal;

    // 2. Check localStorage
    try {
      const local = localStorage.getItem(this.localKey);
      const userProps: Property[] = local ? JSON.parse(local) : [];
      const fromLocal = userProps.find(p => p.id === id);
      if (fromLocal) return fromLocal;
    } catch {}

    // 3. Check mock properties
    return this.mockProperties.find(p => p.id === id);
  }

  addProperty(property: Omit<Property, 'id' | 'createdAt'>): Observable<Property> {
    return this.http.post<Property>(this.apiUrl, property).pipe(
      tap(createdProp => {
        this.persistUserProperties(createdProp);
        const current = this.propertiesSignal();
        this.propertiesSignal.set([createdProp, ...current.filter(p => p.id !== createdProp.id)]);
      }),
      catchError(err => {
        console.warn('Backend POST failed or sleeping, storing locally:', err);
        const fallbackProp: Property = {
          ...property,
          id: 'prop-' + Date.now(),
          createdAt: new Date().toISOString()
        };
        this.persistUserProperties(fallbackProp);
        const current = this.propertiesSignal();
        this.propertiesSignal.set([fallbackProp, ...current.filter(p => p.id !== fallbackProp.id)]);
        return of(fallbackProp);
      })
    );
  }
}
