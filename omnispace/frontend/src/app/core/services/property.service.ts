import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Property } from '../models/property.model';
import { Observable, of, catchError, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PropertyService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/properties`;

  propertiesSignal = signal<Property[]>([]);

  getProperties(): Observable<Property[]> {
    return this.http.get<Property[]>(this.apiUrl).pipe(
      map(serverProps => {
        const list = serverProps || [];
        this.propertiesSignal.set(list);
        return list;
      }),
      catchError(err => {
        console.warn('Could not fetch properties from MongoDB database:', err);
        return of(this.propertiesSignal());
      })
    );
  }

  getPropertyById(id: string): Observable<Property | undefined> {
    return this.http.get<Property>(`${this.apiUrl}/${id}`).pipe(
      map(prop => prop || undefined),
      catchError(err => {
        console.warn(`Property ${id} not found in database:`, err);
        return of(undefined);
      })
    );
  }

  addProperty(property: Omit<Property, 'id' | 'createdAt'>): Observable<Property> {
    return this.http.post<Property>(this.apiUrl, property).pipe(
      tap(createdProp => {
        const current = this.propertiesSignal();
        this.propertiesSignal.set([createdProp, ...current.filter(p => p.id !== createdProp.id)]);
      })
    );
  }
}
