import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ChatMessage {
  id?: string;
  propertyId: string;
  senderId?: string;
  senderName: string;
  senderEmail?: string;
  receiverId?: string;
  receiverName?: string;
  content: string;
  timestamp?: string;
  isOwner?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/messages`;
  private localKeyPrefix = 'omnispace_chat_';

  getMessages(propertyId: string): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.apiUrl}/${propertyId}`).pipe(
      catchError(err => {
        console.warn('Backend messages API unreachable, reading local storage:', err);
        const stored = localStorage.getItem(this.localKeyPrefix + propertyId);
        return of(stored ? JSON.parse(stored) : []);
      })
    );
  }

  sendMessage(msg: ChatMessage): Observable<ChatMessage> {
    return this.http.post<ChatMessage>(this.apiUrl, msg).pipe(
      catchError(err => {
        console.warn('Backend message send failed, saving locally:', err);
        const fallbackMsg: ChatMessage = {
          ...msg,
          id: 'msg-' + Date.now(),
          timestamp: new Date().toISOString()
        };
        const stored = localStorage.getItem(this.localKeyPrefix + msg.propertyId);
        const list: ChatMessage[] = stored ? JSON.parse(stored) : [];
        list.push(fallbackMsg);
        localStorage.setItem(this.localKeyPrefix + msg.propertyId, JSON.stringify(list));
        return of(fallbackMsg);
      })
    );
  }
}
