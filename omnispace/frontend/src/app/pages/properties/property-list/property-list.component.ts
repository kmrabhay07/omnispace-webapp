import { Component, inject, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PropertyService } from '../../../core/services/property.service';
import { Property } from '../../../core/models/property.model';
import { FluidBackdropComponent } from '../../../shared/components/fluid-backdrop/fluid-backdrop.component';
import { RevealDirective } from '../../../shared/directives/reveal.directive';
import { PropertyCardComponent } from '../../../shared/components/property-card/property-card.component';

@Component({
  selector: 'app-property-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PropertyCardComponent, FluidBackdropComponent, RevealDirective],
  template: `
    <div class="property-list-page animate-fade-in">
      <div class="header-banner"><app-fluid-backdrop />
        <div class="container">
          <span class="eyebrow">OMNISPACE / THE COLLECTION</span><h1>Find a place <em>to begin.</em></h1>
          <p>Homes to settle into. Spaces to grow into. A new perspective awaits.</p>
        </div>
      </div>

      <div class="container main-layout">
        <!-- FILTER SIDEBAR -->
        <button type="button" class="filter-toggle btn btn-outline" (click)="filtersOpen = !filtersOpen" [attr.aria-expanded]="filtersOpen" aria-controls="property-filters"><i class="fa-solid fa-sliders" aria-hidden="true"></i> {{ filtersOpen ? 'Hide filters' : 'Refine your search' }}</button><aside id="property-filters" class="filter-sidebar" [class.mobile-open]="filtersOpen"><div class="filter-group"><label for="filter-currency">Currency</label><select id="filter-currency" [(ngModel)]="currency" (change)="applyFilters()"><option value="">All currencies</option><option>INR</option><option>USD</option><option>EUR</option><option>GBP</option><option>AED</option></select><small>Choose a currency to compare prices.</small></div>
          <div class="sidebar-header">
            <h3><i class="fa-solid fa-sliders"></i> Filters</h3>
            <button (click)="resetFilters()" class="btn-reset">Reset All</button>
          </div>

          <!-- Type Selector -->
          <div class="filter-group">
            <label>Property Type</label>
            <div class="segmented-control">
              <button [class.active]="selectedType === ''" (click)="selectedType = ''; applyFilters()">All</button>
              <button [class.active]="selectedType === 'RESIDENTIAL'" (click)="selectedType = 'RESIDENTIAL'; applyFilters()">Residential</button>
              <button [class.active]="selectedType === 'COMMERCIAL'" (click)="selectedType = 'COMMERCIAL'; applyFilters()">Commercial</button>
            </div>
          </div>

          <!-- Category -->
          <div class="filter-group">
            <label for="filter-category">Category</label>
            <select id="filter-category" [(ngModel)]="selectedCategory" (change)="applyFilters()">
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
            <label for="filter-location">Location / Keyword</label>
            <div class="input-with-icon">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input id="filter-location" type="text" [(ngModel)]="searchLocation" (input)="applyFilters()" placeholder="City, neighborhood...">
            </div>
          </div>

          <!-- Max Price Slider -->
          <div class="filter-group">
            <div class="label-row">
              <label for="filter-price">Max Price</label>
              <span class="value-badge">{{ maxPrice >= 100000000 ? 'Any Price' : (maxPrice | number) }}</span>
            </div>
            <input id="filter-price" type="range" [disabled]="!currency" min="500000" max="100000000" step="500000" [(ngModel)]="maxPrice" (input)="applyFilters()">
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
        <main class="grid-container"><p *ngIf="error" class="form-error" role="alert">{{error}}</p>
          <div class="results-bar">
            <span>Showing <strong>{{ filteredProperties.length }}</strong> properties</span>
            <div class="sort-wrapper">
              <label for="property-sort">Sort by:</label>
              <select id="property-sort" [(ngModel)]="sortBy" (change)="applyFilters()">
                <option value="newest">Newest First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="area">Square Feet</option>
              </select>
            </div>
          </div>

          <div class="properties-grid" *ngIf="filteredProperties.length > 0; else noPropsState">
            <app-property-card *ngFor="let p of filteredProperties; index as i" [property]="p" [appReveal]="(i % 3) * 60"></app-property-card>
          </div>

          <ng-template #noPropsState>
            <div class="empty-state py-5" *ngIf="isLoading; else emptyState">
              <div style="font-size: 2.5rem; color: var(--primary); margin-bottom: 16px;">
                <i class="fa-solid fa-circle-notch fa-spin"></i>
              </div>
              <p style="font-size: 1.1rem; color: var(--gray-muted);">Finding your next space…</p>
            </div>
            <ng-template #emptyState>
              <div class="empty-state">
                <i class="fa-solid fa-building-circle-xmark"></i>
                <h3>No properties match your filter</h3>
                <p>Try resetting filters or searching with different criteria.</p>
                <button (click)="resetFilters()" class="btn btn-primary">Reset Filters</button>
              </div>
            </ng-template>
          </ng-template>
        <button *ngIf="hasMore && !isLoading" class="btn btn-outline" (click)="fetchProperties(true)">Load more properties</button></main>
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
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
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

    .header-banner{position:relative;isolation:isolate;overflow:hidden;background:#26372d;padding:63px 0 65px;margin:14px 22px 55px;border-radius:22px}.header-banner>.container{position:relative;z-index:1}.header-banner .eyebrow{color:#b5c2a7;font-size:.56rem}.header-banner h1{font-size:clamp(2.8rem,5vw,4.5rem);margin:18px 0;font-weight:400}.header-banner h1 em{font-family:var(--font-editorial);font-weight:400;color:#e6b49b}.header-banner p{font-size:.83rem;color:#b4c0aa}.filter-sidebar{border-radius:18px;padding:27px;border-color:var(--gray-border);box-shadow:var(--shadow-sm)}.filter-sidebar .filter-group label{font-size:.75rem;font-weight:500}.filter-sidebar .filter-group select,.filter-sidebar .filter-group input[type=text]{border-width:1px;font-size:.78rem;padding:12px;background:var(--white)}.filter-sidebar .filter-group small{display:block;font-size:.65rem;color:var(--gray-muted);margin-top:7px}.filter-sidebar .segmented-control{flex-wrap:wrap}.results-bar{font-size:.77rem;gap:16px;flex-wrap:wrap;margin-bottom:26px}.results-bar .sort-wrapper select{font-size:.75rem;background:var(--white)}.main-layout{gap:30px;grid-template-columns:260px minmax(0,1fr)}.grid-container{min-width:0}.properties-grid{gap:23px}.filter-toggle{display:none}.empty-state{padding:70px 25px}.empty-state i{font-size:2.6rem;color:#9aab8c}.empty-state h3{font-family:var(--font-editorial);font-size:2rem;font-weight:400}.empty-state p{font-size:.85rem}.empty-state .btn{font-size:.8rem}.segmented-control button,.pill-selector button{min-height:36px}.grid-container>.btn{margin-top:30px}
    @media(max-width:992px){.main-layout{grid-template-columns:minmax(0,1fr);gap:24px}.filter-toggle{display:inline-flex;justify-self:start}.filter-sidebar{display:none}.filter-sidebar.mobile-open{display:block;animation:fadeIn .4s var(--ease-out)}.header-banner{margin-bottom:35px}}
    @media(max-width:600px){.header-banner{margin:8px 14px 30px;padding:40px 0}.header-banner h1{font-size:2.8rem;max-width:280px;line-height:1.05}.header-banner h1 em{display:block}.header-banner p{font-size:.78rem;line-height:1.8;max-width:270px}.properties-grid{grid-template-columns:minmax(0,1fr)}.results-bar{align-items:flex-start}.sort-wrapper{flex-wrap:wrap}.main-layout{padding-bottom:55px}}
  `]
})
export class PropertyListComponent implements OnInit {
  filtersOpen = false;
  propertyService = inject(PropertyService);
  route = inject(ActivatedRoute);
  cdr = inject(ChangeDetectorRef);
  ngZone = inject(NgZone);

