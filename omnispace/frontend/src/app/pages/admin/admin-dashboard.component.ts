import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../environments/environment';

interface Metrics {
  generatedAt: string;
  users: number;
  listings: number;
  published: number;
  drafts: number;
  designs: number;
  conversations: number;
  messages: number;
  newUsers24h: number;
  newListings24h: number;
  messages24h: number;
}

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="dashboard" [attr.aria-busy]="loading()">
      <header>
        <div><p class="eyebrow">OmniSpace administration</p><h1>Overview</h1></div>
        <button type="button" (click)="refresh()" [disabled]="loading()">Refresh metrics</button>
      </header>

      @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
      @if (loading() && !metrics()) { <p role="status">Loading metrics…</p> }
      @if (metrics(); as m) {
        <p class="timestamp">Updated {{ m.generatedAt | date:'medium' }}</p>
        <section class="totals" aria-label="Platform totals">
          <article><h2>Accounts</h2><strong>{{ m.users | number }}</strong></article>
          <article><h2>Listings</h2><strong>{{ m.listings | number }}</strong></article>
          <article><h2>Saved designs</h2><strong>{{ m.designs | number }}</strong></article>
          <article><h2>Conversations</h2><strong>{{ m.conversations | number }}</strong></article>
          <article><h2>Messages</h2><strong>{{ m.messages | number }}</strong></article>
        </section>
        <div class="breakdown">
          <section class="panel">
            <h2>Listing status</h2>
            <dl><div><dt>Published</dt><dd>{{ m.published | number }}</dd></div>
              <div><dt>Drafts</dt><dd>{{ m.drafts | number }}</dd></div></dl>
          </section>
          <section class="panel">
            <h2>Last 24 hours</h2>
            <dl><div><dt>New accounts</dt><dd>{{ m.newUsers24h | number }}</dd></div>
              <div><dt>New listings</dt><dd>{{ m.newListings24h | number }}</dd></div>
              <div><dt>Messages sent</dt><dd>{{ m.messages24h | number }}</dd></div></dl>
          </section>
        </div>
      }
    </main>
  `,
  styles: [`
    .dashboard { max-width: 1160px; margin: 0 auto; padding: 56px 24px 80px; color: #23342c; }
    header { display: flex; align-items: end; justify-content: space-between; flex-wrap: wrap; gap: 20px; }
    h1 { font-size: clamp(2.5rem, 6vw, 4.5rem); margin: 0; }
    .eyebrow { color: #526451; margin: 0 0 8px; }
    button { background: #26372d; color: #fff; border: 0; border-radius: 8px; padding: 12px 18px; font: inherit; }
    button:disabled { opacity: .6; }
    .timestamp { color: #526451; margin: 16px 0 24px; }
    .totals, .breakdown { display: grid; gap: 16px; }
    .totals { grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); }
    .totals article { padding: 22px; background: #eef1e8; border-radius: 16px; }
    .totals h2 { font-size: .95rem; margin: 0 0 12px; }
    strong { font-size: 2rem; font-variant-numeric: tabular-nums; }
    .breakdown { grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr)); margin-top: 24px; }
    .panel { background: #fffdfa; border: 1px solid #deded2; border-radius: 16px; padding: 24px; }
    .panel h2 { margin: 0 0 12px; }
    dl { margin: 0; }
    dl div { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eeeee6; }
    dl div:last-child { border-bottom: 0; }
    dd { margin: 0; font-weight: 700; }
    .error { color: #9b201a; }
  `]
})
export class AdminDashboardComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  readonly metrics = signal<Metrics | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');

  ngOnInit() { this.refresh(); }

  refresh() {
    if (this.loading()) return;
    this.error.set('');
    this.loading.set(true);
    this.http.get<Metrics>(`${environment.apiUrl}/admin/metrics`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: metrics => {
          this.metrics.set(metrics);
          this.loading.set(false);
        },
        error: response => {
          if (response.status === 401 || response.status === 403) this.metrics.set(null);
          this.error.set(response.status === 401 || response.status === 403
            ? 'Sign in with an administrator account to see these metrics.'
            : 'Could not load metrics. Try refreshing.');
          this.loading.set(false);
        }
      });
  }
}
