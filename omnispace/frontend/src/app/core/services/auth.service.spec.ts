import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { authInterceptor } from '../interceptors/auth.interceptor';
import { environment } from '../../../environments/environment';
describe('Authentication', () => {
  let http: HttpTestingController; let auth: AuthService;
  const token = () => 'header.' + btoa(JSON.stringify({exp:Math.floor(Date.now()/1000)+3600})) + '.signature';
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({providers:[provideHttpClient(withInterceptors([authInterceptor])),provideHttpClientTesting()]});
    http=TestBed.inject(HttpTestingController);auth=TestBed.inject(AuthService);
  });
  afterEach(() => {http.verify();localStorage.clear();});
  it('keeps invalid credentials signed out and propagates the failure', () => {
    let errorStatus=0;
    auth.login({email:'user@example.com',password:'wrong'}).subscribe({error:error=>errorStatus=error.status});
    http.expectOne(environment.apiUrl+'/auth/login').flush({message:'Invalid credentials'},{status:401,statusText:'Unauthorized'});
    expect(errorStatus).toBe(401);expect(auth.isLoggedIn()).toBe(false);expect(localStorage.getItem('omni_user')).toBeNull();
  });
  it('does not create a local session after registration fails', () => {
    auth.register({name:'User',email:'user@example.com',password:'password'}).subscribe({error:()=>{}});
    http.expectOne(environment.apiUrl+'/auth/register').flush({},{status:409,statusText:'Conflict'});
    expect(auth.isLoggedIn()).toBe(false);
  });
  it('uses server identity and JWT for registration', () => {
    auth.register({name:'User',email:'user@example.com',password:'password'}).subscribe();
    http.expectOne(environment.apiUrl+'/auth/register').flush({id:'database-id',name:'User',email:'user@example.com',role:'USER',token:token()});
    expect(auth.currentUser()?.id).toBe('database-id');expect(auth.isLoggedIn()).toBe(true);
  });
  it('rejects tokenless legacy sessions', () => {
    localStorage.setItem('omni_user',JSON.stringify({id:'local-user',name:'Legacy'}));
    const other=TestBed.runInInjectionContext(()=>new AuthService());
    expect(other.isLoggedIn()).toBe(false);
  });
});
