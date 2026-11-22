import { clampPlacement, footprint, placeItem, wallDistances, containsPoint, toDisplayLength, toFeet, fitsRoom } from './editor-geometry';
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
  it('turns snapping off without losing room boundary protection',()=>{
    const p={...item(),rotation:0,x:51.13,y:50.7};placeItem(p,20,16,'off');
    expect(p.x).toBeCloseTo(51.13);expect(p.y).toBeCloseTo(50.7);
    p.x=-50;placeItem(p,20,16,'off');expect(p.x).toBeCloseTo(15);
  });
  it('uses the selected grid increment',()=>{
    const p={...item(),rotation:0,x:52.9,y:51};placeItem(p,20,16,'grid',1);
    expect(p.x/100*20).toBe(11);expect(p.y/100*16).toBe(8);
  });
  it('magnetizes to a nearby wall without snapping a distant object',()=>{
    const p={...item(),rotation:0,x:16,y:50};placeItem(p,20,16,'wall');
    expect(wallDistances(p,20,16).west).toBeCloseTo(0);
    p.x=20;placeItem(p,20,16,'wall');expect(p.x).toBe(20);
  });
  it('aligns object edges and ignores hidden alignment targets',()=>{
    const other={...item(),instanceId:'other',rotation:0,x:30,y:50,width:4,height:4};
    const p={...item(),rotation:0,x:55.5,y:50,width:6,height:3};
    placeItem(p,20,16,'objects',.25,[other]);expect(p.x/100*20).toBe(11);
    p.x=55.5;placeItem(p,20,16,'objects',.25,[{...other,hidden:true}]);expect(p.x).toBeCloseTo(55.5);
  });
  it('converts metric display back to the same canonical feet',()=>{
    expect(toFeet(toDisplayLength(13.75,'m'),'m')).toBeCloseTo(13.75,10);
    expect(toDisplayLength(4,'m')).toBe(1.2192);
  });
  it('reports rotated wall clearances and whether a footprint fits',()=>{
    const p={...item(),x:50,y:50};
    expect(wallDistances(p,20,16)).toEqual({west:8.5,east:8.5,north:5,south:5});
    expect(fitsRoom(p,2,2)).toBe(false);
  });
  it('hit-tests rotated and hidden items using their actual footprint',()=>{
    const p={...item(),x:50,y:50};
    expect(containsPoint(p,10,10.5,20,16)).toBe(true);
    expect(containsPoint(p,12.5,8,20,16)).toBe(false);
    expect(containsPoint({...p,hidden:true},10,8,20,16)).toBe(false);
  });
});
