import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PropertyService } from '../../../core/services/property.service';
import { Property } from '../../../core/models/property.model';
import { PropertyCardComponent } from '../../../shared/components/property-card/property-card.component';

@Component({
  selector: 'app-property-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, PropertyCardComponent],
  template: `
    <div class="property-list-page animate-fade-in">
      <div class="header-banner">
        <div class="container">
          <h1>Browse Properties</h1>
          <p>Find residential homes and commercial spaces ready for interactive design</p>
        </div>
      </div>

      <div class="container main-layout">
        <!-- FILTER SIDEBAR -->
        <aside class="filter-sidebar">
          <div class="sidebar-header">
            <h3><i class="fa-solid fa-sliders"></i> Filters</h3>
            <button (click)="resetFilters()" class="btn-reset">Reset All</button>
          </div>

          <!-- Type Selector -->
          <div class="filter-group">
            <label>Property Type</label>
            <div class="segmented-control">
              <button [class.active]="selectedType === ''" (click)="selectedType = ''">All</button>
              <button [class.active]="selectedType === 'RESIDENTIAL'" (click)="selectedType = 'RESIDENTIAL'">Residential</button>
              <button [class.active]="selectedType === 'COMMERCIAL'" (click)="selectedType = 'COMMERCIAL'">Commercial</button>
            </div>
          </div>

          <!-- Category -->
          <div class="filter-group">
            <label>Category</label>
            <select [(ngModel)]="selectedCategory" (change)="applyFilters()">
              <option value="">All Categories</option>
              <option value="Apartment">Apartment</option>
              <option value="Villa">Villa</option>
              <option value="Penthouse">Penthouse</option>
              <option value="Office">Office Space</option>
              <option value="Retail">Retail Store</option>
              <option value="Studio">Studio</option>
            </select>
          </div>

          <!-- Keyword / Location -->
          <div class="filter-group">
            <label>Location / Keyword</label>
            <div class="input-with-icon">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input type="text" [(ngModel)]="searchLocation" (input)="applyFilters()" placeholder="City, neighborhood...">
            </div>
          </div>

          <!-- Max Price Slider -->
          <div class="filter-group">
            <div class="label-row">
              <label>Max Price</label>
              <span class="value-badge">{{ maxPrice >= 100000000 ? 'Any Price' : (maxPrice | number) }}</span>
            </div>
            <input type="range" min="500000" max="100000000" step="500000" [(ngModel)]="maxPrice" (input)="applyFilters()">
          </div>

          <!-- Bedrooms -->
          <div class="filter-group">
            <label>Bedrooms (Min)</label>
            <div class="pill-selector">
              <button *ngFor="let num of [0, 1, 2, 3, 4]" [class.active]="minBedrooms === num" (click)="minBedrooms = num; applyFilters()">
                {{ num === 0 ? 'Any' : num + '+' }}
              </button>
            </div>
          </div>
        </aside>

        <!-- PROPERTY GRID CONTENT -->
        <main class="grid-container">
          <div class="results-bar">
            <span>Showing <strong>{{ filteredProperties.length }}</strong> properties</span>
            <div class="sort-wrapper">
              <label>Sort by:</label>
              <select [(ngModel)]="sortBy" (change)="applyFilters()">
                <option value="newest">Newest First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="area">Square Feet</option>
              </select>
            </div>
          </div>

          <div class="properties-grid" *ngIf="filteredProperties.length > 0; else emptyState">
            <app-property-card *ngFor="let p of filteredProperties" [property]="p"></app-property-card>
          </div>

          <ng-template #emptyState>
            <div class="empty-state">
              <i class="fa-solid fa-building-circle-xmark"></i>
              <h3>No properties match your filter</h3>
              <p>Try resetting filters or searching with different criteria.</p>
              <button (click)="resetFilters()" class="btn btn-primary">Reset Filters</button>
            </div>
          </ng-template>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .header-banner {
      background: linear-gradient(135deg, var(--dark), #1A1E29);
      color: white;
      padding: 48px 0;
      margin-bottom: 40px;

      h1 { font-size: 2.4rem; color: white; margin-bottom: 8px; }
      p { color: #94A3B8; font-size: 1.05rem; }
    }

    .main-layout {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 36px;
      padding-bottom: 80px;

      @media (max-width: 992px) {
        grid-template-columns: 1fr;
      }
    }

    /* Filter Sidebar */
    .filter-sidebar {
      background: var(--white);
      border-radius: var(--radius-md);
      border: 1px solid var(--gray-border);
      padding: 24px;
      height: fit-content;

      .sidebar-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 24px;
        padding-bottom: 14px;
        border-bottom: 1px solid var(--gray-border);

        h3 { font-size: 1.1rem; }
        .btn-reset {
          background: transparent;
          color: var(--primary);
          font-size: 0.85rem;
          font-weight: 600;

          &:hover { text-decoration: underline; }
        }
      }

      .filter-group {
        margin-bottom: 20px;

        label {
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--dark);
          display: block;
          margin-bottom: 8px;
        }

        .label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;

          .value-badge {
            font-size: 0.85rem;
            font-weight: 700;
            color: var(--primary);
          }
        }

        select, input[type="text"] {
          width: 100%;
          padding: 10px 14px;
          border-radius: var(--radius-sm);
          border: 1.5px solid var(--gray-border);
          font-size: 0.9rem;
        }

        input[type="range"] {
          width: 100%;
          accent-color: var(--primary);
        }

        .input-with-icon {
          position: relative;
          i {
            position: absolute;
            left: 14px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--gray-muted);
          }
          input { padding-left: 38px; }
        }

        .segmented-control {
          display: flex;
          background: var(--gray-light);
          padding: 4px;
          border-radius: var(--radius-sm);

          button {
            flex: 1;
            padding: 6px 10px;
            font-size: 0.8rem;
            font-weight: 600;
            background: transparent;
            color: var(--gray-muted);
            border-radius: var(--radius-sm);

            &.active {
              background: var(--white);
              color: var(--dark);
              box-shadow: var(--shadow-sm);
            }
          }
        }

        .pill-selector {
          display: flex;
          gap: 8px;

          button {
            flex: 1;
            padding: 6px;
            font-size: 0.85rem;
            border-radius: var(--radius-sm);
            border: 1px solid var(--gray-border);
            background: var(--white);
            color: var(--dark);

            &.active {
              background: var(--dark);
              color: white;
              border-color: var(--dark);
            }
          }
        }
      }
    }

    /* Grid Area */
    .results-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
      font-size: 0.95rem;

      .sort-wrapper {
        display: flex;
        align-items: center;
        gap: 10px;

        select {
          padding: 8px 14px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--gray-border);
          font-size: 0.88rem;
        }
      }
    }

    .properties-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 28px;
    }

    .empty-state {
      text-align: center;
      padding: 80px 20px;
      background: var(--white);
      border-radius: var(--radius-md);
      border: 1px solid var(--gray-border);

      i { font-size: 3.5rem; color: var(--gray-muted); margin-bottom: 16px; }
      h3 { font-size: 1.4rem; margin-bottom: 8px; }
      p { color: var(--gray-muted); margin-bottom: 24px; }
    }
  `]
})
export class PropertyListComponent implements OnInit {
  propertyService = inject(PropertyService);
  route = inject(ActivatedRoute);
  cdr = inject(ChangeDetectorRef);

