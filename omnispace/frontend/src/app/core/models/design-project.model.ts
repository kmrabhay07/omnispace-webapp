import { PlacedFurniture } from './furniture-item.model';

export interface DesignProject {
  unitSystem?: 'ft' | 'm';
  snapMode?: 'off' | 'grid' | 'wall' | 'objects';
  snapStep?: number;
  id?: string;
  version?: number;
  ceilingHeight?: number;
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
  roomPhoto?: string;
  createdAt?: string;
  updatedAt?: string;
}
