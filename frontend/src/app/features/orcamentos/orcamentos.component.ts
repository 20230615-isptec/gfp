import { Component, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PreferencesService } from '../../core/preferences.service';
import { StatusModalComponent } from '../../shared/components/status-modal.component';
import { FormModalComponent } from '../../shared/components/form-modal.component';
import { NotificationService } from '../../core/notification.service';

@Component({
  selector: 'app-orcamentos',
  standalone: true,
  imports: [CommonModule, FormsModule, StatusModalComponent, FormModalComponent, DecimalPipe],
  template: `
    <section class="app-enter space-y-6">
      <div class="mb-2 flex justify-between items-center">
        <h1 class="text-3xl font-bold text-on-surface">{{ prefs.t('Orçamentos', 'Budgets') }}</h1>
        <button class="soft-btn" (click)="openForm.set(true)">{{ prefs.t('Novo', 'New') }}</button>
      </div>

      <form class="glass-card rounded-xl p-4" (ngSubmit)="load(true)">
        <div class="filter-shell">
          <div class="filter-field compact">
            <span class="material-symbols-outlined filter-icon">calendar_month</span>
            <input [(ngModel)]="mesFiltro" type="number" min="1" max="12" name="mesFiltro" class="input-base" [placeholder]="prefs.t('Mês', 'Month')">
          </div>
          <div class="filter-field compact">
            <span class="material-symbols-outlined filter-icon">event</span>
            <input [(ngModel)]="anoFiltro" type="number" min="2000" max="2100" name="anoFiltro" class="input-base" [placeholder]="prefs.t('Ano', 'Year')">
          </div>
          <button class="soft-btn inline-flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">filter_alt</span>{{ prefs.t('Aplicar', 'Apply') }}</button>
          <button type="button" class="soft-btn inline-flex items-center gap-1" (click)="resetPeriodo()"><span class="material-symbols-outlined text-[16px]">today</span>{{ prefs.t('Mês atual', 'Current month') }}</button>
        </div>
      </form>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div class="lg:col-span-4">
          <div class="glass-card rounded-xl p-6 h-full">
            <h3 class="text-on-surface-variant uppercase text-sm">{{ prefs.t('Orçamento Mensal Total', 'Total Monthly Budget') }}</h3>
            <div class="text-3xl font-bold mt-2">Kz {{ totalLimit() | number:'1.2-2' }}</div>
            <p class="text-on-surface-variant text-sm mt-1">{{ mesFiltro }}/{{ anoFiltro }}</p>
            <div class="mt-6">
              <div class="flex justify-between text-sm mb-2">
                <span>{{ prefs.t('Consumido', 'Consumed') }}</span>
                <span class="font-bold text-primary">{{ totalPercent() }}%</span>
              </div>
              <div class="w-full bg-surface-container-high rounded-full h-2 overflow-hidden">
                <div class="bg-primary h-2 rounded-full" [style.width.%]="totalPercent()"></div>
              </div>
              <div class="flex justify-between text-xs mt-2 text-on-surface-variant">
                <span>Kz {{ totalSpent() | number:'1.2-2' }}</span>
                <span>Kz {{ (totalLimit() - totalSpent()) | number:'1.2-2' }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="glass-card rounded-xl p-6 lg:col-span-8">
          <h3 class="text-xl font-bold mb-4">{{ prefs.t('Orçamentos Ativos', 'Active Budgets') }}</h3>
          <div class="space-y-2">
            @for (o of orcamentos(); track o.id) {
              <div class="p-3 rounded-lg bg-surface-container border border-outline-variant/20 flex justify-between items-center gap-3">
              <div class="flex-1">
                <div class="font-semibold">{{ o.categoria }}</div>
                <div class="text-xs text-on-surface-variant">
                  Kz {{ o.valor_limite | number:'1.2-2' }}
                  @if(o.gasto_atual != null) { · {{ prefs.t('Gasto', 'Spent') }}: Kz {{ o.gasto_atual | number:'1.2-2' }} }
                </div>
                <div class="mt-2 w-full bg-surface-container-high rounded-full h-2 overflow-hidden">
                  <div class="h-2 rounded-full"
                       [style.width.%]="getPercent(o)"
                       [class.bg-primary]="getPercent(o) <= 80"
                       [class.bg-yellow-500]="getPercent(o) > 80 && getPercent(o) <= 100"
                       [class.bg-danger-red]="getPercent(o) > 100"></div>
                </div>
                <div class="text-[11px] mt-1"
                     [class.text-primary]="getPercent(o) <= 80"
                     [class.text-yellow-500]="getPercent(o) > 80 && getPercent(o) <= 100"
                     [class.text-danger-red]="getPercent(o) > 100">
                  {{ getPercent(o) }}%
                  @if(getPercent(o) > 100) { · {{ prefs.t('Orçamento excedido', 'Budget exceeded') }} }
                  @else if(getPercent(o) > 80) { · {{ prefs.t('Atenção', 'Warning') }} }
                </div>
              </div>
                <button (click)="status(o.id)" class="soft-btn">{{ prefs.t('Status', 'Status') }}</button>
              </div>
            } @empty {
              <div class="text-on-surface-variant">{{ prefs.t('Sem orçamentos.', 'No budgets.') }}</div>
            }
          </div>
        </div>
      </div>

      <app-form-modal [open]="openForm()" [title]="prefs.t('Novo Orçamento', 'New Budget')" (close)="openForm.set(false)">
        <form class="grid md:grid-cols-2 gap-4" (ngSubmit)="criar()">
          <div class="space-y-1">
            <label class="text-sm text-on-surface-variant">{{ prefs.t('Categoria', 'Category') }}</label>
            <select [(ngModel)]="form.categoria_id" name="categoria_id" class="input-base w-full" required>
              <option value="">{{ prefs.t('Selecione a categoria', 'Select category') }}</option>
              @for (c of categorias(); track c.id) { <option [value]="c.id">{{ c.nome }}</option> }
            </select>
            <span class="field-help">{{ prefs.t('Escolha a categoria que quer controlar mensalmente.', 'Choose the category you want to control monthly.') }}</span>
          </div>
          <div class="space-y-1">
            <label class="text-sm text-on-surface-variant">{{ prefs.t('Valor limite mensal', 'Monthly limit amount') }}</label>
            <input [(ngModel)]="form.valor_limite" name="valor_limite" type="number" min="1" class="input-base w-full" placeholder="Ex: 150000" required>
            <span class="field-help">{{ prefs.t('Este é o teto máximo de gasto para o mês.', 'This is the maximum spending cap for the month.') }}</span>
          </div>
          <div class="space-y-1">
            <label class="text-sm text-on-surface-variant">{{ prefs.t('Mês de referência', 'Reference month') }}</label>
            <input [(ngModel)]="form.mes" name="mes" type="number" min="1" max="12" class="input-base w-full" placeholder="1-12" required>
          </div>
          <div class="space-y-1">
            <label class="text-sm text-on-surface-variant">{{ prefs.t('Ano de referência', 'Reference year') }}</label>
            <input [(ngModel)]="form.ano" name="ano" type="number" min="2000" max="2100" class="input-base w-full" placeholder="Ex: 2026" required>
            <span class="field-help">{{ prefs.t('Use o ano fiscal que deseja monitorar.', 'Use the fiscal year you want to monitor.') }}</span>
          </div>
          <div class="md:col-span-2 flex justify-end">
            <button class="bg-primary text-on-primary rounded-lg px-5 py-2 font-bold">{{ prefs.t('Criar orçamento', 'Create budget') }}</button>
          </div>
        </form>
      </app-form-modal>

      <app-status-modal [open]="statusOpen()" [title]="prefs.t('Status do Orçamento', 'Budget Status')" [data]="statusData()" (close)="statusOpen.set(false)"></app-status-modal>
    </section>
  `
})
export class OrcamentosComponent {
  private http = inject(HttpClient);
  prefs = inject(PreferencesService);
  private notifications = inject(NotificationService);
  orcamentos = signal<any[]>([]);
  categorias = signal<any[]>([]);
  statusData = signal<any | null>(null);
  statusOpen = signal(false);
  openForm = signal(false);
  mesFiltro = new Date().getMonth() + 1;
  anoFiltro = new Date().getFullYear();
  form = { categoria_id: '', valor_limite: '', mes: this.mesFiltro, ano: this.anoFiltro };
  totalLimit = signal(0);
  totalSpent = signal(0);
  totalPercent = signal(0);

