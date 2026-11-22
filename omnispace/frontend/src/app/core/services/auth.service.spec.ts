import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
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
  it('does not create a session when registration is accepted', () => {
    auth.register({name:'User',email:'user@example.com',password:'password'}).subscribe();
    http.expectOne(environment.apiUrl+'/auth/register').flush(null,{status:202,statusText:'Accepted'});
    expect(auth.currentUser()).toBeNull();expect(auth.isLoggedIn()).toBe(false);
  });
  it('rejects tokenless legacy sessions', () => {
    localStorage.setItem('omni_user',JSON.stringify({id:'local-user',name:'Legacy'}));
    const other=TestBed.runInInjectionContext(()=>new AuthService());
    expect(other.isLoggedIn()).toBe(false);
  });
  it('does not attach bearer tokens to a login request',()=>{
    auth.login({email:'user@example.com',password:'password'}).subscribe();
    http.expectOne(environment.apiUrl+'/auth/login').flush({id:'user',name:'User',email:'user@example.com',role:'USER',token:token()});
    const client=TestBed.inject(HttpClient);
    client.post(environment.apiUrl+'/auth/login',{email:'user@example.com',password:'wrong'}).subscribe({error:()=>{}});
    const request=http.expectOne(environment.apiUrl+'/auth/login');expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({},{status:401,statusText:'Unauthorized'});
  });
  it('does not clear a new login when an older authenticated request returns 401',()=>{
    auth.login({email:'user@example.com',password:'password'}).subscribe();
    http.expectOne(environment.apiUrl+'/auth/login').flush({id:'user',name:'User',email:'user@example.com',role:'USER',token:token()});
    TestBed.inject(HttpClient).get(environment.apiUrl+'/designs').subscribe({error:()=>{}});
    const oldRequest=http.expectOne(environment.apiUrl+'/designs');
    auth.login({email:'user@example.com',password:'password'}).subscribe();
    const freshToken=token()+ '-new-session';
    http.expectOne(environment.apiUrl+'/auth/login').flush({id:'user',name:'User',email:'user@example.com',role:'USER',token:freshToken});
    oldRequest.flush({},{status:401,statusText:'Unauthorized'});
    expect(auth.currentUser()?.token).toBe(freshToken);expect(auth.isLoggedIn()).toBe(true);
  });
  it('clears the current rejected session on a protected request',()=>{
    auth.login({email:'user@example.com',password:'password'}).subscribe();
    const jwt=token();http.expectOne(environment.apiUrl+'/auth/login').flush({id:'user',name:'User',email:'user@example.com',role:'USER',token:jwt});
    TestBed.inject(HttpClient).get(environment.apiUrl+'/designs').subscribe({error:()=>{}});
    const request=http.expectOne(environment.apiUrl+'/designs');expect(request.request.headers.get('Authorization')).toBe('Bearer '+jwt);
    request.flush({},{status:401,statusText:'Unauthorized'});
    expect(auth.isLoggedIn()).toBe(false);
  });
});
