import { Component, ElementRef, ViewChild, AfterViewInit, inject, OnInit, OnDestroy, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FurnitureService } from '../../core/services/furniture.service';
import { DesignService } from '../../core/services/design.service';
import { PropertyService } from '../../core/services/property.service';
import { FurnitureItem, PlacedFurniture } from '../../core/models/furniture-item.model';
import { DesignProject } from '../../core/models/design-project.model';

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EditorHistory } from '../../core/utils/history';
import { clampPlacement } from '../../core/utils/editor-geometry';
import { disposeObject } from '../../core/utils/three-resources';

@Component({
  selector: 'app-designer',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './designer.component.html',
  styleUrl: './designer.component.scss'
})
export class DesignerComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('threeCanvasContainer') threeCanvasContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('canvas2D') canvas2DRef!: ElementRef<HTMLCanvasElement>;

  furnitureService = inject(FurnitureService);
  designService = inject(DesignService);
  propertyService = inject(PropertyService);
  route = inject(ActivatedRoute);

  ready = false;
  saving = false;
  private destroyed = false;
  private dirty = false;
  private revision = 0;
  private autosaveTimer?: ReturnType<typeof setTimeout>;
  private timers = new Set<ReturnType<typeof setTimeout>>();
  private resizeObserver?: ResizeObserver;
  private readonly pointerDown = (e: PointerEvent) => { this.on3DPointerDown(e); this.cdr.markForCheck(); };
  private readonly pointerMove = (e: PointerEvent) => this.on3DPointerMove(e);
  private readonly pointerUp = (e: PointerEvent) => { this.on3DPointerUp(e); this.cdr.markForCheck(); };
  private schedule(fn: () => void, ms: number) {
    const timer = setTimeout(() => { this.timers.delete(timer); if (!this.destroyed) fn(); }, ms);
    this.timers.add(timer);
  }
  @HostListener('window:beforeunload', ['$event'])
  beforeUnload(event: BeforeUnloadEvent) { if (this.dirty || this.saving) { event.preventDefault(); event.returnValue = ''; } }
  canLeave() { return !(this.dirty || this.saving) || confirm('Your latest changes have not been saved. Leave this design?'); }

  viewMode: '3D' | 'TOP_DOWN' | 'FRONT' = '3D';
  activeTab: 'PHOTOS' | 'FURNITURE' | 'PAINT' | 'ROOM' = 'PHOTOS';
  roomPhoto = '';
  photoError = '';
  saveMessage = '';
  private cdr = inject(ChangeDetectorRef);
  selectedCategory = 'Living Room';
  categories = ['Living Room', 'Bedroom', 'Kitchen', 'Bathroom', 'Office', 'Decor'];

  catalog: FurnitureItem[] = [];
  placedItems: PlacedFurniture[] = [];
  selectedFurniture: PlacedFurniture | null = null;

  // Room Dimensions (in Feet)
  roomWidthFt = 20;
  roomLengthFt = 16;
  roomHeightFt = 10;

  // 3D Three.js Engine Variables
  private scene: any;
  private camera: any;
  private renderer: any;
  private controls: any;
  private roomMeshGroup: any;
  private furnitureMeshMap = new Map<string, any>();
  private dirLight: any;
  private ambientLight: any;
  private animationFrameId: any;
  private selectionRingMesh: any;

  // 3D Drag State
  private isDragging3D = false;
  private floorPlane: any;
  private dragOffset = { x: 0, z: 0 };
  private pointerDownPos = { x: 0, y: 0 };

  // 2D Drag State
  private isDragging2D = false;
  private dragItem2D: PlacedFurniture | null = null;
  private dragOffset2D = { x: 0, y: 0 };

  isNightMode = false;
  wallColor = '#E2E8F0';
  floorMaterialType: 'WOOD' | 'TILE' | 'CARPET' | 'CONCRETE' = 'WOOD';

  wallPalette = [
    { name: 'Warm Alabaster', hex: '#F8FAFC' },
    { name: 'Modern Slate', hex: '#E2E8F0' },
    { name: 'Sage Green', hex: '#CBD5E1' },
    { name: 'Nordic Clay', hex: '#E2D9D0' },
    { name: 'Midnight Blue', hex: '#1E293B' },
    { name: 'Charcoal Accent', hex: '#334155' },
    { name: 'Blush Coral', hex: '#FFE4E6' },
    { name: 'Terracotta', hex: '#E07A5F' },
    { name: 'Emerald Forest', hex: '#2D6A4F' },
    { name: 'Oatmeal Beige', hex: '#F3E9DC' }
  ];

  floorMaterials: { id: 'WOOD' | 'TILE' | 'CARPET' | 'CONCRETE'; name: string; preview: string }[] = [
    { id: 'WOOD', name: 'Oak Hardwood', preview: 'linear-gradient(135deg, #c29b61, #8b5a2b)' },
    { id: 'TILE', name: 'Carrara Marble', preview: 'linear-gradient(135deg, #f8fafc, #cbd5e1)' },
    { id: 'CONCRETE', name: 'Gray Slate Tile', preview: 'linear-gradient(135deg, #475569, #1e293b)' },
    { id: 'CARPET', name: 'Luxury Carpet', preview: 'linear-gradient(135deg, #e2e8f0, #94a3b8)' }
  ];

  currentProject: DesignProject = {
    name: 'Untitled room',
    roomWidth: 20,
    roomHeight: 16,
    roomShape: 'RECTANGLE',
    wallColor: '#E2E8F0',
    floorColor: '#c29b61',
    floorTexture: 'WOOD',
    placedFurniture: [],
    createdAt: new Date().toISOString()
  };

  history = new EditorHistory<DesignProject>();

  get filteredCatalog(): FurnitureItem[] {
    return this.catalog.filter(item => item.category === this.selectedCategory);
  }

  ngOnInit() {
    this.furnitureService.getCatalog().subscribe(items => { this.catalog = items; });
    const designId = this.route.snapshot.queryParamMap.get('designId');
    const propertyId = this.route.snapshot.queryParamMap.get('propertyId');
    if (designId) {
      this.designService.getDesignById(designId).subscribe({
        next: project => { if (this.destroyed) return; this.loadProject(project); },
        error: () => { this.photoError = 'Could not load this design. Return to My designs and retry.'; this.cdr.markForCheck(); }
      });
    } else if (propertyId) {
      this.propertyService.getPropertyById(propertyId).subscribe({
        next: property => { if (this.destroyed) return; this.currentProject.propertyId = property.id; this.currentProject.name = property.title + ' — room design'; this.finishLoading(); },
        error: () => { this.photoError = 'The linked property is unavailable.'; this.cdr.markForCheck(); }
      });
    } else this.finishLoading();
  }
  private finishLoading() { this.ready = true; this.history.reset(this.snapshot()); this.cdr.markForCheck(); }
  private snapshot(): DesignProject {
    return { ...this.currentProject, placedFurniture: structuredClone(this.placedItems), roomPhoto: this.roomPhoto,
      roomWidth: this.roomWidthFt, roomHeight: this.roomLengthFt, ceilingHeight: this.roomHeightFt,
      floorTexture: this.floorMaterialType, wallColor: this.wallColor };
  }
  private loadProject(project: DesignProject) {
    this.currentProject = { ...project };
    this.applySnapshot(project);
    this.dirty = false; this.saveMessage = 'All changes saved'; this.photoError = ''; this.finishLoading();
  }
  private applySnapshot(project: DesignProject) {
    // Server identity/version never travels backwards with the editor history.
    this.currentProject = { ...project, id: this.currentProject.id, version: this.currentProject.version };
    this.roomPhoto = project.roomPhoto || ''; this.roomWidthFt = project.roomWidth; this.roomLengthFt = project.roomHeight;
    this.roomHeightFt = project.ceilingHeight || 10; this.wallColor = project.wallColor; this.floorMaterialType = project.floorTexture;
    this.placedItems = structuredClone(project.placedFurniture); this.selectedFurniture = null;
    if (this.scene) { this.build3DRoom(); this.rebuildAllMeshes(); }
    this.draw2DCanvas(); this.cdr.markForCheck();
  }

  ngAfterViewInit() {
    this.schedule(() => {
      try { this.initThreeJSEngine(); } catch { this.viewMode = 'TOP_DOWN'; this.photoError = '3D is unavailable on this device. You can use the floor plan.'; }
      this.draw2DCanvas(); this.cdr.markForCheck();
    }, 0);
  }

  ngOnDestroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.animationFrameId);
    clearTimeout(this.autosaveTimer);
    this.timers.forEach(timer => clearTimeout(timer));
    this.resizeObserver?.disconnect();
    const element = this.renderer?.domElement;
    element?.removeEventListener('pointerdown', this.pointerDown);
    element?.removeEventListener('pointermove', this.pointerMove);
    element?.removeEventListener('pointerup', this.pointerUp);
    element?.removeEventListener('pointercancel', this.pointerUp);
    element?.removeEventListener('lostpointercapture', this.pointerUp);
    this.controls?.dispose(); disposeObject(this.scene); this.furnitureMeshMap.clear();
    this.renderer?.dispose(); this.renderer?.forceContextLoss(); element?.remove();
  }

  async readPhoto(event: Event): Promise<{ data: string; width: number; height: number; name: string } | null> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return null;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) { this.photoError = 'Choose a JPG, PNG or WebP image smaller than 10 MB.'; return null; }
    try {
      const url = URL.createObjectURL(file);
      const img = new Image();
      try {
        await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = () => reject(); img.src = url; });
        const scale = Math.min(1, 1000 / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale)); canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Canvas unavailable');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const data = canvas.toDataURL('image/webp', 0.8);
        if (data.length > 700000) throw new Error('Image too large');
        this.photoError = '';
        return { data, width: img.width, height: img.height, name: file.name.replace(/\.[^.]+$/, '').slice(0,160) };
      } finally { URL.revokeObjectURL(url); }
    } catch { this.photoError = 'Could not process this image. Try a smaller or different photo.'; return null; }
    finally { this.cdr.markForCheck(); }
  }
  async uploadRoom(event: Event) {
    const photo = await this.readPhoto(event); if (!photo) return;
    this.roomPhoto = photo.data; if (this.scene) this.build3DRoom(); this.saveHistoryState(); this.cdr.markForCheck();
  }
  resizePhoto(factor: number) {
    const item = this.selectedFurniture;
    if (!item?.imageData || !this.scene) return;
    const width = Math.max(1, Math.min(10, item.width * factor));
    const ratio = width / item.width;
    item.width = width; item.height *= ratio;
    const oldMesh = this.furnitureMeshMap.get(item.instanceId);
    if (oldMesh) disposeObject(oldMesh);
    const mesh = this.create3DMesh(this.catalog[0], item);
    this.furnitureMeshMap.set(item.instanceId, mesh); this.scene.add(mesh);
    this.updateSelectionRing(); this.saveHistoryState();
  }
  removeRoomPhoto() { this.roomPhoto = ''; if (this.scene) this.build3DRoom(); this.saveHistoryState(); }
  async uploadFurniture(event: Event) {
    if (this.placedItems.filter(p => p.imageData).length >= 5) { this.photoError = 'You can add up to five furniture photos per design.'; (event.target as HTMLInputElement).value = ''; return; }
    const photo = await this.readPhoto(event); if (!photo) return;
    const width = 4, height = Math.max(1, Math.min(6, width * photo.height / photo.width));
    const item: PlacedFurniture = { instanceId: 'photo-' + crypto.randomUUID(), furnitureId: 'photo', name: photo.name || 'Furniture photo', category: 'Decor', x: 50, y: 50, width, height, rotation: 0, color: '#ffffff', viewMode: 'TOP_DOWN', imageData: photo.data };
    this.placedItems.push(item); this.selectedFurniture = item;
    if (this.scene) { const mesh = this.create3DMesh(this.catalog[0], item); this.furnitureMeshMap.set(item.instanceId, mesh); this.scene.add(mesh); this.updateSelectionRing(); }
    this.saveHistoryState(); this.cdr.markForCheck();
  }
  restoreLastDesign() {
    if (this.saving) { this.photoError = 'Wait for the current save to finish.'; return; }
    if (!this.canLeave()) return;
    clearTimeout(this.autosaveTimer);
    this.designService.getSavedDesigns().subscribe({
      next: projects => {
        if (this.destroyed) return;
        if (projects.length) { this.loadProject(projects[0]); const url = new URL(location.href); url.searchParams.set('designId', projects[0].id!); history.replaceState(history.state, '', url); }
        else this.photoError = 'No saved designs yet.';
        this.cdr.markForCheck();
      },
      error: () => { this.photoError = 'Could not load saved designs.'; this.cdr.markForCheck(); }
    });
  }

  // KEYBOARD SHORTCUTS FOR MOVING & ROTATING
  @HostListener('window:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent) {
    if (/^(INPUT|TEXTAREA|SELECT)$/.test((e.target as HTMLElement)?.tagName)) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? this.redo() : this.undo(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); this.redo(); return; }
    if (!this.selectedFurniture) return;

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      this.moveSelected(-0.25, 0);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      this.moveSelected(0.25, 0);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.moveSelected(0, -0.25);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.moveSelected(0, 0.25);
    } else if (e.key === 'r' || e.key === 'R') {
      this.rotateSelected(45);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      this.deleteSelected();
    }
  }

  // 1. THREE.JS 3D ENGINE INITIALIZATION
  initThreeJSEngine() {
    if (typeof THREE === 'undefined' || !this.threeCanvasContainer) return;

    const container = this.threeCanvasContainer.nativeElement;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x19291d);

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(16, 14, 20);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(this.renderer.domElement);

    // OrbitControls
    {
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.maxPolarAngle = Math.PI / 2 - 0.05; // Prevent camera going below floor
      this.controls.target.set(0, 2, 0);
    }

    // Floor Math Plane for 3D Dragging
    this.floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    // Lighting
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xfff8e7, 0.85);
    this.dirLight.position.set(15, 25, 15);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.scene.add(this.dirLight);

    // Build 3D Room & Selection Ring
    this.build3DRoom();
    this.createSelectionRing();
    if (this.placedItems.length) this.rebuildAllMeshes();

    // Render loop
    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);
      if (this.controls) this.controls.update();
      if (this.viewMode !== 'TOP_DOWN' && !document.hidden) this.renderer.render(this.scene, this.camera);
    };
    animate();

    this.resizeObserver = new ResizeObserver(() => {
      const w = container.clientWidth, h = container.clientHeight;
      if (!w || !h || this.destroyed) return;
      this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); this.renderer.setSize(w, h); this.draw2DCanvas();
    });
    this.resizeObserver.observe(container);
    const domEl = this.renderer.domElement;
    domEl.addEventListener('pointerdown', this.pointerDown);
    domEl.addEventListener('pointermove', this.pointerMove);
    domEl.addEventListener('pointerup', this.pointerUp);
    domEl.addEventListener('pointercancel', this.pointerUp);
    domEl.addEventListener('lostpointercapture', this.pointerUp);
  }

  createSelectionRing() {
    const geo = new THREE.RingGeometry(2.0, 2.2, 32);
    const mat = new THREE.MeshBasicMaterial({ color: 0xff5a5f, side: THREE.DoubleSide });
    this.selectionRingMesh = new THREE.Mesh(geo, mat);
    this.selectionRingMesh.rotation.x = -Math.PI / 2;
    this.selectionRingMesh.position.y = 0.05;
    this.selectionRingMesh.visible = false;
    this.scene.add(this.selectionRingMesh);
  }

  updateSelectionRing() {
    if (!this.selectionRingMesh) return;
    if (this.selectedFurniture) {
      const mesh = this.furnitureMeshMap.get(this.selectedFurniture.instanceId);
      if (mesh) {
        this.selectionRingMesh.position.x = mesh.position.x;
        this.selectionRingMesh.position.z = mesh.position.z;
        this.selectionRingMesh.visible = true;
        return;
      }
    }
    this.selectionRingMesh.visible = false;
  }

  // 2. 3D PROCEDURAL ROOM GENERATOR
  build3DRoom() {
    if (this.roomMeshGroup) {
      disposeObject(this.roomMeshGroup);
    }

    this.roomMeshGroup = new THREE.Group();

    const w = this.roomWidthFt;
    const l = this.roomLengthFt;
    const h = this.roomHeightFt;

    // Floor Mesh
    let floorColor = 0xc29b61;
    if (this.floorMaterialType === 'TILE') floorColor = 0xf1f5f9;
    if (this.floorMaterialType === 'CONCRETE') floorColor = 0x334155;
    if (this.floorMaterialType === 'CARPET') floorColor = 0x94a3b8;

    const floorGeo = new THREE.PlaneGeometry(w, l);
    const floorMat = new THREE.MeshStandardMaterial({
      color: floorColor,
      roughness: this.floorMaterialType === 'TILE' ? 0.2 : 0.7,
      metalness: 0.1
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    this.roomMeshGroup.add(floorMesh);

    // Back Wall (North)
    const wallColorHex = parseInt(this.wallColor.replace('#', '0x'), 16);
    const wallMat = new THREE.MeshStandardMaterial({ color: wallColorHex, roughness: 0.85 });

    const backWallGeo = new THREE.PlaneGeometry(w, h);
    let backMaterial: THREE.Material = wallMat;
    if (this.roomPhoto) {
      const texture = new THREE.TextureLoader().load(this.roomPhoto);
      texture.colorSpace = THREE.SRGBColorSpace;
      backMaterial = new THREE.MeshBasicMaterial({ map: texture });
    }
    const backWall = new THREE.Mesh(backWallGeo, backMaterial);
    backWall.position.set(0, h / 2, -l / 2);
    backWall.receiveShadow = true;
    this.roomMeshGroup.add(backWall);

    // Left Wall (West)
    const leftWallGeo = new THREE.PlaneGeometry(l, h);
    const leftWall = new THREE.Mesh(leftWallGeo, wallMat);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-w / 2, h / 2, 0);
    leftWall.receiveShadow = true;
    this.roomMeshGroup.add(leftWall);

    // Baseboards
    const baseMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
    const baseBackGeo = new THREE.BoxGeometry(w, 0.4, 0.1);
    const baseBack = new THREE.Mesh(baseBackGeo, baseMat);
    baseBack.position.set(0, 0.2, -l / 2 + 0.05);
    this.roomMeshGroup.add(baseBack);

    this.scene.add(this.roomMeshGroup);
  }

  // 3. 3D PROCEDURAL FURNITURE MESH BUILDER
  create3DMesh(item: FurnitureItem, placed: PlacedFurniture): any {
    const group = new THREE.Group();
    if (placed.imageData) {
      const texture = new THREE.TextureLoader().load(placed.imageData);
      texture.colorSpace = THREE.SRGBColorSpace;
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(placed.width || 4, placed.height || 3), new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide, alphaTest: 0.05 }));
      panel.position.y = (placed.height || 3) / 2;
      group.add(panel);
      group.position.set((placed.x / 100) * this.roomWidthFt - this.roomWidthFt / 2, 0, (placed.y / 100) * this.roomLengthFt - this.roomLengthFt / 2);
      group.rotation.y = placed.rotation * Math.PI / 180;
      group.userData = { id: placed.instanceId };
      return group;
    }
    if (item.modelUrl) {
      group.position.set(placed.x / 100 * this.roomWidthFt - this.roomWidthFt / 2, 0, placed.y / 100 * this.roomLengthFt - this.roomLengthFt / 2);
      group.rotation.y = THREE.MathUtils.degToRad(placed.rotation); group.userData = { id: placed.instanceId };
      new GLTFLoader().load(item.modelUrl, gltf => {
        if (this.destroyed || group.userData['disposed']) { disposeObject(gltf.scene); return; }
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model); const size = box.getSize(new THREE.Vector3());
        model.scale.set(placed.width / Math.max(size.x, .01), placed.width / Math.max(size.x, .01), placed.height / Math.max(size.z, .01));
        const scaled = new THREE.Box3().setFromObject(model); const center = scaled.getCenter(new THREE.Vector3());
        model.position.set(-center.x, -scaled.min.y, -center.z);
        model.traverse(object => { if (object instanceof THREE.Mesh) { object.castShadow = true; object.receiveShadow = true; const materials = Array.isArray(object.material) ? object.material : [object.material]; materials.forEach(material => { if (material.name === 'upholstery' && material instanceof THREE.MeshStandardMaterial) material.color.set(placed.color); }); } });
        group.add(model);
      }, undefined, () => {
        if (!this.destroyed && !group.userData['disposed']) { this.photoError = 'A furniture model could not load. Remove it and try again.'; this.cdr.markForCheck(); }
      });
      return group;
    }
    const name = item.name.toLowerCase();

    // Default Materials
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.6 });
    const fabricColor = placed.color ? parseInt(placed.color.replace('#', '0x'), 16) : 0x334155;
    const fabricMat = new THREE.MeshStandardMaterial({ color: fabricColor, roughness: 0.8 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });

    if (name.includes('sofa') || name.includes('couch') || name.includes('sectional')) {
      // 3D SOFA MESH
      const baseGeo = new THREE.BoxGeometry(4.8, 0.8, 2.2);
      const base = new THREE.Mesh(baseGeo, fabricMat);
      base.position.y = 0.6;
      base.castShadow = true;
      group.add(base);

      // Backrest
      const backGeo = new THREE.BoxGeometry(4.8, 1.8, 0.6);
      const back = new THREE.Mesh(backGeo, fabricMat);
      back.position.set(0, 1.6, -0.9);
      back.castShadow = true;
      group.add(back);

      // Armrests
      const armGeo = new THREE.BoxGeometry(0.5, 1.2, 2.3);
      const armLeft = new THREE.Mesh(armGeo, fabricMat);
      armLeft.position.set(-2.4, 1.1, 0);
      const armRight = armLeft.clone();
      armRight.position.x = 2.4;
      group.add(armLeft, armRight);

      // Wooden Legs
      const legGeo = new THREE.CylinderGeometry(0.08, 0.05, 0.4);
      for (const [lx, lz] of [[-2.2, 0.9], [2.2, 0.9], [-2.2, -0.9], [2.2, -0.9]]) {
        const leg = new THREE.Mesh(legGeo, woodMat);
        leg.position.set(lx, 0.2, lz);
        group.add(leg);
      }
    } else if (name.includes('bed')) {
      // 3D BED MESH
      const frameGeo = new THREE.BoxGeometry(4.5, 0.8, 5.5);
      const frame = new THREE.Mesh(frameGeo, woodMat);
      frame.position.y = 0.4;
      group.add(frame);

      // Mattress & Duvet
      const mattressGeo = new THREE.BoxGeometry(4.2, 0.8, 5.2);
      const mattress = new THREE.Mesh(mattressGeo, new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 }));
      mattress.position.y = 1.0;
      group.add(mattress);

      // Headboard
      const headGeo = new THREE.BoxGeometry(4.6, 2.8, 0.4);
      const headboard = new THREE.Mesh(headGeo, fabricMat);
      headboard.position.set(0, 1.6, -2.6);
      group.add(headboard);

      // Pillows
      const pillowGeo = new THREE.BoxGeometry(1.5, 0.3, 1.0);
      const pillowMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
      const p1 = new THREE.Mesh(pillowGeo, pillowMat);
      p1.position.set(-1.1, 1.5, -1.8);
      const p2 = p1.clone();
      p2.position.x = 1.1;
      group.add(p1, p2);
    } else if (name.includes('table') || name.includes('desk')) {
      // 3D COFFEE / DINING TABLE
      const topGeo = new THREE.BoxGeometry(3.2, 0.15, 2.0);
      const top = new THREE.Mesh(topGeo, woodMat);
      top.position.y = 1.5;
      top.castShadow = true;
      group.add(top);

      const legGeo = new THREE.CylinderGeometry(0.08, 0.05, 1.5);
      for (const [tx, tz] of [[-1.4, 0.8], [1.4, 0.8], [-1.4, -0.8], [1.4, -0.8]]) {
        const leg = new THREE.Mesh(legGeo, metalMat);
        leg.position.set(tx, 0.75, tz);
        group.add(leg);
      }
    } else if (name.includes('tv') || name.includes('entertainment') || name.includes('console')) {
      // 3D TV & CONSOLE
      const consoleGeo = new THREE.BoxGeometry(4.5, 1.2, 1.2);
      const consoleMesh = new THREE.Mesh(consoleGeo, woodMat);
      consoleMesh.position.y = 0.6;
      group.add(consoleMesh);

      // Flat Screen TV
      const screenGeo = new THREE.BoxGeometry(3.8, 2.2, 0.1);
      const screen = new THREE.Mesh(screenGeo, new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.1 }));
      screen.position.set(0, 2.2, 0);
      group.add(screen);
    } else if (name.includes('plant')) {
      // 3D MONSTERA HOUSEPLANT
      const potGeo = new THREE.CylinderGeometry(0.6, 0.4, 1.2);
      const pot = new THREE.Mesh(potGeo, new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 }));
      pot.position.y = 0.6;
      group.add(pot);

      const leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5 });
      for (let i = 0; i < 6; i++) {
        const leafGeo = new THREE.SphereGeometry(0.5, 6, 6);
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        leaf.scale.set(0.8, 0.1, 1.2);
        leaf.position.set(Math.cos(i) * 0.4, 1.4 + i * 0.15, Math.sin(i) * 0.4);
        leaf.rotation.x = Math.random() * 0.5;
        group.add(leaf);
      }
    } else if (name.includes('lamp')) {
      // 3D MODERN FLOOR LAMP
      const baseGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.08);
      const base = new THREE.Mesh(baseGeo, metalMat);
      group.add(base);

      const poleGeo = new THREE.CylinderGeometry(0.04, 0.04, 5.0);
      const pole = new THREE.Mesh(poleGeo, metalMat);
      pole.position.y = 2.5;
      group.add(pole);

      const shadeGeo = new THREE.ConeGeometry(0.8, 0.8, 16, 1, true);
      const shade = new THREE.Mesh(shadeGeo, new THREE.MeshStandardMaterial({ color: 0xf8fafc, side: THREE.DoubleSide }));
      shade.position.y = 5.0;
      group.add(shade);

      // Real 3D Point Light from Lamp!
      const lampLight = new THREE.PointLight(0xffe4a0, 1.2, 8);
      lampLight.position.set(0, 4.8, 0);
      group.add(lampLight);
    } else {
      // Generic Modern Furniture Cube
      const geo = new THREE.BoxGeometry(2, 2, 2);
      const mesh = new THREE.Mesh(geo, fabricMat);
      mesh.position.y = 1;
      mesh.castShadow = true;
      group.add(mesh);
    }

    const bounds = new THREE.Box3().setFromObject(group);
    const measured = bounds.getSize(new THREE.Vector3());
    group.scale.set(placed.width / Math.max(measured.x, .01), placed.width / Math.max(measured.x, .01), placed.height / Math.max(measured.z, .01));
    // Set position & rotation based on room scale
    const posX = (placed.x / 100) * this.roomWidthFt - this.roomWidthFt / 2;
    const posZ = (placed.y / 100) * this.roomLengthFt - this.roomLengthFt / 2;
    group.position.set(posX, 0, posZ);
    group.rotation.y = (placed.rotation * Math.PI) / 180;
    group.userData = { id: placed.instanceId };

    return group;
  }

  // 4. ADD FURNITURE TO 3D ROOM
  add3DFurniture(item: FurnitureItem) {
    if (this.placedItems.length >= 100) { this.photoError = 'Use at most 100 items per design.'; return; }
    const newPlaced: PlacedFurniture = {
      instanceId: 'inst-' + crypto.randomUUID(),
      furnitureId: item.id,
      name: item.name,
      category: item.category,
      x: 35 + Math.random() * 30,
      y: 35 + Math.random() * 30,
      width: item.defaultWidth,
      height: item.defaultHeight,
      rotation: 0,
      color: item.defaultColor || '#647e78',
      viewMode: 'TOP_DOWN'
    };

    clampPlacement(newPlaced, this.roomWidthFt, this.roomLengthFt);
    this.placedItems.push(newPlaced);
    this.selectedFurniture = newPlaced;

    if (this.scene) {
      const mesh = this.create3DMesh(item, newPlaced);
      this.furnitureMeshMap.set(newPlaced.instanceId, mesh);
      this.scene.add(mesh);
      this.updateSelectionRing();
    }

    this.saveHistoryState();
  }

  // 5. INTERACTIVE 3D DRAGGING & SELECTION (POINTER EVENTS)
  private getRaycaster(event: PointerEvent): any {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);
    return { raycaster, mouse };
  }

  on3DPointerDown(event: PointerEvent) {
    if (!this.renderer || !this.camera || !this.scene) return;
    this.pointerDownPos = { x: event.clientX, y: event.clientY };

    const { raycaster } = this.getRaycaster(event);
    const meshes = Array.from(this.furnitureMeshMap.values());
    const intersects = raycaster.intersectObjects(meshes, true);

    if (intersects.length > 0) {
      let root = intersects[0].object;
      while (root.parent && root.parent !== this.scene) {
        root = root.parent;
      }
      const itemId = root.userData?.id;
      if (itemId) {
        const found = this.placedItems.find(p => p.instanceId === itemId);
        if (found) {
            this.renderer.domElement.setPointerCapture(event.pointerId);
            this.selectedFurniture = found;
          this.updateSelectionRing();

          // Initialize 3D Drag on Floor Plane
          const planeIntersect = new THREE.Vector3();
          if (raycaster.ray.intersectPlane(this.floorPlane, planeIntersect)) {
            this.dragOffset.x = root.position.x - planeIntersect.x;
            this.dragOffset.z = root.position.z - planeIntersect.z;
            this.isDragging3D = true;
            if (this.controls) this.controls.enabled = false; // Disable camera orbit while dragging object
          }
        }
      }
    } else {
      // Clicked on empty floor
      this.isDragging3D = false;
    }
  }

  on3DPointerMove(event: PointerEvent) {
    if (!this.isDragging3D || !this.selectedFurniture || !this.renderer) return;

    const { raycaster } = this.getRaycaster(event);
    const planeIntersect = new THREE.Vector3();

    if (raycaster.ray.intersectPlane(this.floorPlane, planeIntersect)) {
      const mesh = this.furnitureMeshMap.get(this.selectedFurniture.instanceId);
      if (mesh) {
        let newX = planeIntersect.x + this.dragOffset.x;
        let newZ = planeIntersect.z + this.dragOffset.z;

        this.selectedFurniture.x = (newX + this.roomWidthFt / 2) / this.roomWidthFt * 100;
        this.selectedFurniture.y = (newZ + this.roomLengthFt / 2) / this.roomLengthFt * 100;
        clampPlacement(this.selectedFurniture, this.roomWidthFt, this.roomLengthFt);
        mesh.position.x = this.selectedFurniture.x / 100 * this.roomWidthFt - this.roomWidthFt / 2;
        mesh.position.z = this.selectedFurniture.y / 100 * this.roomLengthFt - this.roomLengthFt / 2;

        this.updateSelectionRing();
        this.draw2DCanvas();
      }
    }
  }

  on3DPointerUp(event: PointerEvent) {
    if (this.isDragging3D) {
      this.isDragging3D = false;
      if (this.controls) this.controls.enabled = true;
      this.saveHistoryState();
    }
  }

  // 6. PRECISION MOVEMENT CONTROLS (D-PAD & ARROWS)
  moveSelected(deltaXFt: number, deltaZFt: number) {
    if (!this.selectedFurniture) return;

    // Update percentage position
    const deltaXPct = (deltaXFt / this.roomWidthFt) * 100;
    const deltaZPct = (deltaZFt / this.roomLengthFt) * 100;

    this.selectedFurniture.x = Math.max(5, Math.min(95, this.selectedFurniture.x + deltaXPct));
    this.selectedFurniture.y = Math.max(5, Math.min(95, this.selectedFurniture.y + deltaZPct));

    clampPlacement(this.selectedFurniture, this.roomWidthFt, this.roomLengthFt);
    const mesh = this.furnitureMeshMap.get(this.selectedFurniture.instanceId);
    if (mesh) {
      const posX = (this.selectedFurniture.x / 100) * this.roomWidthFt - this.roomWidthFt / 2;
      const posZ = (this.selectedFurniture.y / 100) * this.roomLengthFt - this.roomLengthFt / 2;
      mesh.position.set(posX, 0, posZ);
      this.updateSelectionRing();
    }

    this.draw2DCanvas();
    this.saveHistoryState();
  }

  rotateSelected(degrees: number) {
    if (!this.selectedFurniture) return;
    this.selectedFurniture.rotation = (this.selectedFurniture.rotation + degrees) % 360;
    clampPlacement(this.selectedFurniture, this.roomWidthFt, this.roomLengthFt);

    const mesh = this.furnitureMeshMap.get(this.selectedFurniture.instanceId);
    if (mesh) {
      mesh.rotation.y = (this.selectedFurniture.rotation * Math.PI) / 180;
      mesh.position.set(this.selectedFurniture.x / 100 * this.roomWidthFt - this.roomWidthFt / 2, 0, this.selectedFurniture.y / 100 * this.roomLengthFt - this.roomLengthFt / 2);
    }
    this.saveHistoryState();
  }

  changeColorSelected() {
    if (!this.selectedFurniture) return;
    const colors = ['#1E293B', '#FF5A5F', '#00A699', '#D97706', '#2563EB', '#475569', '#E2E8F0'];
    const next = colors[(colors.indexOf(this.selectedFurniture.color || colors[0]) + 1) % colors.length];
    this.selectedFurniture.color = next;

    // Rebuild mesh with new color
    const oldMesh = this.furnitureMeshMap.get(this.selectedFurniture.instanceId);
    if (oldMesh) {
      disposeObject(oldMesh);
      const item = this.catalog.find(c => c.id === this.selectedFurniture?.furnitureId) || this.catalog[0];
      const newMesh = this.create3DMesh(item, this.selectedFurniture);
      this.furnitureMeshMap.set(this.selectedFurniture.instanceId, newMesh);
      this.scene.add(newMesh);
      this.updateSelectionRing();
    }
    this.saveHistoryState();
  }

  deleteSelected() {
    if (!this.selectedFurniture) return;
    this.deleteItem(this.selectedFurniture.instanceId);
  }

  deleteItem(id: string) {
    const mesh = this.furnitureMeshMap.get(id);
    if (mesh && this.scene) {
      disposeObject(mesh);
      this.furnitureMeshMap.delete(id);
    }
    this.placedItems = this.placedItems.filter(p => p.instanceId !== id);
    if (this.selectedFurniture?.instanceId === id) {
      this.selectedFurniture = null;
      this.updateSelectionRing();
    }
    this.draw2DCanvas();
    this.saveHistoryState();
  }

  selectItem(item: PlacedFurniture) {
    this.selectedFurniture = item;
    this.updateSelectionRing();
  }

  clearAllFurniture() {
    this.placedItems.forEach(p => {
      const mesh = this.furnitureMeshMap.get(p.instanceId);
      if (mesh && this.scene) disposeObject(mesh);
    });
    this.furnitureMeshMap.clear();
    this.placedItems = [];
    this.selectedFurniture = null;
    this.updateSelectionRing();
    this.draw2DCanvas();
    this.saveHistoryState();
  }

  // 7. MATERIAL & LIGHTING CONTROLS
  setWallColor(color: string) {
    this.wallColor = color;
    if (this.scene) this.build3DRoom();
    this.saveHistoryState();
  }

  setFloorMaterial(matId: 'WOOD' | 'TILE' | 'CARPET' | 'CONCRETE') {
    this.floorMaterialType = matId;
    if (this.scene) this.build3DRoom();
    this.saveHistoryState();
  }

  toggleDayNight() {
    this.isNightMode = !this.isNightMode;
    if (this.scene) {
      if (this.isNightMode) {
        this.scene.background = new THREE.Color(0x101912);
        this.ambientLight.intensity = 0.2;
        this.dirLight.intensity = 0.1;
      } else {
        this.scene.background = new THREE.Color(0x19291d);
        this.ambientLight.intensity = 0.65;
        this.dirLight.intensity = 0.85;
      }
    }
  }

  resetCameraView() {
    if (this.camera && this.controls) {
      this.camera.position.set(16, 14, 20);
      this.controls.target.set(0, 2, 0);
      this.controls.update();
    }
  }

  updateRoomDimensions() {
    this.placedItems.forEach(item => clampPlacement(item, this.roomWidthFt, this.roomLengthFt));
    if (this.scene) { this.build3DRoom(); this.rebuildAllMeshes(); }
    this.saveHistoryState();
  }

  applyRoomPreset(type: string) {
    this.clearAllFurniture();
    if (type === 'LIVING') {
      this.setFloorMaterial('WOOD');
      this.setWallColor('#E2E8F0');
      const sofa = this.catalog.find(c => c.name.includes('Sofa')) || this.catalog[0];
      const table = this.catalog.find(c => c.name.includes('Table')) || this.catalog[1];
      const tv = this.catalog.find(c => c.name.includes('TV')) || this.catalog[2];
      if (sofa) this.add3DFurniture(sofa);
      if (table) this.add3DFurniture(table);
      if (tv) this.add3DFurniture(tv);
    } else if (type === 'BEDROOM') {
      this.setFloorMaterial('CARPET');
      this.setWallColor('#F8FAFC');
      const bed = this.catalog.find(c => c.name.includes('Bed')) || this.catalog[0];
      if (bed) this.add3DFurniture(bed);
    }
  }

  // 8. VIEW SWITCHER & 2D CANVAS DRAWING
  setViewMode(mode: '3D' | 'TOP_DOWN' | 'FRONT') {
    this.viewMode = mode;
    if (this.camera && this.controls) {
      if (mode === '3D') {
        this.camera.position.set(16, 14, 20);
        this.controls.target.set(0, 2, 0);
        this.controls.maxPolarAngle = Math.PI / 2 - 0.05;
      } else if (mode === 'TOP_DOWN') {
        this.camera.position.set(0, 34, 0.01);
        this.controls.target.set(0, 0, 0);
        this.controls.maxPolarAngle = Math.PI;
      } else if (mode === 'FRONT') {
        this.camera.position.set(0, this.roomHeightFt / 2, 26);
        this.controls.target.set(0, this.roomHeightFt / 2, 0);
        this.controls.maxPolarAngle = Math.PI / 2;
      }
      this.controls.update();
    }
    this.schedule(() => this.draw2DCanvas(), 0);
  }

  draw2DCanvas() {
    if (!this.canvas2DRef) return;
    const canvas = this.canvas2DRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth || 800;
      canvas.height = parent.clientHeight || 600;
    }

    const w = canvas.width;
    const h = canvas.height;

    // 1. Dark Blueprint Background
    ctx.fillStyle = '#0a0f1d';
    ctx.fillRect(0, 0, w, h);

    // 2. Center Room
    const scale = Math.min((w * 0.7) / this.roomWidthFt, (h * 0.7) / this.roomLengthFt);
    const roomPxW = this.roomWidthFt * scale;
    const roomPxH = this.roomLengthFt * scale;
    const startX = (w - roomPxW) / 2;
    const startY = (h - roomPxH) / 2;

    // Floor Color / Material fill
    let floorHex = '#c29b61';
    if (this.floorMaterialType === 'TILE') floorHex = '#f1f5f9';
    if (this.floorMaterialType === 'CONCRETE') floorHex = '#334155';
    if (this.floorMaterialType === 'CARPET') floorHex = '#94a3b8';

    ctx.fillStyle = floorHex;
    ctx.fillRect(startX, startY, roomPxW, roomPxH);

    // 1-Foot Measurement Grid
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= this.roomWidthFt; x++) {
      ctx.beginPath();
      ctx.moveTo(startX + x * scale, startY);
      ctx.lineTo(startX + x * scale, startY + roomPxH);
      ctx.stroke();
    }
    for (let y = 0; y <= this.roomLengthFt; y++) {
      ctx.beginPath();
      ctx.moveTo(startX, startY + y * scale);
      ctx.lineTo(startX + roomPxW, startY + y * scale);
      ctx.stroke();
    }

    // Outer Room Walls
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 10;
    ctx.strokeRect(startX, startY, roomPxW, roomPxH);

    // Wall Paint Inner Stroke
    ctx.strokeStyle = this.wallColor;
    ctx.lineWidth = 4;
    ctx.strokeRect(startX + 2, startY + 2, roomPxW - 4, roomPxH - 4);

    // Dimension Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${this.roomWidthFt} FT (North Wall)`, startX + roomPxW / 2, startY - 14);
    ctx.fillText(`${this.roomLengthFt} FT (West Wall)`, startX - 20, startY + roomPxH / 2);

    // Render Placed Furniture in 2D
    this.placedItems.forEach(item => {
      const itemW = (item.width || 4) * scale;
      const itemH = (item.height || 2.5) * scale;
      const itemX = startX + (item.x / 100) * roomPxW - itemW / 2;
      const itemY = startY + (item.y / 100) * roomPxH - itemH / 2;

      ctx.save();
      ctx.translate(itemX + itemW / 2, itemY + itemH / 2);
      ctx.rotate((item.rotation * Math.PI) / 180);

      // Furniture Box
      ctx.fillStyle = item.color || '#1e293b';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 6;
      ctx.fillRect(-itemW / 2, -itemH / 2, itemW, itemH);

      // Border / Selection highlight
      if (this.selectedFurniture?.instanceId === item.instanceId) {
        ctx.strokeStyle = '#ff5a5f';
        ctx.lineWidth = 3;
      } else {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1.5;
      }
      ctx.strokeRect(-itemW / 2, -itemH / 2, itemW, itemH);

      // Label
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px Inter, sans-serif';
      ctx.shadowBlur = 0;
      ctx.fillText(item.name, 0, 3);

      ctx.restore();
    });
  }

  // 9. 2D INTERACTIVE DRAG HANDLERS
  on2DMouseDown(e: PointerEvent) {
    if (!this.canvas2DRef) return;
    const canvas = this.canvas2DRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const scale = Math.min((canvas.width * 0.7) / this.roomWidthFt, (canvas.height * 0.7) / this.roomLengthFt);
    const roomPxW = this.roomWidthFt * scale;
    const roomPxH = this.roomLengthFt * scale;
    const startX = (canvas.width - roomPxW) / 2;
    const startY = (canvas.height - roomPxH) / 2;

    for (let i = this.placedItems.length - 1; i >= 0; i--) {
      const item = this.placedItems[i];
      const itemW = (item.width || 4) * scale;
      const itemH = (item.height || 2.5) * scale;
      const itemX = startX + (item.x / 100) * roomPxW - itemW / 2;
      const itemY = startY + (item.y / 100) * roomPxH - itemH / 2;

      if (mouseX >= itemX && mouseX <= itemX + itemW && mouseY >= itemY && mouseY <= itemY + itemH) {
        canvas.setPointerCapture(e.pointerId);
        this.selectedFurniture = item;
        this.dragItem2D = item;
        this.isDragging2D = true;
        this.dragOffset2D = { x: mouseX - itemX, y: mouseY - itemY };
        this.updateSelectionRing();
        this.draw2DCanvas();
        return;
      }
    }
  }

  on2DMouseMove(e: PointerEvent) {
    if (!this.isDragging2D || !this.dragItem2D || !this.canvas2DRef) return;

    const canvas = this.canvas2DRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const scale = Math.min((canvas.width * 0.7) / this.roomWidthFt, (canvas.height * 0.7) / this.roomLengthFt);
    const roomPxW = this.roomWidthFt * scale;
    const roomPxH = this.roomLengthFt * scale;
    const startX = (canvas.width - roomPxW) / 2;
    const startY = (canvas.height - roomPxH) / 2;

    const itemW = (this.dragItem2D.width || 4) * scale;
    const itemH = (this.dragItem2D.height || 2.5) * scale;

    const targetX = mouseX - this.dragOffset2D.x - startX;
    const targetY = mouseY - this.dragOffset2D.y - startY;

    this.dragItem2D.x = ((targetX + itemW / 2) / roomPxW) * 100;
    this.dragItem2D.y = ((targetY + itemH / 2) / roomPxH) * 100;
    clampPlacement(this.dragItem2D, this.roomWidthFt, this.roomLengthFt);

    // Sync 3D mesh
    const mesh = this.furnitureMeshMap.get(this.dragItem2D.instanceId);
    if (mesh) {
      const posX = (this.dragItem2D.x / 100) * this.roomWidthFt - this.roomWidthFt / 2;
      const posZ = (this.dragItem2D.y / 100) * this.roomLengthFt - this.roomLengthFt / 2;
      mesh.position.set(posX, 0, posZ);
      this.updateSelectionRing();
    }

    this.draw2DCanvas();
  }

  on2DMouseUp(e: PointerEvent) {
    if (this.isDragging2D) {
      this.isDragging2D = false;
      this.dragItem2D = null;
      this.saveHistoryState();
    }
  }

  // 10. EXPORT & SAVE
  exportStudioSnapshot() {
    const canvas = this.viewMode !== 'TOP_DOWN' ? this.renderer?.domElement : this.canvas2DRef?.nativeElement;
    if (!canvas) return;
    if (this.viewMode !== 'TOP_DOWN') this.renderer.render(this.scene, this.camera);
    const link = document.createElement('a'); link.download = 'omnispace-design.png'; link.href = canvas.toDataURL('image/png'); link.click();
  }

  saveProject() {
    if (!this.ready || this.saving || this.destroyed) return;
    clearTimeout(this.autosaveTimer);
    this.saving = true; this.photoError = '';
    const revision = this.revision;
    this.designService.saveDesign(this.snapshot()).subscribe({
      next: saved => {
        this.saving = false;
        this.currentProject.id = saved.id; this.currentProject.version = saved.version; this.currentProject.updatedAt = saved.updatedAt;
        this.dirty = this.revision !== revision;
        if (this.destroyed) return;
        this.saveMessage = this.dirty ? 'Saving latest changes…' : 'All changes saved to your account';
        // Preserve the project URL without destroying the active editor or creating a navigation loop.
        const url = new URL(location.href); url.searchParams.set('designId', saved.id!); history.replaceState(history.state, '', url);
        if (this.dirty) this.queueSave();
        this.cdr.markForCheck();
      },
      error: err => { this.saving = false; this.dirty = true; if (this.destroyed) return;
        this.saveMessage = 'Unsaved changes'; this.photoError = err.status === 409 ? 'This design changed in another session. Open it again before saving.' : (err.error?.message || 'Could not save. Keep this page open and retry.');
        this.cdr.markForCheck(); }
    });
  }
  private queueSave() {
    clearTimeout(this.autosaveTimer); this.dirty = true; this.revision++; this.saveMessage = 'Unsaved changes';
    this.autosaveTimer = setTimeout(() => this.saveProject(), 1500);
  }

  saveHistoryState() {
    if (!this.ready) return;
    this.history.push(this.snapshot()); this.draw2DCanvas(); this.queueSave();
  }

  undo() {
    const snapshot = this.history.undo(); if (!snapshot) return;
    this.applySnapshot(snapshot); this.queueSave();
  }
  redo() {
    const snapshot = this.history.redo(); if (!snapshot) return;
    this.applySnapshot(snapshot); this.queueSave();
  }

  rebuildAllMeshes() {
    if (!this.scene) return;
    this.furnitureMeshMap.forEach(mesh => { if (this.scene) disposeObject(mesh); });
    this.furnitureMeshMap.clear();

    this.placedItems.forEach(p => {
      const item = this.catalog.find(c => c.id === p.furnitureId) || this.catalog[0];
      if (!item && !p.imageData) return;
      const mesh = this.create3DMesh(item, p);
      this.furnitureMeshMap.set(p.instanceId, mesh);
      this.scene.add(mesh);
    });
    this.updateSelectionRing();
  }

  loadInitialTemplate() { /* New projects start with an empty, measured room. */ }

  getCategoryIcon(cat: string): string {
    const map: Record<string, string> = {
      'Living Room': 'fa-solid fa-couch',
      'Bedroom': 'fa-solid fa-bed',
      'Kitchen': 'fa-solid fa-utensils',
      'Bathroom': 'fa-solid fa-bath',
      'Office': 'fa-solid fa-briefcase',
      'Decor': 'fa-solid fa-palette'
    };
    return map[cat] || 'fa-solid fa-cube';
  }
}
