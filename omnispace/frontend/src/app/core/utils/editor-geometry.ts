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

export type SnapMode = 'off' | 'grid' | 'wall' | 'objects';

/** All distances and placement calculations use feet, including metric projects. */
export function placeItem(item: PlacedFurniture, width: number, length: number, mode: SnapMode,
  step = 0.25, others: PlacedFurniture[] = []) {
  clampPlacement(item, width, length, mode === 'grid' ? step : 0);
  if (mode !== 'wall' && mode !== 'objects') return;
  const bounds = footprint(item);
  const x = item.x / 100 * width, y = item.y / 100 * length;
  const xs = [bounds.width / 2, width - bounds.width / 2];
  const ys = [bounds.depth / 2, length - bounds.depth / 2];
  if (mode === 'objects') {
    for (const other of others.filter(o => o.instanceId !== item.instanceId && !o.hidden)) {
      const b = footprint(other), ox = other.x / 100 * width, oy = other.y / 100 * length;
      xs.push(ox, ox - b.width / 2 - bounds.width / 2, ox + b.width / 2 + bounds.width / 2,
        ox - b.width / 2 + bounds.width / 2, ox + b.width / 2 - bounds.width / 2);
      ys.push(oy, oy - b.depth / 2 - bounds.depth / 2, oy + b.depth / 2 + bounds.depth / 2,
        oy - b.depth / 2 + bounds.depth / 2, oy + b.depth / 2 - bounds.depth / 2);
    }
  }
  const nearest = (value: number, targets: number[]) => {
    const target = targets.reduce((best, candidate) => Math.abs(candidate - value) < Math.abs(best - value) ? candidate : best);
    return Math.abs(target - value) <= 0.25 ? target : value;
  };
  item.x = nearest(x, xs) / width * 100;
  item.y = nearest(y, ys) / length * 100;
  clampPlacement(item, width, length, 0);
}

export function wallDistances(item: PlacedFurniture, width: number, length: number) {
  const b = footprint(item), x = item.x / 100 * width, y = item.y / 100 * length;
  return { west: x - b.width / 2, east: width - x - b.width / 2,
    north: y - b.depth / 2, south: length - y - b.depth / 2 };
}

export function fitsRoom(item: PlacedFurniture, width: number, length: number) {
  const b = footprint(item);
  return b.width <= width + 1e-7 && b.depth <= length + 1e-7;
}

export const toDisplayLength = (feet: number, unit: 'ft' | 'm') => unit === 'm' ? feet * 0.3048 : feet;
export const toFeet = (value: number, unit: 'ft' | 'm') => unit === 'm' ? value / 0.3048 : value;

/** Hit-test the rotated footprint, rather than its unrotated bounding box. */
export function containsPoint(item: PlacedFurniture, x: number, y: number, width: number, length: number) {
  if (item.hidden) return false;
  const dx = x - item.x / 100 * width, dy = y - item.y / 100 * length;
  const angle = item.rotation * Math.PI / 180;
  const lx = dx * Math.cos(angle) + dy * Math.sin(angle);
  const ly = -dx * Math.sin(angle) + dy * Math.cos(angle);
  return Math.abs(lx) <= item.width / 2 && Math.abs(ly) <= (item.imageData ? 0.2 : item.height) / 2;
}
