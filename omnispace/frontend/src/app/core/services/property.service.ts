import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Property } from '../models/property.model';
import { Observable, of, catchError, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PropertyService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/properties`;
  private localKey = 'omnispace_user_properties';

  private mockProperties: Property[] = [
    {
      id: 'prop-1',
      title: 'The Solstice Glass Penthouse',
      description: 'Experience unparalleled luxury in this modern glass penthouse with 360-degree skyline views, custom Italian marble finishes, and a private rooftop garden.',
      propertyType: 'RESIDENTIAL',
      category: 'Penthouse',
      price: 1850000,
      currency: 'USD',
      currencySymbol: '$',
      location: 'Downtown Bayview, San Francisco',
      address: '742 Skyline Blvd, Apt 50',
      latitude: 37.7749,
      longitude: -122.4194,
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
      currency: 'USD',
      currencySymbol: '$',
      location: 'Pine Crest Estate, Seattle',
      address: '189 Timberline Way',
      latitude: 47.6062,
      longitude: -122.3321,
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
      currency: 'USD',
      currencySymbol: '$',
      location: 'Innovation District, Austin',
      address: '400 Silicon Parkway, Floor 4',
      latitude: 30.2672,
      longitude: -97.7431,
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
      title: 'Palm Avenue Luxury Villa',
      description: 'Prime luxury residential villa in Indiranagar with private swimming pool, Italian marble flooring, landscaped garden, and multi-car parking.',
      propertyType: 'RESIDENTIAL',
      category: 'Villa',
      price: 8500000,
      currency: 'INR',
      currencySymbol: '₹',
      location: 'Indiranagar, Bengaluru',
      address: '100 Feet Road, HAL 2nd Stage',
      latitude: 12.9716,
      longitude: 77.5946,
      bedrooms: 4,
      bathrooms: 4,
      areaSqFt: 3800,
      furnishingStatus: 'Furnished',
      amenities: ['Private Pool', 'Landscaped Garden', 'Clubhouse Access', '24/7 Security', 'Solar Power'],
      featuredImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80'
      ],
      ownerName: 'Abhay Kumar',
      ownerContact: '+91-8091109624',
      createdAt: '2026-08-14T08:00:00Z'
    }
  ];

  private propertiesSignal = signal<Property[]>(this.getInitialCombinedList());

  private getInitialCombinedList(): Property[] {
    try {
      const local = localStorage.getItem(this.localKey);
      const userProps: Property[] = local ? JSON.parse(local) : [];
      const userIds = new Set(userProps.map(p => p.id));
      const remainingMock = this.mockProperties.filter(p => !userIds.has(p.id));
      return [...userProps, ...remainingMock];
    } catch {
      return this.mockProperties;
    }
  }

  private persistUserProperties(prop: Property) {
    try {
      const local = localStorage.getItem(this.localKey);
      const userProps: Property[] = local ? JSON.parse(local) : [];
      const filtered = userProps.filter(p => p.id !== prop.id);
      localStorage.setItem(this.localKey, JSON.stringify([prop, ...filtered]));
    } catch (e) {
      console.warn('Could not persist to localStorage:', e);
    }
  }

  getProperties(): Observable<Property[]> {
    return this.http.get<Property[]>(this.apiUrl).pipe(
      tap(serverProps => {
        if (serverProps && serverProps.length > 0) {
          const serverIds = new Set(serverProps.map(p => p.id));
          const localList = this.getInitialCombinedList().filter(p => !serverIds.has(p.id));
          this.propertiesSignal.set([...serverProps, ...localList]);
        }
      }),
      map(() => this.propertiesSignal()),
      catchError(err => {
        console.warn('Backend API offline, using local store:', err);
        return of(this.propertiesSignal());
      })
    );
  }

  getPropertyById(id: string): Observable<Property | undefined> {
    return this.http.get<Property>(`${this.apiUrl}/${id}`).pipe(
      catchError(() => {
        const prop = this.propertiesSignal().find(p => p.id === id);
        return of(prop);
      })
    );
  }

  addProperty(property: Omit<Property, 'id' | 'createdAt'>): Observable<Property> {
    return this.http.post<Property>(this.apiUrl, property).pipe(
      tap(createdProp => {
        this.persistUserProperties(createdProp);
        const current = this.propertiesSignal();
        this.propertiesSignal.set([createdProp, ...current.filter(p => p.id !== createdProp.id)]);
      }),
      catchError(err => {
        console.warn('Backend POST failed or sleeping, storing locally:', err);
        const fallbackProp: Property = {
          ...property,
          id: 'prop-' + Date.now(),
          createdAt: new Date().toISOString()
        };
        this.persistUserProperties(fallbackProp);
        const current = this.propertiesSignal();
        this.propertiesSignal.set([fallbackProp, ...current.filter(p => p.id !== fallbackProp.id)]);
        return of(fallbackProp);
      })
    );
  }
}
