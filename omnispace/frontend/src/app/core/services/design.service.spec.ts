import { DesignService } from './design.service';
import { DesignProject } from '../models/design-project.model';

describe('DesignService photo projects', () => {
  beforeEach(() => localStorage.removeItem('omni_saved_designs'));
  afterEach(() => localStorage.removeItem('omni_saved_designs'));

  it('saves a new project with an existing id and restores its photo data', () => {
    const service = new DesignService();
    const project: DesignProject = {
      id: 'new-project', name: 'My room', roomWidth: 20, roomHeight: 16,
      roomShape: 'RECTANGLE', wallColor: '#ffffff', floorColor: '#ffffff', floorTexture: 'WOOD',
      roomPhoto: 'data:image/webp;base64,room',
      placedFurniture: [{ instanceId: 'p1', furnitureId: 'photo', name: 'Sofa', category: 'Decor', x: 50, y: 50, width: 4, height: 3, rotation: 0, color: '#fff', viewMode: 'TOP_DOWN', imageData: 'data:image/webp;base64,sofa' }]
    };
    service.saveDesign(project).subscribe();
    const reloaded = new DesignService();
    reloaded.getDesignById('new-project').subscribe(saved => {
      expect(saved?.roomPhoto).toBe(project.roomPhoto);
      expect(saved?.placedFurniture[0].imageData).toBe(project.placedFurniture[0].imageData);
    });
    service.saveDesign({ ...project, name: 'Updated room' }).subscribe();
    service.getSavedDesigns().subscribe(projects => {
      expect(projects.filter(p => p.id === project.id).length).toBe(1);
      expect(projects[0].name).toBe('Updated room');
    });
  });
});
