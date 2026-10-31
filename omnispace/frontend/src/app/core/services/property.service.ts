import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { Property } from '../models/property.model';
import { environment } from '../../../environments/environment';
@Injectable({ providedIn: 'root' })
export class PropertyService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/properties`;
  propertiesSignal = signal<Property[]>([]);
  getProperties(page = 0, filters: Record<string, string | number> = {}) {
    return this.http.get<Property[]>(this.apiUrl, { params: { page, ...filters } }).pipe(
      tap(list => { if (page === 0) this.propertiesSignal.set(list); })
    );
  }
  getMyProperties() { return this.http.get<Property[]>(`${this.apiUrl}/mine`); }
  getPropertyById(id: string) { return this.http.get<Property>(`${this.apiUrl}/${encodeURIComponent(id)}`); }
  addProperty(property: Partial<Property>) { return this.http.post<Property>(this.apiUrl, property); }
  updateProperty(id: string, property: Partial<Property>) { return this.http.put<Property>(`${this.apiUrl}/${encodeURIComponent(id)}`, property); }
  deleteProperty(id: string) { return this.http.delete<void>(`${this.apiUrl}/${encodeURIComponent(id)}`); }
}
