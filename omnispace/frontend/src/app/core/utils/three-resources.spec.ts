import * as THREE from 'three';
import { disposeObject } from './three-resources';
import { vi } from 'vitest';
describe('Three.js cleanup',()=>{
  it('disposes shared geometry, materials and textures once and detaches the group',()=>{
    const parent=new THREE.Scene();const group=new THREE.Group();parent.add(group);
    const geometry=new THREE.BoxGeometry();const texture=new THREE.Texture();const material=new THREE.MeshBasicMaterial({map:texture});
    group.add(new THREE.Mesh(geometry,material),new THREE.Mesh(geometry,material));
    const geo=vi.spyOn(geometry,'dispose');const mat=vi.spyOn(material,'dispose');const tex=vi.spyOn(texture,'dispose');
    disposeObject(group);
    expect(geo).toHaveBeenCalledTimes(1);expect(mat).toHaveBeenCalledTimes(1);expect(tex).toHaveBeenCalledTimes(1);
    expect(group.parent).toBeNull();expect(group.userData['disposed']).toBe(true);
  });
});
