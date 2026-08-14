import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Property } from '../../../core/models/property.model';

@Component({
  selector: 'app-property-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="property-card">
      <div class="image-wrapper">
        <img [src]="property.featuredImage || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9'" [alt]="property.title" loading="lazy">
        <span class="badge" [ngClass]="property.propertyType === 'RESIDENTIAL' ? 'badge-residential' : 'badge-commercial'">
          {{ property.category }}
        </span>
        <button class="favorite-btn" (click)="$event.stopPropagation(); toggleFavorite()">
          <i [class]="isFavorite ? 'fa-solid fa-heart' : 'fa-regular fa-heart'"></i>
        </button>
      </div>

      <div class="card-body">
        <div class="price-row">
          <span class="price">\${{ property.price | number }}</span>
          <span class="furnish-tag">{{ property.furnishingStatus }}</span>
        </div>

        <h3 class="title">
          <a [routerLink]="['/properties', property.id]">{{ property.title }}</a>
        </h3>

        <p class="location">
          <i class="fa-solid fa-location-dot"></i> {{ property.location }}
        </p>

        <div class="specs-grid">
          <div class="spec-item" *ngIf="property.bedrooms > 0">
            <i class="fa-solid fa-bed"></i> {{ property.bedrooms }} Beds
          </div>
          <div class="spec-item" *ngIf="property.bathrooms > 0">
            <i class="fa-solid fa-bath"></i> {{ property.bathrooms }} Baths
          </div>
          <div class="spec-item">
            <i class="fa-solid fa-vector-square"></i> {{ property.areaSqFt | number }} sq ft
          </div>
        </div>

        <div class="card-footer">
          <a [routerLink]="['/properties', property.id]" class="btn btn-outline btn-card">View Details</a>
          <a [routerLink]="['/designer']" [queryParams]="{propertyId: property.id}" class="btn btn-teal btn-card" title="Design this room">
            <i class="fa-solid fa-palette"></i> Design
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .property-card {
      background: var(--white);
      border-radius: var(--radius-md);
      border: 1px solid var(--gray-border);
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      flex-direction: column;
      height: 100%;

      &:hover {
        transform: translateY(-6px);
        box-shadow: var(--shadow-hover);

        .image-wrapper img {
          transform: scale(1.05);
        }
      }
    }

    .image-wrapper {
      position: relative;
      width: 100%;
      height: 220px;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.5s ease;
      }

      .badge {
        position: absolute;
        top: 14px;
        left: 14px;
      }

      .favorite-btn {
        position: absolute;
        top: 14px;
        right: 14px;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(4px);
        color: var(--primary);
        font-size: 1rem;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
          background: white;
          transform: scale(1.1);
        }
      }
    }

    .card-body {
      padding: 20px;
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .price-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;

      .price {
        font-size: 1.35rem;
        font-weight: 800;
        color: var(--dark);
      }

      .furnish-tag {
        font-size: 0.78rem;
        font-weight: 600;
        color: var(--gray-muted);
        background: var(--gray-light);
        padding: 2px 8px;
        border-radius: var(--radius-sm);
      }
    }

    .title {
      font-size: 1.1rem;
      margin-bottom: 6px;
      line-height: 1.3;
      
      a {
        color: var(--dark);
        &:hover {
          color: var(--primary);
        }
      }
    }

    .location {
      font-size: 0.88rem;
      color: var(--gray-muted);
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .specs-grid {
      display: flex;
      align-items: center;
      gap: 16px;
      padding-top: 12px;
      border-top: 1px dashed var(--gray-border);
      margin-bottom: 20px;
      font-size: 0.85rem;
      color: var(--dark-soft);

      .spec-item {
        display: flex;
        align-items: center;
        gap: 6px;
      }
    }

    .card-footer {
      margin-top: auto;
      display: flex;
      gap: 10px;

      .btn-card {
        flex: 1;
        padding: 8px 12px;
        font-size: 0.85rem;
      }
    }
  `]
})
export class PropertyCardComponent {
  @Input({ required: true }) property!: Property;
  isFavorite = false;

  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  }
}