  ngOnInit(): void { this.load(); this.loadCategorias(); }

  loadCategorias(): void {
    this.http.get<any>(`${environment.apiUrl}/categorias`).subscribe({
      next: (r) => this.categorias.set(Array.isArray(r?.data) ? r.data : [])
    });
  }

  load(showFeedback = false): void {
    if (!this.validarPeriodo(this.mesFiltro, this.anoFiltro)) {
      return;
    }

    this.http.get<any>(`${environment.apiUrl}/orcamentos?mes=${this.mesFiltro}&ano=${this.anoFiltro}`).subscribe({
      next: (r) => {
        const data = Array.isArray(r?.data) ? r.data : [];
        this.orcamentos.set(data);
        const limit = data.reduce((s: number, x: any) => s + Number(x?.valor_limite || 0), 0);
        const spent = data.reduce((s: number, x: any) => s + Number(x?.gasto_atual || 0), 0);
        this.totalLimit.set(limit);
        this.totalSpent.set(spent);
        this.totalPercent.set(limit > 0 ? Math.min(Math.round((spent / limit) * 100), 100) : 0);
        if (showFeedback) {
          this.notifications.info(this.prefs.t('Filtros aplicados aos orçamentos.', 'Budget filters applied.'));
        }
      },
      error: (e) => this.notifications.error(e?.error?.message ?? this.prefs.t('Não foi possível carregar os orçamentos deste período.', 'Could not load budgets for this period.'))
    });
  }

