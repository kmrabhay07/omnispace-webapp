import { Component, inject, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PropertyService } from '../../../core/services/property.service';
import { Property } from '../../../core/models/property.model';

declare var L: any;

@Component({
  selector: 'app-property-form',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="property-form-page animate-fade-in">
      <div class="container max-width-md">
        <div class="form-card">
          <div class="form-header">
            <h2>List Your Property</h2>
            <p>Publish your residential or commercial space with interactive map & interior design ready</p>
          </div>

          <form (ngSubmit)="onSubmit()">
            <!-- Title -->
            <div class="form-group">
              <label>Property Title *</label>
              <input type="text" [(ngModel)]="title" name="title" required placeholder="e.g. Skyline Luxury Glass Penthouse">
            </div>

            <!-- Property Type & Category -->
            <div class="form-row">
              <div class="form-group">
                <label>Property Type</label>
                <select [(ngModel)]="propertyType" name="propertyType">
                  <option value="RESIDENTIAL">Residential</option>
                  <option value="COMMERCIAL">Commercial</option>
                </select>
              </div>

              <div class="form-group">
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
              <div class="form-group flex-1">
                <label>Currency</label>
                <select [(ngModel)]="currency" name="currency" (change)="onCurrencyChange()">
                  <option value="INR">INR (₹ - Indian Rupee)</option>
                  <option value="USD">USD ($ - US Dollar)</option>
                  <option value="EUR">EUR (€ - Euro)</option>
                  <option value="GBP">GBP (£ - British Pound)</option>
                  <option value="AED">AED (د.إ - UAE Dirham)</option>
                </select>
              </div>

              <div class="form-group flex-2">
                <label>Listing Price ({{ currencySymbol }}) *</label>
                <input type="number" [(ngModel)]="price" name="price" required placeholder="e.g. 7500000">
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

            <!-- Image Upload & Preview Section -->
            <div class="form-group">
              <label>Property Photos & Image Upload *</label>
              <div class="upload-dropzone" (click)="fileInput.click()" (dragover)="onDragOver($event)" (drop)="onDrop($event)">
                <input #fileInput type="file" multiple accept="image/*" (change)="onFileSelected($event)" style="display:none">
                <i class="fa-solid fa-cloud-arrow-up upload-icon"></i>
                <h4>Drag & drop images here or <span>Browse Files</span></h4>
                <p>Upload PNG, JPG, or WEBP photos from your device</p>
              </div>

              <!-- Live Uploaded Images Preview Grid -->
              <div class="uploaded-gallery-grid" *ngIf="uploadedImages.length > 0">
                <div class="gallery-card" *ngFor="let img of uploadedImages; let i = index">
                  <img [src]="img" alt="Uploaded Photo">
                  <div class="card-overlay">
                    <button type="button" class="btn-badge" [class.featured]="featuredImage === img" (click)="setFeatured(img)">
                      {{ featuredImage === img ? '★ Featured' : 'Set Featured' }}
                    </button>
                    <button type="button" class="btn-delete" (click)="removeImage(i)">
                      <i class="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Fallback Direct URL option -->
              <div class="url-input-toggle">
                <small>Or paste direct photo URL:</small>
                <div class="input-with-button">
                  <input type="url" [(ngModel)]="customImageUrl" name="customImageUrl" placeholder="https://images.unsplash.com/photo-...">
                  <button type="button" class="btn btn-sm btn-outline" (click)="addCustomUrl()">Add URL</button>
                </div>
              </div>
            </div>

            <!-- Location & Address -->
            <div class="form-row">
              <div class="form-group">
                <label>City & Neighborhood *</label>
                <input type="text" [(ngModel)]="location" name="location" required placeholder="e.g. Indiranagar, Bengaluru">
              </div>

              <div class="form-group">
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
              <button type="submit" class="btn btn-primary">
                <i class="fa-solid fa-cloud-arrow-up"></i> Publish Listing
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .property-form-page {
      padding: 60px 0 100px;

      .max-width-md { max-width: 780px; }

      .form-card {
        background: var(--white);
        border: 1px solid var(--gray-border);
        border-radius: var(--radius-lg);
        padding: 40px;
        box-shadow: var(--shadow-md);
      }

      .form-header {
        margin-bottom: 30px;
        text-align: center;
        h2 { font-size: 2rem; margin-bottom: 6px; }
        p { color: var(--gray-muted); }
      }

      .form-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 16px;
      }

      .flex-1 { flex: 1; }
      .flex-2 { flex: 2; }

      /* Upload Dropzone */
      .upload-dropzone {
        border: 2px dashed #cbd5e1;
        background: #f8fafc;
        border-radius: var(--radius-md);
        padding: 30px 20px;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          border-color: var(--primary);
          background: #f1f5f9;
        }

        .upload-icon {
          font-size: 2.2rem;
          color: var(--primary);
          margin-bottom: 10px;
        }

        h4 {
          font-size: 1rem;
          margin-bottom: 4px;
          span { color: var(--primary); text-decoration: underline; }
        }

        p {
          font-size: 0.82rem;
          color: var(--gray-muted);
          margin: 0;
        }
      }

      .uploaded-gallery-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
        gap: 12px;
        margin-top: 14px;

        .gallery-card {
          position: relative;
          height: 100px;
          border-radius: var(--radius-sm);
          overflow: hidden;
          border: 1px solid var(--gray-border);

          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .card-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.4);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px;
            opacity: 0;
            transition: opacity 0.2s ease;
          }

          &:hover .card-overlay {
            opacity: 1;
          }

          .btn-badge {
            background: rgba(255, 255, 255, 0.85);
            border: none;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 0.7rem;
            font-weight: 700;
            cursor: pointer;

            &.featured {
              background: var(--primary);
              color: white;
            }
          }

          .btn-delete {
            background: #ef4444;
            color: white;
            border: none;
            width: 26px;
            height: 26px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.75rem;
            cursor: pointer;
          }
        }
      }

      .url-input-toggle {
        margin-top: 12px;

        small { color: var(--gray-muted); display: block; margin-bottom: 4px; }

        .input-with-button {
          display: flex;
          gap: 8px;

          input { flex: 1; }
        }
      }

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
            padding: 3px 10px;
            border-radius: 999px;
            font-size: 0.78rem;
            cursor: pointer;
            transition: all 0.2s ease;

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
  router = inject(Router);

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
  
  // Image Upload Support
  uploadedImages: string[] = [
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80'
  ];
  featuredImage = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80';
  customImageUrl = '';

  // Free Map Location Coordinates (Leaflet OpenStreetMap)
  latitude = 12.9716;
  longitude = 77.5946;
  private mapInstance: any;
  private markerInstance: any;

  ngOnInit() {
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
    if (this.currency === 'INR' && this.price < 100000) {
      this.price = 7500000;
    } else if (this.currency !== 'INR' && this.price > 2000000) {
      this.price = 650000;
    }
  }

  // File Upload Handlers
  onFileSelected(event: any) {
    const files: FileList = event.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onload = (e: any) => {
          const result = e.target.result;
          this.uploadedImages.push(result);
          if (!this.featuredImage) {
            this.featuredImage = result;
          }
        };
        reader.readAsDataURL(file);
      }
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      const files = event.dataTransfer.files;
      for (let i = 0; i < files.length; i++) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.uploadedImages.push(e.target.result);
          if (!this.featuredImage) {
            this.featuredImage = e.target.result;
          }
        };
        reader.readAsDataURL(files[i]);
      }
    }
  }

  setFeatured(img: string) {
    this.featuredImage = img;
  }

  removeImage(index: number) {
    const removed = this.uploadedImages.splice(index, 1)[0];
    if (this.featuredImage === removed && this.uploadedImages.length > 0) {
      this.featuredImage = this.uploadedImages[0];
    }
  }

  addCustomUrl() {
    if (this.customImageUrl && this.customImageUrl.startsWith('http')) {
      this.uploadedImages.push(this.customImageUrl);
      if (!this.featuredImage) {
        this.featuredImage = this.customImageUrl;
      }
      this.customImageUrl = '';
    }
  }

  // Free Map Picker Initialization
  initMapPicker() {
    const mapElement = document.getElementById('property-picker-map');
    if (!mapElement || typeof L === 'undefined' || this.mapInstance) return;

    this.mapInstance = L.map('property-picker-map').setView([this.latitude, this.longitude], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(this.mapInstance);

    // Draggable Pin Marker
    this.markerInstance = L.marker([this.latitude, this.longitude], { draggable: true }).addTo(this.mapInstance);
    this.markerInstance.bindPopup('<strong>Drag me</strong> to set property location!').openPopup();

    this.markerInstance.on('dragend', (e: any) => {
      const pos = e.target.getLatLng();
      this.latitude = pos.lat;
      this.longitude = pos.lng;
    });

    // Click anywhere on map to reposition marker
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

  onSubmit() {
    if (!this.title || !this.location) {
      alert('Please fill in property title and location!');
      return;
    }

    const finalFeatured = this.featuredImage || (this.uploadedImages.length > 0 ? this.uploadedImages[0] : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80');

    const newProp: Omit<Property, 'id' | 'createdAt'> = {
      title: this.title,
      propertyType: this.propertyType,
      category: this.category,
      price: this.price,
      currency: this.currency,
      currencySymbol: this.currencySymbol,
      furnishingStatus: this.furnishingStatus,
      location: this.location,
      address: this.address,
      latitude: this.latitude,
      longitude: this.longitude,
      bedrooms: this.bedrooms,
      bathrooms: this.bathrooms,
      areaSqFt: this.areaSqFt,
      featuredImage: finalFeatured,
      images: this.uploadedImages.length > 0 ? this.uploadedImages : [finalFeatured],
      description: this.description,
      amenities: ['Smart Access', 'High Ceilings', 'Parking', '24/7 Security'],
      ownerName: 'Property Host',
      ownerContact: '+91-8091109624'
    };

    this.propertyService.addProperty(newProp).subscribe(res => {
      alert(`🎉 Property published successfully in ${this.currencySymbol}${this.price.toLocaleString()}!`);
      this.router.navigate(['/properties', res.id]);
    });
  }
}
