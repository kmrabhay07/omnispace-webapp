import * as THREE from 'three';
export function disposeObject(root: THREE.Object3D | undefined): void {
  if (!root) return;
  root.userData['disposed'] = true;
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  root.traverse(object => {
    const mesh = object as THREE.Mesh;
    if (mesh.geometry) geometries.add(mesh.geometry);
    const items = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of items) {
      if (!material) continue;
      materials.add(material);
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
    }
    if (object instanceof THREE.Light && 'shadow' in object) (object as THREE.DirectionalLight).shadow?.dispose();
  });
  textures.forEach(texture => texture.dispose());
  materials.forEach(material => material.dispose());
  geometries.forEach(geometry => geometry.dispose());
  root.removeFromParent();
}
