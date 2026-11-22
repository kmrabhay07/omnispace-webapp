import { ChangeDetectorRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import * as THREE from 'three';
import { DesignerComponent } from './designer.component';
import { FurnitureService } from '../../core/services/furniture.service';
import { PropertyService } from '../../core/services/property.service';
import { DesignService } from '../../core/services/design.service';
import { FurnitureItem } from '../../core/models/furniture-item.model';

describe('Studio precision editing',()=>{
  let editor: DesignerComponent;
  const catalog: FurnitureItem[]=[
    {id:'sofa',name:'Sofa',category:'Living Room',iconSvg:'sofa',defaultWidth:6,defaultHeight:3},
    {id:'table',name:'Table',category:'Living Room',iconSvg:'table',defaultWidth:3,defaultHeight:2},
    {id:'desk',name:'Desk',category:'Office',iconSvg:'desk',defaultWidth:4,defaultHeight:2},
    {id:'chair',name:'Chair',category:'Office',iconSvg:'chair',defaultWidth:2,defaultHeight:2}
  ];
  const change=(value:string):Event=>({target:{value}} as unknown as Event);
  beforeEach(()=>{
    TestBed.configureTestingModule({providers:[
      {provide:FurnitureService,useValue:{getCatalog:()=>of(catalog)}},
      {provide:DesignService,useValue:{}},{provide:PropertyService,useValue:{}},
      provideRouter([]),
      {provide:ActivatedRoute,useValue:{snapshot:{queryParamMap:convertToParamMap({})}}},{provide:ChangeDetectorRef,useValue:{markForCheck:()=>{}}}
    ]});
    editor=TestBed.runInInjectionContext(()=>new DesignerComponent());
    editor.ready=true;editor.catalog=catalog;
    editor.history.reset(structuredClone(editor.currentProject));
  });
  afterEach(()=>{editor.ngOnDestroy();vi.restoreAllMocks();});

  it('keeps precise metric edits in canonical feet through undo/redo',()=>{
    editor.add3DFurniture(catalog[0]);editor.setSnap('off');editor.setUnit('m');
    editor.updateSelected('width',change('1.524'));
    expect(editor.selectedFurniture?.width).toBeCloseTo(5);
    editor.undo();expect(editor.placedItems[0].width).toBe(6);
    editor.redo();expect(editor.placedItems[0].width).toBeCloseTo(5);
    expect(editor.unitSystem).toBe('m');
  });
  it('prevents locked transforms/deletion but duplicates into an unlocked visible item',()=>{
    editor.add3DFurniture(catalog[0]);const original=editor.selectedFurniture!;
    editor.toggleItemLock(original);editor.toggleItemHidden(original);
    const before={...original};editor.moveSelected(1,0);editor.rotateSelected(45);editor.updateSelected('width',change('2'));editor.deleteSelected();
    expect(original).toEqual(before);expect(editor.placedItems.length).toBe(1);
    editor.duplicateSelected();expect(editor.placedItems.length).toBe(2);
    expect(editor.selectedFurniture?.locked).toBe(false);expect(editor.selectedFurniture?.hidden).toBe(false);
    expect(editor.selectedFurniture?.instanceId).not.toBe(original.instanceId);
  });
  it('cancels Clear without changing the project',()=>{
    editor.add3DFurniture(catalog[0]);const initial=structuredClone(editor.placedItems);
    vi.spyOn(window,'confirm').mockReturnValue(false);editor.clearAllFurniture();
    expect(editor.placedItems).toEqual(initial);
  });
  it('applies a preset as one undoable operation and restores hidden/locked state',()=>{
    editor.add3DFurniture(catalog[0]);editor.toggleItemHidden(editor.selectedFurniture!);editor.toggleItemLock(editor.selectedFurniture!);
    const initial=structuredClone(editor.placedItems);
    vi.spyOn(window,'confirm').mockReturnValue(true);editor.applyRoomPreset('OFFICE');
    expect(editor.placedItems.map(item=>item.name)).toEqual(['Desk','Chair']);
    editor.undo();expect(editor.placedItems).toEqual(initial);
    editor.redo();expect(editor.placedItems.map(item=>item.name)).toEqual(['Desk','Chair']);
  });
  it('does not shrink a room through existing furniture or accept non-finite values',()=>{
    editor.add3DFurniture(catalog[0]);editor.updateRoomMeasurement('width',change('4'));
    expect(editor.roomWidthFt).toBe(20);expect(editor.photoError).toContain('too large');
    editor.updateSelected('rotation',change('NaN'));expect(editor.selectedFurniture?.rotation).toBe(0);
  });
  it('retains absolute positions when room dimensions change and accepts the metric minimum',()=>{
    editor.add3DFurniture(catalog[0]);const x=editor.selectedX;
    editor.updateRoomMeasurement('width',change('24'));expect(editor.selectedX).toBeCloseTo(x);
    editor.placedItems=[];editor.setUnit('m');editor.updateRoomMeasurement('width',change('1.2192'));
    expect(editor.roomWidthFt).toBeCloseTo(4);
  });
  it('does not intercept shortcuts while editing an input',()=>{
    editor.add3DFurniture(catalog[0]);const input=document.createElement('input');
    editor.onKeyDown({target:input,key:'Delete'} as unknown as KeyboardEvent);
    expect(editor.placedItems.length).toBe(1);
  });
  it('nudges by the selected grid step instead of snapping back to the same point',()=>{
    editor.currentProject.snapStep=1;editor.add3DFurniture(catalog[0]);const before=editor.selectedX;
    editor.moveSelected(.25,0);expect(editor.selectedX-before).toBeCloseTo(1);
  });
  it('hides and restores the actual Three.js object without deleting it',()=>{
    editor['scene']=new THREE.Scene();editor.add3DFurniture(catalog[0]);
    const item=editor.selectedFurniture!,mesh=editor['furnitureMeshMap'].get(item.instanceId);
    editor.toggleItemHidden(item);expect(mesh.visible).toBe(false);expect(editor.placedItems.length).toBe(1);
    editor.toggleItemHidden(item);expect(mesh.visible).toBe(true);
  });
  it('renders the inspector and applies duplicate, lock and hide through real buttons',()=>{
    vi.spyOn(DesignerComponent.prototype,'ngAfterViewInit').mockImplementation(()=>{});
    vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue(null);
    const fixture=TestBed.createComponent(DesignerComponent);
    fixture.detectChanges();
    const root=fixture.nativeElement as HTMLElement;
    const click=(label:string)=>{
      const button=Array.from(root.querySelectorAll('button')).find(b=>b.textContent?.trim()===label);
      expect(button,`Missing ${label} button`).toBeTruthy();button!.click();fixture.detectChanges();
    };
    click('3D Furniture');
    (root.querySelector('.catalog-card') as HTMLElement).click();fixture.detectChanges();
    expect(root.querySelector('.precision-inspector input[type=text]')).toBeTruthy();
    click('Duplicate');expect(fixture.componentInstance.placedItems.length).toBe(2);
    click('Lock');expect(root.querySelector('fieldset')?.disabled).toBe(true);
    click('Hide');expect(root.textContent).toContain('excluded from all views and PNG exports');
    click('Unlock');expect(root.querySelector('fieldset')?.disabled).toBe(false);
    fixture.destroy();
  });
});
