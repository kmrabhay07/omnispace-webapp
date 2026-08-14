import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PropertyService } from '../../../core/services/property.service';
import { Property } from '../../../core/models/property.model';

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
            <p>Add a residential or commercial property for buyers and interior designers</p>
          </div>

          <form (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label>Property Title</label>
              <input type="text" [(ngModel)]="title" name="title" required placeholder="e.g. Skyline Luxury Glass Penthouse">
            </div>

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

            <div class="form-row">
              <div class="form-group">
                <label>Price ($USD)</label>
                <input type="number" [(ngModel)]="price" name="price" required placeholder="1250000">
              </div>

              <div class="form-group">
                <label>Furnishing Status</label>
                <select [(ngModel)]="furnishingStatus" name="furnishingStatus">
                  <option value="Furnished">Furnished</option>
                  <option value="Semi-Furnished">Semi-Furnished</option>
                  <option value="Unfurnished">Unfurnished</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label>City & Neighborhood</label>
              <input type="text" [(ngModel)]="location" name="location" required placeholder="e.g. Downtown Bayview, San Francisco">
            </div>

            <div class="form-group">
              <label>Full Address</label>
              <input type="text" [(ngModel)]="address" name="address" placeholder="742 Skyline Blvd, Apt 50">
            </div>

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

            <div class="form-group">
              <label>Featured Image URL</label>
              <input type="url" [(ngModel)]="featuredImage" name="featuredImage" placeholder="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9">
            </div>

            <div class="form-group">
              <label>Description</label>
              <textarea [(ngModel)]="description" name="description" rows="4" placeholder="Describe key features, architectural highlights, neighborhood amenities..."></textarea>
            </div>

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

      .max-width-md { max-width: 720px; }

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
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
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
export class PropertyFormComponent {
  propertyService = inject(PropertyService);
  router = inject(Router);

  title = '';
  propertyType: 'RESIDENTIAL' | 'COMMERCIAL' = 'RESIDENTIAL';
  category: any = 'Apartment';
  price = 850000;
  furnishingStatus: any = 'Semi-Furnished';
  location = '';
  address = '';
  bedrooms = 3;
  bathrooms = 2;
  areaSqFt = 2100;
  featuredImage = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80';
  description = '';

  onSubmit() {
    if (!this.title || !this.location) {
      alert('Please fill in title and location!');
      return;
    }

    const newProp: Omit<Property, 'id' | 'createdAt'> = {
      title: this.title,
      propertyType: this.propertyType,
      category: this.category,
      price: this.price,
      furnishingStatus: this.furnishingStatus,
      location: this.location,
      address: this.address,
      bedrooms: this.bedrooms,
      bathrooms: this.bathrooms,
      areaSqFt: this.areaSqFt,
      featuredImage: this.featuredImage,
      images: [this.featuredImage],
      description: this.description,
      amenities: ['Smart Access', 'High Ceilings', 'Parking'],
      ownerName: 'You (Property Owner)',
      ownerContact: '+1 (555) 019-2834'
    };

    this.propertyService.addProperty(newProp).subscribe(res => {
      alert('Property published successfully!');
      this.router.navigate(['/properties', res.id]);
    });
  }
}
