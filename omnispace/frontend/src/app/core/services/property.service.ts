import { Injectable, signal } from '@angular/core';
import { Property } from '../models/property.model';
import { Observable, of } from '../../../../node_modules/rxjs/dist/types';

@Injectable({
  providedIn: 'root'
})
export class PropertyService {
  private mockProperties: Property[] = [
    {
      id: 'prop-1',
      title: 'The Solstice Glass Penthouse',
      description: 'Experience unparalleled luxury in this modern glass penthouse with 360-degree skyline views, custom Italian marble finishes, and a private rooftop garden.',
      propertyType: 'RESIDENTIAL',
      category: 'Penthouse',
      price: 1850000,
      location: 'Downtown Bayview, San Francisco',
      address: '742 Skyline Blvd, Apt 50',
      bedrooms: 4,
      bathrooms: 4.5,
      areaSqFt: 3400,
      furnishingStatus: 'Furnished',
      amenities: ['Private Rooftop Pool', 'Smart Home System', 'Floor-to-Ceiling Windows', 'Private Elevator', 'Wine Cellar', '24/7 Concierge'],
      featuredImage: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80'
      ],
      ownerName: 'Victoria Sterling',
      ownerContact: '+1 (415) 892-0192',
      createdAt: '2026-08-01T10:00:00Z'
    },
    {
      id: 'prop-2',
      title: 'Nordic Minimalist Eco-Villa',
      description: 'A serene architectural masterpiece nestled in lush greenery. Sustainable oak flooring, solar integration, and open-concept indoor-outdoor living.',
      propertyType: 'RESIDENTIAL',
      category: 'Villa',
      price: 1250000,
      location: 'Pine Crest Estate, Seattle',
      address: '189 Timberline Way',
      bedrooms: 3,
      bathrooms: 3,
      areaSqFt: 2800,
      furnishingStatus: 'Semi-Furnished',
      amenities: ['Solar Energy System', 'Zen Garden', 'Heated Floors', 'Double-Sided Fireplace', 'EV Charging Station'],
      featuredImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?auto=format&fit=crop&w=1200&q=80'
      ],
      ownerName: 'Marcus Lindqvist',
      ownerContact: '+1 (206) 431-7720',
      createdAt: '2026-08-05T14:30:00Z'
    },
    {
      id: 'prop-3',
      title: 'Apex Tech Hub & Collaborative Suite',
      description: 'State-of-the-art commercial tech office featuring acoustic pod stations, executive conference hall, lounge bar, and high-speed fiber infrastructure.',
      propertyType: 'COMMERCIAL',
      category: 'Office',
      price: 3200000,
      location: 'Innovation District, Austin',
      address: '400 Silicon Parkway, Floor 4',
      bedrooms: 0,
      bathrooms: 6,
      areaSqFt: 6500,
      furnishingStatus: 'Furnished',
      amenities: ['High-Speed Fiber', 'Acoustic Conference Pods', 'Lounge & Espresso Bar', 'Keycard Access', 'Underground Parking'],
      featuredImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80'
      ],
      ownerName: 'Apex Commercial Ventures',
      ownerContact: '+1 (512) 901-4411',
      createdAt: '2026-08-10T09:15:00Z'
    },
    {
      id: 'prop-4',
      title: 'Loft 84 Artisan Studio & Residence',
      description: 'Industrial chic loft with exposed brickwork, 16ft timber beam ceilings, oversized steel-frame windows, and versatile open floor plan.',
      propertyType: 'RESIDENTIAL',
      category: 'Studio',
      price: 680000,
      location: 'Arts District, Chicago',
      address: '840 N Fulton Market, Unit 3B',
      bedrooms: 1,
      bathrooms: 1.5,
      areaSqFt: 1450,
      furnishingStatus: 'Unfurnished',
      amenities: ['Exposed Brick', 'High Ceilings', 'Freight Elevator', 'Freight Loading Dock', 'Pet Friendly'],
      featuredImage: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80'
      ],
      ownerName: 'Elena Rostova',
      ownerContact: '+1 (312) 554-9920',
      createdAt: '2026-08-12T11:00:00Z'
    },
    {
      id: 'prop-5',
      title: 'Prism Luxury Flagship Storefront',
      description: 'Premier retail space on high-foot-traffic boulevard with expansive double-glass facade, high ceilings, security vault, and storage room.',
      propertyType: 'COMMERCIAL',
      category: 'Retail',
      price: 2100000,
      location: 'Fifth Avenue Corridor, New York',
      address: '620 5th Avenue',
      bedrooms: 0,
      bathrooms: 2,
      areaSqFt: 3100,
      furnishingStatus: 'Semi-Furnished',
      amenities: ['High Footfall Zone', 'Double Glass Facade', 'Storage Vault', 'HVAC Installed', 'Security System'],
      featuredImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=1200&q=80'
      ],
      ownerName: 'Manhattan Prime Real Estate',
      ownerContact: '+1 (212) 880-3321',
      createdAt: '2026-08-13T16:20:00Z'
    },
    {
      id: 'prop-6',
      title: 'Monaco Bay Coastal Apartment',
      description: 'Sunlit beachfront residence with sprawling balcony overlooking the azure bay. Features white oak cabinetry, stone island, and infinity pool access.',
      propertyType: 'RESIDENTIAL',
      category: 'Apartment',
      price: 940000,
      location: 'Ocean Drive, Miami',
      address: '2200 Ocean Dr, Unit 1204',
      bedrooms: 2,
      bathrooms: 2,
      areaSqFt: 1850,
      furnishingStatus: 'Furnished',
      amenities: ['Beachfront Access', 'Infinity Pool', 'Valet Parking', 'Fitness Center', 'Private Balcony'],
      featuredImage: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
      ],
      ownerName: 'Carlos Rossi',
      ownerContact: '+1 (305) 772-0091',
      createdAt: '2026-08-14T08:00:00Z'
    }
  ];

  private propertiesSignal = signal<Property[]>(this.mockProperties);

  getProperties(): Observable<Property[]> {
    return of(this.propertiesSignal());
  }

  getPropertyById(id: string): Observable<Property | undefined> {
    const prop = this.propertiesSignal().find(p => p.id === id);
    return of(prop);
  }

  addProperty(property: Omit<Property, 'id' | 'createdAt'>): Observable<Property> {
    const newProp: Property = {
      ...property,
      id: 'prop-' + Date.now(),
      createdAt: new Date().toISOString()
    };
    const current = this.propertiesSignal();
    this.propertiesSignal.set([newProp, ...current]);
    return of(newProp);
  }
}
