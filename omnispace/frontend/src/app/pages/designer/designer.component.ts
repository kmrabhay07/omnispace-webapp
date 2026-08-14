import { Component, ElementRef, ViewChild, AfterViewInit, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FurnitureService } from '../../core/services/furniture.service';
import { DesignService } from '../../core/services/design.service';
import { PropertyService } from '../../core/services/property.service';
import { FurnitureItem, PlacedFurniture } from '../../core/models/furniture-item.model';
import { DesignProject } from '../../core/models/design-project.model';

declare var THREE: any;

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

        <!-- 3D vs 2D View Switcher -->
        <div class="view-toggle">
          <button [class.active]="viewMode === '3D'" (click)="setViewMode('3D')">
            <i class="fa-solid fa-cube"></i> 3D Studio (Walkthrough)
          </button>
          <button [class.active]="viewMode === 'TOP_DOWN'" (click)="setViewMode('TOP_DOWN')">
            <i class="fa-solid fa-layer-group"></i> 2D Floor Plan
          </button>
          <button [class.active]="viewMode === 'FRONT'" (click)="setViewMode('FRONT')">
            <i class="fa-solid fa-vr-cardboard"></i> Front Elevation
          </button>
        </div>

        <div class="toolbar-actions">
          <button class="tool-btn" (click)="resetCameraView()" title="Reset Camera">
            <i class="fa-solid fa-camera-rotate"></i> Reset View
          </button>
          <button class="tool-btn" (click)="toggleDayNight()" [class.active]="isNightMode" title="Toggle Day/Night Lighting">
            <i [class]="isNightMode ? 'fa-solid fa-moon' : 'fa-solid fa-sun'"></i> {{ isNightMode ? 'Night Mode' : 'Daylight' }}
          </button>
          <button class="tool-btn" (click)="undo()" [disabled]="historyIndex <= 0" title="Undo (Ctrl+Z)">
            <i class="fa-solid fa-rotate-left"></i> Undo
          </button>
          <button class="tool-btn btn-danger" (click)="clearAllFurniture()" title="Clear Room">
            <i class="fa-solid fa-trash"></i> Clear
          </button>
          <button class="tool-btn btn-export" (click)="exportStudioSnapshot()" title="Export PNG Image">
            <i class="fa-solid fa-download"></i> Export PNG
          </button>
          <button class="btn btn-primary btn-save" (click)="saveProject()">
            <i class="fa-solid fa-floppy-disk"></i> Save Design
          </button>
        </div>
      </header>

      <div class="studio-body">
        <!-- LEFT SIDEBAR: 3D FURNITURE & MATERIAL PALETTE -->
        <aside class="left-sidebar">
          <div class="sidebar-tabs">
            <button [class.active]="activeTab === 'FURNITURE'" (click)="activeTab = 'FURNITURE'">
              <i class="fa-solid fa-couch"></i> 3D Furniture
            </button>
            <button [class.active]="activeTab === 'PAINT'" (click)="activeTab = 'PAINT'">
              <i class="fa-solid fa-palette"></i> Walls & Floor
            </button>
            <button [class.active]="activeTab === 'ROOM'" (click)="activeTab = 'ROOM'">
              <i class="fa-solid fa-vector-square"></i> Room Specs
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
                (click)="add3DFurniture(item)"
              >
                <div class="item-preview">
                  <div class="item-3d-badge">3D</div>
                  <i [class]="getCategoryIcon(item.category)" class="catalog-icon"></i>
                </div>
                <div class="item-meta">
                  <div class="name">{{ item.name }}</div>
                  <div class="dimensions">{{ item.defaultWidth }}' × {{ item.defaultHeight }}'</div>
                </div>
                <button class="add-btn" title="Add to room"><i class="fa-solid fa-plus"></i></button>
              </div>
            </div>
          </div>

          <!-- PAINT & FLOOR MATERIALS TAB -->
          <div class="tab-content" *ngIf="activeTab === 'PAINT'">
            <div class="palette-section">
              <h4><i class="fa-solid fa-paint-roller"></i> 3D Wall Paint</h4>
              <p class="sub-label">Click a shade to paint all interior walls</p>
              <div class="color-swatches">
                <div
                  *ngFor="let c of wallPalette"
                  class="swatch"
                  [style.background-color]="c.hex"
                  [class.active]="wallColor === c.hex"
                  (click)="setWallColor(c.hex)"
                  [title]="c.name"
                ></div>
              </div>
            </div>

            <div class="palette-section">
              <h4><i class="fa-solid fa-border-all"></i> 3D Floor Textures & Materials</h4>
              <p class="sub-label">Select flooring surface</p>
              <div class="material-grid">
                <button
                  *ngFor="let mat of floorMaterials"
                  class="material-card"
                  [class.active]="floorMaterialType === mat.id"
                  (click)="setFloorMaterial(mat.id)"
                >
                  <div class="mat-color-preview" [style.background]="mat.preview"></div>
                  <span>{{ mat.name }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- ROOM SPECS TAB -->
          <div class="tab-content" *ngIf="activeTab === 'ROOM'">
            <div class="room-control-group">
              <label>Room Width (Feet): {{ roomWidthFt }}'</label>
              <input type="range" min="10" max="36" step="2" [(ngModel)]="roomWidthFt" (input)="updateRoomDimensions()">
            </div>
            <div class="room-control-group">
              <label>Room Length (Feet): {{ roomLengthFt }}'</label>
              <input type="range" min="10" max="36" step="2" [(ngModel)]="roomLengthFt" (input)="updateRoomDimensions()">
            </div>
            <div class="room-control-group">
              <label>Ceiling Height: {{ roomHeightFt }}'</label>
              <input type="range" min="8" max="16" step="1" [(ngModel)]="roomHeightFt" (input)="updateRoomDimensions()">
            </div>

            <div class="room-preset-boxes">
              <h4>Quick Layout Presets:</h4>
              <button class="btn-preset" (click)="applyRoomPreset('LIVING')">Modern Living Room</button>
              <button class="btn-preset" (click)="applyRoomPreset('BEDROOM')">Master Suite</button>
              <button class="btn-preset" (click)="applyRoomPreset('OFFICE')">Executive Office</button>
            </div>
          </div>
        </aside>

        <!-- 3D / 2D CANVAS VIEWPORT -->
        <main class="canvas-viewport" #viewportContainer>
          <!-- THREE.JS 3D CANVAS CONTAINER -->
          <div class="threejs-canvas-wrapper" #threeCanvasContainer [style.display]="viewMode === '3D' ? 'block' : 'none'"></div>

          <!-- 2D FLOOR PLAN / ELEVATION CANVAS (for 2D views) -->
          <canvas #canvas2D class="canvas-2d" [style.display]="viewMode !== '3D' ? 'block' : 'none'"></canvas>

          <!-- 3D INTERACTION HINT OVERLAY -->
          <div class="viewport-hints" *ngIf="viewMode === '3D'">
            <div class="hint-pill"><i class="fa-solid fa-computer-mouse"></i> Left Click + Drag: <strong>Orbit 3D Camera</strong></div>
            <div class="hint-pill"><i class="fa-solid fa-arrows-up-down-left-right"></i> Right Click: <strong>Pan Room</strong></div>
            <div class="hint-pill"><i class="fa-solid fa-magnifying-glass-plus"></i> Scroll: <strong>Zoom In/Out</strong></div>
          </div>

          <!-- SELECTED ITEM FLOATING CONTROLLER -->
          <div class="selected-item-toolbar" *ngIf="selectedFurniture">
            <span class="selected-title"><i class="fa-solid fa-couch"></i> {{ selectedFurniture.name }}</span>
            <div class="actions">
              <button (click)="rotateSelected(45)" title="Rotate 45°"><i class="fa-solid fa-rotate-right"></i> Rotate</button>
              <button (click)="changeColorSelected()" title="Change Fabric Color"><i class="fa-solid fa-paint-roller"></i> Color</button>
              <button class="btn-del" (click)="deleteSelected()" title="Delete"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>
        </main>

        <!-- RIGHT SIDEBAR: PLACED OBJECTS & INSPECTOR -->
        <aside class="right-sidebar">
          <div class="inspector-header">
            <h3><i class="fa-solid fa-list-check"></i> Placed Objects ({{ placedItems.length }})</h3>
          </div>

          <div class="placed-list" *ngIf="placedItems.length > 0; else emptyPlaced">
            <div
              *ngFor="let item of placedItems"
              class="placed-row"
              [class.active]="selectedFurniture?.instanceId === item.instanceId"
              (click)="selectItem(item)"
            >
              <div class="icon-circle"><i [class]="getCategoryIcon(item.category)"></i></div>
              <div class="name-box">
                <div class="item-name">{{ item.name }}</div>
                <div class="item-sub">{{ item.x | number:'1.0-0' }}', {{ item.y | number:'1.0-0' }}' • {{ item.rotation }}°</div>
              </div>
              <button class="remove-btn" (click)="$event.stopPropagation(); deleteItem(item.instanceId)">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>

          <ng-template #emptyPlaced>
            <div class="empty-state">
              <i class="fa-solid fa-couch"></i>
              <p>No 3D furniture placed yet.<br>Click items from the catalog on the left to stage this room!</p>
            </div>
          </ng-template>
        </aside>
      </div>
    </div>
  `,
  styles: [`
    .designer-layout {
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
      background: #090d16;
      color: #f1f5f9;
      font-family: var(--font-sans);
    }

    /* TOP TOOLBAR */
    .designer-toolbar {
      height: 60px;
      background: #0f172a;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20px;
      z-index: 100;

      .brand-sub {
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 700;
        color: var(--primary);
        font-size: 1rem;

        .project-title { color: #f8fafc; font-weight: 600; }
      }

      .view-toggle {
        display: flex;
        background: #1e293b;
        padding: 4px;
        border-radius: 8px;
        gap: 4px;

        button {
          background: transparent;
          border: none;
          color: #94a3b8;
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 6px;

          &.active, &:hover {
            background: var(--primary);
            color: #ffffff;
          }
        }
      }

      .toolbar-actions {
        display: flex;
        align-items: center;
        gap: 8px;

        .tool-btn {
          background: #1e293b;
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #cbd5e1;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.82rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;

          &:hover:not(:disabled) {
            background: #334155;
            color: #ffffff;
          }

          &:disabled { opacity: 0.4; cursor: not-allowed; }

          &.btn-danger:hover { background: #ef4444; border-color: #ef4444; }
          &.btn-export { background: #06b6d4; color: white; border-color: #06b6d4; }
        }

        .btn-save {
          padding: 6px 16px;
          font-size: 0.85rem;
        }
      }
    }

    /* STUDIO BODY */
    .studio-body {
      display: flex;
      flex: 1;
      overflow: hidden;
      position: relative;
    }

    /* LEFT SIDEBAR */
    .left-sidebar {
      width: 320px;
      background: #0f172a;
      border-right: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      flex-direction: column;
      z-index: 50;

      .sidebar-tabs {
        display: flex;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);

        button {
          flex: 1;
          padding: 12px 8px;
          background: transparent;
          border: none;
          color: #94a3b8;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;

          &.active {
            color: var(--primary);
            border-bottom: 2px solid var(--primary);
            background: rgba(255, 90, 95, 0.05);
          }
        }
      }

      .tab-content {
        padding: 16px;
        overflow-y: auto;
        flex: 1;
      }

      .category-pills {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
        margin-bottom: 14px;

        button {
          background: #1e293b;
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: #94a3b8;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 0.75rem;
          cursor: pointer;

          &.active, &:hover {
            background: var(--primary);
            color: white;
          }
        }
      }

      .catalog-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;

        .catalog-card {
          background: #1e293b;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 8px;
          padding: 12px;
          cursor: pointer;
          position: relative;
          transition: all 0.2s ease;

          &:hover {
            transform: translateY(-2px);
            border-color: var(--primary);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
          }

          .item-preview {
            height: 65px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #090d16;
            border-radius: 6px;
            margin-bottom: 8px;
            position: relative;

            .item-3d-badge {
              position: absolute;
              top: 4px;
              left: 4px;
              background: #06b6d4;
              color: white;
              font-size: 0.65rem;
              font-weight: 800;
              padding: 1px 4px;
              border-radius: 3px;
            }

            .catalog-icon {
              font-size: 1.8rem;
              color: #cbd5e1;
            }
          }

          .item-meta {
            .name { font-size: 0.8rem; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .dimensions { font-size: 0.7rem; color: #64748b; margin-top: 2px; }
          }

          .add-btn {
            position: absolute;
            bottom: 8px;
            right: 8px;
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: var(--primary);
            color: white;
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.7rem;
            cursor: pointer;
          }
        }
      }

      /* Paint & Floor styles */
      .palette-section {
        margin-bottom: 24px;
        h4 { font-size: 0.95rem; margin-bottom: 4px; display: flex; align-items: center; gap: 8px; color: #f8fafc; }
        .sub-label { font-size: 0.75rem; color: #64748b; margin-bottom: 10px; }

        .color-swatches {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 8px;

          .swatch {
            height: 36px;
            border-radius: 6px;
            cursor: pointer;
            border: 2px solid transparent;
            transition: transform 0.2s ease;

            &:hover, &.active {
              transform: scale(1.1);
              border-color: #ffffff;
              box-shadow: 0 0 10px rgba(255, 255, 255, 0.4);
            }
          }
        }

        .material-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;

          .material-card {
            background: #1e293b;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 6px;
            padding: 8px;
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            color: #cbd5e1;
            font-size: 0.75rem;
            font-weight: 600;

            &.active, &:hover {
              border-color: var(--primary);
              background: #334155;
              color: white;
            }

            .mat-color-preview {
              width: 24px;
              height: 24px;
              border-radius: 4px;
            }
          }
        }
      }

      .room-control-group {
        margin-bottom: 16px;
        label { display: block; font-size: 0.8rem; margin-bottom: 6px; color: #94a3b8; }
        input[type="range"] { width: 100%; accent-color: var(--primary); }
      }

      .room-preset-boxes {
        margin-top: 20px;
        h4 { font-size: 0.85rem; margin-bottom: 10px; color: #94a3b8; }
        .btn-preset {
          display: block;
          width: 100%;
          padding: 8px 12px;
          background: #1e293b;
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #cbd5e1;
          border-radius: 6px;
          font-size: 0.8rem;
          margin-bottom: 8px;
          cursor: pointer;

          &:hover { background: var(--primary); color: white; }
        }
      }
    }

    /* MAIN VIEWPORT */
    .canvas-viewport {
      flex: 1;
      position: relative;
      background: #070a12;
      overflow: hidden;

      .threejs-canvas-wrapper {
        width: 100%;
        height: 100%;
      }

      .canvas-2d {
        width: 100%;
        height: 100%;
        display: block;
      }

      .viewport-hints {
        position: absolute;
        bottom: 16px;
        left: 16px;
        display: flex;
        gap: 8px;
        pointer-events: none;

        .hint-pill {
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #94a3b8;
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 0.75rem;

          strong { color: #f8fafc; }
          i { color: var(--primary); margin-right: 4px; }
        }
      }

      .selected-item-toolbar {
        position: absolute;
        top: 16px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(15, 23, 42, 0.95);
        backdrop-filter: blur(12px);
        border: 1px solid var(--primary);
        border-radius: 999px;
        padding: 6px 18px;
        display: flex;
        align-items: center;
        gap: 16px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);

        .selected-title {
          font-size: 0.85rem;
          font-weight: 700;
          color: #f8fafc;
          i { color: var(--primary); }
        }

        .actions {
          display: flex;
          gap: 6px;

          button {
            background: #1e293b;
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: #cbd5e1;
            padding: 4px 10px;
            border-radius: 999px;
            font-size: 0.78rem;
            font-weight: 600;
            cursor: pointer;

            &:hover { background: var(--primary); color: white; }
            &.btn-del:hover { background: #ef4444; }
          }
        }
      }
    }

    /* RIGHT SIDEBAR */
    .right-sidebar {
      width: 280px;
      background: #0f172a;
      border-left: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      flex-direction: column;

      .inspector-header {
        padding: 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        h3 { font-size: 0.9rem; margin: 0; color: #f8fafc; }
      }

      .placed-list {
        padding: 12px;
        overflow-y: auto;
        flex: 1;

        .placed-row {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #1e293b;
          border: 1px solid rgba(255, 255, 255, 0.06);
          padding: 8px 12px;
          border-radius: 8px;
          margin-bottom: 8px;
          cursor: pointer;
          transition: all 0.2s ease;

          &:hover, &.active {
            border-color: var(--primary);
            background: #334155;
          }

          .icon-circle {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            background: #090d16;
            color: var(--primary);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.85rem;
          }

          .name-box {
            flex: 1;
            .item-name { font-size: 0.8rem; font-weight: 700; }
            .item-sub { font-size: 0.7rem; color: #64748b; }
          }

          .remove-btn {
            background: transparent;
            border: none;
            color: #64748b;
            cursor: pointer;
            font-size: 0.8rem;

            &:hover { color: #ef4444; }
          }
        }
      }

      .empty-state {
        padding: 40px 20px;
        text-align: center;
        color: #64748b;
        i { font-size: 2rem; margin-bottom: 12px; color: #334155; }
        p { font-size: 0.82rem; line-height: 1.5; margin: 0; }
      }
    }
  `]
})
export class DesignerComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('threeCanvasContainer') threeCanvasContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('canvas2D') canvas2DRef!: ElementRef<HTMLCanvasElement>;

  furnitureService = inject(FurnitureService);
  designService = inject(DesignService);
  propertyService = inject(PropertyService);
  route = inject(ActivatedRoute);

  viewMode: '3D' | 'TOP_DOWN' | 'FRONT' = '3D';
  activeTab: 'FURNITURE' | 'PAINT' | 'ROOM' = 'FURNITURE';
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
    id: 'proj-' + Date.now(),
    name: '3D Luxury Interior Design Studio',
    roomWidth: 20,
    roomHeight: 16,
    roomShape: 'RECTANGLE',
    wallColor: '#E2E8F0',
    floorColor: '#c29b61',
    floorTexture: 'WOOD',
    placedFurniture: [],
    createdAt: new Date().toISOString()
  };

  historyStack: PlacedFurniture[][] = [];
  historyIndex = 0;

  get filteredCatalog(): FurnitureItem[] {
    return this.catalog.filter(item => item.category === this.selectedCategory);
  }

  ngOnInit() {
    this.furnitureService.getCatalog().subscribe((items: FurnitureItem[]) => {
      this.catalog = items;
      this.loadInitialTemplate();
    });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.initThreeJSEngine();
    }, 200);
  }

  ngOnDestroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
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
    this.scene.background = new THREE.Color(0x070a12);

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(16, 14, 20);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.innerHTML = '';
    container.appendChild(this.renderer.domElement);

    // OrbitControls
    if ((THREE as any).OrbitControls) {
      this.controls = new (THREE as any).OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.maxPolarAngle = Math.PI / 2 - 0.05; // Prevent camera going below floor
      this.controls.target.set(0, 2, 0);
    }

    // Lighting
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xfff8e7, 0.85);
    this.dirLight.position.set(15, 25, 15);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.scene.add(this.dirLight);

    // Build 3D Room
    this.build3DRoom();

    // Render loop
    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);
      if (this.controls) this.controls.update();
      this.renderer.render(this.scene, this.camera);
    };
    animate();

    // Resize listener
    window.addEventListener('resize', () => {
      if (!this.threeCanvasContainer) return;
      const w = this.threeCanvasContainer.nativeElement.clientWidth;
      const h = this.threeCanvasContainer.nativeElement.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });

    // Raycasting for object selection
    this.renderer.domElement.addEventListener('click', (e: MouseEvent) => this.on3DCanvasClick(e));
  }

  // 2. 3D PROCEDURAL ROOM GENERATOR
  build3DRoom() {
    if (this.roomMeshGroup) {
      this.scene.remove(this.roomMeshGroup);
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
    const backWall = new THREE.Mesh(backWallGeo, wallMat);
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

    // Set position & rotation based on room scale
    const posX = (placed.x / 100) * (this.roomWidthFt / 2) - this.roomWidthFt / 4;
    const posZ = (placed.y / 100) * (this.roomLengthFt / 2) - this.roomLengthFt / 4;
    group.position.set(posX, 0, posZ);
    group.rotation.y = (placed.rotation * Math.PI) / 180;
    group.userData = { id: placed.instanceId };

    return group;
  }

  // 4. ADD FURNITURE TO 3D ROOM
  add3DFurniture(item: FurnitureItem) {
    const newPlaced: PlacedFurniture = {
      instanceId: 'inst-' + Date.now(),
      furnitureId: item.id,
      name: item.name,
      category: item.category,
      x: 40 + Math.random() * 20,
      y: 40 + Math.random() * 20,
      width: item.defaultWidth,
      height: item.defaultHeight,
      rotation: 0,
      color: '#1E293B',
      viewMode: 'TOP_DOWN'
    };

    this.placedItems.push(newPlaced);
    this.selectedFurniture = newPlaced;

    if (this.scene) {
      const mesh = this.create3DMesh(item, newPlaced);
      this.furnitureMeshMap.set(newPlaced.instanceId, mesh);
      this.scene.add(mesh);
    }

    this.saveHistoryState();
  }

  // 5. 3D RAYCASTING CLICK LISTENER
  on3DCanvasClick(event: MouseEvent) {
    if (!this.renderer || !this.camera || !this.scene) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);

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
          this.selectedFurniture = found;
        }
      }
    }
  }

  // 6. 3D CONTROLS (Rotate, Delete, Color)
  rotateSelected(degrees: number) {
    if (!this.selectedFurniture) return;
    this.selectedFurniture.rotation = (this.selectedFurniture.rotation + degrees) % 360;

    const mesh = this.furnitureMeshMap.get(this.selectedFurniture.instanceId);
    if (mesh) {
      mesh.rotation.y = (this.selectedFurniture.rotation * Math.PI) / 180;
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
      this.scene.remove(oldMesh);
      const item = this.catalog.find(c => c.id === this.selectedFurniture?.furnitureId) || this.catalog[0];
      const newMesh = this.create3DMesh(item, this.selectedFurniture);
      this.furnitureMeshMap.set(this.selectedFurniture.instanceId, newMesh);
      this.scene.add(newMesh);
    }
  }

  deleteSelected() {
    if (!this.selectedFurniture) return;
    this.deleteItem(this.selectedFurniture.instanceId);
  }

  deleteItem(id: string) {
    const mesh = this.furnitureMeshMap.get(id);
    if (mesh && this.scene) {
      this.scene.remove(mesh);
      this.furnitureMeshMap.delete(id);
    }
    this.placedItems = this.placedItems.filter(p => p.instanceId !== id);
    if (this.selectedFurniture?.instanceId === id) {
      this.selectedFurniture = null;
    }
    this.saveHistoryState();
  }

  selectItem(item: PlacedFurniture) {
    this.selectedFurniture = item;
  }

  clearAllFurniture() {
    this.placedItems.forEach(p => {
      const mesh = this.furnitureMeshMap.get(p.instanceId);
      if (mesh && this.scene) this.scene.remove(mesh);
    });
    this.furnitureMeshMap.clear();
    this.placedItems = [];
    this.selectedFurniture = null;
    this.saveHistoryState();
  }

  // 7. MATERIAL & LIGHTING CONTROLS
  setWallColor(color: string) {
    this.wallColor = color;
    this.build3DRoom();
  }

  setFloorMaterial(matId: 'WOOD' | 'TILE' | 'CARPET' | 'CONCRETE') {
    this.floorMaterialType = matId;
    this.build3DRoom();
  }

  toggleDayNight() {
    this.isNightMode = !this.isNightMode;
    if (this.scene) {
      if (this.isNightMode) {
        this.scene.background = new THREE.Color(0x020617);
        this.ambientLight.intensity = 0.2;
        this.dirLight.intensity = 0.1;
      } else {
        this.scene.background = new THREE.Color(0x070a12);
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
    this.build3DRoom();
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

  // 8. VIEW SWITCHER
  setViewMode(mode: '3D' | 'TOP_DOWN' | 'FRONT') {
    this.viewMode = mode;
    if (mode === '3D') {
      setTimeout(() => {
        if (this.camera && this.controls) {
          this.camera.position.set(16, 14, 20);
          this.controls.target.set(0, 2, 0);
        }
      }, 100);
    }
  }

  // 9. EXPORT & SAVE
  exportStudioSnapshot() {
    if (this.renderer) {
      const dataUrl = this.renderer.domElement.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `omnispace-3d-design-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    }
  }

  saveProject() {
    this.currentProject.placedFurniture = this.placedItems;
    this.currentProject.floorTexture = this.floorMaterialType;
    this.currentProject.wallColor = this.wallColor;

    this.designService.saveDesign(this.currentProject).subscribe(() => {
      alert('🎉 3D Interior Design Project Saved Successfully!');
    });
  }

  saveHistoryState() {
    this.historyStack.push(JSON.parse(JSON.stringify(this.placedItems)));
    this.historyIndex = this.historyStack.length - 1;
  }

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.placedItems = JSON.parse(JSON.stringify(this.historyStack[this.historyIndex]));
      this.rebuildAllMeshes();
    }
  }

  rebuildAllMeshes() {
    this.placedItems.forEach(p => {
      const oldMesh = this.furnitureMeshMap.get(p.instanceId);
      if (oldMesh && this.scene) this.scene.remove(oldMesh);
    });
    this.furnitureMeshMap.clear();

    this.placedItems.forEach(p => {
      const item = this.catalog.find(c => c.id === p.furnitureId) || this.catalog[0];
      const mesh = this.create3DMesh(item, p);
      this.furnitureMeshMap.set(p.instanceId, mesh);
      this.scene.add(mesh);
    });
  }

  loadInitialTemplate() {
    setTimeout(() => {
      if (this.catalog.length > 0 && this.placedItems.length === 0) {
        this.applyRoomPreset('LIVING');
      }
    }, 500);
  }

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
