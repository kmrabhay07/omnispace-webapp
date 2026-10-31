import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ChatService } from './chat.service';
import { environment } from '../../../environments/environment';
describe('Private conversations',()=>{
  let api:ChatService;let http:HttpTestingController;
  beforeEach(()=>{TestBed.configureTestingModule({providers:[provideHttpClient(),provideHttpClientTesting()]});api=TestBed.inject(ChatService);http=TestBed.inject(HttpTestingController);});
  afterEach(()=>http.verify());
  it('sends only content, without client-controlled participant identity',()=>{
    api.sendMessage('conversation-1','Hello').subscribe();
    const request=http.expectOne(environment.apiUrl+'/conversations/conversation-1/messages');
    expect(request.request.body).toEqual({content:'Hello'});request.flush({id:'message-1'});
  });
  it('does not disguise failed delivery as success',()=>{
    let success=false;let failure=false;
    api.sendMessage('conversation-1','Hello').subscribe({next:()=>success=true,error:()=>failure=true});
    http.expectOne(environment.apiUrl+'/conversations/conversation-1/messages').flush({},{status:503,statusText:'Unavailable'});
    expect(success).toBe(false);expect(failure).toBe(true);
  });
});
