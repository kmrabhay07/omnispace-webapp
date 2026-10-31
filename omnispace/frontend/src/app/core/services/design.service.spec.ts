import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { DesignService } from './design.service';
import { DesignProject } from '../models/design-project.model';
import { environment } from '../../../environments/environment';
describe('Account-backed designs', () => {
  let api:DesignService;let http:HttpTestingController;
  const project:DesignProject={name:'My room',roomWidth:20,roomHeight:16,ceilingHeight:12,roomShape:'RECTANGLE',wallColor:'#ffffff',floorColor:'#ffffff',floorTexture:'WOOD',propertyId:'property-1',roomPhoto:'data:image/webp;base64,AAAA',placedFurniture:[]};
  beforeEach(()=>{TestBed.configureTestingModule({providers:[provideHttpClient(),provideHttpClientTesting()]});api=TestBed.inject(DesignService);http=TestBed.inject(HttpTestingController);});
  afterEach(()=>http.verify());
  it('saves photos, dimensions, and property linkage through the API',()=>{
    api.saveDesign(project).subscribe(saved=>expect(saved.id).toBe('server-id'));
    const req=http.expectOne(environment.apiUrl+'/designs');expect(req.request.method).toBe('POST');expect(req.request.body).toEqual(project);
    req.flush({...project,id:'server-id',version:0});
    api.getDesignById('server-id').subscribe(saved=>{expect(saved.roomPhoto).toBe(project.roomPhoto);expect(saved.ceilingHeight).toBe(12);});
    http.expectOne(environment.apiUrl+'/designs/server-id').flush({...project,id:'server-id',version:0});
  });
  it('uses PUT with server version for an existing project',()=>{
    api.saveDesign({...project,id:'server-id',version:3}).subscribe();
    const req=http.expectOne(environment.apiUrl+'/designs/server-id');expect(req.request.method).toBe('PUT');expect(req.request.body.version).toBe(3);req.flush({...project,id:'server-id',version:4});
  });
  it('does not report success or store locally when saving fails',()=>{
    let succeeded=false;let failed=false;
    api.saveDesign(project).subscribe({next:()=>succeeded=true,error:()=>failed=true});
    http.expectOne(environment.apiUrl+'/designs').flush({},{status:503,statusText:'Unavailable'});
    expect(succeeded).toBe(false);expect(failed).toBe(true);expect(localStorage.getItem('omni_saved_designs')).toBeNull();
  });
});