  isLoading = true;
  allProperties: Property[] = this.propertyService.propertiesSignal();
  filteredProperties: Property[] = [...this.allProperties];

  selectedType = '';
  selectedCategory = '';
  searchLocation = '';
  maxPrice = 100000000;
  minBedrooms = 0;
  sortBy = 'newest';

  ngOnInit() {
    if (this.allProperties.length > 0) {
      this.isLoading = false;
      this.applyFilters();
    }

    this.route.queryParams.subscribe(params => {
      if (params['type']) this.selectedType = params['type'];
      if (params['category']) this.selectedCategory = params['category'];
      if (params['location']) this.searchLocation = params['location'];

      this.fetchProperties();
    });
  }

  currency = '';
  error = '';
  hasMore = false;
  private page = 0;
  private requestNumber = 0;
  fetchProperties(more = false) {
    if (more && this.isLoading) return;
    const request = ++this.requestNumber;
    const page = more ? this.page + 1 : 0;
    const filters: Record<string,string|number> = {sort:this.sortBy};
    if(this.selectedType)filters['type']=this.selectedType;
    if(this.selectedCategory)filters['category']=this.selectedCategory;
    if(this.searchLocation.trim())filters['location']=this.searchLocation.trim();
    if(this.currency)filters['currency']=this.currency;
    if(this.maxPrice<100000000 && this.currency)filters['maxPrice']=this.maxPrice;
    if(this.minBedrooms)filters['bedrooms']=this.minBedrooms;
    this.isLoading=true;this.error='';
    this.propertyService.getProperties(page,filters).subscribe({
      next: props => {
        if(request!==this.requestNumber)return;
        this.page=page;this.hasMore=props.length===24;
        this.allProperties=more?[...this.allProperties,...props]:props;
        this.filteredProperties=[...this.allProperties];this.isLoading=false;this.cdr.markForCheck();
      },
      error:()=>{if(request!==this.requestNumber)return;this.isLoading=false;this.error='Could not load properties. Please retry.';this.cdr.markForCheck();}
    });
  }
  applyFilters(){this.fetchProperties();}

  resetFilters() {
    this.selectedType = '';
    this.selectedCategory = '';
    this.searchLocation = '';
    this.maxPrice = 100000000;
    this.minBedrooms = 0;
    this.sortBy = 'newest';
    this.currency = '';
    this.applyFilters();
  }
}
