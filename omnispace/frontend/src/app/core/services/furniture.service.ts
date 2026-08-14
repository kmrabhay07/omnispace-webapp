import { Injectable } from '@angular/core';
import { FurnitureItem } from '../models/furniture-item.model';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FurnitureService {
  private furnitureItems: FurnitureItem[] = [
    // Living Room
    {
      id: 'f-sofa-3',
      name: 'Luxury 3-Seater Sofa',
      category: 'Living Room',
      iconSvg: 'sofa',
      defaultWidth: 6.5,
      defaultHeight: 3.2,
      defaultColor: '#4A5568',
      description: 'Comfortable 3-seater velvet sofa with clean lines and oak legs.',
      price: 1200
    },
    {
      id: 'f-sofa-l',
      name: 'L-Shaped Sectional Sofa',
      category: 'Living Room',
      iconSvg: 'sectional',
      defaultWidth: 8.5,
      defaultHeight: 6.0,
      defaultColor: '#2D3748',
      description: 'Spacious sectional sofa perfect for open-plan living rooms.',
      price: 2100
    },
    {
      id: 'f-coffee-table',
      name: 'Modern Coffee Table',
      category: 'Living Room',
      iconSvg: 'table-round',
      defaultWidth: 3.5,
      defaultHeight: 3.5,
      defaultColor: '#D69E2E',
      description: 'Brass finished round coffee table with marble top.',
      price: 450
    },
    {
      id: 'f-tv-unit',
      name: 'Minimalist Media Console',
      category: 'Living Room',
      iconSvg: 'tv-console',
      defaultWidth: 6.0,
      defaultHeight: 1.8,
      defaultColor: '#744210',
      description: 'Walnut wood TV console with cord management slots.',
      price: 680
    },
    {
      id: 'f-armchair',
      name: 'Nordic Accent Armchair',
      category: 'Living Room',
      iconSvg: 'armchair',
      defaultWidth: 3.0,
      defaultHeight: 3.0,
      defaultColor: '#DD6B20',
      description: 'Cozy lounge chair with ergonomic cushion support.',
      price: 520
    },
    {
      id: 'f-rug-large',
      name: 'Geometrical Persian Rug',
      category: 'Living Room',
      iconSvg: 'rug',
      defaultWidth: 9.0,
      defaultHeight: 6.5,
      defaultColor: '#CBD5E0',
      description: 'Soft hand-woven wool rug with modern pattern.',
      price: 390
    },

    // Bedroom
    {
      id: 'f-bed-king',
      name: 'King Size Upholstered Bed',
      category: 'Bedroom',
      iconSvg: 'bed-king',
      defaultWidth: 6.5,
      defaultHeight: 7.0,
      defaultColor: '#E2E8F0',
      description: 'King bed frame with tufted fabric headboard.',
      price: 1550
    },
    {
      id: 'f-bed-queen',
      name: 'Queen Bed with Storage',
      category: 'Bedroom',
      iconSvg: 'bed-queen',
      defaultWidth: 5.5,
      defaultHeight: 6.5,
      defaultColor: '#CBD5E0',
      description: 'Queen bed with built-in pullout storage drawers.',
      price: 1180
    },
    {
      id: 'f-nightstand',
      name: 'Bedside Nightstand',
      category: 'Bedroom',
      iconSvg: 'nightstand',
      defaultWidth: 1.8,
      defaultHeight: 1.8,
      defaultColor: '#744210',
      description: 'Sleek wood nightstand with soft-close drawer.',
      price: 180
    },
    {
      id: 'f-wardrobe',
      name: 'Sliding Door Wardrobe',
      category: 'Bedroom',
      iconSvg: 'wardrobe',
      defaultWidth: 6.0,
      defaultHeight: 2.2,
      defaultColor: '#4A5568',
      description: 'Full height double-sliding door closet with mirrors.',
      price: 1400
    },

    // Kitchen & Dining
    {
      id: 'f-dining-table-6',
      name: '6-Seater Oak Dining Table',
      category: 'Kitchen',
      iconSvg: 'dining-set',
      defaultWidth: 6.5,
      defaultHeight: 4.5,
      defaultColor: '#975A16',
      description: 'Solid oak dining table surrounded by 6 ergonomic chairs.',
      price: 1350
    },
    {
      id: 'f-kitchen-island',
      name: 'Marble Island with Barstools',
      category: 'Kitchen',
      iconSvg: 'island',
      defaultWidth: 7.0,
      defaultHeight: 3.5,
      defaultColor: '#EDF2F7',
      description: 'Freestanding marble top kitchen island with 3 stool chairs.',
      price: 2400
    },
    {
      id: 'f-fridge',
      name: 'French Door Refrigerator',
      category: 'Kitchen',
      iconSvg: 'fridge',
      defaultWidth: 3.2,
      defaultHeight: 2.8,
      defaultColor: '#A0AEC0',
      description: 'Stainless steel double-door smart refrigerator.',
      price: 1900
    },

    // Office
    {
      id: 'f-desk-executive',
      name: 'Executive Work Desk',
      category: 'Office',
      iconSvg: 'desk',
      defaultWidth: 5.5,
      defaultHeight: 2.8,
      defaultColor: '#2C5282',
      description: 'Spacious work desk with built-in cable grommets.',
      price: 750
    },
    {
      id: 'f-office-chair',
      name: 'Ergonomic Mesh Chair',
      category: 'Office',
      iconSvg: 'office-chair',
      defaultWidth: 2.2,
      defaultHeight: 2.2,
      defaultColor: '#1A202C',
      description: 'High-back mesh chair with lumbar support.',
      price: 380
    },
    {
      id: 'f-bookshelf',
      name: 'Tall Wall Bookshelf',
      category: 'Office',
      iconSvg: 'bookshelf',
      defaultWidth: 4.0,
      defaultHeight: 1.5,
      defaultColor: '#744210',
      description: '5-tier open shelf unit for books and display items.',
      price: 420
    },

    // Bathroom
    {
      id: 'f-bathtub',
      name: 'Freestanding Soaking Tub',
      category: 'Bathroom',
      iconSvg: 'bathtub',
      defaultWidth: 5.5,
      defaultHeight: 2.8,
      defaultColor: '#FFFFFF',
      description: 'Modern acrylic freestanding bath tub.',
      price: 1250
    },
    {
      id: 'f-vanity',
      name: 'Double Sink Bathroom Vanity',
      category: 'Bathroom',
      iconSvg: 'vanity',
      defaultWidth: 5.0,
      defaultHeight: 2.0,
      defaultColor: '#4FD1C5',
      description: 'Quartz top vanity with dual ceramic basins.',
      price: 1100
    },

    // Decor & Lighting
    {
      id: 'f-plant',
      name: 'Monstera Potted Plant',
      category: 'Decor',
      iconSvg: 'plant',
      defaultWidth: 2.0,
      defaultHeight: 2.0,
      defaultColor: '#38A169',
      description: 'Vibrant indoor Monstera deliciosa in ceramic pot.',
      price: 95
    },
    {
      id: 'f-lamp-floor',
      name: 'Arc Floor Lamp',
      category: 'Decor',
      iconSvg: 'lamp',
      defaultWidth: 2.0,
      defaultHeight: 2.0,
      defaultColor: '#D69E2E',
      description: 'Brass arc floor lamp with marble base.',
      price: 240
    }
  ];

  getCatalog(): Observable<FurnitureItem[]> {
    return of(this.furnitureItems);
  }
}
