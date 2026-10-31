import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
export interface Conversation {
  id: string; propertyId: string; propertyTitle: string;
  buyerId: string; buyerName: string; ownerId: string; ownerName: string; updatedAt: string;
}
export interface ChatMessage {
  id: string; conversationId: string; propertyId: string;
  senderId: string; senderName: string; receiverId: string; content: string; timestamp: string;
}
@Injectable({ providedIn: 'root' })
export class ChatService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/conversations`;
  getConversations() { return this.http.get<Conversation[]>(this.url); }
  startConversation(propertyId: string) { return this.http.post<Conversation>(this.url, { propertyId }); }
  getMessages(id: string, page = 0) { return this.http.get<ChatMessage[]>(`${this.url}/${encodeURIComponent(id)}/messages`, { params: { page } }); }
  sendMessage(id: string, content: string) { return this.http.post<ChatMessage>(`${this.url}/${encodeURIComponent(id)}/messages`, { content }); }
}