  allProperties: Property[] = this.propertyService.getInitialCombinedList();
  filteredProperties: Property[] = [...this.allProperties];

  selectedType = '';
  selectedCategory = '';
  searchLocation = '';
  maxPrice = 100000000;
  minBedrooms = 0;
  sortBy = 'newest';

  ngOnInit() {
    this.applyFilters();

    this.route.queryParams.subscribe(params => {
      if (params['type']) this.selectedType = params['type'];
      if (params['category']) this.selectedCategory = params['category'];
      if (params['location']) this.searchLocation = params['location'];

      this.fetchProperties();
    });
  }

  fetchProperties() {
    this.propertyService.getProperties().subscribe(props => {
      if (props && props.length > 0) {
        this.allProperties = props;
      }
      this.applyFilters();
      this.cdr.markForCheck();
    });
  }

  applyFilters() {
    let result = [...this.allProperties];

    if (this.selectedType) {
      result = result.filter(p => p.propertyType?.toUpperCase() === this.selectedType.toUpperCase());
    }
    if (this.selectedCategory) {
      result = result.filter(p => p.category?.toLowerCase() === this.selectedCategory.toLowerCase());
    }
    if (this.searchLocation && this.searchLocation.trim()) {
      const kw = this.searchLocation.trim().toLowerCase();
      result = result.filter(p =>
        (p.title && p.title.toLowerCase().includes(kw)) ||
        (p.location && p.location.toLowerCase().includes(kw)) ||
        (p.description && p.description.toLowerCase().includes(kw))
      );
    }
    if (this.maxPrice < 100000000) {
      result = result.filter(p => p.price == null || p.price <= this.maxPrice);
    }
    if (this.minBedrooms > 0) {
      result = result.filter(p => p.bedrooms != null && p.bedrooms >= this.minBedrooms);
    }

    // Sort
    if (this.sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (this.sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (this.sortBy === 'area') {
      result.sort((a, b) => b.areaSqFt - a.areaSqFt);
    }

    this.filteredProperties = result;
    this.cdr.markForCheck();
  }

  resetFilters() {
    this.selectedType = '';
    this.selectedCategory = '';
    this.searchLocation = '';
    this.maxPrice = 100000000;
    this.minBedrooms = 0;
    this.sortBy = 'newest';
    this.applyFilters();
  }
}
