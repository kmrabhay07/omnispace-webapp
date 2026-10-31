import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PropertyService } from '../../../core/services/property.service';
import { AuthService } from '../../../core/services/auth.service';
import { Property } from '../../../core/models/property.model';
import { propertyPopup } from '../../../core/utils/map-popup';
declare const L: any;
@Component({
  selector: 'app-property-detail', standalone: true, imports: [CommonModule, RouterLink],
  template: `
    <section class="workspace-page">
      <a routerLink="/properties">← Browse properties</a>
      <p *ngIf="loading" role="status">Loading property…</p><p *ngIf="error" role="alert" class="form-error">{{ error }}</p>
      <ng-container *ngIf="property as p">
        <header class="page-heading"><div><p class="eyebrow">{{ p.category }} · {{ p.status === 'DRAFT' ? 'PRIVATE DRAFT' : p.location }}</p><h1>{{ p.title }}</h1><p>{{ p.address }}</p></div><strong class="property-price">{{ p.currencySymbol }}{{ p.price | number }}</strong></header>
        <div class="detail-grid">
          <div>
            <img *ngIf="activeImage" [src]="activeImage" [alt]="p.title" class="hero-photo animate-fade-in">
            <div *ngIf="!activeImage" class="empty-state">No property photos uploaded.</div>
            <div class="thumbnails"><button *ngFor="let img of p.images; let i = index" (click)="activeImage = img" [class.selected]="activeImage === img" [attr.aria-pressed]="activeImage === img" [attr.aria-label]="'View property photo ' + (i + 1)"><img [src]="img" alt="" loading="lazy"></button></div>
            <div class="spec-strip"><span>{{ p.bedrooms || 0 }} bedrooms</span><span>{{ p.bathrooms || 0 }} bathrooms</span><span>{{ p.areaSqFt | number }} sq ft</span><span>{{ p.furnishingStatus }}</span></div>
            <section class="detail-section"><h2>About this property</h2><p class="description">{{ p.description || 'The owner has not added a description yet.' }}</p></section>
            <section class="detail-section"><h2>Amenities</h2><div class="tag-list"><span *ngFor="let amenity of p.amenities">{{ amenity }}</span></div><p *ngIf="!p.amenities?.length">No amenities specified.</p></section>
            <section class="detail-section"><h2>Owner-provided floor plan</h2><img *ngIf="p.floorPlanImage; else noPlan" [src]="p.floorPlanImage" alt="Floor plan uploaded by the property owner" class="floor-plan"><ng-template #noPlan><p>No floor plan has been uploaded.</p></ng-template></section>
            <section class="detail-section"><h2>Location</h2><div #mapElement class="property-map"></div><p *ngIf="p.latitude == null || p.longitude == null">Exact coordinates have not been provided.</p></section>
          </div>
          <aside class="detail-aside">
            <h2>{{ p.ownerName || 'Listing owner' }}</h2><p>Contact the owner to confirm availability, amenities, and viewing times.</p>
            <a *ngIf="auth.currentUser()?.id !== p.ownerId" routerLink="/chats" [queryParams]="{propertyId:p.id}" class="btn btn-primary">Message owner</a>
            <a *ngIf="auth.currentUser()?.id === p.ownerId" [routerLink]="['/properties', p.id, 'edit']" class="btn btn-primary">Edit listing</a>
            <a *ngIf="auth.currentUser()?.id === p.ownerId" routerLink="/chats" class="btn btn-outline">View inquiries</a>
            <p *ngIf="p.ownerContact">Contact: {{ p.ownerContact }}</p>
            <hr><h2>Plan your space</h2><p>Create a design linked to this listing. Enter the room dimensions yourself; the studio does not reconstruct a property from photos.</p>
            <a routerLink="/designer" [queryParams]="{propertyId:p.id}" class="btn btn-teal">Open interior studio</a>
          </aside>
        </div>
      </ng-container>
    </section>`,
  styles:[`
    .detail-grid{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:32px}.property-price{font-size:1.8rem;color:#007f73}.hero-photo{width:100%;max-height:540px;object-fit:cover;border-radius:18px}.thumbnails{display:flex;gap:10px;overflow:auto;margin:12px 0}.thumbnails button{padding:0;border:2px solid #dbe3ec;border-radius:9px;overflow:hidden;cursor:pointer}.thumbnails img{width:95px;height:70px;object-fit:cover}.spec-strip{display:flex;flex-wrap:wrap;gap:18px;padding:24px 0;border-bottom:1px solid #dbe3ec}.detail-section{padding:24px 0}.description{white-space:pre-wrap}.floor-plan{max-width:100%;max-height:600px;object-fit:contain}.property-map{height:320px;border-radius:14px;background:#f1f5f9}.detail-aside{padding:24px;border:1px solid #dbe3ec;border-radius:18px;align-self:start;display:grid;gap:18px;background:white}.detail-aside h2{font-size:1.2rem}.tag-list{display:flex;gap:10px;flex-wrap:wrap}.tag-list span{padding:7px 12px;border-radius:8px;background:#e8f6f3}@media(max-width:850px){.detail-grid{grid-template-columns:1fr}.detail-aside{order:-1}}
    .workspace-page>a{display:inline-block;font-size:.75rem;margin-bottom:14px;color:var(--gray-muted)}.page-heading{margin-bottom:38px}.property-price{color:var(--dark);font-family:var(--font-heading);font-weight:400;letter-spacing:-.04em}.hero-photo{border-radius:20px;box-shadow:var(--shadow-md);aspect-ratio:1.55}.thumbnails{gap:12px;margin:16px 0 28px}.thumbnails button{flex-shrink:0;border-color:transparent;transition:border-color .3s,transform .4s}.thumbnails button:hover{transform:translateY(-2px)}.thumbnails button.selected{border-color:var(--primary)}.thumbnails img{display:block}.spec-strip{font-size:.8rem;color:var(--dark-soft);border-color:var(--gray-border);gap:24px}.detail-section{padding:30px 0;border-bottom:1px solid var(--gray-border)}.detail-section h2{font-family:var(--font-editorial);font-size:2rem;margin-bottom:18px}.detail-section p{font-size:.88rem;line-height:1.95;color:var(--gray-muted)}.detail-aside{background:var(--white);border-color:var(--gray-border);padding:28px;box-shadow:var(--shadow-md);position:sticky;top:115px}.detail-aside h2{font-family:var(--font-editorial);font-size:1.65rem}.detail-aside p{font-size:.8rem;line-height:1.85;color:var(--gray-muted)}.detail-aside .btn{font-size:.78rem}.detail-aside hr{border:0;border-top:1px solid var(--gray-border)}.tag-list span{background:#e9ede0;color:#637054;border-radius:999px;font-size:.75rem;padding:7px 15px}@media(max-width:850px){.detail-aside{position:static;order:0}.detail-grid{gap:24px}.hero-photo{aspect-ratio:1.2}}
  `]
})
export class PropertyDetailComponent implements OnInit, OnDestroy {
  private api = inject(PropertyService); private route = inject(ActivatedRoute); private cdr = inject(ChangeDetectorRef);
  auth = inject(AuthService); @ViewChild('mapElement') mapElement?: ElementRef<HTMLDivElement>;
  property?: Property; activeImage = ''; loading = true; error = ''; private map: any; private timer?: ReturnType<typeof setTimeout>; private destroyed = false;
  ngOnInit() {
    this.api.getPropertyById(this.route.snapshot.paramMap.get('id')!).subscribe({
      next: p => { if (this.destroyed) return; this.property = p; this.activeImage = p.featuredImage || ''; this.loading = false; this.cdr.detectChanges(); this.timer = setTimeout(() => this.initMap(), 0); },
      error: err => { this.loading = false; this.error = err.status === 404 ? 'This listing is unavailable or private.' : 'Could not load this property. Please try again.'; this.cdr.markForCheck(); }
    });
  }
  private initMap() {
    const p = this.property;
    if (this.destroyed || typeof L === 'undefined' || !this.mapElement || !p || p.latitude == null || p.longitude == null) return;
    this.map = L.map(this.mapElement.nativeElement).setView([p.latitude, p.longitude], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom:19, attribution:'© OpenStreetMap contributors' }).addTo(this.map);
    L.marker([p.latitude,p.longitude]).addTo(this.map).bindPopup(propertyPopup(p.title,p.location));
  }
  ngOnDestroy() { this.destroyed = true; clearTimeout(this.timer); this.map?.remove(); }
}
