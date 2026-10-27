import { Component, ElementRef, ViewChild, AfterViewInit, inject, OnInit, OnDestroy, HostListener, ChangeDetectorRef } from '@angular/core';
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
          <div class="cube-icon"><i class="fa-solid fa-cube"></i></div>
          <div class="brand-copy"><span class="brand-eyebrow">OMNISPACE / STUDIO</span><span class="project-title">{{ currentProject.name }}</span></div>
        </div>

        <!-- 3D vs 2D View Switcher -->
        <div class="view-toggle">
          <button [class.active]="viewMode === '3D'" (click)="setViewMode('3D')">
            <i class="fa-solid fa-cube"></i> 3D View
          </button>
          <button [class.active]="viewMode === 'TOP_DOWN'" (click)="setViewMode('TOP_DOWN')">
            <i class="fa-solid fa-layer-group"></i> Floor plan
          </button>
          <button [class.active]="viewMode === 'FRONT'" (click)="setViewMode('FRONT')">
            <i class="fa-solid fa-vr-cardboard"></i> Elevation
          </button>
        </div>

        <div class="toolbar-actions">
          <button class="tool-btn" (click)="resetCameraView()" title="Reset Camera">
            <i class="fa-solid fa-camera-rotate"></i> Reset View
          </button>
          <button class="tool-btn" (click)="toggleDayNight()" [class.active]="isNightMode" title="Toggle Day/Night Lighting">
            <i [class]="isNightMode ? 'fa-solid fa-moon' : 'fa-solid fa-sun'"></i> {{ isNightMode ? 'Night Mode' : 'Daylight' }}
          </button>
          <button class="tool-btn" (click)="undo()" [disabled]="historyIndex <= 0" title="Undo last change">
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
          <div class="studio-intro"><span>YOUR CREATIVE SPACE</span><h2>Make room for ideas<span class="intro-dot">.</span></h2><p>Build a space that feels like you.</p></div>
          <div class="sidebar-tabs"><button [class.active]="activeTab === 'PHOTOS'" (click)="activeTab = 'PHOTOS'"><i class="fa-solid fa-image"></i> Photos</button>
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

          <div class="tab-content photo-panel" *ngIf="activeTab === 'PHOTOS'">
            <div class="section-kicker">GET STARTED <span>01 / 02</span></div><div class="photo-heading"><span>01</span><div><h3>Start with your room</h3><p>Add a photo to use as the back wall of your 3D space.</p></div></div>
            <label class="upload-card" for="room-upload"><img *ngIf="roomPhoto" [src]="roomPhoto" alt="Room reference"><i *ngIf="!roomPhoto" class="fa-solid fa-cloud-arrow-up"></i><strong>{{ roomPhoto ? 'Replace room photo' : 'Upload a room photo' }}</strong><small>JPG, PNG or WebP · up to 10 MB</small></label>
            <input id="room-upload" class="file-input" type="file" accept="image/jpeg,image/png,image/webp" (change)="uploadRoom($event)">
            <button *ngIf="roomPhoto" class="text-button" (click)="removeRoomPhoto()">Remove room photo</button>
            <div class="photo-divider"></div>
            <div class="photo-heading"><span>02</span><div><h3>Bring in your furniture</h3><p>Add a sofa, table or decor photo to the scene.</p></div></div>
            <label class="upload-card furniture-upload" for="furniture-upload"><i class="fa-solid fa-plus"></i><strong>Add furniture photo</strong><small>Transparent PNG works best</small></label>
            <input id="furniture-upload" class="file-input" type="file" accept="image/jpeg,image/png,image/webp" (change)="uploadFurniture($event)">
            <p class="photo-note photo-info"><i class="fa-solid fa-circle-info"></i> Photos appear as flat panels, not 3D models. Select one to move, rotate or resize it.</p>
            <p class="photo-error" role="alert" *ngIf="photoError">{{ photoError }}</p><p class="photo-success" role="status" *ngIf="saveMessage">{{ saveMessage }}</p>
            <button class="restore-button" (click)="restoreLastDesign()">Restore last saved design</button><p class="photo-note">Designs are saved in this browser only.</p>
          </div>
          <!-- FURNITURE TAB CONTENT -->
          <div class="tab-content" *ngIf="activeTab === 'FURNITURE'">
            <div class="panel-heading"><span>EXPLORE THE COLLECTION</span><h3>Find your furniture</h3><p>Choose a piece to add it to your room.</p></div><div class="category-pills">
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
          <div class="viewport-label" *ngIf="!selectedFurniture"><span class="live-dot"></span><div><strong>{{ viewMode === '3D' ? 'Your space in 3D' : (viewMode === 'TOP_DOWN' ? 'Floor plan' : 'Elevation') }}</strong><small>{{ roomWidthFt }} × {{ roomLengthFt }} ft · {{ placedItems.length }} pieces</small></div></div>
          <!-- THREE.JS 3D CANVAS CONTAINER -->
          <div class="threejs-canvas-wrapper" #threeCanvasContainer [style.display]="viewMode === '3D' ? 'block' : 'none'"></div>

          <!-- 2D FLOOR PLAN / ELEVATION CANVAS (for 2D views) -->
          <canvas 
            #canvas2D 
            class="canvas-2d" 
            [style.display]="viewMode !== '3D' ? 'block' : 'none'"
            (mousedown)="on2DMouseDown($event)"
            (mousemove)="on2DMouseMove($event)"
            (mouseup)="on2DMouseUp($event)"
            (mouseleave)="on2DMouseUp($event)"
          ></canvas>

          <!-- 3D INTERACTION HINT OVERLAY -->
          <div class="viewport-hints" *ngIf="viewMode === '3D'">
            <div class="hint-pill"><i class="fa-solid fa-arrows-up-down-left-right"></i> <strong>Click & Drag Any Object</strong> to Move</div>
            <div class="hint-pill"><i class="fa-solid fa-computer-mouse"></i> Left Click Floor: <strong>Orbit Camera</strong></div>
            <div class="hint-pill"><i class="fa-solid fa-keyboard"></i> Arrow Keys: <strong>Nudge Position</strong></div>
          </div>

          <!-- SELECTED ITEM FLOATING CONTROLLER -->
          <div class="selected-item-toolbar" *ngIf="selectedFurniture">
            <div class="selected-meta">
              <span class="selected-title"><i class="fa-solid fa-couch"></i> {{ selectedFurniture.name }}</span>
              <span class="selected-pos">{{ selectedFurniture.imageData ? 'Photo panel' : '3D object' }}</span>
            </div>

            <!-- Precision Direction Pad -->
            <div class="move-dpad">
              <button (click)="moveSelected(-3, 0)" title="Move Left (←)"><i class="fa-solid fa-arrow-left"></i></button>
              <button (click)="moveSelected(0, -3)" title="Move Up (↑)"><i class="fa-solid fa-arrow-up"></i></button>
              <button (click)="moveSelected(0, 3)" title="Move Down (↓)"><i class="fa-solid fa-arrow-down"></i></button>
              <button (click)="moveSelected(3, 0)" title="Move Right (→)"><i class="fa-solid fa-arrow-right"></i></button>
            </div>

            <div class="actions">
              <button *ngIf="selectedFurniture.imageData" (click)="resizePhoto(0.8)" title="Make photo smaller">− Size</button>
              <button *ngIf="selectedFurniture.imageData" (click)="resizePhoto(1.25)" title="Make photo larger">+ Size</button>
              <button (click)="rotateSelected(45)" title="Rotate 45° (R)"><i class="fa-solid fa-rotate-right"></i> Rotate</button>
              <button *ngIf="!selectedFurniture.imageData" (click)="changeColorSelected()" title="Change Fabric Color"><i class="fa-solid fa-paint-roller"></i> Color</button>
              <button class="btn-del" (click)="deleteSelected()" title="Delete (Del)"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>
        </main>

        <!-- RIGHT SIDEBAR: PLACED OBJECTS & INSPECTOR -->
        <aside class="right-sidebar">
          <div class="inspector-header">
            <div class="inspector-title"><div><span>YOUR SPACE</span><h3>Placed pieces</h3></div><b>{{ placedItems.length }}</b></div><p>Select an item to edit it.</p>
          </div>

          <div class="placed-list" *ngIf="placedItems.length > 0; else emptyPlaced">
            <div
              *ngFor="let item of placedItems"
              class="placed-row"
              [class.active]="selectedFurniture?.instanceId === item.instanceId"
              (click)="selectItem(item)"
            >
              <div class="icon-circle"><img *ngIf="item.imageData" [src]="item.imageData" alt=""><i *ngIf="!item.imageData" [class]="getCategoryIcon(item.category)"></i></div>
              <div class="name-box">
                <div class="item-name">{{ item.name }}</div>
                <div class="item-sub">{{ item.imageData ? 'Photo' : '3D object' }} · {{ item.rotation }}°</div>
              </div>
              <button class="remove-btn" [attr.aria-label]="'Remove ' + item.name" (click)="$event.stopPropagation(); deleteItem(item.instanceId)">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>

          <ng-template #emptyPlaced>
            <div class="empty-state">
              <i class="fa-solid fa-couch"></i>
              <p>Your room is a blank canvas.<br>Add a photo or choose a piece from the collection.</p>
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

    .studio-intro { padding: 24px 20px 17px; background: linear-gradient(135deg, #182744, #152337); }
    .studio-intro span { color: #8ea6cf; letter-spacing: .16em; font-size: 10px; font-weight: 800; }
    .studio-intro h2 { color: white; font-size: 23px; margin: 6px 0 2px; }
    .studio-intro p { color: #aebbd1; font-size: 12px; margin: 0; }
    .sidebar-tabs { flex-wrap: wrap; }
    .photo-heading { display: flex; gap: 12px; margin: 8px 0 14px; }
    .photo-heading span { color: #ffac9f; font-weight: 800; font-size: 12px; padding: 6px; background: #433141; border-radius: 8px; height: fit-content; }
    .photo-heading h3 { margin: 0 0 4px; color: white; font-size: 15px; }
    .photo-heading p { margin: 0; color: #a8b6ce; font-size: 12px; line-height: 1.5; }
    .upload-card { min-height: 145px; border: 1px dashed #647a9c; border-radius: 14px; background: #18263d; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 8px; cursor: pointer; overflow: hidden; padding: 16px; text-align: center; }
    .upload-card:hover { border-color: #ff8b83; background: #20314b; }
    .upload-card img { width: 100%; max-height: 130px; object-fit: cover; border-radius: 8px; }
    .upload-card i { color: #ffada1; font-size: 22px; }
    .upload-card strong { font-size: 13px; color: white; }
    .upload-card small { color: #a2b1ca; font-size: 11px; }
    .furniture-upload { min-height: 120px; }
    .file-input { position: absolute; width: 1px; height: 1px; opacity: 0; }
    .text-button { color: #ffada1; background: none; padding: 10px 0; cursor: pointer; }
    .photo-divider { height: 1px; background: #334155; margin: 22px 0; }
    .photo-note { color: #a9b8cf; font-size: 12px; line-height: 1.6; }
    .photo-error { color: #fca5a5; font-size: 12px; }
    .restore-button { width: 100%; padding: 11px; border: 1px solid #526782; border-radius: 9px; background: #23344d; color: white; cursor: pointer; }
    @media (max-width: 900px) { .designer-layout { height: auto; min-height: 100vh; overflow: visible; } .studio-body { flex-wrap: wrap; } .left-sidebar, .right-sidebar { width: 100% !important; max-height: 420px; } .canvas-viewport { flex: 1 0 100%; min-height: 460px; } .designer-toolbar { height: auto; flex-wrap: wrap; gap: 10px; padding: 12px; } }
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

        .cube-icon {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1rem;
        }

        .project-title { color: #f8fafc; font-weight: 700; font-size: 0.95rem; }
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
        cursor: grab;

        &:active {
          cursor: grabbing;
        }
      }

      .viewport-hints {
        position: absolute;
        bottom: 16px;
        left: 16px;
        display: flex;
        gap: 8px;
        pointer-events: none;
        flex-wrap: wrap;

        .hint-pill {
          background: rgba(15, 23, 42, 0.85);
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
        background: rgba(15, 23, 42, 0.96);
        backdrop-filter: blur(12px);
        border: 1px solid var(--primary);
        border-radius: 999px;
        padding: 6px 18px;
        display: flex;
        align-items: center;
        gap: 14px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
        z-index: 200;

        .selected-meta {
          display: flex;
          flex-direction: column;

          .selected-title {
            font-size: 0.85rem;
            font-weight: 700;
            color: #f8fafc;
            i { color: var(--primary); }
          }

          .selected-pos {
            font-size: 0.7rem;
            color: #94a3b8;
          }
        }

        .move-dpad {
          display: flex;
          align-items: center;
          gap: 4px;
          background: #1e293b;
          padding: 2px 6px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.08);

          button {
            background: transparent;
            border: none;
            color: #cbd5e1;
            width: 24px;
            height: 24px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 0.75rem;
            transition: all 0.15s ease;

            &:hover {
              background: var(--primary);
              color: white;
            }
          }
        }

        .actions {
          display: flex;
          gap: 6px;

          button {
            background: #1e293b;
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: #cbd5e1;
            padding: 5px 12px;
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

    /* Workspace visual system */
    .designer-layout { background: #0b1020; font-family: 'DM Sans', sans-serif; }
    .designer-toolbar { min-height: 78px; height: auto; gap: 18px; padding: 14px 22px; background: #111a2d; }
    .designer-toolbar .brand-sub { min-width: 210px; }
    .designer-toolbar .brand-sub .cube-icon { width: 40px; height: 40px; border-radius: 13px; background: linear-gradient(145deg,#fa887e,#d96683); box-shadow: 0 5px 18px #f47b8240; }
    .brand-copy { display: flex; flex-direction: column; gap: 3px; }
    .brand-eyebrow, .section-kicker, .panel-heading span, .inspector-title span { color: #8796b4; font-size: 9px; font-weight: 800; letter-spacing: .15em; }
    .designer-toolbar .brand-sub .project-title { color: #f7f8fc; font-size: 13px; max-width: 210px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .designer-toolbar .view-toggle { background: #0b1323; border: 1px solid #27344b; padding: 4px; border-radius: 12px; }
    .designer-toolbar .view-toggle button { padding: 9px 11px; font-size: 12px; white-space: nowrap; }
    .designer-toolbar .view-toggle button.active { background: #f0807c; box-shadow: 0 3px 12px #f0807c44; }
    .designer-toolbar .toolbar-actions { flex-wrap: wrap; justify-content: flex-end; }
    .designer-toolbar .toolbar-actions .tool-btn { border-radius: 9px; min-height: 36px; background: #202c42; }
    .designer-toolbar .toolbar-actions .btn-export { background: #202c42; border-color: #35445c; }
    .designer-toolbar .toolbar-actions .btn-save { min-height: 36px; border-radius: 9px; white-space: nowrap; }
    .studio-body { min-height: 0; }
    .left-sidebar { width: 330px; min-width: 0; background: #111a2d; }
    .studio-intro { background: linear-gradient(140deg,#253653,#19263c); padding: 24px 22px; }
    .studio-intro h2 { max-width: 250px; font-size: 25px; line-height: 1.15; letter-spacing: -.035em; }
    .studio-intro .intro-dot { color: #ff8e82; font-size: inherit; letter-spacing: 0; }
    .studio-intro p { margin-top: 9px; }
    .left-sidebar .sidebar-tabs { display: grid; grid-template-columns: 1fr 1fr; padding: 9px; gap: 4px; }
    .left-sidebar .sidebar-tabs button { justify-content: flex-start; border-radius: 9px; border: 0; padding: 10px; font-size: 11px; }
    .left-sidebar .sidebar-tabs button.active { background: #2d354a; color: #ffaaa0; border: 0; }
    .left-sidebar .tab-content { padding: 20px; }
    .section-kicker { display: flex; justify-content: space-between; margin-bottom: 19px; }
    .section-kicker span { color: #ffafa0; }
    .photo-heading { margin-bottom: 15px; }
    .photo-heading span { background: #3e3443; border-radius: 10px; padding: 8px; }
    .photo-heading h3, .panel-heading h3 { font-size: 15px; color: #f4f6fc; }
    .upload-card { border-radius: 15px; background: linear-gradient(145deg,#1b2b44,#1b253b); border-color: #536783; }
    button:focus-visible, input:focus-visible { outline: 2px solid #ffb2a9; outline-offset: 3px; }
    .photo-info { padding: 12px; background: #1b2940; border: 1px solid #293c59; border-radius: 10px; }
    .photo-info i { color: #f7a296; margin-right: 4px; }
    .photo-success { font-size: 12px; color: #a7e9c1; line-height: 1.5; }
    .panel-heading { margin-bottom: 18px; }
    .panel-heading h3 { margin: 7px 0; }
    .panel-heading p { font-size: 12px; color: #a8b6ce; line-height: 1.5; }
    .canvas-viewport { min-width: 0; background: radial-gradient(circle at 50% 38%, #1d2d48, #0c1426 74%); }
    .viewport-label { position: absolute; z-index: 2; top: 22px; left: 22px; display: flex; align-items: flex-start; gap: 10px; pointer-events: none; padding: 10px 13px; border: 1px solid #ffffff1a; border-radius: 12px; background: #111b30d9; }
    .viewport-label strong, .viewport-label small { display: block; }
    .viewport-label strong { color: #f8fafc; font-size: 12px; }
    .viewport-label small { color: #a5b3ca; font-size: 11px; margin-top: 3px; }
    .live-dot { width: 7px; height: 7px; border-radius: 50%; background: #8bd4b0; margin-top: 4px; }
    .canvas-viewport .selected-item-toolbar { max-width: calc(100% - 24px); flex-wrap: wrap; justify-content: center; border-radius: 16px; padding: 10px 12px; }
    .canvas-viewport .viewport-hints { right: 16px; }
    .right-sidebar { width: 248px; min-width: 0; background: #111a2d; }
    .right-sidebar .inspector-header { padding: 24px 18px 17px; }
    .inspector-title { display: flex; align-items: center; justify-content: space-between; }
    .right-sidebar .inspector-header h3 { font-size: 16px; margin-top: 6px; }
    .inspector-title b { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 10px; background: #293750; color: #ffc0b4; font-size: 12px; }
    .inspector-header p { margin: 8px 0 0; color: #98a8c2; font-size: 12px; }
    .right-sidebar .placed-list .placed-row { padding: 10px; border-radius: 11px; background: #1c2940; }
    .right-sidebar .placed-list .placed-row .icon-circle { border-radius: 9px; overflow: hidden; width: 38px; height: 38px; flex-shrink: 0; }
    .icon-circle img { width: 100%; height: 100%; object-fit: cover; }
    @media (max-width: 1250px) { .designer-toolbar { flex-wrap: wrap; } .designer-toolbar .toolbar-actions { margin-left: auto; } .left-sidebar { width: 300px; } .right-sidebar { width: 210px; } }
    @media (max-width: 900px) {
      .designer-layout { height: auto; min-height: 100vh; overflow: visible; }
      .designer-toolbar { position: relative; padding: 14px; gap: 12px; }
      .designer-toolbar .brand-sub { min-width: 0; flex: 1 0 100%; }
      .designer-toolbar .view-toggle { width: 100%; justify-content: space-between; }
      .designer-toolbar .toolbar-actions { justify-content: flex-start; margin: 0; }
      .studio-body { display: flex; flex-wrap: wrap; overflow: visible; }
      .left-sidebar { width: 100% !important; max-height: none; order: 1; }
      .left-sidebar .tab-content { max-height: 440px; }
      .canvas-viewport { flex: 1 0 100%; width: 100%; min-height: 480px; height: 60vh; order: 2; }
      .right-sidebar { width: 100% !important; max-height: 360px; order: 3; }
      .canvas-viewport .selected-item-toolbar { width: max-content; }
    }
    @media (max-width: 520px) {
      .designer-toolbar .toolbar-actions { gap: 5px; }
      .designer-toolbar .toolbar-actions .tool-btn, .designer-toolbar .toolbar-actions .btn-save { font-size: 11px; padding: 7px; }
      .designer-toolbar .view-toggle button { font-size: 11px; padding: 8px 6px; }
      .canvas-viewport .viewport-hints { bottom: 10px; left: 10px; gap: 5px; }
      .canvas-viewport .viewport-hints .hint-pill { font-size: 10px; padding: 5px 7px; }
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
      this.draw2DCanvas();
    }, 200);
  }

  ngOnDestroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
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
        return { data, width: img.width, height: img.height, name: file.name.replace(/\.[^.]+$/, '') };
      } finally { URL.revokeObjectURL(url); }
    } catch { this.photoError = 'Could not process this image. Try a smaller or different photo.'; return null; }
    finally { this.cdr.markForCheck(); }
  }
  async uploadRoom(event: Event) {
    const photo = await this.readPhoto(event); if (!photo) return;
    this.roomPhoto = photo.data; if (this.scene) this.build3DRoom(); this.cdr.markForCheck();
  }
  resizePhoto(factor: number) {
    const item = this.selectedFurniture;
    if (!item?.imageData || !this.scene) return;
    const width = Math.max(1, Math.min(10, item.width * factor));
    const ratio = width / item.width;
    item.width = width; item.height *= ratio;
    const oldMesh = this.furnitureMeshMap.get(item.instanceId);
    if (oldMesh) this.scene.remove(oldMesh);
    const mesh = this.create3DMesh(this.catalog[0], item);
    this.furnitureMeshMap.set(item.instanceId, mesh); this.scene.add(mesh);
    this.updateSelectionRing(); this.saveHistoryState();
  }
  removeRoomPhoto() { this.roomPhoto = ''; if (this.scene) this.build3DRoom(); }
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
    this.designService.getSavedDesigns().subscribe(projects => {
      const project = projects.find(p => p.id !== 'demo-design-1');
      if (!project) { this.photoError = 'No saved design found in this browser yet.'; return; }
      this.currentProject = { ...project }; this.roomPhoto = project.roomPhoto || ''; this.roomWidthFt = project.roomWidth; this.roomLengthFt = project.roomHeight;
      this.wallColor = project.wallColor; this.floorMaterialType = project.floorTexture;
      this.furnitureMeshMap.forEach(mesh => this.scene?.remove(mesh)); this.furnitureMeshMap.clear();
      this.placedItems = JSON.parse(JSON.stringify(project.placedFurniture)); this.selectedFurniture = null;
      if (this.scene) { this.build3DRoom(); this.rebuildAllMeshes(); }
      this.historyStack = []; this.saveHistoryState(); this.photoError = ''; this.saveMessage = 'Your saved design is ready.'; this.cdr.markForCheck();
    });
  }

  // KEYBOARD SHORTCUTS FOR MOVING & ROTATING
  @HostListener('window:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent) {
    if (!this.selectedFurniture || /^(INPUT|TEXTAREA|SELECT)$/.test((e.target as HTMLElement)?.tagName)) return;

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      this.moveSelected(-2, 0);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      this.moveSelected(2, 0);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.moveSelected(0, -2);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.moveSelected(0, 2);
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
      this.draw2DCanvas();
    });

    // 3D POINTER LISTENERS FOR DRAGGING & SELECTION
    const domEl = this.renderer.domElement;
    domEl.addEventListener('pointerdown', (e: PointerEvent) => this.on3DPointerDown(e));
    domEl.addEventListener('pointermove', (e: PointerEvent) => this.on3DPointerMove(e));
    domEl.addEventListener('pointerup', (e: PointerEvent) => this.on3DPointerUp(e));
    domEl.addEventListener('pointercancel', (e: PointerEvent) => this.on3DPointerUp(e));
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
    let backMaterial = wallMat;
    if (this.roomPhoto) {
      const texture = new THREE.TextureLoader().load(this.roomPhoto);
      texture.encoding = THREE.sRGBEncoding;
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
      texture.encoding = THREE.sRGBEncoding;
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(placed.width || 4, placed.height || 3), new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide, alphaTest: 0.05 }));
      panel.position.y = (placed.height || 3) / 2;
      group.add(panel);
      group.position.set((placed.x / 100) * this.roomWidthFt - this.roomWidthFt / 2, 0, (placed.y / 100) * this.roomLengthFt - this.roomLengthFt / 2);
      group.rotation.y = placed.rotation * Math.PI / 180;
      group.userData = { id: placed.instanceId };
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
    const newPlaced: PlacedFurniture = {
      instanceId: 'inst-' + Date.now(),
      furnitureId: item.id,
      name: item.name,
      category: item.category,
      x: 35 + Math.random() * 30,
      y: 35 + Math.random() * 30,
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

        // Clamp inside room
        const maxLimitX = this.roomWidthFt / 2 - 1.5;
        const maxLimitZ = this.roomLengthFt / 2 - 1.5;
        newX = Math.max(-maxLimitX, Math.min(maxLimitX, newX));
        newZ = Math.max(-maxLimitZ, Math.min(maxLimitZ, newZ));

        mesh.position.x = newX;
        mesh.position.z = newZ;

        // Convert 3D world coords to percentage (0 - 100)
        this.selectedFurniture.x = ((newX + this.roomWidthFt / 2) / this.roomWidthFt) * 100;
        this.selectedFurniture.y = ((newZ + this.roomLengthFt / 2) / this.roomLengthFt) * 100;

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
      this.scene.remove(mesh);
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
      if (mesh && this.scene) this.scene.remove(mesh);
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
    this.build3DRoom();
    this.draw2DCanvas();
  }

  setFloorMaterial(matId: 'WOOD' | 'TILE' | 'CARPET' | 'CONCRETE') {
    this.floorMaterialType = matId;
    this.build3DRoom();
    this.draw2DCanvas();
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
    this.draw2DCanvas();
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
    setTimeout(() => this.draw2DCanvas(), 50);
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
      const itemX = startX + (item.x / 100) * (roomPxW - itemW);
      const itemY = startY + (item.y / 100) * (roomPxH - itemH);

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
  on2DMouseDown(e: MouseEvent) {
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
      const itemX = startX + (item.x / 100) * (roomPxW - itemW);
      const itemY = startY + (item.y / 100) * (roomPxH - itemH);

      if (mouseX >= itemX && mouseX <= itemX + itemW && mouseY >= itemY && mouseY <= itemY + itemH) {
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

  on2DMouseMove(e: MouseEvent) {
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

    this.dragItem2D.x = Math.max(0, Math.min(100, (targetX / (roomPxW - itemW)) * 100));
    this.dragItem2D.y = Math.max(0, Math.min(100, (targetY / (roomPxH - itemH)) * 100));

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

  on2DMouseUp(e: MouseEvent) {
    if (this.isDragging2D) {
      this.isDragging2D = false;
      this.dragItem2D = null;
      this.saveHistoryState();
    }
  }

  // 10. EXPORT & SAVE
  exportStudioSnapshot() {
    if (this.renderer) {
      const canvas = this.viewMode === '3D' ? this.renderer.domElement : this.canvas2DRef.nativeElement;
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `omnispace-3d-design-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    }
  }

  saveProject() {
    this.currentProject.placedFurniture = this.placedItems;
    this.currentProject.roomPhoto = this.roomPhoto;
    this.currentProject.roomWidth = this.roomWidthFt;
    this.currentProject.roomHeight = this.roomLengthFt;
    this.currentProject.floorTexture = this.floorMaterialType;
    this.currentProject.wallColor = this.wallColor;

    try {
      this.designService.saveDesign(this.currentProject).subscribe(() => { this.saveMessage = 'Saved in this browser. Restore it anytime from Photos.'; this.photoError = ''; this.activeTab = 'PHOTOS'; this.cdr.markForCheck(); });
    } catch {
      this.saveMessage = '';
      this.photoError = 'Could not save: browser storage may be full. Remove some photos and try again.';
      this.activeTab = 'PHOTOS';
    }
  }

  saveHistoryState() {
    this.historyStack.push(JSON.parse(JSON.stringify(this.placedItems)));
    this.historyIndex = this.historyStack.length - 1;
    this.draw2DCanvas();
  }

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.placedItems = JSON.parse(JSON.stringify(this.historyStack[this.historyIndex]));
      this.rebuildAllMeshes();
      this.draw2DCanvas();
    }
  }

  rebuildAllMeshes() {
    this.furnitureMeshMap.forEach(mesh => { if (this.scene) this.scene.remove(mesh); });
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
