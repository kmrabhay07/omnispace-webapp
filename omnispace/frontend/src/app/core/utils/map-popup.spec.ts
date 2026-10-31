import { propertyPopup } from './map-popup';
describe('Map popup safety',()=>{
  it('treats hostile listing text as text instead of executable HTML',()=>{
    const title='<img src=x onerror=alert(1)>';const location='<script>alert(2)</script>';
    const popup=propertyPopup(title,location);
    expect(popup.querySelector('img')).toBeNull();expect(popup.querySelector('script')).toBeNull();
    expect(popup.textContent).toContain(title);expect(popup.textContent).toContain(location);
  });
});
