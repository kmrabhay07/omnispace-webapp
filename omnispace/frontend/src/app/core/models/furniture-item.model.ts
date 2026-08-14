export interface FurnitureItem {
  id: string;
  name: string;
  category: 'Living Room' | 'Bedroom' | 'Kitchen' | 'Bathroom' | 'Office' | 'Decor';
  iconSvg: string;
  defaultWidth: number;   // in feet/canvas relative units
  defaultHeight: number;  // in feet/canvas relative units
  defaultColor?: string;
  description?: string;
  price?: number;
}

export interface PlacedFurniture {
  instanceId: string;
  furnitureId: string;
  name: string;
  category: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // angle in degrees (0, 90, 180, 270)
  color: string;
  viewMode: 'TOP_DOWN' | 'FRONT';
  iconSvg?: string;
}
