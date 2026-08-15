import { Component, inject, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PropertyService } from '../../../core/services/property.service';
import { AuthService } from '../../../core/services/auth.service';
import { Property } from '../../../core/models/property.model';
import { User } from '../../../core/models/user.model';

declare var L: any; // Leaflet declaration for OpenStreetMap

@Component({
  selector: 'app-property-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="property-form-page animate-fade-in">
      <div class="container max-width-md">
        <div class="form-card">
          <div class="form-header">
            <h2>List Your Property</h2>
            <p>Publish a residential or commercial space for potential buyers & virtual interior staging</p>
          </div>

          <!-- Verified Host Banner -->
          <div class="host-info-card" *ngIf="currentUser">
            <div class="host-badge-header">
              <div class="host-avatar"><i class="fa-solid fa-user-check"></i></div>
              <div class="host-text">
                <div class="label">Verified Listing Owner</div>
                <div class="host-name">{{ currentUser.name }} <span class="host-email">({{ currentUser.email }})</span></div>
              </div>
              <div class="account-tag"><i class="fa-solid fa-shield-halved"></i> Account Linked</div>
            </div>
          </div>

          <form (ngSubmit)="onSubmit()">
            <!-- Title -->
            <div class="form-group">
              <label>Property Title *</label>
              <input type="text" [(ngModel)]="title" name="title" required placeholder="e.g. Modern Minimalist Skyline Penthouse">
            </div>

            <!-- Host Contact Customization -->
            <div class="form-row">
              <div class="form-group flex-1">
                <label>Listing Agent / Host Name</label>
                <input type="text" [(ngModel)]="ownerName" name="ownerName" placeholder="e.g. Alex Morgan">
              </div>
              <div class="form-group flex-1">
                <label>Direct Contact Phone / WhatsApp (Optional)</label>
                <input type="text" [(ngModel)]="ownerPhone" name="ownerPhone" placeholder="e.g. +91 98765 43210">
              </div>
            </div>

            <!-- Type and Category -->
            <div class="form-row">
              <div class="form-group flex-1">
                <label>Property Type</label>
                <select [(ngModel)]="propertyType" name="propertyType">
                  <option value="RESIDENTIAL">Residential</option>
                  <option value="COMMERCIAL">Commercial</option>
                </select>
              </div>

              <div class="form-group flex-1">
                <label>Category</label>
                <select [(ngModel)]="category" name="category">
                  <option value="Apartment">Apartment</option>
                  <option value="Villa">Villa</option>
                  <option value="Penthouse">Penthouse</option>
                  <option value="Office">Office Space</option>
                  <option value="Retail">Retail Store</option>
                  <option value="Studio">Studio</option>
                </select>
              </div>
            </div>

            <!-- Currency & Price Row -->
            <div class="form-row">
              <div class="form-group" style="width: 140px; flex: none;">
                <label>Currency</label>
                <select [(ngModel)]="currency" name="currency" (change)="onCurrencyChange()">
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="AED">AED (د.إ)</option>
                </select>
              </div>

              <div class="form-group flex-2">
                <label>Price (in {{ currencySymbol }}) *</label>
                <div class="input-with-symbol">
                  <span class="currency-prefix">{{ currencySymbol }}</span>
                  <input type="number" [(ngModel)]="price" name="price" required min="1000">
                </div>
              </div>

              <div class="form-group flex-1">
                <label>Furnishing Status</label>
                <select [(ngModel)]="furnishingStatus" name="furnishingStatus">
                  <option value="Furnished">Furnished</option>
                  <option value="Semi-Furnished">Semi-Furnished</option>
                  <option value="Unfurnished">Unfurnished</option>
                </select>
              </div>
            </div>



            <!-- Location & Free Maps -->
            <div class="form-row">
              <div class="form-group flex-1">
                <label>City / Location *</label>
                <input type="text" [(ngModel)]="location" name="location" required placeholder="e.g. Indiranagar, Bengaluru">
              </div>

              <div class="form-group flex-1">
                <label>Full Address</label>
                <input type="text" [(ngModel)]="address" name="address" placeholder="100 Feet Road, Suite 402">
              </div>
            </div>

            <!-- Free Interactive Map Location Picker (Leaflet + OpenStreetMap) -->
            <div class="form-group map-group">
              <div class="map-label-row">
                <label><i class="fa-solid fa-map-pin"></i> Pinpoint Location on Map (Free OpenStreetMap)</label>
                <span class="coord-tag">Lat: {{ latitude | number:'1.4-4' }}, Lng: {{ longitude | number:'1.4-4' }}</span>
              </div>
              <p class="map-hint">Click anywhere on the map or drag the marker to set your property's exact location.</p>
              
              <div class="map-quick-cities">
                <span>Quick Jump:</span>
                <button type="button" class="city-chip" (click)="setMapLocation(12.9716, 77.5946, 'Bengaluru')">Bengaluru</button>
                <button type="button" class="city-chip" (click)="setMapLocation(19.0760, 72.8777, 'Mumbai')">Mumbai</button>
                <button type="button" class="city-chip" (click)="setMapLocation(28.6139, 77.2090, 'Delhi')">Delhi</button>
                <button type="button" class="city-chip" (click)="setMapLocation(37.7749, -122.4194, 'San Francisco')">San Francisco</button>
                <button type="button" class="city-chip" (click)="setMapLocation(25.2048, 55.2708, 'Dubai')">Dubai</button>
                <button type="button" class="city-chip" (click)="setMapLocation(51.5074, -0.1278, 'London')">London</button>
              </div>

              <div id="property-picker-map" class="picker-map-container"></div>
            </div>

            <!-- Specs Row -->
            <div class="form-row">
              <div class="form-group">
                <label>Bedrooms</label>
                <input type="number" [(ngModel)]="bedrooms" name="bedrooms" min="0">
              </div>

              <div class="form-group">
                <label>Bathrooms</label>
                <input type="number" [(ngModel)]="bathrooms" name="bathrooms" min="0" step="0.5">
              </div>

              <div class="form-group">
                <label>Area (Sq Ft)</label>
                <input type="number" [(ngModel)]="areaSqFt" name="areaSqFt">
              </div>
            </div>

            <!-- Description -->
            <div class="form-group">
              <label>Description</label>
              <textarea [(ngModel)]="description" name="description" rows="4" placeholder="Describe key features, architectural highlights, neighborhood amenities, interior layout..."></textarea>
            </div>

            <!-- Form Actions -->
            <div class="form-actions">
              <button type="button" routerLink="/properties" class="btn btn-outline">Cancel</button>
              <button type="submit" [disabled]="isSubmitting" class="btn btn-primary">
                <i *ngIf="isSubmitting" class="fa-solid fa-circle-notch fa-spin"></i>
                <i *ngIf="!isSubmitting" class="fa-solid fa-cloud-arrow-up"></i>
                {{ isSubmitting ? 'Publishing Listing...' : 'Publish Listing' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .property-form-page {
      padding: 40px 0 80px;
      background: var(--gray-light);

      .max-width-md { max-width: 780px; }

      .form-card {
        background: var(--white);
        border: 1px solid var(--gray-border);
        border-radius: var(--radius-lg);
        padding: 40px;
        box-shadow: var(--shadow-md);
      }

      .form-header {
        margin-bottom: 24px;
        text-align: center;
        h2 { font-size: 2rem; margin-bottom: 6px; }
        p { color: var(--gray-muted); }
      }

      .host-info-card {
        background: linear-gradient(135deg, rgba(0, 166, 153, 0.08), rgba(255, 90, 95, 0.05));
        border: 1px solid rgba(0, 166, 153, 0.25);
        border-radius: var(--radius-md);
        padding: 14px 18px;
        margin-bottom: 24px;

        .host-badge-header {
          display: flex;
          align-items: center;
          gap: 12px;

          .host-avatar {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: var(--secondary);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.1rem;
          }

          .host-text {
            flex: 1;
            .label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--secondary); letter-spacing: 0.5px; }
            .host-name { font-size: 0.95rem; font-weight: 700; color: var(--dark); }
            .host-email { font-weight: normal; color: var(--gray-muted); font-size: 0.85rem; }
          }

          .account-tag {
            background: var(--white);
            color: var(--secondary);
            border: 1px solid var(--secondary);
            font-size: 0.75rem;
            font-weight: 700;
            padding: 4px 10px;
            border-radius: var(--radius-full);
            display: flex;
            align-items: center;
            gap: 6px;
          }
        }
      }

      .form-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 16px;
      }

      .flex-1 { flex: 1; }
      .flex-2 { flex: 2; }

      /* Map Picker Styling */
      .map-group {
        margin-top: 8px;

        .map-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;

          label { margin: 0; }

          .coord-tag {
            font-family: monospace;
            font-size: 0.8rem;
            color: var(--primary);
            background: #f1f5f9;
            padding: 2px 8px;
            border-radius: 4px;
          }
        }

        .map-hint {
          font-size: 0.82rem;
          color: var(--gray-muted);
          margin-bottom: 10px;
        }

        .map-quick-cities {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
          margin-bottom: 10px;
          font-size: 0.82rem;
          color: var(--gray-muted);

          .city-chip {
            background: #f1f5f9;
            border: 1px solid var(--gray-border);
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 0.75rem;
            cursor: pointer;
            transition: all 0.15s ease;

            &:hover {
              background: var(--primary);
              color: white;
              border-color: var(--primary);
            }
          }
        }

        .picker-map-container {
          width: 100%;
          height: 280px;
          border-radius: var(--radius-md);
          border: 1px solid var(--gray-border);
          overflow: hidden;
          z-index: 1;
        }
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 14px;
        margin-top: 28px;
        padding-top: 20px;
        border-top: 1px solid var(--gray-border);
      }
    }
  `]
})
export class PropertyFormComponent implements OnInit, AfterViewInit {
  propertyService = inject(PropertyService);
  authService = inject(AuthService);
  router = inject(Router);

  currentUser: User | null = null;
  ownerName = '';
  ownerEmail = '';
  ownerPhone = '';

  title = '';
  propertyType: 'RESIDENTIAL' | 'COMMERCIAL' = 'RESIDENTIAL';
  category: any = 'Apartment';
  
  // Currency Support
  currency: 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED' = 'INR';
  currencySymbol = '₹';
  price = 8500000;
  
  furnishingStatus: any = 'Semi-Furnished';
  location = 'Indiranagar, Bengaluru';
  address = '100 Feet Road';
  bedrooms = 3;
  bathrooms = 2;
  areaSqFt = 2100;
  description = '';
  


  // Free Map Location Coordinates (Leaflet OpenStreetMap)
  latitude = 12.9716;
  longitude = 77.5946;
  private mapInstance: any;
  private markerInstance: any;

  ngOnInit() {
    this.currentUser = this.authService.currentUser();
    if (!this.currentUser) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/properties/new' } });
      return;
    }

    this.ownerName = this.currentUser.name;
    this.ownerEmail = this.currentUser.email;
    this.onCurrencyChange();
  }

  ngAfterViewInit() {
    setTimeout(() => this.initMapPicker(), 300);
  }

  onCurrencyChange() {
    const symbolMap: Record<string, string> = {
      'INR': '₹',
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'AED': 'د.إ'
    };
    this.currencySymbol = symbolMap[this.currency] || '₹';
    
    // Adjust sample price based on currency
    if (this.currency === 'INR' && this.price < 500000) {
      this.price = 8500000;
    } else if (this.currency === 'USD' && this.price > 5000000) {
      this.price = 1250000;
    }
  }



  // Leaflet Interactive Free Map Picker
  initMapPicker() {
    if (typeof L === 'undefined') return;
    const mapEl = document.getElementById('property-picker-map');
    if (!mapEl) return;

    this.mapInstance = L.map('property-picker-map').setView([this.latitude, this.longitude], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.mapInstance);

    this.markerInstance = L.marker([this.latitude, this.longitude], { draggable: true }).addTo(this.mapInstance);

    this.markerInstance.on('dragend', (event: any) => {
      const position = event.target.getLatLng();
      this.latitude = position.lat;
      this.longitude = position.lng;
    });

    this.mapInstance.on('click', (e: any) => {
      this.latitude = e.latlng.lat;
      this.longitude = e.latlng.lng;
      this.markerInstance.setLatLng([this.latitude, this.longitude]);
    });
  }

  setMapLocation(lat: number, lng: number, cityName: string) {
    this.latitude = lat;
    this.longitude = lng;
    if (this.mapInstance && this.markerInstance) {
      this.mapInstance.setView([lat, lng], 13);
      this.markerInstance.setLatLng([lat, lng]);
      this.markerInstance.bindPopup(`<strong>${cityName}</strong> selected`).openPopup();
    }
    if (!this.location || this.location === 'Indiranagar, Bengaluru') {
      this.location = cityName;
    }
  }

  isSubmitting = false;

  onSubmit() {
    if (!this.title || !this.location || !this.price) {
      alert('Please fill in property title, location and price!');
      return;
    }

    this.isSubmitting = true;

    const defaultImage = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80';
    const contactStr = this.ownerPhone ? `${this.ownerPhone} • ${this.ownerEmail}` : this.ownerEmail;

    const newProp: Omit<Property, 'id' | 'createdAt'> = {
      title: this.title.trim(),
      propertyType: this.propertyType,
      category: this.category,
      price: Number(this.price),
      currency: this.currency,
      currencySymbol: this.currencySymbol,
      furnishingStatus: this.furnishingStatus,
      location: this.location.trim(),
      address: this.address ? this.address.trim() : '',
      latitude: this.latitude,
      longitude: this.longitude,
      bedrooms: Number(this.bedrooms) || 0,
      bathrooms: Number(this.bathrooms) || 0,
      areaSqFt: Number(this.areaSqFt) || 0,
      featuredImage: defaultImage,
      images: [defaultImage],
      description: this.description ? this.description.trim() : '',
      amenities: ['Smart Access', 'High Ceilings', 'Parking', '24/7 Security'],
      ownerId: this.currentUser?.id || 'host-user',
      ownerName: this.ownerName || this.currentUser?.name || 'Property Host',
      ownerContact: contactStr
    };

    this.propertyService.addProperty(newProp).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        alert(`🎉 Property "${res.title}" published successfully to MongoDB!`);
        this.router.navigate(['/properties', res.id]);
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Error publishing property to backend:', err);
        alert('Could not publish listing. Please check your network or inputs and try again.');
      }
    });
  }
}
