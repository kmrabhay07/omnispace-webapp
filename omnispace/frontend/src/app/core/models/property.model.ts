export interface Property {
  id: string;
  title: string;
  description: string;
  propertyType: 'RESIDENTIAL' | 'COMMERCIAL';
  category: 'Apartment' | 'Villa' | 'Penthouse' | 'Office' | 'Retail' | 'Studio';
  price: number;
  currency?: 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED';
  currencySymbol?: string;
  location: string;
  address: string;
  latitude?: number;
  longitude?: number;
  bedrooms: number;
  bathrooms: number;
  areaSqFt: number;
  furnishingStatus: 'Furnished' | 'Semi-Furnished' | 'Unfurnished';
  amenities: string[];
  images: string[];
  featuredImage: string;
  ownerId?: string;
  ownerName?: string;
  ownerContact?: string;
  createdAt?: string;
}
