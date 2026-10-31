import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { ChatService, Conversation, ChatMessage } from '../../core/services/chat.service';

@Component({
  selector: 'app-chats', standalone: true, imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="workspace-page">
      <header class="page-heading"><div><p class="eyebrow">YOUR CONVERSATIONS</p><h1>Messages</h1><p>Talk directly with property owners and interested buyers.</p></div><a routerLink="/properties" class="btn btn-outline">Browse properties</a></header>
      <p *ngIf="error()" role="alert" class="form-error">{{ error() }} <button (click)="reload()">Retry</button></p>
      <div class="messaging-layout">
        <nav class="conversation-list" aria-label="Conversations">
          <p *ngIf="loading()">Loading conversations…</p>
          <p *ngIf="!loading() && !conversations().length">No conversations yet. Open a listing to contact its owner.</p>
          <button *ngFor="let c of conversations()" [class.selected]="selected()?.id === c.id" (click)="select(c)">
            <strong>{{ c.propertyTitle }}</strong><span>{{ otherName(c) }}</span><small>{{ c.updatedAt | date:'mediumDate' }}</small>
          </button>
        </nav>
        <section class="message-thread" *ngIf="selected() as c; else choose">
          <header><div><h2>{{ otherName(c) }}</h2><a [routerLink]="['/properties', c.propertyId]">{{ c.propertyTitle }}</a></div></header>
          <div class="messages" aria-live="polite">
            <button *ngIf="hasOlder()" (click)="loadOlder()" [disabled]="loadingOlder()">Load older messages</button>
            <p *ngIf="!messages().length">Start the conversation. Replies appear when the other person sends them.</p>
            <article *ngFor="let m of messages(); trackBy: trackMessage" [class.mine]="m.senderId === auth.currentUser()?.id">
              <strong>{{ m.senderName }}</strong><p>{{ m.content }}</p><time>{{ m.timestamp | date:'short' }}</time>
            </article>
          </div>
          <form (ngSubmit)="send()"><label class="sr-only" for="message">Message</label><textarea id="message" name="message" [(ngModel)]="text" maxlength="4000" required placeholder="Write a message…" [disabled]="sending()"></textarea><button class="btn btn-primary" [disabled]="sending() || !text.trim()">{{ sending() ? 'Sending…' : 'Send' }}</button></form>
        </section>
        <ng-template #choose><div class="empty-state">Choose a conversation to read and reply.</div></ng-template>
      </div>
    </section>`,
  styles: [`
    .messaging-layout { display:grid;grid-template-columns:280px 1fr;min-height:560px;border:1px solid #dbe3ec;border-radius:18px;overflow:hidden;background:white; }
    .conversation-list { border-right:1px solid #dbe3ec;padding:16px; } .conversation-list button { display:grid;gap:7px;width:100%;text-align:left;padding:18px;border-radius:12px;background:white;border:0;cursor:pointer;margin-bottom:8px; }
    .conversation-list button.selected { background:#e8f6f3; } .conversation-list span,.conversation-list small { color:#64748b; }
    .message-thread { display:flex;flex-direction:column;min-width:0; } .message-thread header { padding:20px;border-bottom:1px solid #e2e8f0; } h2 { font-size:1.15rem; }
    .messages { flex:1;max-height:520px;overflow:auto;padding:24px;display:flex;flex-direction:column;gap:14px; } article { align-self:flex-start;background:#f1f5f9;padding:14px 18px;border-radius:14px;max-width:85%;overflow-wrap:anywhere; } article.mine { align-self:flex-end;background:#e0f4ee; } article p { white-space:pre-wrap;margin:7px 0; } time { font-size:.72rem;color:#64748b; }
    form { display:flex;gap:12px;padding:18px;border-top:1px solid #e2e8f0; } textarea { flex:1;min-width:0;resize:vertical; }
    @media(max-width:700px) { .messaging-layout { grid-template-columns:1fr; } .conversation-list { display:flex;overflow-x:auto;border-right:0;border-bottom:1px solid #dbe3ec; } .conversation-list button { min-width:200px; } }
  `]
})
export class ChatsComponent implements OnInit {
  auth = inject(AuthService); private api = inject(ChatService); private route = inject(ActivatedRoute); private destroy = inject(DestroyRef);
  conversations = signal<Conversation[]>([]); selected = signal<Conversation | null>(null); messages = signal<ChatMessage[]>([]);
  loading = signal(true); error = signal(''); sending = signal(false); hasOlder = signal(false); loadingOlder = signal(false);
  text = ''; private page = 0;
  ngOnInit() {
    const propertyId = this.route.snapshot.queryParamMap.get('propertyId');
    if (propertyId) this.api.startConversation(propertyId).pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: c => { this.select(c); this.reload(); }, error: err => { this.error.set(err.error?.message || 'Could not start this conversation.'); this.loading.set(false); }
    });
    else this.reload();
    interval(5000).pipe(takeUntilDestroyed(this.destroy)).subscribe(() => {
      if (this.selected() && !this.sending()) this.refresh();
    });
  }
  otherName(c: Conversation) { return this.auth.currentUser()?.id === c.ownerId ? c.buyerName : c.ownerName; }
  trackMessage(_: number, message: ChatMessage) { return message.id; }
  reload() {
    this.loading.set(true); this.error.set('');
    this.api.getConversations().pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: list => { this.conversations.set(list); this.loading.set(false); if (!this.selected() && list.length) this.select(list[0]); else this.refresh(); },
      error: err => { this.loading.set(false); this.error.set(err.error?.message || 'Messages could not be loaded.'); }
    });
  }
  select(c: Conversation) { this.selected.set(c); this.messages.set([]); this.text = ''; this.page = 0; this.hasOlder.set(false); this.refresh(); }
  private merge(list: ChatMessage[]) {
    const byId = new Map([...this.messages(), ...list].map(m => [m.id, m]));
    this.messages.set([...byId.values()].sort((a, b) => a.timestamp.localeCompare(b.timestamp) || a.id.localeCompare(b.id)));
  }
  refresh() {
    const id = this.selected()?.id; if (!id) return;
    this.api.getMessages(id).pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: list => { if (this.selected()?.id !== id) return; this.merge(list); if (this.page === 0) this.hasOlder.set(list.length === 50); this.error.set(''); },
      error: () => this.error.set('Could not refresh messages. Your unsent text is kept here.')
    });
  }
  loadOlder() {
    const id = this.selected()?.id; if (!id || this.loadingOlder()) return;
    this.loadingOlder.set(true);
    this.api.getMessages(id, this.page + 1).pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: list => { this.loadingOlder.set(false); if (this.selected()?.id !== id) return; this.page++; this.merge(list); this.hasOlder.set(list.length === 50); },
      error: () => { this.loadingOlder.set(false); this.error.set('Could not load older messages.'); }
    });
  }
  send() {
    const id = this.selected()?.id; const text = this.text.trim(); if (!id || !text || this.sending()) return;
    this.sending.set(true); this.error.set('');
    this.api.sendMessage(id, text).pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: message => { this.sending.set(false); if (this.selected()?.id === id) { this.merge([message]); this.text = ''; } },
      error: err => { this.sending.set(false); this.error.set(err.error?.message || 'Message was not sent. Please retry.'); }
    });
  }
}
