import { EditorHistory } from './history';
describe('Editor history',()=>{
  it('discards the abandoned branch after undo and a new edit',()=>{
    const history=new EditorHistory<string>();history.reset('A');history.push('B');expect(history.undo()).toBe('A');
    history.push('C');expect(history.undo()).toBe('A');expect(history.redo()).toBe('C');expect(history.canRedo).toBe(false);
  });
  it('restores the whole room and isolates snapshots from later mutation',()=>{
    const history=new EditorHistory<{width:number;color:string;photo:string;items:{x:number}[]}>();
    const initial={width:20,color:'#ffffff',photo:'room-photo',items:[{x:10}]};history.reset(initial);
    initial.items[0].x=99;history.push({...initial,width:24,color:'#000000',photo:'new-photo'});
    expect(history.undo()).toEqual({width:20,color:'#ffffff',photo:'room-photo',items:[{x:10}]});
  });
  it('limits the retained history',()=>{
    const history=new EditorHistory<number>(3);history.reset(0);[1,2,3,4].forEach(n=>history.push(n));
    expect(history.undo()).toBe(3);expect(history.undo()).toBe(2);expect(history.undo()).toBeUndefined();
  });
});
