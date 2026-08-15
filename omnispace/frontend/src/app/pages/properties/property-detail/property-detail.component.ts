import { Component, inject, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PropertyService } from '../../../core/services/property.service';
import { Property } from '../../../core/models/property.model';

declare var L: any;

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
                <span class="price-val">{{ property.currencySymbol || (property.currency === 'INR' ? '₹' : '$') }}{{ property.price | number }}</span>
                <span class="price-sub">Est. mortgage {{ property.currencySymbol || (property.currency === 'INR' ? '₹' : '$') }}{{ (property.price * 0.005) | number:'1.0-0' }}/mo</span>
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

            <!-- Interactive Map Section -->
            <div class="section-block">
              <h2>Location & Map</h2>
              <p class="map-location-title"><i class="fa-solid fa-map-location-dot"></i> {{ property.address ? (property.address + ', ' + property.location) : property.location }}</p>
              <div id="property-detail-map" class="map-container"></div>
            </div>
          </main>

          <!-- Contact Sidebar -->
          <aside class="sidebar-contact">
            <div class="contact-card">
              <h3>Interested in this space?</h3>
              <p>Contact the owner or book a virtual walkthrough.</p>

              <div class="owner-profile">
                <div class="avatar"><i class="fa-solid fa-user-check"></i></div>
                <div class="owner-meta">
                  <div class="name">{{ property.ownerName || 'Verified Host' }}</div>
                  <div class="role"><i class="fa-solid fa-shield-halved text-success"></i> Verified Listing Owner</div>
                  <div class="contact-info-sub">{{ property.ownerContact }}</div>
                </div>
              </div>

              <div class="contact-buttons">
                <a *ngIf="getPhoneContact()" [href]="'tel:' + getPhoneContact()" class="btn btn-primary btn-full">
                  <i class="fa-solid fa-phone"></i> Call {{ property.ownerName || 'Host' }}
                </a>
                <a *ngIf="getEmailContact()" [href]="'mailto:' + getEmailContact() + '?subject=' + encodeSubject()" class="btn btn-outline btn-full">
                  <i class="fa-solid fa-envelope"></i> Email {{ property.ownerName || 'Host' }}
                </a>
                <button *ngIf="!getPhoneContact() && !getEmailContact()" (click)="onInquire()" class="btn btn-primary btn-full">
                  <i class="fa-solid fa-paper-plane"></i> Send Inquiry
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
        grid-template-columns: 1fr 180px;
        gap: 16px;
        height: 480px;

        @media (max-width: 768px) {
          grid-template-columns: 1fr;
          height: auto;
        }

        .main-image {
          border-radius: var(--radius-lg);
          overflow: hidden;
          background: #000;
          height: 100%;

          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            min-height: 300px;
          }
        }

        .thumbnail-col {
          display: flex;
          flex-direction: column;
          gap: 12px;
          overflow-y: auto;

          @media (max-width: 768px) {
            flex-direction: row;
            height: 90px;
          }

          .thumb-item {
            height: 110px;
            border-radius: var(--radius-md);
            overflow: hidden;
            cursor: pointer;
            border: 2px solid transparent;
            opacity: 0.7;
            transition: all 0.2s ease;

            @media (max-width: 768px) {
              width: 120px;
              height: 100%;
              flex-shrink: 0;
            }

            &:hover, &.active {
              opacity: 1;
              border-color: var(--primary);
            }

            img {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
          }
        }
      }
    }

    .content-section {
      padding: 50px 0 100px;

      .detail-layout {
        display: grid;
        grid-template-columns: 1fr 340px;
        gap: 40px;

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
            font-weight: 600;
            background: var(--gray-light);
            padding: 3px 10px;
            border-radius: var(--radius-sm);
          }
        }

        .title {
          font-size: 2.2rem;
          font-weight: 800;
          margin-bottom: 8px;
        }

        .location {
          font-size: 1.05rem;
          color: var(--gray-muted);
          margin-bottom: 20px;
        }

        .price-box {
          display: flex;
          align-items: baseline;
          gap: 16px;
          padding: 16px 20px;
          background: #F8FAFC;
          border-radius: var(--radius-md);
          border-left: 4px solid var(--primary);

          .price-val {
            font-size: 2rem;
            font-weight: 800;
            color: var(--dark);
          }

          .price-sub {
            color: var(--gray-muted);
            font-size: 0.9rem;
          }
        }
      }

      .specs-bar {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        margin-bottom: 36px;

        @media (max-width: 600px) {
          grid-template-columns: repeat(2, 1fr);
        }

        .spec-card {
          background: white;
          border: 1px solid var(--gray-border);
          border-radius: var(--radius-md);
          padding: 20px;
          text-align: center;

          i {
            font-size: 1.5rem;
            color: var(--primary);
            margin-bottom: 8px;
          }

          .spec-val {
            font-size: 1.3rem;
            font-weight: 800;
          }

          .spec-lbl {
            font-size: 0.8rem;
            color: var(--gray-muted);
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
        }
      }

      .designer-cta-banner {
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        color: white;
        border-radius: var(--radius-lg);
        padding: 30px;
        display: flex;
        align-items: center;
        gap: 24px;
        margin-bottom: 40px;

        @media (max-width: 768px) {
          flex-direction: column;
          text-align: center;
        }

        .cta-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: rgba(0, 166, 153, 0.2);
          color: var(--secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.8rem;
          flex-shrink: 0;
        }

        .cta-text {
          flex: 1;
          h3 { font-size: 1.3rem; margin-bottom: 6px; }
          p { color: #94a3b8; font-size: 0.95rem; margin: 0; }
        }
      }

      .section-block {
        margin-bottom: 40px;
        padding-bottom: 30px;
        border-bottom: 1px solid var(--gray-border);

        h2 { font-size: 1.5rem; margin-bottom: 16px; }
        .description-text { color: var(--dark-soft); line-height: 1.8; font-size: 1.05rem; }
      }

      .map-location-title {
        color: var(--gray-muted);
        font-size: 0.95rem;
        margin-bottom: 14px;
        display: flex;
        align-items: center;
        gap: 8px;
        i { color: var(--primary); }
      }

      .map-container {
        width: 100%;
        height: 320px;
        border-radius: var(--radius-md);
        border: 1px solid var(--gray-border);
        overflow: hidden;
        z-index: 1;
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
          position: sticky;
          top: 100px;
          background: white;
          border: 1px solid var(--gray-border);
          border-radius: var(--radius-lg);
          padding: 30px;
          box-shadow: var(--shadow-md);

          h3 { font-size: 1.3rem; margin-bottom: 8px; }
          p { color: var(--gray-muted); font-size: 0.9rem; margin-bottom: 24px; }

          .owner-profile {
            display: flex;
            align-items: center;
            gap: 14px;
            margin-bottom: 24px;
            padding-bottom: 20px;
            border-bottom: 1px solid var(--gray-border);

            .avatar {
              width: 46px;
              height: 46px;
              border-radius: 50%;
              background: var(--dark);
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 1.2rem;
            }

            .name { font-weight: 700; font-size: 1rem; }
            .role { font-size: 0.8rem; color: var(--gray-muted); }
          }

          .contact-buttons {
            display: flex;
            flex-direction: column;
            gap: 12px;

            .btn-full { width: 100%; }
          }
        }
      }
    }
  `]
})
export class PropertyDetailComponent implements OnInit, AfterViewInit {
  propertyService = inject(PropertyService);
  route = inject(ActivatedRoute);

  property?: Property;
  activeImage = '';
  private mapInstance: any;

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.propertyService.getPropertyById(id).subscribe(prop => {
          this.property = prop;
          if (prop && prop.featuredImage) {
            this.activeImage = prop.featuredImage;
          }
          setTimeout(() => this.initMap(), 200);
        });
      }
    });
  }

  ngAfterViewInit() {
    if (this.property) {
      setTimeout(() => this.initMap(), 300);
    }
  }

  initMap() {
    const mapElement = document.getElementById('property-detail-map');
    if (!mapElement || typeof L === 'undefined' || this.mapInstance) return;

    // Default to property coords or Bengaluru / San Francisco fallback
    let lat = this.property?.latitude || (this.property?.location?.toLowerCase().includes('bengaluru') ? 12.9716 : (this.property?.currency === 'INR' ? 12.9716 : 37.7749));
    let lng = this.property?.longitude || (this.property?.location?.toLowerCase().includes('bengaluru') ? 77.5946 : (this.property?.currency === 'INR' ? 77.5946 : -122.4194));

    this.mapInstance = L.map('property-detail-map').setView([lat, lng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(this.mapInstance);

    const marker = L.marker([lat, lng]).addTo(this.mapInstance);
    marker.bindPopup(`<strong>${this.property?.title || 'Property Location'}</strong><br>${this.property?.location || ''}`).openPopup();
  }

  getPhoneContact(): string | null {
    if (!this.property?.ownerContact) return null;
    const contact = this.property.ownerContact;
    const match = contact.match(/(\+?[0-9\s-]{7,15})/);
    return match ? match[0].trim() : null;
  }

  getEmailContact(): string | null {
    if (!this.property?.ownerContact) return null;
    const contact = this.property.ownerContact;
    const match = contact.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    return match ? match[0].trim() : null;
  }

  encodeSubject(): string {
    return encodeURIComponent(`Inquiry for ${this.property?.title || 'Property'}`);
  }

  onInquire() {
    alert(`Inquiry request submitted for "${this.property?.title}". The host will contact you shortly!`);
  }
}
