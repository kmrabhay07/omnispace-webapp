import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PropertyService } from '../../core/services/property.service';
import { Property } from '../../core/models/property.model';
@Component({selector:'app-my-properties',standalone:true,imports:[CommonModule,RouterLink],template:`
<section class="workspace-page"><header class="page-heading"><div><p class="eyebrow">OWNER WORKSPACE</p><h1>My listings</h1><p>Manage drafts and published properties.</p></div><a routerLink="/properties/new" class="btn btn-primary">Add property</a></header>
<p *ngIf="error()" class="form-error" role="alert">{{error()}}</p><p *ngIf="loading()">Loading listings…</p><div *ngIf="!loading()&&!items().length" class="empty-state">You have no listings yet. Start with a draft.</div>
<div class="workspace-cards"><article *ngFor="let p of items()" class="workspace-card"><img *ngIf="p.featuredImage" [src]="p.featuredImage" [alt]="p.title"><div class="workspace-card-body"><span class="eyebrow">{{p.status || 'DRAFT'}}</span><h2>{{p.title}}</h2><p>{{p.location}} · {{p.currencySymbol}}{{p.price|number}}</p><div class="card-actions"><a [routerLink]="['/properties',p.id,'edit']" class="btn btn-outline">Edit / publish</a><a [routerLink]="['/properties',p.id]">Preview</a><button (click)="remove(p)" [disabled]="busy()===p.id">Delete</button></div></div></article></div>
</section>`})
export class MyPropertiesComponent implements OnInit {
  private api=inject(PropertyService);items=signal<Property[]>([]);loading=signal(true);error=signal('');busy=signal('');
  ngOnInit(){this.api.getMyProperties().subscribe({next:items=>{this.items.set(items);this.loading.set(false);},error:()=>{this.error.set('Could not load your listings.');this.loading.set(false);}});}
  remove(p:Property){if(!confirm('Delete this listing? This cannot be undone.'))return;this.busy.set(p.id);this.api.deleteProperty(p.id).subscribe({next:()=>{this.items.update(list=>list.filter(x=>x.id!==p.id));this.busy.set('');},error:()=>{this.busy.set('');this.error.set('Could not delete this listing.');}});}
}
