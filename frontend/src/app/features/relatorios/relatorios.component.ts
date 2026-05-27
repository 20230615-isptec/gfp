import { Component, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PreferencesService } from '../../core/preferences.service';
import { NotificationService } from '../../core/notification.service';

@Component({
  selector: 'app-relatorios',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  template: `
    <section class="app-enter space-y-6">
      <div class="glass-card rounded-xl p-6">
        <h2 class="text-2xl font-bold mb-4">{{ prefs.t('Relatórios', 'Reports') }}</h2>
        <div class="filter-shell mb-4">
          <div class="filter-field compact">
            <span class="material-symbols-outlined filter-icon">calendar_month</span>
            <input [(ngModel)]="mes" type="number" min="1" max="12" class="input-base" [placeholder]="prefs.t('Mês', 'Month')">
          </div>
          <div class="filter-field compact">
            <span class="material-symbols-outlined filter-icon">event</span>
            <input [(ngModel)]="ano" type="number" min="2000" max="2100" class="input-base" [placeholder]="prefs.t('Ano', 'Year')">
          </div>
          <button class="soft-btn inline-flex items-center gap-1" (click)="loadMensal()"><span class="material-symbols-outlined text-[16px]">summarize</span>{{ prefs.t('Mensal', 'Monthly') }}</button>
          <button class="soft-btn inline-flex items-center gap-1" (click)="loadTendencias()"><span class="material-symbols-outlined text-[16px]">monitoring</span>{{ prefs.t('Tendências', 'Trends') }}</button>
          <button class="soft-btn opacity-70 cursor-not-allowed inline-flex items-center gap-1" type="button" title="A integração será adicionada depois"><span class="material-symbols-outlined text-[16px]">download</span>{{ prefs.t('CSV', 'CSV') }}</button>
        </div>

        @if(mensal()) {
          <div class="grid md:grid-cols-3 gap-3 mb-4">
            <div class="p-4 rounded-lg bg-surface-container">
              <div class="text-xs text-on-surface-variant">{{ prefs.t('Saldo Final', 'Final Balance') }}</div>
              <div class="text-xl font-bold">{{ mensal().saldo_final | currency:'AOA':'symbol' }}</div>
            </div>
            <div class="p-4 rounded-lg bg-surface-container">
              <div class="text-xs text-on-surface-variant">{{ prefs.t('Top Despesa', 'Top Expense') }}</div>
              <div class="text-xl font-bold">{{ mensal().top_despesa?.categoria || '-' }}</div>
            </div>
            <div class="p-4 rounded-lg bg-surface-container">
              <div class="text-xs text-on-surface-variant">{{ prefs.t('Comparação', 'Comparison') }}</div>
              <div class="text-sm font-semibold">{{ mensal().comparacao_percentual || '-' }}</div>
            </div>
          </div>
        }

        @if(tendencias().length > 0) {
          <div class="glass-card rounded-xl p-4 border border-outline-variant/20">
            <h3 class="font-bold mb-3">{{ prefs.t('Histórico de 6 Meses', '6-Month History') }}</h3>
            <div class="space-y-2">
              @for (t of tendencias(); track t.mes + '-' + t.ano) {
                <div class="p-3 rounded-lg bg-surface-container border border-outline-variant/20">
                  {{ t.mes }}/{{ t.ano }} · {{ prefs.t('Receitas', 'Income') }}: {{ t.receitas }} · {{ prefs.t('Despesas', 'Expenses') }}: {{ t.despesas }} · {{ prefs.t('Saldo', 'Balance') }}: {{ t.saldo }}
                </div>
              }
            </div>
          </div>
        }
      </div>
    </section>
  `
})
export class RelatoriosComponent {
  private http = inject(HttpClient);
  prefs = inject(PreferencesService);
  private notifications = inject(NotificationService);
  mes = new Date().getMonth() + 1;
  ano = new Date().getFullYear();
  mensal = signal<any | null>(null);
  tendencias = signal<any[]>([]);

  loadMensal(): void {
    if (!this.validarPeriodo()) {
      return;
    }

    this.http.get<any>(`${environment.apiUrl}/relatorios/mensal?mes=${this.mes}&ano=${this.ano}`).subscribe({
      next: (r) => {
        this.mensal.set(r?.data ?? null);
        this.notifications.success(this.prefs.t('Relatório mensal carregado.', 'Monthly report loaded.'));
      },
      error: () => {
        this.notifications.error(this.prefs.t('Relatório mensal indisponível no momento.', 'Monthly report unavailable at the moment.'));
        this.mensal.set(null);
      }
    });
  }

  loadTendencias(): void {
    this.http.get<any>(`${environment.apiUrl}/relatorios/tendencias`).subscribe({
      next: (r) => {
        this.tendencias.set(Array.isArray(r?.data) ? r.data : []);
        this.notifications.success(this.prefs.t('Tendências carregadas.', 'Trends loaded.'));
      },
      error: () => {
        this.notifications.error(this.prefs.t('Tendências indisponíveis no momento.', 'Trends unavailable at the moment.'));
        this.tendencias.set([]);
      }
    });
  }

  private validarPeriodo(): boolean {
    if (!Number.isInteger(Number(this.mes)) || Number(this.mes) < 1 || Number(this.mes) > 12) {
      this.notifications.warning(this.prefs.t('Informe um mês entre 1 e 12.', 'Enter a month between 1 and 12.'));
      return false;
    }

    if (!Number.isInteger(Number(this.ano)) || Number(this.ano) < 2000 || Number(this.ano) > 2100) {
      this.notifications.warning(this.prefs.t('Informe um ano entre 2000 e 2100.', 'Enter a year between 2000 and 2100.'));
      return false;
    }

    return true;
  }
}
