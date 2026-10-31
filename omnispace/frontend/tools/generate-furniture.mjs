// Original OmniSpace models. Run from the frontend directory with `node tools/generate-furniture.mjs`.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { writeFile } from 'node:fs/promises';
globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(value => { this.result = value; this.onloadend?.(); }); }
};
const fabric = new THREE.MeshStandardMaterial({ color: '#647e78', roughness: .9 });
const cream = new THREE.MeshStandardMaterial({ color: '#eee7dd', roughness: .95 });
const wood = new THREE.MeshStandardMaterial({ color: '#8d6144', roughness: .65 });
const metal = new THREE.MeshStandardMaterial({ color: '#253341', roughness: .35, metalness: .55 });
function box(g,w,h,d,x,y,z,mat,rounded=false) {
  const mesh = new THREE.Mesh(rounded ? new RoundedBoxGeometry(w,h,d,2,Math.min(.06,w/5,h/5,d/5)) : new THREE.BoxGeometry(w,h,d), mat);
  mesh.position.set(x,y,z);g.add(mesh);return mesh;
}
function legs(g,w,d,height) {for(const x of [-w/2+.12,w/2-.12])for(const z of [-d/2+.12,d/2-.12])box(g,.08,height,.08,x,height/2,z,wood);}
fabric.name='upholstery';cream.name='cushions';wood.name='wood';metal.name='metal';
const models={};
const sofa=new THREE.Group();legs(sofa,2.2,.95,.18);box(sofa,2.2,.22,.95,0,.29,0,fabric,true);box(sofa,2.2,.58,.15,0,.65,-.4,fabric,true);
for(const x of [-1.03,1.03])box(sofa,.15,.5,.95,x,.5,0,fabric,true);
for(const x of [-.65,0,.65]){box(sofa,.61,.18,.74,x,.49,.05,cream,true);box(sofa,.61,.42,.16,x,.72,-.28,cream,true);}models['sofa']=sofa;
const table=new THREE.Group();legs(table,1.15,.75,.4);box(table,1.2,.09,.8,0,.445,0,wood,true);box(table,.96,.04,.56,0,.15,0,metal);models['coffee-table']=table;
const chair=new THREE.Group();legs(chair,.82,.8,.18);box(chair,.82,.2,.8,0,.28,0,fabric,true);box(chair,.82,.65,.14,0,.63,-.33,fabric,true);box(chair,.64,.15,.6,0,.45,.04,cream,true);for(const x of [-.36,.36])box(chair,.12,.42,.8,x,.48,0,fabric,true);models['armchair']=chair;
const bed=new THREE.Group();legs(bed,1.9,2.1,.17);box(bed,1.9,.22,2.1,0,.28,0,wood,true);box(bed,1.86,.26,2.02,0,.52,0,cream,true);box(bed,1.96,1.08,.12,0,.6,-1.02,fabric,true);for(const x of [-.47,.47])box(bed,.74,.15,.43,x,.73,-.65,cream,true);box(bed,1.88,.05,1.1,0,.68,.41,fabric,true);models['bed']=bed;
for (const [name,model] of Object.entries(models)) {
  const bytes=await new GLTFExporter().parseAsync(model,{binary:true});
  await writeFile(new URL('../public/models/'+name+'.glb',import.meta.url),Buffer.from(bytes));
  console.log(name,bytes.byteLength);
}
