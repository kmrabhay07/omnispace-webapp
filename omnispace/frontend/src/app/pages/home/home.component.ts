import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PropertyService } from '../../core/services/property.service';
import { Property } from '../../core/models/property.model';
import { PropertyCardComponent } from '../../shared/components/property-card/property-card.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, PropertyCardComponent],
  template: `
    <div class="home-page animate-fade-in">
      <!-- HERO SECTION -->
      <section class="hero-section">
        <div class="hero-overlay"></div>
        <div class="container hero-content">
          <div class="hero-badge">
            <i class="fa-solid fa-sparkles"></i> Next-Gen Real Estate Platform
          </div>
          <h1 class="hero-title">
            Find Your Dream Space & <br>
            <span class="gradient-text">Design It Yourself</span>
          </h1>
          <p class="hero-subtitle">
            Browse premium residential and commercial properties, then use our interactive 2D Design Studio to customize furniture, paint walls, and plan layout before you buy.
          </p>

          <!-- Search Bar Box -->
          <div class="search-box">
            <div class="search-tabs">
              <button [class.active]="searchType === 'ALL'" (click)="searchType = 'ALL'">All Properties</button>
              <button [class.active]="searchType === 'RESIDENTIAL'" (click)="searchType = 'RESIDENTIAL'">Residential</button>
              <button [class.active]="searchType === 'COMMERCIAL'" (click)="searchType = 'COMMERCIAL'">Commercial</button>
            </div>
            <div class="search-inputs">
              <div class="input-field">
                <i class="fa-solid fa-magnifying-glass"></i>
                <input type="text" [(ngModel)]="searchKeyword" placeholder="Location, neighborhood, city..." (keyup.enter)="onSearch()">
              </div>
              <div class="input-divider"></div>
              <div class="input-field">
                <i class="fa-solid fa-house"></i>
                <select [(ngModel)]="searchCategory">
                  <option value="">Property Type (All)</option>
                  <option value="Apartment">Apartment</option>
                  <option value="Villa">Villa</option>
                  <option value="Penthouse">Penthouse</option>
                  <option value="Office">Office</option>
                  <option value="Retail">Retail Store</option>
                </select>
              </div>
              <button class="btn btn-primary search-btn" (click)="onSearch()">
                <i class="fa-solid fa-arrow-right"></i> Search
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- FEATURE HIGHLIGHTS -->
      <section class="features-section">
        <div class="container">
          <div class="section-header text-center">
            <h2>Why Choose OmniSpace?</h2>
            <p>Combining real estate marketplace with immersive virtual interior design tools</p>
          </div>

          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon icon-red">
                <i class="fa-solid fa-building"></i>
              </div>
              <h3>Curated Listings</h3>
              <p>Explore high-end residential homes, luxury villas, executive office spaces, and commercial retail units.</p>
            </div>

            <div class="feature-card">
              <div class="feature-icon icon-teal">
                <i class="fa-solid fa-palette"></i>
              </div>
              <h3>2D Interior Design Studio</h3>
              <p>Drag and drop furniture items, paint walls, change floor textures, and switch between floor plan and wall views.</p>
            </div>

            <div class="feature-card">
              <div class="feature-icon icon-orange">
                <i class="fa-solid fa-download"></i>
              </div>
              <h3>Save & Export Designs</h3>
              <p>Save your interior design projects and export them as high-quality PNG images to share with clients or contractors.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- INTERIOR DESIGN STUDIO SPOTLIGHT BANNER -->
      <section class="studio-banner-section">
        <div class="container">
          <div class="studio-banner-card">
            <div class="banner-text">
              <span class="badge badge-primary">Interactive Tool</span>
              <h2>Virtual Room Planner & Staging Studio</h2>
              <p>
                Don't just view a room — customize it! Our drag-and-drop studio lets you add sofas, beds, desks, dining sets, paint walls with custom colors, and view your design from bird's-eye top-down view or front-wall view.
              </p>
              <div class="banner-features">
                <span><i class="fa-solid fa-check"></i> 20+ Furniture SVGs</span>
                <span><i class="fa-solid fa-check"></i> Dual View Modes (Top/Front)</span>
                <span><i class="fa-solid fa-check"></i> Wall & Floor Customizer</span>
                <span><i class="fa-solid fa-check"></i> Export PNG</span>
              </div>
              <a routerLink="/designer" class="btn btn-primary btn-lg mt-4">
                <i class="fa-solid fa-wand-magic-sparkles"></i> Launch Interior Design Studio
              </a>
            </div>

            <div class="banner-visual">
              <div class="visual-canvas-mock">
                <div class="mock-header">
                  <span class="dot red"></span>
                  <span class="dot yellow"></span>
                  <span class="dot green"></span>
                  <span class="mock-title">OmniSpace Studio Engine</span>
                </div>
                <div class="mock-body">
                  <div class="mock-sidebar">
                    <div class="mock-item active"><i class="fa-solid fa-couch"></i> Sofa</div>
                    <div class="mock-item"><i class="fa-solid fa-bed"></i> Bed</div>
                    <div class="mock-item"><i class="fa-solid fa-chair"></i> Chair</div>
                    <div class="mock-item"><i class="fa-solid fa-brush"></i> Paint</div>
                  </div>
                  <div class="mock-grid">
                    <div class="mock-furniture sofa-item" style="top: 30%; left: 25%;">
                      <i class="fa-solid fa-couch"></i> Sectional Sofa
                    </div>
                    <div class="mock-furniture table-item" style="top: 45%; left: 60%;">
                      <i class="fa-solid fa-table"></i> Coffee Table
                    </div>
                    <div class="mock-furniture plant-item" style="top: 70%; left: 20%;">
                      <i class="fa-solid fa-plant-wilt"></i> Monstera
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- FEATURED PROPERTIES -->
      <section class="properties-section">
        <div class="container">
          <div class="section-header-flex">
            <div>
              <h2>Featured Properties</h2>
              <p>Handpicked luxury spaces ready for interactive design</p>
            </div>
            <a routerLink="/properties" class="btn btn-outline">
              View All Properties <i class="fa-solid fa-arrow-right"></i>
            </a>
          </div>

          <div class="properties-grid">
            <ng-container *ngFor="let prop of featuredProperties">
              <app-property-card [property]="prop"></app-property-card>
            </ng-container>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .hero-section {
      position: relative;
      background: linear-gradient(135deg, #1A1A24 0%, #2A2D3E 100%), url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1800&q=80') center/cover;
      padding: 100px 0 120px;
      color: white;
      text-align: center;

      .hero-overlay {
        position: absolute;
        inset: 0;
        background: rgba(18, 20, 29, 0.72);
        backdrop-filter: blur(3px);
      }

      .hero-content {
        position: relative;
        z-index: 2;
        max-width: 900px;
      }

      .hero-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: rgba(255, 90, 95, 0.2);
        color: #FF7B80;
        border: 1px solid rgba(255, 90, 95, 0.4);
        padding: 6px 16px;
        border-radius: var(--radius-full);
        font-size: 0.85rem;
        font-weight: 700;
        margin-bottom: 24px;
      }

      .hero-title {
        font-size: 3.4rem;
        font-weight: 800;
        margin-bottom: 20px;
        line-height: 1.15;
        color: white;

        .gradient-text {
          background: linear-gradient(135deg, #FF5A5F, #FF8E53);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      }

      .hero-subtitle {
        font-size: 1.15rem;
        color: #CBD5E1;
        margin-bottom: 40px;
        line-height: 1.6;
      }
    }

    /* Search Box */
    .search-box {
      background: rgba(255, 255, 255, 0.98);
      padding: 8px;
      border-radius: var(--radius-lg);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      color: var(--dark);
      text-align: left;
    }

    .search-tabs {
      display: flex;
      gap: 4px;
      padding: 6px 12px;
      border-bottom: 1px solid var(--gray-border);

      button {
        background: transparent;
        padding: 8px 16px;
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--gray-muted);
        border-radius: var(--radius-sm);

        &:hover {
          color: var(--dark);
        }

        &.active {
          color: var(--primary);
          background: var(--primary-light);
        }
      }
    }

    .search-inputs {
      display: flex;
      align-items: center;
      padding: 8px;
      gap: 12px;

      @media (max-width: 768px) {
        flex-direction: column;
      }

      .input-field {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 16px;

        i {
          color: var(--primary);
          font-size: 1.1rem;
        }

        input, select {
          width: 100%;
          border: none;
          outline: none;
          font-size: 0.95rem;
          font-family: var(--font-body);
          background: transparent;

          &:focus {
            box-shadow: none;
          }
        }
      }

      .input-divider {
        width: 1px;
        height: 36px;
        background: var(--gray-border);

        @media (max-width: 768px) {
          display: none;
        }
      }

      .search-btn {
        padding: 14px 28px;
      }
    }

    /* Features Section */
    .features-section {
      padding: 80px 0;

      .section-header {
        margin-bottom: 50px;
        h2 { font-size: 2.2rem; }
        p { color: var(--gray-muted); font-size: 1.05rem; }
      }

      .features-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 30px;
      }

      .feature-card {
        background: var(--white);
        padding: 36px 28px;
        border-radius: var(--radius-md);
        border: 1px solid var(--gray-border);
        transition: transform 0.3s ease;

        &:hover {
          transform: translateY(-6px);
          box-shadow: var(--shadow-md);
        }

        .feature-icon {
          width: 56px;
          height: 56px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          margin-bottom: 20px;

          &.icon-red { background: rgba(255, 90, 95, 0.1); color: var(--primary); }
          &.icon-teal { background: rgba(0, 166, 153, 0.1); color: var(--secondary); }
          &.icon-orange { background: rgba(252, 100, 45, 0.1); color: var(--accent); }
        }

        h3 { font-size: 1.3rem; margin-bottom: 10px; }
        p { color: var(--gray-muted); font-size: 0.95rem; }
      }
    }

    /* Studio Spotlight Banner */
    .studio-banner-section {
      padding: 40px 0 80px;

      .studio-banner-card {
        background: linear-gradient(135deg, #1E293B, #0F172A);
        border-radius: var(--radius-lg);
        padding: 60px;
        color: white;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 40px;
        align-items: center;

        @media (max-width: 992px) {
          grid-template-columns: 1fr;
          padding: 30px;
        }

        .banner-text {
          h2 {
            font-size: 2.3rem;
            color: white;
            margin: 16px 0;
          }

          p {
            color: #94A3B8;
            font-size: 1.05rem;
            margin-bottom: 24px;
          }

          .banner-features {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            font-weight: 600;
            font-size: 0.95rem;

            i {
              color: var(--secondary);
              margin-right: 6px;
            }
          }

          .mt-4 { margin-top: 28px; }
        }

        .banner-visual {
          .visual-canvas-mock {
            background: #0F172A;
            border: 1px solid #334155;
            border-radius: var(--radius-md);
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.5);

            .mock-header {
              background: #1E293B;
              padding: 10px 16px;
              display: flex;
              align-items: center;
              gap: 8px;

              .dot {
                width: 10px; height: 10px; border-radius: 50%;
                &.red { background: #EF4444; }
                &.yellow { background: #F59E0B; }
                &.green { background: #10B981; }
              }

              .mock-title {
                font-size: 0.78rem;
                color: #94A3B8;
                margin-left: 12px;
              }
            }

            .mock-body {
              display: flex;
              height: 260px;

              .mock-sidebar {
                width: 100px;
                background: #1E293B;
                border-right: 1px solid #334155;
                padding: 12px 8px;
                display: flex;
                flex-direction: column;
                gap: 8px;

                .mock-item {
                  padding: 8px;
                  font-size: 0.75rem;
                  color: #94A3B8;
                  border-radius: 6px;
                  display: flex;
                  align-items: center;
                  gap: 6px;

                  &.active {
                    background: var(--primary);
                    color: white;
                  }
                }
              }

              .mock-grid {
                flex: 1;
                background: #090D16;
                background-image: linear-gradient(#1E293B 1px, transparent 1px), linear-gradient(90deg, #1E293B 1px, transparent 1px);
                background-size: 20px 20px;
                position: relative;

                .mock-furniture {
                  position: absolute;
                  padding: 8px 12px;
                  border-radius: 8px;
                  font-size: 0.75rem;
                  font-weight: 700;

                  &.sofa-item { background: #3B82F6; color: white; }
                  &.table-item { background: #F59E0B; color: white; }
                  &.plant-item { background: #10B981; color: white; }
                }
              }
            }
          }
        }
      }
    }

    /* Properties Section */
    .properties-section {
      padding: 40px 0 100px;

      .section-header-flex {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        margin-bottom: 40px;

        h2 { font-size: 2.2rem; }
        p { color: var(--gray-muted); }
      }

      .properties-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
        gap: 30px;
      }
    }

    .text-center { text-align: center; }
  `]
})
export class HomeComponent implements OnInit {
  propertyService = inject(PropertyService);
  router = inject(Router);

  featuredProperties: Property[] = [];
  searchType: 'ALL' | 'RESIDENTIAL' | 'COMMERCIAL' = 'ALL';
  searchKeyword = '';
  searchCategory = '';

  ngOnInit() {
    this.propertyService.getProperties().subscribe(props => {
      this.featuredProperties = props.slice(0, 3);
    });
  }

  onSearch() {
    this.router.navigate(['/properties'], {
      queryParams: {
        type: this.searchType !== 'ALL' ? this.searchType : null,
        category: this.searchCategory || null,
        location: this.searchKeyword || null
      }
    });
  }
}
