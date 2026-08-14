import { Injectable, signal } from '@angular/core';
import { DesignProject } from '../models/design-project.model';
import { Observable, of } from '../../../../node_modules/rxjs/dist/types';

@Injectable({
  providedIn: 'root'
})
export class DesignService {
  private projectsKey = 'omni_saved_designs';

  private initialProject: DesignProject = {
    id: 'demo-design-1',
    name: 'Solstice Penthouse — Living Room Concept',
    propertyId: 'prop-1',
    roomWidth: 24,
    roomHeight: 18,
    roomShape: 'RECTANGLE',
    wallColor: '#F5F5F7',
    floorColor: '#D4C4B3',
    floorTexture: 'WOOD',
    placedFurniture: [
      {
        instanceId: 'inst-1',
        furnitureId: 'f-sofa-l',
        name: 'L-Shaped Sectional Sofa',
        category: 'Living Room',
        x: 4,
        y: 4,
        width: 8.5,
        height: 6.0,
        rotation: 0,
        color: '#2D3748',
        viewMode: 'TOP_DOWN'
      },
      {
        instanceId: 'inst-2',
        furnitureId: 'f-coffee-table',
        name: 'Modern Coffee Table',
        category: 'Living Room',
        x: 6.5,
        y: 11,
        width: 3.5,
        height: 3.5,
        rotation: 0,
        color: '#D69E2E',
        viewMode: 'TOP_DOWN'
      },
      {
        instanceId: 'inst-3',
        furnitureId: 'f-tv-unit',
        name: 'Minimalist Media Console',
        category: 'Living Room',
        x: 17,
        y: 2,
        width: 6.0,
        height: 1.8,
        rotation: 90,
        color: '#744210',
        viewMode: 'TOP_DOWN'
      },
      {
        instanceId: 'inst-4',
        furnitureId: 'f-plant',
        name: 'Monstera Potted Plant',
        category: 'Decor',
        x: 21,
        y: 15,
        width: 2.2,
        height: 2.2,
        rotation: 0,
        color: '#38A169',
        viewMode: 'TOP_DOWN'
      }
    ]
  };

  private projectsSignal = signal<DesignProject[]>(this.loadProjectsFromStorage());

  constructor() {
    if (this.projectsSignal().length === 0) {
      this.saveProjectsToStorage([this.initialProject]);
      this.projectsSignal.set([this.initialProject]);
    }
  }

  private loadProjectsFromStorage(): DesignProject[] {
    const raw = localStorage.getItem(this.projectsKey);
    return raw ? JSON.parse(raw) : [];
  }

  private saveProjectsToStorage(list: DesignProject[]): void {
    localStorage.setItem(this.projectsKey, JSON.stringify(list));
  }

  getSavedDesigns(): Observable<DesignProject[]> {
    return of(this.projectsSignal());
  }

  getDesignById(id: string): Observable<DesignProject | undefined> {
    const proj = this.projectsSignal().find(p => p.id === id);
    return of(proj);
  }

  saveDesign(project: DesignProject): Observable<DesignProject> {
    const current = this.projectsSignal();
    let updated: DesignProject[];
    if (project.id) {
      updated = current.map(p => p.id === project.id ? { ...project, updatedAt: new Date().toISOString() } : p);
    } else {
      const newProj = {
        ...project,
        id: 'design-' + Date.now(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      project = newProj;
      updated = [newProj, ...current];
    }
    this.saveProjectsToStorage(updated);
    this.projectsSignal.set(updated);
    return of(project);
  }
}
