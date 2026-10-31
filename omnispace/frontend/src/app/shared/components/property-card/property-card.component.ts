import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Property } from '../../../core/models/property.model';
import { FluidSurfaceDirective } from '../../directives/fluid-surface.directive';

@Component({
  selector: 'app-property-card', standalone: true,
  imports: [CommonModule, RouterLink, FluidSurfaceDirective],
  template: `
    <article class="property-card" appFluidSurface>
      <a [routerLink]="['/properties', property.id]" class="image-wrapper" [attr.aria-label]="'View ' + property.title">
        <img *ngIf="property.featuredImage && !imageFailed; else noImage" [src]="property.featuredImage" [alt]="property.title" loading="lazy" (error)="imageFailed = true">
        <ng-template #noImage><div class="image-placeholder"><i class="fa-solid fa-house" aria-hidden="true"></i><span>A space with possibility</span></div></ng-template>
        <span class="category-label">{{ property.category }}</span><span class="image-arrow" aria-hidden="true"><i class="fa-solid fa-arrow-up-right-from-square"></i></span>
      </a>
      <div class="card-body"><div class="location"><i class="fa-solid fa-location-dot" aria-hidden="true"></i> {{ property.location }}</div><h3><a [routerLink]="['/properties', property.id]">{{ property.title }}</a></h3><div class="specs"><span *ngIf="property.bedrooms > 0">{{ property.bedrooms }} beds</span><span *ngIf="property.bathrooms > 0">{{ property.bathrooms }} baths</span><span>{{ property.areaSqFt | number }} sq ft</span></div><div class="card-bottom"><span class="price">{{ property.price | currency:(property.currency || 'INR'):'symbol':'1.0-0' }}</span><a routerLink="/designer" [queryParams]="{propertyId: property.id}" [attr.aria-label]="'Design a room for ' + property.title">Design this space <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a></div></div>
    </article>
  `,
  styles: [`
    :host{display:block;min-width:0;height:100%}.property-card{height:100%;background:var(--white);border:1px solid var(--gray-border);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;transition:transform .65s var(--ease-out),box-shadow .65s var(--ease-out),border-color .5s}.property-card:hover{transform:translateY(-6px);box-shadow:var(--shadow-hover);border-color:#ced2c2}.image-wrapper{position:relative;display:block;aspect-ratio:1.45;overflow:hidden;background:#e8e8de}.image-wrapper img{display:block;width:100%;height:100%;object-fit:cover;transition:transform 1.2s var(--ease-out),filter 1s}.property-card:hover .image-wrapper img{transform:scale(1.055);filter:saturate(1.05)}.image-wrapper::after{content:'';position:absolute;inset:40% 0 0;background:linear-gradient(transparent,#162a2022);pointer-events:none}.category-label{position:absolute;top:16px;left:16px;padding:6px 12px;border:1px solid #ffffffa0;background:#fffefaeb;backdrop-filter:blur(8px);border-radius:999px;font-size:.61rem;letter-spacing:.04em;color:#43513c;z-index:1}.image-arrow{position:absolute;bottom:16px;right:16px;width:35px;height:35px;border-radius:50%;background:#fffefaee;display:grid;place-items:center;font-size:.68rem;z-index:1;transform:translateY(8px);opacity:0;transition:transform .5s var(--ease-out),opacity .3s}.property-card:hover .image-arrow,.property-card:focus-within .image-arrow{transform:translateY(0);opacity:1}.image-placeholder{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;background:radial-gradient(at 30% 30%,#ece0d1,transparent 70%),#e0e6d7;color:#7b8b70}.image-placeholder>i{font-size:2rem;font-weight:400}.image-placeholder>span{font-family:var(--font-editorial);font-size:1.3rem}.card-body{padding:23px;flex:1;display:flex;flex-direction:column}.location{font-size:.62rem;color:#87907d;display:flex;align-items:center;gap:7px;letter-spacing:.03em}.location i{font-size:.6rem}h3{font-size:1.45rem;line-height:1.2;letter-spacing:-.04em;margin:12px 0}h3 a:hover{color:var(--primary)}.specs{display:flex;gap:12px;flex-wrap:wrap;font-size:.68rem;color:#7a8273;margin:4px 0 23px}.specs>span+span::before{content:'·';margin-right:12px;color:#b4b9ab}.card-bottom{border-top:1px solid var(--gray-border);padding-top:18px;display:flex;align-items:center;gap:12px;justify-content:space-between;margin-top:auto}.price{font-family:var(--font-heading);font-size:1.14rem;letter-spacing:-.035em}.card-bottom a{font-size:.58rem;color:#637359;display:flex;align-items:center;gap:9px}.card-bottom a:hover{color:var(--primary)}.card-bottom a i{font-size:.55rem;transition:transform .3s}.card-bottom a:hover i{transform:translateX(3px)}@media(hover:none){.property-card:hover{transform:none}.image-arrow{opacity:1;transform:none}}@media(max-width:600px){h3{font-size:1.6rem}.card-body{padding:24px}.location{font-size:.68rem}.specs{font-size:.75rem}.card-bottom a{font-size:.68rem}.image-wrapper{aspect-ratio:1.5}}
  `]
})
export class PropertyCardComponent {
  @Input({ required: true }) property!: Property;
  imageFailed = false;
}
