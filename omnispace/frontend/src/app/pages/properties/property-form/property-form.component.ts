import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PropertyService } from '../../../core/services/property.service';
import { Property } from '../../../core/models/property.model';
import { readImage } from '../../../core/utils/images';

@Component({
  selector:'app-property-form', standalone:true, imports:[CommonModule,FormsModule,RouterLink],
  template:`
    <section class="workspace-page form-page">
      <header class="page-heading"><div><p class="eyebrow">OWNER WORKSPACE</p><h1>{{ id ? 'Edit your listing' : 'List your property' }}</h1><p>Add your own photos and details. Drafts are visible only to you.</p></div><a routerLink="/my-properties">My listings</a></header>
      <p *ngIf="error" class="form-error" role="alert">{{ error }}</p><p *ngIf="loading">Loading listing…</p>
      <form #form="ngForm" (ngSubmit)="save('PUBLISHED')" *ngIf="!loading">
        <label>Property title<input name="title" [(ngModel)]="model.title" required maxlength="160" placeholder="e.g. Bright two-bedroom apartment"></label>
        <div class="form-grid">
          <label>Property type<select name="type" [(ngModel)]="model.propertyType"><option value="RESIDENTIAL">Residential</option><option value="COMMERCIAL">Commercial</option></select></label>
          <label>Category<select name="category" [(ngModel)]="model.category"><option *ngFor="let category of categories" [value]="category">{{ category }}</option></select></label>
          <label>Currency<select name="currency" [(ngModel)]="model.currency"><option *ngFor="let c of currencies" [value]="c">{{ c }}</option></select></label>
          <label>Price<input type="number" name="price" [(ngModel)]="model.price" required min="1"></label>
          <label>City / locality<input name="location" [(ngModel)]="model.location" required maxlength="200"></label>
          <label>Address<input name="address" [(ngModel)]="model.address" maxlength="500"></label>
          <label>Bedrooms<input type="number" name="bedrooms" [(ngModel)]="model.bedrooms" min="0" max="100"></label>
          <label>Bathrooms<input type="number" name="bathrooms" [(ngModel)]="model.bathrooms" min="0" max="100" step="0.5"></label>
          <label>Area in square feet<input type="number" name="area" [(ngModel)]="model.areaSqFt" min="1" required></label>
          <label>Furnishing<select name="furnishing" [(ngModel)]="model.furnishingStatus"><option>Unfurnished</option><option>Semi-Furnished</option><option>Furnished</option></select></label>
          <label>Latitude (optional)<input type="number" name="latitude" [(ngModel)]="model.latitude" min="-90" max="90" step="any"></label>
          <label>Longitude (optional)<input type="number" name="longitude" [(ngModel)]="model.longitude" min="-180" max="180" step="any"></label>
        </div>
        <label>Description<textarea name="description" [(ngModel)]="model.description" maxlength="10000" rows="5"></textarea></label>
        <label>Public contact phone (optional)<input name="contact" [(ngModel)]="model.ownerContact" maxlength="100" placeholder="Only add details you want displayed publicly"></label>
        <fieldset><legend>Amenities actually available</legend><div class="amenity-options"><label *ngFor="let a of amenities"><input type="checkbox" [checked]="model.amenities?.includes(a)" (change)="toggleAmenity(a)"> {{ a }}</label></div></fieldset>
        <fieldset><legend>Property photos</legend><p>Upload up to 8 photos. The first photo is your cover. JPG, PNG or WebP, up to 10 MB each.</p>
          <input type="file" multiple accept="image/jpeg,image/png,image/webp" (change)="uploadPhotos($event)" [disabled]="uploading" aria-label="Upload property photos">
          <div class="photo-grid"><div *ngFor="let photo of model.images; let i = index"><img [src]="photo" [alt]="'Property photo ' + (i + 1)"><button type="button" (click)="removePhoto(i)">Remove</button><button type="button" *ngIf="i > 0" (click)="makeCover(i)">Use as cover</button></div></div>
        </fieldset>
        <fieldset><legend>Floor plan (optional)</legend><p>Upload the actual floor plan for this property.</p><input type="file" accept="image/jpeg,image/png,image/webp" (change)="uploadPlan($event)" [disabled]="uploading" aria-label="Upload floor plan"><img *ngIf="model.floorPlanImage" [src]="model.floorPlanImage" alt="Floor plan preview" class="plan-preview"><button *ngIf="model.floorPlanImage" type="button" (click)="model.floorPlanImage = ''">Remove floor plan</button></fieldset>
        <div class="form-actions"><button type="button" class="btn btn-outline" [disabled]="busy || uploading || form.invalid" (click)="save('DRAFT')">{{ busy ? 'Saving…' : 'Save draft' }}</button><button class="btn btn-primary" [disabled]="busy || uploading || form.invalid">{{ busy ? 'Saving…' : 'Publish listing' }}</button></div>
      </form>
    </section>`,
  styles:[`.form-page{max-width:1000px}form{display:grid;gap:24px;background:white;padding:28px;border:1px solid #dbe3ec;border-radius:18px}label{display:grid;gap:8px;font-weight:600}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}fieldset{border:1px solid #dbe3ec;padding:18px;border-radius:12px}legend{font-weight:700;padding:0 8px}.amenity-options{display:flex;flex-wrap:wrap;gap:18px}.amenity-options label{display:flex;align-items:center}.amenity-options input{width:auto}.photo-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:15px;margin-top:16px}.photo-grid img{width:100%;height:130px;object-fit:cover;border-radius:8px}.photo-grid button{margin:6px}.plan-preview{display:block;max-width:100%;max-height:300px;margin:16px 0}.form-actions{display:flex;justify-content:flex-end;gap:15px}@media(max-width:600px){.form-grid{grid-template-columns:1fr}form{padding:18px}}`]
})
export class PropertyFormComponent implements OnInit {
  private api=inject(PropertyService); private route=inject(ActivatedRoute); private router=inject(Router); private cdr=inject(ChangeDetectorRef);
  id=this.route.snapshot.paramMap.get('id'); busy=false; uploading=false; loading=false; error='';
  categories=['Apartment','Villa','Penthouse','Office','Retail','Studio']; currencies=['INR','USD','EUR','GBP','AED'];
  amenities=['Parking','Lift','Security','Power backup','Balcony','Gym','Pool','Pet friendly','Water supply','Air conditioning'];
  model: Partial<Property>={title:'',description:'',propertyType:'RESIDENTIAL',category:'Apartment',currency:'INR',price:undefined,location:'',address:'',bedrooms:0,bathrooms:0,areaSqFt:undefined,furnishingStatus:'Unfurnished',amenities:[],images:[],floorPlanImage:'',status:'DRAFT'};
  ngOnInit() {
    if (!this.id) return;
    this.loading=true;
    this.api.getPropertyById(this.id).subscribe({ next:p=>{this.model={...p,images:[...p.images],amenities:[...p.amenities]};this.loading=false;this.cdr.markForCheck();}, error:()=>{this.loading=false;this.error='Could not load this listing.';this.cdr.markForCheck();} });
  }
  toggleAmenity(value:string) { this.model.amenities=this.model.amenities?.includes(value)?this.model.amenities.filter(a=>a!==value):[...(this.model.amenities||[]),value]; }
  removePhoto(index:number) { this.model.images=this.model.images?.filter((_,i)=>i!==index); }
  makeCover(index:number) { const images=[...(this.model.images||[])]; const [cover]=images.splice(index,1); this.model.images=[cover,...images]; }
  async uploadPhotos(event:Event) {
    const input=event.target as HTMLInputElement; const files=Array.from(input.files||[]); input.value='';
    if ((this.model.images?.length||0)+files.length>8) {this.error='Use at most 8 property photos.';return;}
    this.uploading=true;this.error='';
    try {const images=await Promise.all(files.map(readImage));this.model.images=[...(this.model.images||[]),...images];}
    catch(err){this.error=(err as Error).message;} finally{this.uploading=false;this.cdr.markForCheck();}
  }
  async uploadPlan(event:Event) {
    const input=event.target as HTMLInputElement;const file=input.files?.[0];input.value='';if(!file)return;
    this.uploading=true;this.error='';
    try{this.model.floorPlanImage=await readImage(file);}catch(err){this.error=(err as Error).message;}finally{this.uploading=false;this.cdr.markForCheck();}
  }
  save(status:'DRAFT'|'PUBLISHED') {
    if(this.busy||this.uploading)return;
    if(status==='PUBLISHED'&&!this.model.images?.length){this.error='Add at least one photo before publishing.';return;}
    this.busy=true;this.error='';
    const payload={...this.model,status};
    (this.id?this.api.updateProperty(this.id,payload):this.api.addProperty(payload)).subscribe({
      next:()=>this.router.navigate(['/my-properties']),
      error:err=>{this.busy=false;this.error=err.error?.message||'Could not save the listing. Your changes are still here.';this.cdr.markForCheck();}
    });
  }
}
