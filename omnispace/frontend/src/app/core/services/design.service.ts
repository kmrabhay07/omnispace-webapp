import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DesignProject } from '../models/design-project.model';
import { environment } from '../../../environments/environment';
@Injectable({ providedIn: 'root' })
export class DesignService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/designs`;
  getSavedDesigns() { return this.http.get<DesignProject[]>(this.url); }
  getDesignById(id: string) { return this.http.get<DesignProject>(`${this.url}/${encodeURIComponent(id)}`); }
  saveDesign(project: DesignProject) {
    return project.id
      ? this.http.put<DesignProject>(`${this.url}/${encodeURIComponent(project.id)}`, project)
      : this.http.post<DesignProject>(this.url, project);
  }
  deleteDesign(id: string) { return this.http.delete<void>(`${this.url}/${encodeURIComponent(id)}`); }
}
