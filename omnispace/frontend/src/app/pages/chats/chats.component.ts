import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMessage } from '../../core/services/chat.service';
import { PropertyService } from '../../core/services/property.service';
import { AuthService } from '../../core/services/auth.service';
import { Property } from '../../core/models/property.model';

interface ConversationGroup {
  propertyId: string;
  propertyTitle: string;
  propertyImage: string;
  propertyPrice: number;
  propertyCurrencySymbol: string;
  propertyLocation: string;
  ownerName: string;
  ownerContact?: string;
  lastMessage: string;
  lastTimestamp: string;
  messages: ChatMessage[];
}

@Component({
  selector: 'app-chats',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="inbox-page animate-fade-in">
      <div class="container inbox-container">
        <!-- Page Header -->
        <div class="inbox-header-row">
          <div class="header-text">
            <h1><i class="fa-solid fa-comments"></i> My Messages & Inquiries</h1>
            <p>Direct live conversations with property hosts, verified owners & inquiries</p>
          </div>
          <a routerLink="/properties" class="btn btn-outline btn-sm">
            <i class="fa-solid fa-building"></i> Browse Properties
          </a>
        </div>

        <div class="inbox-card" *ngIf="conversations.length > 0; else noChatsTemplate">
          <!-- Sidebar: Conversations List -->
          <div class="conversations-sidebar">
            <div class="sidebar-search">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input type="text" [(ngModel)]="searchFilter" placeholder="Search conversations...">
            </div>

            <div class="conversations-list">
              <div
                *ngFor="let convo of filteredConversations"
                class="conversation-item"
                [class.active]="selectedConvo?.propertyId === convo.propertyId"
                (click)="selectConversation(convo)"
              >
                <img [src]="convo.propertyImage" [alt]="convo.propertyTitle" class="convo-thumb">
                <div class="convo-info">
                  <div class="convo-top-row">
                    <span class="convo-title">{{ convo.propertyTitle }}</span>
                    <span class="convo-time">{{ convo.lastTimestamp }}</span>
                  </div>
                  <div class="convo-host"><i class="fa-solid fa-user-check"></i> {{ convo.ownerName }}</div>
                  <div class="convo-preview">{{ convo.lastMessage }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Main Chat Panel -->
          <div class="chat-main-panel" *ngIf="selectedConvo; else pickConvoTemplate">
            <!-- Chat Active Header -->
            <div class="chat-active-header">
              <div class="header-property-summary">
                <img [src]="selectedConvo.propertyImage" [alt]="selectedConvo.propertyTitle" class="header-thumb">
                <div class="header-text-group">
                  <div class="property-title-text">{{ selectedConvo.propertyTitle }}</div>
                  <div class="property-sub-text">
                    <span class="price-highlight">{{ selectedConvo.propertyCurrencySymbol }}{{ selectedConvo.propertyPrice | number }}</span>
                    <span>• {{ selectedConvo.propertyLocation }}</span>
                    <span class="owner-pill"><i class="fa-solid fa-shield-halved"></i> {{ selectedConvo.ownerName }}</span>
                  </div>
                </div>
              </div>

              <div class="header-actions">
                <a [routerLink]="['/properties', selectedConvo.propertyId]" class="btn btn-outline btn-sm" title="View property listing">
                  <i class="fa-solid fa-arrow-up-right-from-square"></i> Details
                </a>
                <a [routerLink]="['/designer']" [queryParams]="{propertyId: selectedConvo.propertyId}" class="btn btn-teal btn-sm" title="Open in 3D Studio">
                  <i class="fa-solid fa-palette"></i> 3D Studio
                </a>
              </div>
            </div>

            <!-- Quick Inquiry Chips -->
            <div class="quick-chips-bar">
              <button type="button" class="quick-chip" (click)="sendQuickReply('Is this property still available for viewing?')">
                Available for viewing?
              </button>
              <button type="button" class="quick-chip" (click)="sendQuickReply('Can I schedule a visit this weekend?')">
                Visit this weekend?
              </button>
              <button type="button" class="quick-chip" (click)="sendQuickReply('What are the maintenance & parking charges?')">
                Parking & maintenance?
              </button>
            </div>

            <!-- Messages Thread -->
            <div class="messages-thread-body" #threadContainer>
              <div class="date-divider"><span>Live Chat History</span></div>

              <div
                *ngFor="let msg of selectedConvo.messages"
                class="chat-bubble-row"
                [class.is-buyer]="!msg.isOwner"
                [class.is-owner]="msg.isOwner"
              >
                <div class="message-bubble">
                  <div class="sender-tag" *ngIf="msg.isOwner">{{ selectedConvo.ownerName || 'Verified Host' }}</div>
                  <div class="message-content">{{ msg.content }}</div>
                  <div class="message-time">{{ formatTime(msg.timestamp) }}</div>
                </div>
              </div>

              <div class="typing-bubble" *ngIf="isTyping">
                <span class="dot"></span><span class="dot"></span><span class="dot"></span>
                <span class="typing-text">{{ selectedConvo.ownerName }} is typing...</span>
              </div>
            </div>

            <!-- Message Input Bar -->
            <div class="chat-input-bar">
              <form (ngSubmit)="sendReply()" class="chat-form">
                <input
                  type="text"
                  [(ngModel)]="replyText"
                  name="replyInput"
                  placeholder="Type a message to {{ selectedConvo.ownerName }}..."
                  autocomplete="off"
                  #replyInputField
                >
                <button type="submit" [disabled]="!replyText.trim()" class="send-btn">
                  <i class="fa-solid fa-paper-plane"></i>
                </button>
              </form>
            </div>
          </div>

          <ng-template #pickConvoTemplate>
            <div class="empty-selection">
              <i class="fa-solid fa-comments"></i>
              <h3>Select a conversation</h3>
              <p>Choose an inquiry from the sidebar to view message history and reply.</p>
            </div>
          </ng-template>
        </div>

        <ng-template #noChatsTemplate>
          <div class="empty-inbox-card">
            <div class="empty-icon"><i class="fa-solid fa-message"></i></div>
            <h2>No messages yet</h2>
            <p>You haven't started any property inquiries yet. Browse our curated listings and click "Contact Owner" to chat in real-time!</p>
            <a routerLink="/properties" class="btn btn-primary mt-3">
              <i class="fa-solid fa-compass"></i> Explore Listings
            </a>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .inbox-page {
      padding: 36px 0 60px;
      min-height: calc(100vh - 72px);
      background: #f8fafc;
    }

    .inbox-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;

      h1 {
        font-size: 1.8rem;
        margin-bottom: 4px;
        color: #1e293b;
        display: flex;
        align-items: center;
        gap: 10px;

        i { color: var(--primary); font-size: 1.6rem; }
      }

      p {
        color: #64748b;
        font-size: 0.92rem;
        margin: 0;
      }
    }

    .inbox-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: var(--radius-lg);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
      display: grid;
      grid-template-columns: 340px 1fr;
      height: 680px;
      overflow: hidden;

      @media (max-width: 900px) {
        grid-template-columns: 1fr;
        height: auto;
      }
    }

    /* Sidebar */
    .conversations-sidebar {
      border-right: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      background: #ffffff;

      .sidebar-search {
        padding: 14px;
        border-bottom: 1px solid #e2e8f0;
        position: relative;

        i {
          position: absolute;
          left: 26px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          font-size: 0.85rem;
        }

        input {
          width: 100%;
          padding: 8px 12px 8px 34px;
          border-radius: 999px;
          border: 1px solid #cbd5e1;
          font-size: 0.85rem;
          outline: none;

          &:focus {
            border-color: var(--primary);
          }
        }
      }

      .conversations-list {
        flex: 1;
        overflow-y: auto;

        .conversation-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border-bottom: 1px solid #f1f5f9;
          cursor: pointer;
          transition: background 0.15s ease;

          &:hover {
            background: #f8fafc;
          }

          &.active {
            background: #fff1f2;
            border-left: 4px solid var(--primary);
          }

          .convo-thumb {
            width: 48px;
            height: 48px;
            border-radius: 8px;
            object-fit: cover;
            flex-shrink: 0;
          }

          .convo-info {
            flex: 1;
            overflow: hidden;

            .convo-top-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 2px;

              .convo-title {
                font-weight: 700;
                font-size: 0.88rem;
                color: #1e293b;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 170px;
              }

              .convo-time {
                font-size: 0.7rem;
                color: #94a3b8;
              }
            }

            .convo-host {
              font-size: 0.75rem;
              color: var(--secondary);
              font-weight: 600;
              margin-bottom: 2px;
            }

            .convo-preview {
              font-size: 0.78rem;
              color: #64748b;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
          }
        }
      }
    }

    /* Main Chat Panel */
    .chat-main-panel {
      display: flex;
      flex-direction: column;
      background: #f8fafc;
      height: 100%;

      .chat-active-header {
        background: white;
        border-bottom: 1px solid #e2e8f0;
        padding: 12px 18px;
        display: flex;
        justify-content: space-between;
        align-items: center;

        .header-property-summary {
          display: flex;
          align-items: center;
          gap: 12px;

          .header-thumb {
            width: 44px;
            height: 44px;
            border-radius: 6px;
            object-fit: cover;
          }

          .property-title-text {
            font-weight: 700;
            font-size: 0.95rem;
            color: #1e293b;
          }

          .property-sub-text {
            font-size: 0.78rem;
            color: #64748b;
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 2px;

            .price-highlight {
              color: var(--primary);
              font-weight: 700;
            }

            .owner-pill {
              background: #f0fdf4;
              color: #166534;
              padding: 2px 6px;
              border-radius: 4px;
              font-weight: 600;
              font-size: 0.7rem;
            }
          }
        }

        .header-actions {
          display: flex;
          gap: 8px;
        }
      }

      .quick-chips-bar {
        background: #f1f5f9;
        border-bottom: 1px solid #e2e8f0;
        padding: 6px 14px;
        display: flex;
        gap: 6px;
        overflow-x: auto;
        scrollbar-width: none;

        &::-webkit-scrollbar { display: none; }

        .quick-chip {
          background: white;
          border: 1px solid #cbd5e1;
          border-radius: 999px;
          padding: 3px 10px;
          font-size: 0.72rem;
          color: #334155;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease;

          &:hover {
            background: var(--primary);
            color: white;
            border-color: var(--primary);
          }
        }
      }

      .messages-thread-body {
        flex: 1;
        padding: 16px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 12px;

        .date-divider {
          text-align: center;
          margin: 4px 0;
          span {
            background: #e2e8f0;
            color: #64748b;
            font-size: 0.7rem;
            font-weight: 700;
            padding: 2px 10px;
            border-radius: 999px;
            text-transform: uppercase;
          }
        }

        .chat-bubble-row {
          display: flex;

          &.is-buyer {
            justify-content: flex-end;
            .message-bubble {
              background: linear-gradient(135deg, var(--primary), #e07a5f);
              color: white;
              border-radius: 14px 14px 2px 14px;
              .message-time { color: rgba(255, 255, 255, 0.8); }
            }
          }

          &.is-owner {
            justify-content: flex-start;
            .message-bubble {
              background: white;
              border: 1px solid #e2e8f0;
              color: #1e293b;
              border-radius: 14px 14px 14px 2px;
              box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);

              .sender-tag {
                font-size: 0.7rem;
                font-weight: 800;
                color: var(--secondary);
                margin-bottom: 2px;
              }

              .message-time { color: #94a3b8; }
            }
          }

          .message-bubble {
            max-width: 75%;
            padding: 10px 14px;
            font-size: 0.88rem;
            line-height: 1.4;

            .message-time {
              font-size: 0.65rem;
              text-align: right;
              margin-top: 4px;
            }
          }
        }

        .typing-bubble {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: white;
          border: 1px solid #e2e8f0;
          padding: 8px 12px;
          border-radius: 12px;
          width: fit-content;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);

          .dot {
            width: 6px;
            height: 6px;
            background: #94a3b8;
            border-radius: 50%;
            animation: pulse 1.4s infinite ease-in-out;
            &:nth-child(2) { animation-delay: 0.2s; }
            &:nth-child(3) { animation-delay: 0.4s; }
          }

          .typing-text {
            font-size: 0.72rem;
            color: #64748b;
            margin-left: 6px;
          }
        }
      }

      .chat-input-bar {
        background: white;
        border-top: 1px solid #e2e8f0;
        padding: 12px 16px;

        .chat-form {
          display: flex;
          gap: 8px;

          input {
            flex: 1;
            padding: 10px 16px;
            border-radius: 999px;
            border: 1.5px solid #e2e8f0;
            font-size: 0.9rem;
            outline: none;

            &:focus {
              border-color: var(--primary);
            }
          }

          .send-btn {
            width: 42px;
            height: 42px;
            border-radius: 50%;
            background: var(--primary);
            color: white;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1rem;
            transition: all 0.2s ease;

            &:hover:not(:disabled) {
              transform: scale(1.06);
              background: #e0484d;
            }

            &:disabled {
              opacity: 0.4;
              cursor: not-allowed;
            }
          }
        }
      }
    }

    .empty-selection, .empty-inbox-card {
      text-align: center;
      padding: 60px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      i { font-size: 3rem; color: #cbd5e1; margin-bottom: 16px; }
      h3, h2 { color: #1e293b; margin-bottom: 8px; }
      p { color: #64748b; max-width: 420px; }
    }

    @keyframes pulse {
      0%, 100% { transform: scale(0.6); opacity: 0.4; }
      50% { transform: scale(1); opacity: 1; }
    }
  `]
})
export class ChatsComponent implements OnInit, OnDestroy {
  chatService = inject(ChatService);
  propertyService = inject(PropertyService);
  authService = inject(AuthService);
  cdr = inject(ChangeDetectorRef);

  @ViewChild('threadContainer') private threadContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('replyInputField') private replyInputField!: ElementRef<HTMLInputElement>;

  conversations: ConversationGroup[] = [];
  selectedConvo: ConversationGroup | null = null;
  searchFilter = '';
  replyText = '';
  isTyping = false;
  private pollTimer: any;

  get filteredConversations(): ConversationGroup[] {
    if (!this.searchFilter.trim()) return this.conversations;
    const kw = this.searchFilter.toLowerCase();
    return this.conversations.filter(c =>
      c.propertyTitle.toLowerCase().includes(kw) ||
      c.ownerName.toLowerCase().includes(kw) ||
      c.lastMessage.toLowerCase().includes(kw)
    );
  }

  ngOnInit() {
    this.loadAllConversations();

    this.pollTimer = setInterval(() => {
      this.refreshActiveMessages();
    }, 5000);
  }

  ngOnDestroy() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
    }
  }

  loadAllConversations() {
    this.propertyService.getProperties().subscribe(properties => {
      const propMap = new Map<string, Property>();
      properties.forEach(p => propMap.set(p.id, p));

      const currentUser = this.authService.currentUser();
      const userId = currentUser?.id;

      this.chatService.getAllUserMessages(userId).subscribe(allMessages => {
        const groups = new Map<string, ChatMessage[]>();

        allMessages.forEach(msg => {
          if (!groups.has(msg.propertyId)) {
            groups.set(msg.propertyId, []);
          }
          groups.get(msg.propertyId)!.push(msg);
        });

        // Also check if any properties have local chats
        properties.forEach(p => {
          if (!groups.has(p.id)) {
            const localKey = 'omnispace_chat_' + p.id;
            const stored = localStorage.getItem(localKey);
            if (stored) {
              try {
                const list: ChatMessage[] = JSON.parse(stored);
                if (list.length > 0) groups.set(p.id, list);
              } catch {}
            }
          }
        });

        this.conversations = Array.from(groups.entries()).map(([propId, msgs]) => {
          const prop = propMap.get(propId);
          const lastMsg = msgs[msgs.length - 1];

          return {
            propertyId: propId,
            propertyTitle: prop?.title || 'Property #' + propId,
            propertyImage: prop?.featuredImage || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
            propertyPrice: prop?.price || 0,
            propertyCurrencySymbol: prop?.currencySymbol || (prop?.currency === 'INR' ? '₹' : '$'),
            propertyLocation: prop?.location || 'Location',
            ownerName: prop?.ownerName || 'Verified Host',
            ownerContact: prop?.ownerContact,
            lastMessage: lastMsg?.content || 'No messages yet',
            lastTimestamp: lastMsg?.timestamp ? this.formatTime(lastMsg.timestamp) : 'Recent',
            messages: msgs
          };
        });

        if (this.conversations.length > 0 && !this.selectedConvo) {
          this.selectedConvo = this.conversations[0];
        }

        this.cdr.markForCheck();
      });
    });
  }

  selectConversation(convo: ConversationGroup) {
    this.selectedConvo = convo;
    setTimeout(() => this.scrollToBottom(), 100);
  }

  sendQuickReply(text: string) {
    this.replyText = text;
    this.sendReply();
  }

  sendReply() {
    if (!this.replyText.trim() || !this.selectedConvo) return;

    const currentUser = this.authService.currentUser();
    const buyerName = currentUser?.name || 'Buyer';
    const text = this.replyText.trim();
    this.replyText = '';

    const newMsg: ChatMessage = {
      propertyId: this.selectedConvo.propertyId,
      senderId: currentUser?.id || 'guest',
      senderName: buyerName,
      senderEmail: currentUser?.email || '',
      receiverId: 'owner',
      receiverName: this.selectedConvo.ownerName,
      content: text,
      isOwner: false,
      timestamp: new Date().toISOString()
    };

    this.selectedConvo.messages.push(newMsg);
    this.selectedConvo.lastMessage = text;
    this.selectedConvo.lastTimestamp = this.formatTime(newMsg.timestamp!);
    this.scrollToBottom();

    // Persist message to backend
    this.chatService.sendMessage(newMsg).subscribe();

    // Smart owner response with simulated delay
    this.isTyping = true;
    setTimeout(() => {
      this.isTyping = false;
      const ownerReply = this.generateOwnerReply(text, this.selectedConvo!);
      const replyMsg: ChatMessage = {
        propertyId: this.selectedConvo!.propertyId,
        senderId: 'owner',
        senderName: this.selectedConvo!.ownerName,
        content: ownerReply,
        isOwner: true,
        timestamp: new Date().toISOString()
      };

      this.selectedConvo!.messages.push(replyMsg);
      this.selectedConvo!.lastMessage = ownerReply;
      this.selectedConvo!.lastTimestamp = this.formatTime(replyMsg.timestamp!);
      this.scrollToBottom();

      this.chatService.sendMessage(replyMsg).subscribe();
      this.cdr.markForCheck();
    }, 1200);
  }

  private generateOwnerReply(text: string, convo: ConversationGroup): string {
    const lower = text.toLowerCase();
    if (lower.includes('available') || lower.includes('still')) {
      return `Yes! "${convo.propertyTitle}" is currently available. Would you like to schedule an in-person or virtual 3D tour?`;
    }
    if (lower.includes('visit') || lower.includes('weekend')) {
      return `Visits are open Saturday and Sunday 11am - 5pm. Please call or WhatsApp me at ${convo.ownerContact || 'my direct line'} to confirm your time.`;
    }
    if (lower.includes('price') || lower.includes('negotiable')) {
      return `The listed price is ${convo.propertyCurrencySymbol}${convo.propertyPrice.toLocaleString()}. Slight flexibility is available for immediate advance bookings.`;
    }
    return `Thank you for reaching out! I'd be happy to discuss further details about "${convo.propertyTitle}". Feel free to message or call anytime.`;
  }

  private refreshActiveMessages() {
    if (!this.selectedConvo) return;
    this.chatService.getMessages(this.selectedConvo.propertyId).subscribe(msgs => {
      if (msgs && msgs.length > this.selectedConvo!.messages.length) {
        this.selectedConvo!.messages = msgs;
        const last = msgs[msgs.length - 1];
        if (last) {
          this.selectedConvo!.lastMessage = last.content;
          this.selectedConvo!.lastTimestamp = this.formatTime(last.timestamp || '');
        }
        this.scrollToBottom();
        this.cdr.markForCheck();
      }
    });
  }

  formatTime(isoDate?: string): string {
    if (!isoDate) return 'Just now';
    try {
      const d = new Date(isoDate);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Just now';
    }
  }

  private scrollToBottom() {
    setTimeout(() => {
      if (this.threadContainer) {
        this.threadContainer.nativeElement.scrollTop = this.threadContainer.nativeElement.scrollHeight;
      }
    }, 50);
  }
}
