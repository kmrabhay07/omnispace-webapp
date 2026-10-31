import { PlacedFurniture } from '../models/furniture-item.model';
export function footprint(item: PlacedFurniture) {
  const radians = item.rotation * Math.PI / 180;
  const depth = item.imageData ? 0.2 : item.height;
  return { width: Math.abs(Math.cos(radians)) * item.width + Math.abs(Math.sin(radians)) * depth,
    depth: Math.abs(Math.sin(radians)) * item.width + Math.abs(Math.cos(radians)) * depth };
}
export function clampPlacement(item: PlacedFurniture, width: number, length: number, snap = 0.25) {
  const bounds = footprint(item);
  const clamp = (position: number, size: number, extent: number) => {
    const half = Math.min(size / 2, extent / 2);
    const snapped = snap ? Math.round(position / snap) * snap : position;
    return Math.max(half, Math.min(extent - half, snapped));
  };
  item.x = clamp(item.x / 100 * width, bounds.width, width) / width * 100;
  item.y = clamp(item.y / 100 * length, bounds.depth, length) / length * 100;
}
