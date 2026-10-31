import { clampPlacement, footprint } from './editor-geometry';
import { PlacedFurniture } from '../models/furniture-item.model';
const item=():PlacedFurniture=>({instanceId:'one',furnitureId:'sofa',name:'Sofa',category:'Living Room',x:0,y:100,width:6,height:3,rotation:90,color:'#ffffff',viewMode:'TOP_DOWN'});
describe('Measured placement',()=>{
  it('keeps rotated furniture footprints inside the room',()=>{
    const placed=item();clampPlacement(placed,20,16);const bounds=footprint(placed);
    expect(placed.x/100*20).toBeCloseTo(bounds.width/2);expect(placed.y/100*16).toBeCloseTo(16-bounds.depth/2);
  });
  it('snaps center positions to quarter-foot increments',()=>{
    const placed={...item(),x:51.1,y:50.4,rotation:0};clampPlacement(placed,20,16);
    expect(placed.x/100*20).toBe(10.25);expect(placed.y/100*16).toBe(8);
  });
});