  criar(): void {
    if (!this.validarFormulario()) {
      return;
    }

    this.http.post<any>(`${environment.apiUrl}/orcamentos`, this.form).subscribe({
      next: () => {
        this.notifications.success(this.prefs.t('Orçamento criado. O acompanhamento mensal já está ativo.', 'Budget created. Monthly tracking is now active.'));
        this.openForm.set(false);
        this.load();
      },
      error: (e) => this.notifications.error(e?.error?.message ?? this.prefs.t('Revise a categoria, mês, ano e limite antes de criar.', 'Review category, month, year and limit before creating.'))
    });
  }

  status(id: number): void {
    this.http.get<any>(`${environment.apiUrl}/orcamentos/status?id=${id}`).subscribe({
      next: (r) => { this.statusData.set(r?.data ?? null); this.statusOpen.set(true); },
      error: (e) => this.notifications.error(e?.error?.message ?? this.prefs.t('Não foi possível abrir o status deste orçamento.', 'Could not open this budget status.'))
    });
  }

  resetPeriodo(): void {
    this.mesFiltro = new Date().getMonth() + 1;
    this.anoFiltro = new Date().getFullYear();
    this.load(true);
  }

  getPercent(o: any): number {
    const limit = Number(o?.valor_limite || 0);
    const spent = Number(o?.gasto_atual || 0);
    if (limit <= 0) return 0;
    return Math.round((spent / limit) * 100);
  }

  private validarPeriodo(mes: number, ano: number): boolean {
    if (!Number.isInteger(Number(mes)) || Number(mes) < 1 || Number(mes) > 12) {
      this.notifications.warning(this.prefs.t('Informe um mês entre 1 e 12.', 'Enter a month between 1 and 12.'));
      return false;
    }

    if (!Number.isInteger(Number(ano)) || Number(ano) < 2000 || Number(ano) > 2100) {
      this.notifications.warning(this.prefs.t('Informe um ano entre 2000 e 2100.', 'Enter a year between 2000 and 2100.'));
      return false;
    }

    return true;
  }

  private validarFormulario(): boolean {
    if (!Number(this.form.categoria_id)) {
      this.notifications.warning(this.prefs.t('Selecione a categoria do orçamento.', 'Select the budget category.'));
      return false;
    }

    if (!Number.isFinite(Number(this.form.valor_limite)) || Number(this.form.valor_limite) <= 0) {
      this.notifications.warning(this.prefs.t('O limite mensal deve ser maior que zero.', 'Monthly limit must be greater than zero.'));
      return false;
    }

    return this.validarPeriodo(Number(this.form.mes), Number(this.form.ano));
  }
}
