import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PropertyService } from '../../../core/services/property.service';
import { Property } from '../../../core/models/property.model';

@Component({
  selector: 'app-property-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="property-detail-page animate-fade-in" *ngIf="property; else loading">
      <!-- HERO GALLERY HEADER -->
      <section class="gallery-section">
        <div class="container">
          <div class="breadcrumb">
            <a routerLink="/properties">Properties</a> / <span>{{ property.title }}</span>
          </div>

          <div class="gallery-grid">
            <div class="main-image">
              <img [src]="activeImage || property.featuredImage" [alt]="property.title">
            </div>
            <div class="thumbnail-col" *ngIf="property.images && property.images.length > 1">
              <div
                *ngFor="let img of property.images"
                class="thumb-item"
                [class.active]="activeImage === img"
                (click)="activeImage = img"
              >
                <img [src]="img" alt="Thumbnail">
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="content-section">
        <div class="container detail-layout">
          <main class="main-detail">
            <!-- Title & Price Header -->
            <div class="header-info">
              <div class="badges-row">
                <span class="badge" [ngClass]="property.propertyType === 'RESIDENTIAL' ? 'badge-residential' : 'badge-commercial'">
                  {{ property.category }}
                </span>
                <span class="furnish-badge">{{ property.furnishingStatus }}</span>
              </div>
              <h1 class="title">{{ property.title }}</h1>
              <p class="location"><i class="fa-solid fa-location-dot"></i> {{ property.location }} • {{ property.address }}</p>

              <div class="price-box">
                <span class="price-val">\${{ property.price | number }}</span>
                <span class="price-sub">Est. mortgage \${{ (property.price * 0.005) | number:'1.0-0' }}/mo</span>
              </div>
            </div>

            <!-- Quick Specs Row -->
            <div class="specs-bar">
              <div class="spec-card" *ngIf="property.bedrooms > 0">
                <i class="fa-solid fa-bed"></i>
                <div class="spec-val">{{ property.bedrooms }}</div>
                <div class="spec-lbl">Bedrooms</div>
              </div>
              <div class="spec-card" *ngIf="property.bathrooms > 0">
                <i class="fa-solid fa-bath"></i>
                <div class="spec-val">{{ property.bathrooms }}</div>
                <div class="spec-lbl">Bathrooms</div>
              </div>
              <div class="spec-card">
                <i class="fa-solid fa-vector-square"></i>
                <div class="spec-val">{{ property.areaSqFt | number }}</div>
                <div class="spec-lbl">Square Feet</div>
              </div>
              <div class="spec-card">
                <i class="fa-solid fa-building"></i>
                <div class="spec-val">{{ property.propertyType }}</div>
                <div class="spec-lbl">Type</div>
              </div>
            </div>

            <!-- DESIGN THIS SPACE BANNER CTA -->
            <div class="designer-cta-banner">
              <div class="cta-icon">
                <i class="fa-solid fa-wand-magic-sparkles"></i>
              </div>
              <div class="cta-text">
                <h3>Want to customize this room?</h3>
                <p>Use our 2D Interior Studio to add furniture, paint walls, change layout, and export design concepts for this space.</p>
              </div>
              <a [routerLink]="['/designer']" [queryParams]="{propertyId: property.id}" class="btn btn-teal">
                <i class="fa-solid fa-palette"></i> Launch Interior Studio
              </a>
            </div>

            <!-- Description -->
            <div class="section-block">
              <h2>Property Description</h2>
              <p class="description-text">{{ property.description }}</p>
            </div>

            <!-- Amenities -->
            <div class="section-block" *ngIf="property.amenities && property.amenities.length > 0">
              <h2>Features & Amenities</h2>
              <div class="amenities-grid">
                <div class="amenity-item" *ngFor="let am of property.amenities">
                  <i class="fa-solid fa-circle-check"></i> {{ am }}
                </div>
              </div>
            </div>
          </main>

          <!-- Contact Sidebar -->
          <aside class="sidebar-contact">
            <div class="contact-card">
              <h3>Interested in this space?</h3>
              <p>Contact the owner or book a virtual walkthrough.</p>

              <div class="owner-profile">
                <div class="avatar"><i class="fa-solid fa-user-tie"></i></div>
                <div class="owner-meta">
                  <div class="name">{{ property.ownerName || 'Victoria Sterling' }}</div>
                  <div class="role">Property Agent / Owner</div>
                </div>
              </div>

              <div class="contact-buttons">
                <a [href]="'tel:' + (property.ownerContact || '123456789')" class="btn btn-primary btn-full">
                  <i class="fa-solid fa-phone"></i> Call Agent
                </a>
                <button (click)="onInquire()" class="btn btn-outline btn-full">
                  <i class="fa-solid fa-envelope"></i> Send Message
                </button>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>

    <ng-template #loading>
      <div class="container text-center py-5">
        <p>Loading property details...</p>
      </div>
    </ng-template>
  `,
  styles: [`
    .gallery-section {
      padding: 30px 0;
      background: #F8FAFC;

      .breadcrumb {
        font-size: 0.9rem;
        color: var(--gray-muted);
        margin-bottom: 16px;
        a { color: var(--dark); font-weight: 600; }
      }

      .gallery-grid {
        display: grid;
        grid-template-columns: 1fr 120px;
        gap: 16px;
        height: 420px;

        @media (max-width: 768px) {
          grid-template-columns: 1fr;
          height: auto;
        }

        .main-image {
          width: 100%;
          height: 100%;
          border-radius: var(--radius-md);
          overflow: hidden;
          background: #000;

          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
        }

        .thumbnail-col {
          display: flex;
          flex-direction: column;
          gap: 12px;
          overflow-y: auto;

          .thumb-item {
            height: 90px;
            border-radius: var(--radius-sm);
            overflow: hidden;
            cursor: pointer;
            border: 2px solid transparent;
            opacity: 0.7;
            transition: all 0.2s ease;

            &.active, &:hover {
              opacity: 1;
              border-color: var(--primary);
            }

            img { width: 100%; height: 100%; object-fit: cover; }
          }
        }
      }
    }

    .detail-layout {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 40px;
      padding: 40px 0 100px;

      @media (max-width: 992px) {
        grid-template-columns: 1fr;
      }
    }

    .header-info {
      margin-bottom: 30px;

      .badges-row {
        display: flex;
        gap: 10px;
        margin-bottom: 12px;

        .furnish-badge {
          font-size: 0.8rem;
          font-weight: 700;
          background: var(--gray-light);
          padding: 4px 10px;
          border-radius: var(--radius-full);
          color: var(--dark-soft);
        }
      }

      .title { font-size: 2.2rem; margin-bottom: 8px; }
      .location { color: var(--gray-muted); font-size: 1rem; margin-bottom: 20px; }

      .price-box {
        display: flex;
        align-items: baseline;
        gap: 16px;

        .price-val { font-size: 2.2rem; font-weight: 800; color: var(--primary); }
        .price-sub { font-size: 0.9rem; color: var(--gray-muted); }
      }
    }

    .specs-bar {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      background: var(--white);
      border: 1px solid var(--gray-border);
      border-radius: var(--radius-md);
      padding: 20px;
      margin-bottom: 36px;

      .spec-card {
        text-align: center;
        i { font-size: 1.5rem; color: var(--primary); margin-bottom: 6px; }
        .spec-val { font-size: 1.2rem; font-weight: 700; }
        .spec-lbl { font-size: 0.8rem; color: var(--gray-muted); }
      }
    }

    .designer-cta-banner {
      background: linear-gradient(135deg, #0F172A, #1E293B);
      color: white;
      border-radius: var(--radius-md);
      padding: 24px 30px;
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 40px;

      @media (max-width: 768px) {
        flex-direction: column;
        text-align: center;
      }

      .cta-icon {
        width: 54px;
        height: 54px;
        border-radius: 50%;
        background: rgba(0, 166, 153, 0.2);
        color: var(--secondary);
        font-size: 1.6rem;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .cta-text {
        flex: 1;
        h3 { color: white; font-size: 1.25rem; margin-bottom: 4px; }
        p { color: #94A3B8; font-size: 0.9rem; }
      }
    }

    .section-block {
      margin-bottom: 40px;
      h2 { font-size: 1.4rem; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid var(--gray-border); }
      .description-text { font-size: 1.05rem; line-height: 1.7; color: var(--dark-soft); }
    }

    .amenities-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 14px;

      .amenity-item {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 0.95rem;
        color: var(--dark-soft);

        i { color: var(--secondary); }
      }
    }

    .sidebar-contact {
      .contact-card {
        background: var(--white);
        border: 1px solid var(--gray-border);
        border-radius: var(--radius-md);
        padding: 28px;
        position: sticky;
        top: 100px;

        h3 { font-size: 1.2rem; margin-bottom: 6px; }
        p { font-size: 0.9rem; color: var(--gray-muted); margin-bottom: 24px; }

        .owner-profile {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
          padding: 12px;
          background: var(--gray-light);
          border-radius: var(--radius-sm);

          .avatar {
            width: 42px;
            height: 42px;
            border-radius: 50%;
            background: var(--dark);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .name { font-weight: 700; font-size: 0.95rem; }
          .role { font-size: 0.78rem; color: var(--gray-muted); }
        }

        .contact-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;

          .btn-full { width: 100%; }
        }
      }
    }
  `]
})
export class PropertyDetailComponent implements OnInit {
  propertyService = inject(PropertyService);
  route = inject(ActivatedRoute);

  property?: Property;
  activeImage = '';

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.propertyService.getPropertyById(id).subscribe(prop => {
          this.property = prop;
          if (prop && prop.featuredImage) {
            this.activeImage = prop.featuredImage;
          }
        });
      }
    });
  }

  onInquire() {
    alert('Inquiry sent to property agent! They will contact you shortly.');
  }
}
