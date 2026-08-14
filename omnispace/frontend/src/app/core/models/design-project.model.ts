import { PlacedFurniture } from './furniture-item.model';

export interface DesignProject {
  id?: string;
  name: string;
  userId?: string;
  propertyId?: string;
  roomWidth: number;
  roomHeight: number;
  roomShape: 'RECTANGLE' | 'L_SHAPED';
  wallColor: string;
  floorColor: string;
  floorTexture: 'WOOD' | 'TILE' | 'CARPET' | 'CONCRETE';
  placedFurniture: PlacedFurniture[];
  createdAt?: string;
  updatedAt?: string;
}
