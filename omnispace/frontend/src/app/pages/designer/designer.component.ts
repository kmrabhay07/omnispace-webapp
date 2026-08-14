import { Component, ElementRef, ViewChild, AfterViewInit, HostListener, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FurnitureService } from '../../core/services/furniture.service';
import { DesignService } from '../../core/services/design.service';
import { PropertyService } from '../../core/services/property.service';
import { FurnitureItem, PlacedFurniture } from '../../core/models/furniture-item.model';
import { DesignProject } from '../../core/models/design-project.model';

@Component({
  selector: 'app-designer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="designer-layout animate-fade-in">
      <!-- TOP TOOLBAR -->
      <header class="designer-toolbar">
        <div class="brand-sub">
          <i class="fa-solid fa-cube"></i>
          <span class="project-title">{{ currentProject.name }}</span>
        </div>

        <!-- View Mode Switcher -->
        <div class="view-toggle">
          <button [class.active]="viewMode === 'TOP_DOWN'" (click)="setViewMode('TOP_DOWN')">
            <i class="fa-solid fa-layer-group"></i> Top-Down (Floor Plan)
          </button>
          <button [class.active]="viewMode === 'FRONT'" (click)="setViewMode('FRONT')">
            <i class="fa-solid fa-vr-cardboard"></i> Front View (Elevation)
          </button>
        </div>

        <div class="toolbar-actions">
          <button class="tool-btn" (click)="toggleSnapGrid()" [class.active]="snapToGrid" title="Snap to 1ft Grid">
            <i class="fa-solid fa-border-all"></i> Grid Snap
          </button>
          <button class="tool-btn" (click)="undo()" [disabled]="historyIndex <= 0" title="Undo (Ctrl+Z)">
            <i class="fa-solid fa-rotate-left"></i> Undo
          </button>
          <button class="tool-btn" (click)="redo()" [disabled]="historyIndex >= historyStack.length - 1" title="Redo (Ctrl+Y)">
            <i class="fa-solid fa-rotate-right"></i> Redo
          </button>
          <button class="tool-btn btn-danger" (click)="clearCanvas()" title="Clear All Furniture">
            <i class="fa-solid fa-trash"></i> Clear
          </button>
          <button class="tool-btn btn-export" (click)="exportAsPNG()" title="Export PNG Image">
            <i class="fa-solid fa-download"></i> Export PNG
          </button>
          <button class="btn btn-primary btn-save" (click)="saveProject()">
            <i class="fa-solid fa-floppy-disk"></i> Save Project
          </button>
        </div>
      </header>

      <div class="studio-body">
        <!-- LEFT SIDEBAR: FURNITURE & PAINT CATALOG -->
        <aside class="left-sidebar">
          <div class="sidebar-tabs">
            <button [class.active]="activeTab === 'FURNITURE'" (click)="activeTab = 'FURNITURE'">
              <i class="fa-solid fa-couch"></i> Furniture
            </button>
            <button [class.active]="activeTab === 'PAINT'" (click)="activeTab = 'PAINT'">
              <i class="fa-solid fa-palette"></i> Paint & Floor
            </button>
            <button [class.active]="activeTab === 'ROOM'" (click)="activeTab = 'ROOM'">
              <i class="fa-solid fa-vector-square"></i> Room Size
            </button>
          </div>

          <!-- FURNITURE TAB CONTENT -->
          <div class="tab-content" *ngIf="activeTab === 'FURNITURE'">
            <div class="category-pills">
              <button
                *ngFor="let cat of categories"
                [class.active]="selectedCategory === cat"
                (click)="selectedCategory = cat"
              >
                {{ cat }}
              </button>
            </div>

            <div class="catalog-grid">
              <div
                *ngFor="let item of filteredCatalog"
                class="catalog-card"
                (click)="addFurnitureToCanvas(item)"
              >
                <div class="item-preview">
                  <div class="svg-placeholder" [attr.data-icon]="item.iconSvg">
                    <i [class]="getCategoryIcon(item.category)"></i>
                  </div>
                </div>
                <div class="item-meta">
                  <div class="name">{{ item.name }}</div>
                  <div class="dimensions">{{ item.defaultWidth }}' × {{ item.defaultHeight }}'</div>
                </div>
                <button class="add-btn"><i class="fa-solid fa-plus"></i></button>
              </div>
            </div>
          </div>

          <!-- PAINT TAB CONTENT -->
          <div class="tab-content" *ngIf="activeTab === 'PAINT'">
            <div class="paint-section">
              <h4>Wall Color</h4>
              <div class="swatch-grid">
                <button
                  *ngFor="let c of wallSwatches"
                  class="swatch-btn"
                  [style.background]="c.hex"
                  [class.active]="wallColor === c.hex"
                  (click)="setWallColor(c.hex)"
                  [title]="c.name"
                ></button>
              </div>
              <div class="custom-color-picker">
                <label>Custom Wall Hex:</label>
                <input type="color" [(ngModel)]="wallColor" (change)="recordHistory()">
              </div>
            </div>

            <div class="paint-section">
              <h4>Floor Color & Texture</h4>
              <div class="swatch-grid">
                <button
                  *ngFor="let f of floorSwatches"
                  class="swatch-btn"
                  [style.background]="f.hex"
                  [class.active]="floorColor === f.hex"
                  (click)="setFloorColor(f.hex)"
                  [title]="f.name"
                ></button>
              </div>
            </div>
          </div>

          <!-- ROOM TAB CONTENT -->
          <div class="tab-content" *ngIf="activeTab === 'ROOM'">
            <div class="form-group">
              <label>Room Width (Feet): {{ roomWidth }} ft</label>
              <input type="range" min="10" max="40" [(ngModel)]="roomWidth" (input)="renderCanvas()">
            </div>
            <div class="form-group">
              <label>Room Length (Feet): {{ roomHeight }} ft</label>
              <input type="range" min="10" max="40" [(ngModel)]="roomHeight" (input)="renderCanvas()">
            </div>

            <div class="presets-section">
              <h4>Quick Templates</h4>
              <div class="template-buttons">
                <button (click)="applyTemplate('STUDIO')" class="preset-btn">Studio Apt (16x14)</button>
                <button (click)="applyTemplate('LIVING')" class="preset-btn">Penthouse Living (24x18)</button>
                <button (click)="applyTemplate('OFFICE')" class="preset-btn">Tech Office (30x20)</button>
              </div>
            </div>
          </div>
        </aside>

        <!-- CANVAS MAIN WORKSPACE -->
        <main class="canvas-workspace">
          <div class="canvas-container">
            <canvas #studioCanvas (mousedown)="onCanvasMouseDown($event)" (mousemove)="onCanvasMouseMove($event)" (mouseup)="onCanvasMouseUp()"></canvas>
          </div>

          <!-- BOTTOM PROPERTY INSPECTOR BAR -->
          <div class="item-inspector" *ngIf="selectedFurniture">
            <div class="inspector-info">
              <span class="item-title">{{ selectedFurniture.name }}</span>
              <span class="item-coords">X: {{ selectedFurniture.x | number:'1.1-1' }}ft, Y: {{ selectedFurniture.y | number:'1.1-1' }}ft</span>
            </div>

            <div class="inspector-controls">
              <button class="insp-btn" (click)="rotateSelected(-90)" title="Rotate Left 90°">
                <i class="fa-solid fa-rotate-left"></i> Rotate 90°
              </button>

              <div class="color-picker-inline">
                <label>Color:</label>
                <input type="color" [(ngModel)]="selectedFurniture.color" (change)="renderCanvas(); recordHistory()">
              </div>

              <button class="insp-btn btn-danger" (click)="deleteSelected()" title="Delete Item">
                <i class="fa-solid fa-trash"></i> Delete
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .designer-layout {
      display: flex;
      flex-direction: column;
      height: calc(100vh - 72px);
      background: #0F172A;
      color: #F8FAFC;
    }

    /* Toolbar Header */
    .designer-toolbar {
      height: 56px;
      background: #1E293B;
      border-bottom: 1px solid #334155;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20px;

      .brand-sub {
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 700;
        color: #38BDF8;

        .project-title {
          color: white;
          font-size: 0.95rem;
        }
      }

      .view-toggle {
        display: flex;
        background: #0F172A;
        padding: 3px;
        border-radius: var(--radius-sm);

        button {
          padding: 6px 14px;
          font-size: 0.82rem;
          font-weight: 600;
          color: #94A3B8;
          background: transparent;
          border-radius: 6px;

          &.active {
            background: var(--primary);
            color: white;
          }
        }
      }

      .toolbar-actions {
        display: flex;
        align-items: center;
        gap: 8px;

        .tool-btn {
          padding: 6px 12px;
          font-size: 0.8rem;
          font-weight: 600;
          background: #334155;
          color: #F1F5F9;
          border-radius: 6px;

          &:hover:not(:disabled) {
            background: #475569;
          }

          &:disabled {
            opacity: 0.4;
            cursor: not-allowed;
          }

          &.active {
            background: #0284C7;
          }

          &.btn-danger { background: #991B1B; }
          &.btn-export { background: #059669; }
        }

        .btn-save {
          padding: 6px 16px;
          font-size: 0.85rem;
        }
      }
    }

    /* Studio Body */
    .studio-body {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    /* Left Catalog Sidebar */
    .left-sidebar {
      width: 340px;
      background: #1E293B;
      border-right: 1px solid #334155;
      display: flex;
      flex-direction: column;

      .sidebar-tabs {
        display: flex;
        border-bottom: 1px solid #334155;

        button {
          flex: 1;
          padding: 12px 8px;
          font-size: 0.82rem;
          font-weight: 600;
          color: #94A3B8;
          background: transparent;
          border-bottom: 2px solid transparent;

          &.active {
            color: #38BDF8;
            border-bottom-color: #38BDF8;
            background: rgba(56, 189, 248, 0.05);
          }
        }
      }

      .tab-content {
        padding: 16px;
        flex: 1;
        overflow-y: auto;
      }

      .category-pills {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-bottom: 16px;

        button {
          padding: 4px 10px;
          font-size: 0.75rem;
          border-radius: var(--radius-full);
          background: #334155;
          color: #94A3B8;

          &.active {
            background: #38BDF8;
            color: #0F172A;
            font-weight: 700;
          }
        }
      }

      .catalog-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      .catalog-card {
        background: #0F172A;
        border: 1px solid #334155;
        border-radius: var(--radius-sm);
        padding: 10px;
        cursor: pointer;
        position: relative;
        transition: all 0.2s ease;

        &:hover {
          border-color: #38BDF8;
          transform: translateY(-2px);
          .add-btn { background: #38BDF8; color: #0F172A; }
        }

        .item-preview {
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.8rem;
          color: #38BDF8;
          margin-bottom: 8px;
        }

        .item-meta {
          .name { font-size: 0.8rem; font-weight: 700; color: white; margin-bottom: 2px; }
          .dimensions { font-size: 0.7rem; color: #64748B; }
        }

        .add-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #334155;
          color: white;
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }

      /* Swatch Grid */
      .swatch-grid {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 8px;
        margin-bottom: 20px;

        .swatch-btn {
          height: 36px;
          border-radius: 6px;
          border: 2px solid transparent;

          &.active {
            border-color: white;
            box-shadow: 0 0 0 2px #38BDF8;
          }
        }
      }

      .custom-color-picker {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 0.85rem;
      }

      .presets-section {
        margin-top: 24px;
        h4 { font-size: 0.9rem; margin-bottom: 12px; color: #94A3B8; }
        .template-buttons {
          display: flex;
          flex-direction: column;
          gap: 8px;

          .preset-btn {
            padding: 10px;
            background: #334155;
            color: white;
            border-radius: 6px;
            font-size: 0.85rem;
            text-align: left;

            &:hover { background: #475569; }
          }
        }
      }
    }

    /* Workspace Canvas */
    .canvas-workspace {
      flex: 1;
      display: flex;
      flex-direction: column;
      position: relative;
      background: #090D16;
    }

    .canvas-container {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      overflow: auto;

      canvas {
        background: #F4F6F9;
        border-radius: var(--radius-sm);
        box-shadow: 0 20px 50px rgba(0,0,0,0.6);
        cursor: crosshair;
      }
    }

    /* Inspector Footer Bar */
    .item-inspector {
      height: 52px;
      background: #1E293B;
      border-top: 1px solid #334155;
      padding: 0 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;

      .inspector-info {
        display: flex;
        align-items: center;
        gap: 16px;

        .item-title { font-weight: 700; color: white; font-size: 0.95rem; }
        .item-coords { font-size: 0.8rem; color: #94A3B8; }
      }

      .inspector-controls {
        display: flex;
        align-items: center;
        gap: 12px;

        .insp-btn {
          padding: 6px 12px;
          font-size: 0.8rem;
          background: #334155;
          color: white;
          border-radius: 6px;
        }

        .color-picker-inline {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          color: #94A3B8;
        }
      }
    }
  `]
})
export class DesignerComponent implements OnInit, AfterViewInit {
  @ViewChild('studioCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  furnitureService = inject(FurnitureService);
  designService = inject(DesignService);
  propertyService = inject(PropertyService);
  route = inject(ActivatedRoute);

  viewMode: 'TOP_DOWN' | 'FRONT' = 'TOP_DOWN';
  activeTab: 'FURNITURE' | 'PAINT' | 'ROOM' = 'FURNITURE';
  categories = ['All', 'Living Room', 'Bedroom', 'Kitchen', 'Bathroom', 'Office', 'Decor'];
  selectedCategory = 'All';

  wallColor = '#F5F5F7';
  floorColor = '#D4C4B3';
  roomWidth = 24;  // feet
  roomHeight = 18; // feet
  snapToGrid = true;

  catalog: FurnitureItem[] = [];
  placedItems: PlacedFurniture[] = [];
  selectedFurniture: PlacedFurniture | null = null;

  // History stack for Undo/Redo
  historyStack: string[] = [];
  historyIndex = -1;

  // Drag state
  isDragging = false;
  dragOffsetX = 0;
  dragOffsetY = 0;

  // Swatches
  wallSwatches = [
    { name: 'Warm White', hex: '#F5F5F7' },
    { name: 'Nordic Blue', hex: '#E2E8F0' },
    { name: 'Soft Sage', hex: '#E2E8DF' },
    { name: 'Charcoal', hex: '#334155' },
    { name: 'Terracotta', hex: '#E2D4C3' },
    { name: 'Blush Pink', hex: '#FCE7F3' }
  ];

  floorSwatches = [
    { name: 'Light Oak Wood', hex: '#D4C4B3' },
    { name: 'Dark Walnut', hex: '#744210' },
    { name: 'Modern Concrete', hex: '#94A3B8' },
    { name: 'Marble Tile', hex: '#EDF2F7' },
    { name: 'Deep Navy Carpet', hex: '#1E293B' },
    { name: 'Warm Amber Wood', hex: '#B45309' }
  ];

  currentProject: DesignProject = {
    name: 'Untitled Design Project',
    roomWidth: 24,
    roomHeight: 18,
    roomShape: 'RECTANGLE',
    wallColor: '#F5F5F7',
    floorColor: '#D4C4B3',
    floorTexture: 'WOOD',
    placedFurniture: []
  };

  ngOnInit() {
    this.furnitureService.getCatalog().subscribe(items => {
      this.catalog = items;
    });

    this.route.queryParams.subscribe(params => {
      if (params['propertyId']) {
        this.propertyService.getPropertyById(params['propertyId']).subscribe(prop => {
          if (prop) {
            this.currentProject.name = prop.title + ' — Design Studio';
            this.currentProject.propertyId = prop.id;
          }
        });
      }
    });
  }

  ngAfterViewInit() {
    this.designService.getSavedDesigns().subscribe(designs => {
      if (designs.length > 0) {
        this.loadProject(designs[0]);
      } else {
        this.renderCanvas();
        this.recordHistory();
      }
    });
  }

  get filteredCatalog(): FurnitureItem[] {
    if (this.selectedCategory === 'All') return this.catalog;
    return this.catalog.filter(i => i.category === this.selectedCategory);
  }

  getCategoryIcon(cat: string): string {
    switch (cat) {
      case 'Living Room': return 'fa-solid fa-couch';
      case 'Bedroom': return 'fa-solid fa-bed';
      case 'Kitchen': return 'fa-solid fa-utensils';
      case 'Bathroom': return 'fa-solid fa-bath';
      case 'Office': return 'fa-solid fa-laptop';
      case 'Decor': return 'fa-solid fa-plant-wilt';
      default: return 'fa-solid fa-cube';
    }
  }

  setViewMode(mode: 'TOP_DOWN' | 'FRONT') {
    this.viewMode = mode;
    this.renderCanvas();
  }

  toggleSnapGrid() {
    this.snapToGrid = !this.snapToGrid;
  }

  setWallColor(color: string) {
    this.wallColor = color;
    this.renderCanvas();
    this.recordHistory();
  }

  setFloorColor(color: string) {
    this.floorColor = color;
    this.renderCanvas();
    this.recordHistory();
  }

  addFurnitureToCanvas(item: FurnitureItem) {
    const newItem: PlacedFurniture = {
      instanceId: 'inst-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      furnitureId: item.id,
      name: item.name,
      category: item.category,
      x: this.roomWidth / 2 - item.defaultWidth / 2,
      y: this.roomHeight / 2 - item.defaultHeight / 2,
      width: item.defaultWidth,
      height: item.defaultHeight,
      rotation: 0,
      color: item.defaultColor || '#4A5568',
      viewMode: 'TOP_DOWN',
      iconSvg: item.iconSvg
    };

    this.placedItems.push(newItem);
    this.selectedFurniture = newItem;
    this.renderCanvas();
    this.recordHistory();
  }

  // Record Canvas State for Undo/Redo
  recordHistory() {
    const state = JSON.stringify({
      placedItems: this.placedItems,
      wallColor: this.wallColor,
      floorColor: this.floorColor,
      roomWidth: this.roomWidth,
      roomHeight: this.roomHeight
    });

    if (this.historyIndex < this.historyStack.length - 1) {
      this.historyStack = this.historyStack.slice(0, this.historyIndex + 1);
    }
    this.historyStack.push(state);
    this.historyIndex = this.historyStack.length - 1;
  }

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.restoreHistoryState(this.historyStack[this.historyIndex]);
    }
  }

  redo() {
    if (this.historyIndex < this.historyStack.length - 1) {
      this.historyIndex++;
      this.restoreHistoryState(this.historyStack[this.historyIndex]);
    }
  }

  private restoreHistoryState(stateJson: string) {
    const data = JSON.parse(stateJson);
    this.placedItems = data.placedItems;
    this.wallColor = data.wallColor;
    this.floorColor = data.floorColor;
    this.roomWidth = data.roomWidth;
    this.roomHeight = data.roomHeight;
    this.selectedFurniture = null;
    this.renderCanvas();
  }

  rotateSelected(deg: number) {
    if (this.selectedFurniture) {
      this.selectedFurniture.rotation = (this.selectedFurniture.rotation + deg + 360) % 360;
      this.renderCanvas();
      this.recordHistory();
    }
  }

  deleteSelected() {
    if (this.selectedFurniture) {
      this.placedItems = this.placedItems.filter(i => i.instanceId !== this.selectedFurniture?.instanceId);
      this.selectedFurniture = null;
      this.renderCanvas();
      this.recordHistory();
    }
  }

  clearCanvas() {
    if (confirm('Are you sure you want to clear all furniture items?')) {
      this.placedItems = [];
      this.selectedFurniture = null;
      this.renderCanvas();
      this.recordHistory();
    }
  }

  applyTemplate(type: string) {
    if (type === 'STUDIO') {
      this.roomWidth = 16;
      this.roomHeight = 14;
      this.wallColor = '#F5F5F7';
      this.floorColor = '#D4C4B3';
    } else if (type === 'LIVING') {
      this.roomWidth = 24;
      this.roomHeight = 18;
      this.wallColor = '#E2E8F0';
      this.floorColor = '#744210';
    } else if (type === 'OFFICE') {
      this.roomWidth = 30;
      this.roomHeight = 20;
      this.wallColor = '#334155';
      this.floorColor = '#94A3B8';
    }
    this.renderCanvas();
    this.recordHistory();
  }

  saveProject() {
    this.currentProject.roomWidth = this.roomWidth;
    this.currentProject.roomHeight = this.roomHeight;
    this.currentProject.wallColor = this.wallColor;
    this.currentProject.floorColor = this.floorColor;
    this.currentProject.placedFurniture = this.placedItems;

    this.designService.saveDesign(this.currentProject).subscribe(saved => {
      alert(`Design "${saved.name}" saved successfully!`);
    });
  }

  loadProject(project: DesignProject) {
    this.currentProject = project;
    this.roomWidth = project.roomWidth;
    this.roomHeight = project.roomHeight;
    this.wallColor = project.wallColor;
    this.floorColor = project.floorColor;
    this.placedItems = project.placedFurniture;
    this.renderCanvas();
    this.recordHistory();
  }

  exportAsPNG() {
    const canvas = this.canvasRef.nativeElement;
    const link = document.createElement('a');
    link.download = `${this.currentProject.name.replace(/\\s+/g, '_')}_design.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  /* --------------------------------------------------------------------------
     HTML5 CANVAS RENDERING ENGINE
     -------------------------------------------------------------------------- */
  renderCanvas() {
    if (!this.canvasRef) return;
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    const scale = 25; // 25 pixels per foot
    const canvasW = this.roomWidth * scale + 100;
    const canvasH = this.roomHeight * scale + 100;
    canvas.width = canvasW;
    canvas.height = canvasH;

    const offsetX = 50;
    const offsetY = 50;

    // Clear
    ctx.clearRect(0, 0, canvasW, canvasH);

    if (this.viewMode === 'TOP_DOWN') {
      // 1. Render Floor
      ctx.fillStyle = this.floorColor;
      ctx.fillRect(offsetX, offsetY, this.roomWidth * scale, this.roomHeight * scale);

      // Floor grid lines
      ctx.strokeStyle = 'rgba(0,0,0,0.06)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= this.roomWidth; x++) {
        ctx.beginPath();
        ctx.moveTo(offsetX + x * scale, offsetY);
        ctx.lineTo(offsetX + x * scale, offsetY + this.roomHeight * scale);
        ctx.stroke();
      }
      for (let y = 0; y <= this.roomHeight; y++) {
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY + y * scale);
        ctx.lineTo(offsetX + this.roomWidth * scale, offsetY + y * scale);
        ctx.stroke();
      }

      // 2. Render Outer Room Walls (Thick Border)
      ctx.strokeStyle = '#222222';
      ctx.lineWidth = 8;
      ctx.strokeRect(offsetX, offsetY, this.roomWidth * scale, this.roomHeight * scale);

      // Dimension labels
      ctx.fillStyle = '#64748B';
      ctx.font = 'bold 12px DM Sans, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${this.roomWidth} ft`, offsetX + (this.roomWidth * scale) / 2, offsetY - 14);
      ctx.fillText(`${this.roomHeight} ft`, offsetX - 24, offsetY + (this.roomHeight * scale) / 2);

      // 3. Render Placed Furniture
      for (const item of this.placedItems) {
        this.renderItemTopDown(ctx, item, scale, offsetX, offsetY);
      }

    } else {
      // FRONT ELEVATION VIEW
      // 1. Render Wall Surface
      ctx.fillStyle = this.wallColor;
      ctx.fillRect(offsetX, offsetY, this.roomWidth * scale, this.roomHeight * scale);

      // Render Floor Line
      ctx.fillStyle = this.floorColor;
      ctx.fillRect(offsetX, offsetY + this.roomHeight * scale - 20, this.roomWidth * scale, 20);

      // Wall outline
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 6;
      ctx.strokeRect(offsetX, offsetY, this.roomWidth * scale, this.roomHeight * scale);

      ctx.fillStyle = '#64748B';
      ctx.font = 'bold 14px DM Sans, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Front Elevation View — Wall Perspective', offsetX + (this.roomWidth * scale) / 2, offsetY + 30);

      // Render Placed Furniture in Front View
      for (const item of this.placedItems) {
        this.renderItemFrontView(ctx, item, scale, offsetX, offsetY);
      }
    }
  }

  // Draw 2D Top Down Furniture shape
  private renderItemTopDown(
    ctx: CanvasRenderingContext2D,
    item: PlacedFurniture,
    scale: number,
    offX: number,
    offY: number
  ) {
    const itemW = item.width * scale;
    const itemH = item.height * scale;
    const itemX = offX + item.x * scale;
    const itemY = offY + item.y * scale;

    ctx.save();
    // Rotate around item center
    ctx.translate(itemX + itemW / 2, itemY + itemH / 2);
    ctx.rotate((item.rotation * Math.PI) / 180);

    const isSelected = this.selectedFurniture?.instanceId === item.instanceId;

    // Draw furniture body
    ctx.fillStyle = item.color || '#4A5568';
    ctx.beginPath();
    ctx.roundRect(-itemW / 2, -itemH / 2, itemW, itemH, 6);
    ctx.fill();

    // Inner detail outline
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Text label
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.name.split(' ')[0], 0, 0);

    // Selection highlight handles
    if (isSelected) {
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 3;
      ctx.strokeRect(-itemW / 2 - 4, -itemH / 2 - 4, itemW + 8, itemH + 8);

      // Rotation indicator circle
      ctx.fillStyle = '#FF5A5F';
      ctx.beginPath();
      ctx.arc(0, -itemH / 2 - 14, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // Draw Front View Elevation
  private renderItemFrontView(
    ctx: CanvasRenderingContext2D,
    item: PlacedFurniture,
    scale: number,
    offX: number,
    offY: number
  ) {
    const itemW = item.width * scale;
    const itemH = item.height * scale;
    const itemX = offX + item.x * scale;
    const floorY = offY + this.roomHeight * scale - 20;
    const itemY = floorY - itemH;

    ctx.save();
    ctx.fillStyle = item.color || '#3B82F6';
    ctx.fillRect(itemX, itemY, itemW, itemH);

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(itemX, itemY, itemW, itemH);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(item.name, itemX + itemW / 2, itemY + itemH / 2);
    ctx.restore();
  }

  /* --------------------------------------------------------------------------
     MOUSE INTERACTION HANDLERS
     -------------------------------------------------------------------------- */
  onCanvasMouseDown(e: MouseEvent) {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const scale = 25;
    const offX = 50;
    const offY = 50;

    // Check hit test for furniture
    for (let i = this.placedItems.length - 1; i >= 0; i--) {
      const item = this.placedItems[i];
      const itemX = offX + item.x * scale;
      const itemY = offY + item.y * scale;
      const itemW = item.width * scale;
      const itemH = item.height * scale;

      if (clickX >= itemX && clickX <= itemX + itemW && clickY >= itemY && clickY <= itemY + itemH) {
        this.selectedFurniture = item;
        this.isDragging = true;
        this.dragOffsetX = clickX - itemX;
        this.dragOffsetY = clickY - itemY;
        this.renderCanvas();
        return;
      }
    }

    this.selectedFurniture = null;
    this.renderCanvas();
  }

  onCanvasMouseMove(e: MouseEvent) {
    if (!this.isDragging || !this.selectedFurniture) return;

    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const moveX = e.clientX - rect.left;
    const moveY = e.clientY - rect.top;
    const scale = 25;
    const offX = 50;
    const offY = 50;

    let newX = (moveX - this.dragOffsetX - offX) / scale;
    let newY = (moveY - this.dragOffsetY - offY) / scale;

    if (this.snapToGrid) {
      newX = Math.round(newX);
      newY = Math.round(newY);
    }

    // Keep inside bounds
    newX = Math.max(0, Math.min(newX, this.roomWidth - this.selectedFurniture.width));
    newY = Math.max(0, Math.min(newY, this.roomHeight - this.selectedFurniture.height));

    this.selectedFurniture.x = newX;
    this.selectedFurniture.y = newY;
    this.renderCanvas();
  }

  onCanvasMouseUp() {
    if (this.isDragging) {
      this.isDragging = false;
      this.recordHistory();
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'Delete' || event.key === 'Backspace') {
      this.deleteSelected();
    } else if (event.key === 'r' || event.key === 'R') {
      this.rotateSelected(90);
    } else if (event.ctrlKey && event.key === 'z') {
      this.undo();
    }
  }
}
