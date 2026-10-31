import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { App } from './app';
describe('OmniSpace application shell',()=>{
  it('renders navigation to the real account workspaces',async()=>{
    TestBed.configureTestingModule({imports:[App],providers:[provideRouter([]),provideHttpClient()]});
    const fixture=TestBed.createComponent(App);fixture.detectChanges();await fixture.whenStable();
    const element:HTMLElement=fixture.nativeElement;
    expect(element.textContent).toContain('OmniSpace');
    expect(element.querySelector('a[href="/designs"]')).not.toBeNull();
    expect(element.querySelector('a[href="/my-properties"]')).not.toBeNull();
  });
});
