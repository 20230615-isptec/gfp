import { Component, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PreferencesService } from '../../core/preferences.service';
import { NotificationService } from '../../core/notification.service';

@Component({
  selector: 'app-notificacoes',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <section class="app-enter max-w-4xl mx-auto">
      <div class="glass-card rounded-xl p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-2xl font-bold">{{ prefs.t('Notificações', 'Notifications') }}</h2>
          <button class="soft-btn" (click)="lerTodas()">{{ prefs.t('Marcar todas lidas', 'Mark all as read') }}</button>
        </div>
        <div class="filter-shell mb-4">
          <div class="filter-pill-group">
            <button type="button" (click)="activeFilter.set('all')" class="filter-pill" [ngClass]="{'active': activeFilter() === 'all'}"><span class="material-symbols-outlined text-[16px]">notifications</span>{{ prefs.t('Todas', 'All') }}</button>
            <button type="button" (click)="activeFilter.set('transaction')" class="filter-pill" [ngClass]="{'active': activeFilter() === 'transaction'}"><span class="material-symbols-outlined text-[16px]">receipt_long</span>{{ prefs.t('Transações', 'Transactions') }}</button>
            <button type="button" (click)="activeFilter.set('security')" class="filter-pill" [ngClass]="{'active': activeFilter() === 'security'}"><span class="material-symbols-outlined text-[16px]">shield</span>{{ prefs.t('Segurança', 'Security') }}</button>
          </div>
        </div>
        <div class="space-y-3">
          @for (n of notificacoes(); track n.id) {
            @if(activeFilter() === 'all' || activeFilter() === n.type) {
            <div class="p-4 rounded-lg bg-surface-container border border-outline-variant/20">
              <div class="flex justify-between gap-3">
                <div>
                  <p class="font-bold">{{ n.titulo }}</p>
                  <p class="text-sm text-on-surface-variant">{{ n.mensagem }}</p>
                  <p class="text-xs text-on-surface-variant mt-1">{{ n.criado_em | date:'dd/MM/yyyy HH:mm' }}</p>
                </div>
                @if(!n.lida) {
                  <button (click)="ler(n.id)" class="soft-btn">{{ prefs.t('Marcar lida', 'Mark as read') }}</button>
                }
              </div>
            </div>
            }
          } @empty {
            <div class="text-on-surface-variant">{{ prefs.t('Sem notificações.', 'No notifications.') }}</div>
          }
        </div>
      </div>
    </section>
  `
})
export class NotificacoesComponent {
  private http = inject(HttpClient);
  prefs = inject(PreferencesService);
  private notifications = inject(NotificationService);
  notificacoes = signal<any[]>([]);
  activeFilter = signal<'all' | 'transaction' | 'security'>('all');

  ngOnInit(): void {
    this.notifications.loadHistory();
    this.load();
  }

  load(): void {
    this.http.get<any>(`${environment.apiUrl}/notificacoes?tipo=all`).subscribe({
      next: (r) => {
        const backendData = Array.isArray(r?.data) ? r.data : [];
        const backendNotifications = backendData.map((n: any) => ({
          id: String(n.id),
          titulo: n.titulo,
          mensagem: n.mensagem,
          criado_em: n.criado_em,
          lida: !!n.lida,
          type: this.inferType(n),
          origem: 'backend'
        }));

        const localNotifications = this.notifications.history().map((n) => ({
          id: n.id,
          titulo: n.title,
          mensagem: n.message,
          criado_em: n.criado_em,
          lida: n.lida,
          type: this.mapType(n.type),
          origem: n.origem
        }));

        const merged = [...localNotifications, ...backendNotifications]
          .sort((a, b) => String(b.criado_em).localeCompare(String(a.criado_em)));

        this.notificacoes.set(merged);
      },
      error: (e) => this.notifications.error(e?.error?.message ?? this.prefs.t('Não foi possível carregar as notificações.', 'Could not load notifications.'))
    });
  }

  ler(id: number): void {
    const item = this.notificacoes().find((n) => String(n.id) === String(id));
    if (item?.origem === 'ui') {
      this.notifications.markHistoryRead(String(id));
      this.notifications.success(this.prefs.t('Notificação marcada como lida.', 'Notification marked as read.'));
      this.load();
      return;
    }

    this.http.put(`${environment.apiUrl}/notificacoes/ler`, { id }).subscribe({
      next: () => {
        this.notifications.success(this.prefs.t('Notificação marcada como lida.', 'Notification marked as read.'));
        this.load();
      },
      error: (e) => this.notifications.error(e?.error?.message ?? this.prefs.t('Não foi possível marcar esta notificação.', 'Could not mark this notification.'))
    });
  }

  lerTodas(): void {
    this.notifications.markAllHistoryRead();
    this.http.put(`${environment.apiUrl}/notificacoes/ler-todas`, {}).subscribe({
      next: () => {
        this.notifications.success(this.prefs.t('Todas as notificações foram marcadas como lidas.', 'All notifications were marked as read.'));
        this.load();
      },
      error: (e) => this.notifications.error(e?.error?.message ?? this.prefs.t('Não foi possível marcar todas como lidas.', 'Could not mark all as read.'))
    });
  }

  private inferType(n: any): 'transaction' | 'security' {
    const text = `${n?.titulo ?? ''} ${n?.mensagem ?? ''}`.toLowerCase();
    if (text.includes('senha') || text.includes('security') || text.includes('acesso')) return 'security';
    return 'transaction';
  }

  private mapType(type: string): 'transaction' | 'security' {
    return type === 'security' ? 'security' : 'transaction';
  }
}
