import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DesignService } from '../../core/services/design.service';
import { DesignProject } from '../../core/models/design-project.model';
@Component({selector:'app-design-gallery',standalone:true,imports:[CommonModule,RouterLink],template:`
<section class="workspace-page"><header class="page-heading"><div><p class="eyebrow">YOUR CREATIVE SPACE</p><h1>Saved designs</h1><p>Your projects are saved to your account and available across devices.</p></div><a routerLink="/designer" class="btn btn-primary">New design</a></header>
<p *ngIf="error()" role="alert" class="form-error">{{error()}}</p><p *ngIf="loading()">Loading designs…</p><div *ngIf="!loading()&&!items().length" class="empty-state">Your first design starts with a room. Create a project to get started.</div>
<div class="workspace-cards"><article *ngFor="let p of items()" class="workspace-card"><img *ngIf="p.roomPhoto;else placeholder" [src]="p.roomPhoto" [alt]="p.name"><ng-template #placeholder><div class="design-placeholder" [style.background]="p.wallColor"><i class="fa-solid fa-couch"></i><span>{{p.roomWidth}} × {{p.roomHeight}} ft</span></div></ng-template>
<div class="workspace-card-body"><h2>{{p.name}}</h2><p>{{p.placedFurniture.length}} items · Updated {{p.updatedAt|date:'mediumDate'}}</p><div class="card-actions"><a routerLink="/designer" [queryParams]="{designId:p.id}" class="btn btn-primary">Open design</a><a *ngIf="p.propertyId" [routerLink]="['/properties',p.propertyId]">View property</a><button (click)="remove(p)">Delete</button></div></div></article></div></section>`,
styles:[`.design-placeholder{height:210px;display:grid;place-content:center;gap:14px;text-align:center;color:#334155}.design-placeholder i{font-size:3rem}`]})
export class DesignGalleryComponent implements OnInit {
 private api=inject(DesignService);items=signal<DesignProject[]>([]);loading=signal(true);error=signal('');
 ngOnInit(){this.api.getSavedDesigns().subscribe({next:items=>{this.items.set(items);this.loading.set(false);},error:()=>{this.error.set('Could not load your designs. Please try again.');this.loading.set(false);}});}
 remove(p:DesignProject){if(!p.id||!confirm('Delete this design? This cannot be undone.'))return;this.api.deleteDesign(p.id).subscribe({next:()=>this.items.update(list=>list.filter(x=>x.id!==p.id)),error:()=>this.error.set('Could not delete this design.')});}
}
