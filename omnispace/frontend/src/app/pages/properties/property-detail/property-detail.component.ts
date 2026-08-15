import { Component, inject, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PropertyService } from '../../../core/services/property.service';
import { AuthService } from '../../../core/services/auth.service';
import { ChatService, ChatMessage as ApiChatMessage } from '../../../core/services/chat.service';
import { Property } from '../../../core/models/property.model';

declare var L: any;

interface ChatMessage {
  id: string;
  sender: 'BUYER' | 'OWNER';
  senderName: string;
  text: string;
  timestamp: string;
}

@Component({
  selector: 'app-property-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="property-detail-page animate-fade-in" *ngIf="property; else loading">
      <!-- HERO GALLERY HEADER -->
      <section class="gallery-section">
        <div class="container">
          <div class="breadcrumb">
            <a routerLink="/properties">Properties</a> / <span>{{ property.title }}</span>
          </div>

          <div class="gallery-grid">
            <div class="main-image">
              <img [src]="activeImage || property.featuredImage" [alt]="property.title">
            </div>
            <div class="thumbnail-col" *ngIf="property.images && property.images.length > 1">
              <div
                *ngFor="let img of property.images"
                class="thumb-item"
                [class.active]="activeImage === img"
                (click)="activeImage = img"
              >
                <img [src]="img" alt="Thumbnail">
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="content-section">
        <div class="container detail-layout">
          <main class="main-detail">
            <!-- Title & Price Header -->
            <div class="header-info">
              <div class="badges-row">
                <span class="badge" [ngClass]="property.propertyType === 'RESIDENTIAL' ? 'badge-residential' : 'badge-commercial'">
                  {{ property.category }}
                </span>
                <span class="furnish-badge">{{ property.furnishingStatus }}</span>
              </div>
              <h1 class="title">{{ property.title }}</h1>
              <p class="location"><i class="fa-solid fa-location-dot"></i> {{ property.location }} • {{ property.address }}</p>

              <div class="price-box">
                <span class="price-val">{{ property.currencySymbol || (property.currency === 'INR' ? '₹' : '$') }}{{ property.price | number }}</span>
                <span class="price-sub">Est. mortgage {{ property.currencySymbol || (property.currency === 'INR' ? '₹' : '$') }}{{ (property.price * 0.005) | number:'1.0-0' }}/mo</span>
              </div>
            </div>

            <!-- Quick Specs Row -->
            <div class="specs-grid">
              <div class="spec-card">
                <i class="fa-solid fa-bed"></i>
                <div class="val">{{ property.bedrooms }} Beds</div>
                <div class="lbl">Bedrooms</div>
              </div>
              <div class="spec-card">
                <i class="fa-solid fa-bath"></i>
                <div class="val">{{ property.bathrooms }} Baths</div>
                <div class="lbl">Bathrooms</div>
              </div>
              <div class="spec-card">
                <i class="fa-solid fa-ruler-combined"></i>
                <div class="val">{{ property.areaSqFt | number }} sq ft</div>
                <div class="lbl">Living Area</div>
              </div>
              <div class="spec-card">
                <i class="fa-solid fa-couch"></i>
                <div class="val">{{ property.furnishingStatus }}</div>
                <div class="lbl">Furnishing</div>
              </div>
            </div>

            <!-- Description -->
            <div class="section-block">
              <h2>About this Property</h2>
              <p class="description-text">{{ property.description }}</p>
            </div>

            <!-- Amenities -->
            <div class="section-block" *ngIf="property.amenities && property.amenities.length > 0">
              <h2>Key Features & Amenities</h2>
              <div class="amenities-grid">
                <div *ngFor="let am of property.amenities" class="amenity-pill">
                  <i class="fa-solid fa-check text-primary"></i> {{ am }}
                </div>
              </div>
            </div>

            <!-- 3D Interior Staging CTA Banner -->
            <div class="designer-cta-banner">
              <div class="cta-text">
                <h3><i class="fa-solid fa-wand-magic-sparkles"></i> Customize in 3D Design Studio</h3>
                <p>Rearrange real 3D furniture, change wall paints, and floor textures in our interactive studio.</p>
              </div>
              <a routerLink="/designer" class="btn btn-secondary">
                <i class="fa-solid fa-cube"></i> Open 3D Studio
              </a>
            </div>

            <!-- Interactive Map Section -->
            <div class="section-block">
              <h2>Location & Map</h2>
              <p class="map-location-title"><i class="fa-solid fa-map-location-dot"></i> {{ property.address ? (property.address + ', ' + property.location) : property.location }}</p>
              <div id="property-detail-map" class="map-container"></div>
            </div>
          </main>

          <!-- Contact Sidebar with OLX-Style Chat & Contact -->
          <aside class="sidebar-contact">
            <div class="contact-card">
              <div class="card-status-badge">
                <span class="pulse-dot"></span> Available for immediate inquiry
              </div>

              <h3>Interested in this property?</h3>
              <p>Chat directly with the verified owner or schedule a visit.</p>

              <!-- Owner Profile -->
              <div class="owner-profile">
                <div class="avatar"><i class="fa-solid fa-user-check"></i></div>
                <div class="owner-meta">
                  <div class="name">{{ property.ownerName || 'Verified Host' }}</div>
                  <div class="role"><i class="fa-solid fa-shield-halved text-success"></i> Verified Owner</div>
                  <div class="contact-info-sub">{{ property.ownerContact }}</div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="contact-buttons">
                <!-- OLX-STYLE LIVE CHAT BUTTON -->
                <button (click)="openChatModal()" class="btn btn-chat btn-full">
                  <i class="fa-solid fa-comments"></i> Chat with Owner
                  <span class="online-pill">Online</span>
                </button>

                <a *ngIf="getPhoneContact()" [href]="'tel:' + getPhoneContact()" class="btn btn-primary btn-full">
                  <i class="fa-solid fa-phone"></i> Call {{ property.ownerName || 'Host' }}
                </a>

                <a *ngIf="getPhoneContact()" [href]="'https://wa.me/' + getCleanPhoneNumber()" target="_blank" class="btn btn-whatsapp btn-full">
                  <i class="fa-brands fa-whatsapp"></i> WhatsApp Owner
                </a>

                <a *ngIf="getEmailContact()" [href]="'mailto:' + getEmailContact() + '?subject=' + encodeSubject()" class="btn btn-outline btn-full">
                  <i class="fa-solid fa-envelope"></i> Email {{ property.ownerName || 'Host' }}
                </a>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <!-- OLX-STYLE INTERACTIVE REAL-TIME CHAT MODAL -->
      <div class="chat-modal-overlay" *ngIf="isChatOpen" (click)="closeChatModal()">
        <div class="chat-drawer-container animate-slide-up" (click)="$event.stopPropagation()">
          <!-- Chat Header -->
          <div class="chat-header">
            <div class="chat-host-info">
              <div class="chat-avatar-wrapper">
                <div class="chat-avatar"><i class="fa-solid fa-user-tie"></i></div>
                <span class="status-indicator"></span>
              </div>
              <div class="chat-title-group">
                <div class="host-name">{{ property.ownerName || 'Property Owner' }} <i class="fa-solid fa-circle-check text-success"></i></div>
                <div class="host-status">Online • Typically replies in seconds</div>
              </div>
            </div>
            <button class="chat-close-btn" (click)="closeChatModal()" title="Close chat"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <!-- Property Snippet Card -->
          <div class="chat-property-preview">
            <img [src]="property.featuredImage" alt="Property thumbnail" class="preview-img">
            <div class="preview-details">
              <div class="preview-title">{{ property.title }}</div>
              <div class="preview-price">{{ property.currencySymbol || '₹' }}{{ property.price | number }} • {{ property.location }}</div>
            </div>
          </div>

          <!-- Quick OLX Prompt Chips -->
          <div class="quick-prompts-row">
            <button type="button" *ngFor="let q of quickQuestions" (click)="sendQuickPrompt(q)" class="prompt-chip">
              {{ q }}
            </button>
          </div>

          <!-- Messages Stream -->
          <div class="chat-messages-body" #messagesContainer>
            <div class="chat-timestamp-divider"><span>Today</span></div>

            <div *ngFor="let msg of chatMessages" class="chat-bubble-row" [class.is-buyer]="msg.sender === 'BUYER'" [class.is-owner]="msg.sender === 'OWNER'">
              <div class="message-bubble">
                <div class="sender-tag" *ngIf="msg.sender === 'OWNER'">{{ property.ownerName || 'Host' }}</div>
                <div class="message-content">{{ msg.text }}</div>
                <div class="message-time">
                  {{ msg.timestamp }}
                  <i *ngIf="msg.sender === 'BUYER'" class="fa-solid fa-check-double read-receipt"></i>
                </div>
              </div>
            </div>

            <!-- Typing Indicator -->
            <div class="typing-bubble" *ngIf="isOwnerTyping">
              <span class="dot"></span><span class="dot"></span><span class="dot"></span>
              <span class="typing-text">{{ property.ownerName || 'Host' }} is typing...</span>
            </div>
          </div>

          <!-- Chat Input Bar -->
          <div class="chat-input-footer">
            <form (ngSubmit)="sendMessage()" class="chat-input-form">
              <input
                type="text"
                [(ngModel)]="newMessageText"
                name="chatInput"
                placeholder="Type a message to {{ property.ownerName || 'the owner' }}..."
                autocomplete="off"
                #chatInputField
              >
              <button type="submit" [disabled]="!newMessageText.trim()" class="chat-send-btn" title="Send message">
                <i class="fa-solid fa-paper-plane"></i>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>

    <ng-template #loading>
      <div class="container text-center py-5">
        <p>Loading property details...</p>
      </div>
    </ng-template>
  `,
  styles: [`
    .gallery-section {
      padding: 30px 0;
      background: #F8FAFC;

      .breadcrumb {
        font-size: 0.9rem;
        color: var(--gray-muted);
        margin-bottom: 16px;
        a { color: var(--dark); font-weight: 600; }
      }

      .gallery-grid {
        display: grid;
        grid-template-columns: 1fr 180px;
        gap: 16px;
        height: 480px;

        @media (max-width: 768px) {
          grid-template-columns: 1fr;
          height: auto;
        }

        .main-image {
          border-radius: var(--radius-lg);
          overflow: hidden;
          background: #000;
          height: 100%;

          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            min-height: 300px;
          }
        }

        .thumbnail-col {
          display: flex;
          flex-direction: column;
          gap: 12px;
          overflow-y: auto;

          @media (max-width: 768px) {
            flex-direction: row;
            height: 90px;
          }

          .thumb-item {
            height: 110px;
            border-radius: var(--radius-sm);
            overflow: hidden;
            cursor: pointer;
            border: 2px solid transparent;
            opacity: 0.7;
            transition: all 0.2s ease;

            @media (max-width: 768px) {
              width: 120px;
              flex-shrink: 0;
              height: 100%;
            }

            img { width: 100%; height: 100%; object-fit: cover; }

            &:hover, &.active {
              opacity: 1;
              border-color: var(--primary);
            }
          }
        }
      }
    }

    .content-section {
      padding: 40px 0 80px;

      .detail-layout {
        display: grid;
        grid-template-columns: 1fr 360px;
        gap: 40px;

        @media (max-width: 992px) {
          grid-template-columns: 1fr;
        }
      }

      .main-detail {
        .header-info {
          margin-bottom: 30px;
          padding-bottom: 24px;
          border-bottom: 1px solid var(--gray-border);

          .badges-row {
            display: flex;
            gap: 8px;
            margin-bottom: 12px;

            .badge {
              padding: 4px 12px;
              border-radius: var(--radius-full);
              font-size: 0.8rem;
              font-weight: 700;
              text-transform: uppercase;
            }
            .badge-residential { background: rgba(0, 166, 153, 0.1); color: var(--secondary); }
            .badge-commercial { background: rgba(30, 41, 59, 0.1); color: var(--dark); }
            .furnish-badge {
              background: var(--gray-light);
              color: var(--gray-muted);
              padding: 4px 10px;
              border-radius: var(--radius-full);
              font-size: 0.8rem;
              font-weight: 600;
            }
          }

          .title { font-size: 2.2rem; font-weight: 800; margin-bottom: 8px; }
          .location { font-size: 1rem; color: var(--gray-muted); margin-bottom: 18px; i { color: var(--primary); } }

          .price-box {
            display: flex;
            align-items: baseline;
            gap: 12px;

            .price-val { font-size: 2.2rem; font-weight: 800; color: var(--primary); }
            .price-sub { font-size: 0.9rem; color: var(--gray-muted); }
          }
        }

        .specs-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 32px;

          @media (max-width: 576px) {
            grid-template-columns: repeat(2, 1fr);
          }

          .spec-card {
            background: var(--white);
            border: 1px solid var(--gray-border);
            border-radius: var(--radius-md);
            padding: 16px;
            text-align: center;

            i { font-size: 1.4rem; color: var(--primary); margin-bottom: 8px; }
            .val { font-weight: 700; font-size: 1.05rem; }
            .lbl { font-size: 0.8rem; color: var(--gray-muted); }
          }
        }

        .section-block {
          margin-bottom: 32px;
          h2 { font-size: 1.4rem; margin-bottom: 14px; }
          .description-text { font-size: 1.02rem; line-height: 1.7; color: var(--dark-soft); }

          .amenities-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 12px;

            .amenity-pill {
              background: var(--white);
              border: 1px solid var(--gray-border);
              padding: 10px 14px;
              border-radius: var(--radius-sm);
              font-size: 0.9rem;
              font-weight: 600;
              display: flex;
              align-items: center;
              gap: 8px;
            }
          }

          .map-location-title {
            color: var(--gray-muted);
            font-size: 0.95rem;
            margin-bottom: 12px;
            i { color: var(--primary); }
          }

          .map-container {
            width: 100%;
            height: 320px;
            border-radius: var(--radius-md);
            border: 1px solid var(--gray-border);
            overflow: hidden;
            z-index: 1;
          }
        }

        .designer-cta-banner {
          background: linear-gradient(135deg, var(--dark), #1A1E29);
          border-radius: var(--radius-lg);
          padding: 28px;
          color: white;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 32px;
          box-shadow: var(--shadow-md);

          @media (max-width: 768px) {
            flex-direction: column;
            gap: 18px;
            text-align: center;
          }

          .cta-text {
            h3 { color: white; font-size: 1.3rem; margin-bottom: 6px; }
            p { color: #94A3B8; font-size: 0.9rem; margin: 0; }
          }

          .btn-secondary {
            white-space: nowrap;
            padding: 10px 20px;
          }
        }
      }

      /* Contact Sidebar */
      .sidebar-contact {
        .contact-card {
          background: var(--white);
          border: 1px solid var(--gray-border);
          border-radius: var(--radius-lg);
          padding: 24px;
          box-shadow: var(--shadow-md);
          position: sticky;
          top: 96px;

          .card-status-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 0.75rem;
            font-weight: 700;
            color: #16a34a;
            background: #dcfce7;
            padding: 4px 10px;
            border-radius: 999px;
            margin-bottom: 14px;

            .pulse-dot {
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background: #16a34a;
              box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.3);
            }
          }

          h3 { font-size: 1.25rem; margin-bottom: 6px; }
          p { font-size: 0.88rem; color: var(--gray-muted); margin-bottom: 18px; }

          .owner-profile {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            background: var(--gray-light);
            border-radius: var(--radius-md);
            margin-bottom: 20px;

            .avatar {
              width: 44px;
              height: 44px;
              border-radius: 50%;
              background: linear-gradient(135deg, var(--primary), var(--secondary));
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 1.2rem;
            }

            .owner-meta {
              flex: 1;
              overflow: hidden;
              .name { font-weight: 700; font-size: 0.95rem; }
              .role { font-size: 0.75rem; color: var(--gray-muted); font-weight: 600; }
              .contact-info-sub { font-size: 0.75rem; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            }
          }

          .contact-buttons {
            display: flex;
            flex-direction: column;
            gap: 10px;

            .btn-full { width: 100%; justify-content: center; }

            .btn-chat {
              background: linear-gradient(135deg, #ff5a5f, #e07a5f);
              color: white;
              border: none;
              padding: 12px 18px;
              border-radius: 8px;
              font-weight: 700;
              font-size: 0.95rem;
              display: flex;
              align-items: center;
              gap: 8px;
              cursor: pointer;
              box-shadow: 0 4px 12px rgba(255, 90, 95, 0.3);
              transition: all 0.2s ease;

              &:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(255, 90, 95, 0.4);
              }

              .online-pill {
                background: rgba(255, 255, 255, 0.25);
                font-size: 0.7rem;
                padding: 2px 6px;
                border-radius: 4px;
                margin-left: auto;
              }
            }

            .btn-whatsapp {
              background: #25d366;
              color: white;
              border: none;
              padding: 10px 16px;
              border-radius: 8px;
              font-weight: 700;
              font-size: 0.9rem;
              display: flex;
              align-items: center;
              gap: 8px;
              text-decoration: none;
              justify-content: center;

              &:hover { background: #20ba5a; }
            }
          }
        }
      }
    }

    /* OLX-STYLE INTERACTIVE CHAT DRAWER / MODAL */
    .chat-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(6px);
      z-index: 2000;
      display: flex;
      align-items: flex-end;
      justify-content: flex-end;
      padding: 20px;

      @media (max-width: 576px) {
        padding: 0;
      }
    }

    .chat-drawer-container {
      width: 400px;
      max-width: 100%;
      height: 580px;
      max-height: 90vh;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.3);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid var(--gray-border);

      @media (max-width: 576px) {
        width: 100%;
        height: 100vh;
        max-height: 100vh;
        border-radius: 0;
      }

      .chat-header {
        background: #0f172a;
        color: white;
        padding: 14px 18px;
        display: flex;
        align-items: center;
        justify-content: space-between;

        .chat-host-info {
          display: flex;
          align-items: center;
          gap: 12px;

          .chat-avatar-wrapper {
            position: relative;

            .chat-avatar {
              width: 38px;
              height: 38px;
              border-radius: 50%;
              background: linear-gradient(135deg, var(--primary), var(--secondary));
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 1rem;
              color: white;
            }

            .status-indicator {
              position: absolute;
              bottom: 0;
              right: 0;
              width: 10px;
              height: 10px;
              border-radius: 50%;
              background: #22c55e;
              border: 2px solid #0f172a;
            }
          }

          .chat-title-group {
            .host-name { font-weight: 700; font-size: 0.95rem; }
            .host-status { font-size: 0.72rem; color: #94a3b8; }
          }
        }

        .chat-close-btn {
          background: transparent;
          border: none;
          color: #94a3b8;
          font-size: 1.2rem;
          cursor: pointer;
          padding: 4px;

          &:hover { color: white; }
        }
      }

      .chat-property-preview {
        display: flex;
        align-items: center;
        gap: 10px;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
        padding: 8px 14px;

        .preview-img {
          width: 44px;
          height: 44px;
          border-radius: 6px;
          object-fit: cover;
        }

        .preview-details {
          flex: 1;
          overflow: hidden;

          .preview-title {
            font-size: 0.82rem;
            font-weight: 700;
            color: #1e293b;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .preview-price {
            font-size: 0.75rem;
            color: var(--primary);
            font-weight: 700;
          }
        }
      }

      .quick-prompts-row {
        display: flex;
        gap: 6px;
        padding: 8px 12px;
        overflow-x: auto;
        background: #f1f5f9;
        border-bottom: 1px solid #e2e8f0;
        scrollbar-width: none;

        &::-webkit-scrollbar { display: none; }

        .prompt-chip {
          white-space: nowrap;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #334155;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;

          &:hover {
            background: var(--primary);
            color: white;
            border-color: var(--primary);
          }
        }
      }

      .chat-messages-body {
        flex: 1;
        padding: 14px;
        overflow-y: auto;
        background: #f8fafc;
        display: flex;
        flex-direction: column;
        gap: 10px;

        .chat-timestamp-divider {
          text-align: center;
          margin: 6px 0;
          span {
            background: #e2e8f0;
            color: #64748b;
            font-size: 0.68rem;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 999px;
            text-transform: uppercase;
          }
        }

        .chat-bubble-row {
          display: flex;
          margin-bottom: 4px;

          &.is-buyer {
            justify-content: flex-end;

            .message-bubble {
              background: linear-gradient(135deg, var(--primary), #e07a5f);
              color: white;
              border-radius: 14px 14px 2px 14px;

              .message-time {
                color: rgba(255, 255, 255, 0.8);
              }
            }
          }

          &.is-owner {
            justify-content: flex-start;

            .message-bubble {
              background: #ffffff;
              border: 1px solid #e2e8f0;
              color: #1e293b;
              border-radius: 14px 14px 14px 2px;
              box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);

              .sender-tag {
                font-size: 0.68rem;
                font-weight: 800;
                color: var(--secondary);
                margin-bottom: 2px;
              }

              .message-time {
                color: #94a3b8;
              }
            }
          }

          .message-bubble {
            max-width: 80%;
            padding: 8px 12px;
            font-size: 0.85rem;
            line-height: 1.4;

            .message-time {
              font-size: 0.65rem;
              text-align: right;
              margin-top: 4px;
              display: flex;
              align-items: center;
              justify-content: flex-end;
              gap: 4px;

              .read-receipt { font-size: 0.65rem; color: #a7f3d0; }
            }
          }
        }

        .typing-bubble {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          padding: 6px 12px;
          border-radius: 999px;
          width: fit-content;

          .dot {
            width: 6px;
            height: 6px;
            background: var(--primary);
            border-radius: 50%;
            animation: blink 1.2s infinite ease-in-out;

            &:nth-child(2) { animation-delay: 0.2s; }
            &:nth-child(3) { animation-delay: 0.4s; }
          }

          .typing-text { font-size: 0.72rem; color: #64748b; margin-left: 4px; }
        }
      }

      .chat-input-footer {
        padding: 10px 14px;
        background: #ffffff;
        border-top: 1px solid #e2e8f0;

        .chat-input-form {
          display: flex;
          gap: 8px;

          input {
            flex: 1;
            padding: 10px 14px;
            border-radius: 999px;
            border: 1.5px solid #e2e8f0;
            font-size: 0.88rem;
            outline: none;
            transition: border-color 0.2s ease;

            &:focus {
              border-color: var(--primary);
            }
          }

          .chat-send-btn {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: var(--primary);
            color: white;
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.95rem;
            cursor: pointer;
            transition: all 0.2s ease;

            &:hover:not(:disabled) {
              transform: scale(1.05);
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

    @keyframes blink {
      0%, 80%, 100% { transform: scale(0); opacity: 0.4; }
      40% { transform: scale(1); opacity: 1; }
    }
  `]
})
export class PropertyDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('chatInputField') private chatInputField!: ElementRef<HTMLInputElement>;

  route = inject(ActivatedRoute);
  propertyService = inject(PropertyService);
  authService = inject(AuthService);
  chatService = inject(ChatService);

  property: Property | undefined;
  activeImage = '';
  private mapInstance: any;
  private chatPollTimer: any;

  // OLX CHAT SYSTEM
  isChatOpen = false;
  isOwnerTyping = false;
  newMessageText = '';

  quickQuestions = [
    'Is this property still available?',
    'Can I schedule a visit this weekend?',
    'Is the price negotiable?',
    'Are parking & maintenance included?'
  ];

  chatMessages: ChatMessage[] = [];

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.propertyService.getPropertyById(id).subscribe(prop => {
        this.property = prop;
        if (prop) {
          this.activeImage = prop.featuredImage;
          this.loadChatHistory(prop.id);
        }
      });
    }

    // Polling for live chat updates every 5 seconds
    this.chatPollTimer = setInterval(() => {
      if (this.isChatOpen && this.property) {
        this.refreshChat(this.property.id);
      }
    }, 5000);
  }

  ngOnDestroy() {
    if (this.chatPollTimer) {
      clearInterval(this.chatPollTimer);
    }
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.initMap();
    }, 400);
  }

  initMap() {
    const mapElement = document.getElementById('property-detail-map');
    if (!mapElement || typeof L === 'undefined' || this.mapInstance) return;

    let lat = this.property?.latitude || (this.property?.location?.toLowerCase().includes('bengaluru') ? 12.9716 : (this.property?.currency === 'INR' ? 12.9716 : 37.7749));
    let lng = this.property?.longitude || (this.property?.location?.toLowerCase().includes('bengaluru') ? 77.5946 : (this.property?.currency === 'INR' ? 77.5946 : -122.4194));

    this.mapInstance = L.map('property-detail-map').setView([lat, lng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(this.mapInstance);

    const marker = L.marker([lat, lng]).addTo(this.mapInstance);
    marker.bindPopup(`<strong>${this.property?.title || 'Property Location'}</strong><br>${this.property?.location || ''}`).openPopup();
  }

  // OLX CHAT SYSTEM METHODS (MongoDB-Backed Live Chat)
  openChatModal() {
    this.isChatOpen = true;
    if (this.property) {
      this.loadChatHistory(this.property.id);
    }
    setTimeout(() => {
      this.scrollToBottom();
      if (this.chatInputField) this.chatInputField.nativeElement.focus();
    }, 100);
  }

  closeChatModal() {
    this.isChatOpen = false;
  }

  sendQuickPrompt(question: string) {
    this.newMessageText = question;
    this.sendMessage();
  }

  sendMessage() {
    if (!this.newMessageText.trim() || !this.property) return;

    const currentUser = this.authService.currentUser();
    const buyerName = currentUser?.name || 'Buyer';
    const text = this.newMessageText.trim();
    this.newMessageText = '';

    const buyerMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      sender: 'BUYER',
      senderName: buyerName,
      text: text,
      timestamp: this.getCurrentTimeString()
    };

    this.chatMessages.push(buyerMsg);
    this.scrollToBottom();

    // Persist Buyer Message to MongoDB
    this.chatService.sendMessage({
      propertyId: this.property.id,
      senderId: currentUser?.id || 'guest',
      senderName: buyerName,
      senderEmail: currentUser?.email || '',
      receiverId: this.property.ownerId || 'owner',
      receiverName: this.property.ownerName || 'Verified Host',
      content: text,
      isOwner: false
    }).subscribe();

    // Trigger Smart Owner Reply with realistic delay
    this.isOwnerTyping = true;
    setTimeout(() => {
      this.isOwnerTyping = false;
      const ownerReply = this.generateSmartOwnerReply(text);
      const ownerMsg: ChatMessage = {
        id: 'msg-' + Date.now(),
        sender: 'OWNER',
        senderName: this.property?.ownerName || 'Verified Host',
        text: ownerReply,
        timestamp: this.getCurrentTimeString()
      };

      this.chatMessages.push(ownerMsg);
      this.scrollToBottom();

      // Persist Owner Response to MongoDB
      if (this.property) {
        this.chatService.sendMessage({
          propertyId: this.property.id,
          senderId: this.property.ownerId || 'owner',
          senderName: this.property.ownerName || 'Verified Host',
          content: ownerReply,
          isOwner: true
        }).subscribe();
      }
    }, 1200);
  }

  private generateSmartOwnerReply(buyerText: string): string {
    const lower = buyerText.toLowerCase();

    if (lower.includes('available') || lower.includes('still')) {
      return `Yes, absolutely! The property is available and ready for viewing. Would you like to schedule an in-person visit or virtual 3D tour?`;
    }
    if (lower.includes('visit') || lower.includes('weekend') || lower.includes('see') || lower.includes('tour')) {
      return `Sure! Saturday and Sunday between 11:00 AM and 5:00 PM work great for visits. Please let me know your preferred time slot, or call me directly at ${this.property?.ownerContact || 'my registered contact'}.`;
    }
    if (lower.includes('price') || lower.includes('negotiable') || lower.includes('offer')) {
      return `The listed price is ${this.property?.currencySymbol || '₹'}${this.property?.price?.toLocaleString()}. There is slight room for negotiation for serious buyers ready with immediate token advance.`;
    }
    if (lower.includes('parking') || lower.includes('maintenance')) {
      return `Yes, covered multi-car parking and 24/7 security maintenance are included with this property!`;
    }
    return `Thank you for reaching out! I would be glad to share more details and high-resolution floor plans with you. Feel free to call or WhatsApp me as well.`;
  }

  private loadChatHistory(propId: string) {
    this.chatService.getMessages(propId).subscribe(apiMsgs => {
      if (apiMsgs && apiMsgs.length > 0) {
        this.chatMessages = apiMsgs.map(m => ({
          id: m.id || 'msg-' + Math.random(),
          sender: m.isOwner ? 'OWNER' : 'BUYER',
          senderName: m.senderName || (m.isOwner ? 'Verified Host' : 'Buyer'),
          text: m.content,
          timestamp: m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : this.getCurrentTimeString()
        }));
      } else {
        // Welcome message if conversation is new
        if (this.chatMessages.length === 0 && this.property) {
          this.chatMessages = [{
            id: 'msg-welcome',
            sender: 'OWNER',
            senderName: this.property.ownerName || 'Verified Host',
            text: `Hello! Thanks for your interest in "${this.property.title}". How can I help you today? Feel free to ask about pricing, layout, or scheduling a visit.`,
            timestamp: this.getCurrentTimeString()
          }];
        }
      }
      this.scrollToBottom();
    });
  }

  private refreshChat(propId: string) {
    this.chatService.getMessages(propId).subscribe(apiMsgs => {
      if (apiMsgs && apiMsgs.length > this.chatMessages.length) {
        this.chatMessages = apiMsgs.map(m => ({
          id: m.id || 'msg-' + Math.random(),
          sender: m.isOwner ? 'OWNER' : 'BUYER',
          senderName: m.senderName || (m.isOwner ? 'Verified Host' : 'Buyer'),
          text: m.content,
          timestamp: m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : this.getCurrentTimeString()
        }));
        this.scrollToBottom();
      }
    });
  }

  private scrollToBottom() {
    setTimeout(() => {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    }, 50);
  }

  private getCurrentTimeString(): string {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Contact Helpers
  getPhoneContact(): string | null {
    if (!this.property?.ownerContact) return null;
    const contact = this.property.ownerContact;
    const match = contact.match(/(\+?[0-9\s-]{7,15})/);
    return match ? match[0].trim() : null;
  }

  getCleanPhoneNumber(): string {
    const phone = this.getPhoneContact() || '918091109624';
    return phone.replace(/[^0-9]/g, '');
  }

  getEmailContact(): string | null {
    if (!this.property?.ownerContact) return null;
    const contact = this.property.ownerContact;
    const match = contact.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    return match ? match[0].trim() : null;
  }

  encodeSubject(): string {
    return encodeURIComponent(`Inquiry for ${this.property?.title || 'Property'}`);
  }
}
