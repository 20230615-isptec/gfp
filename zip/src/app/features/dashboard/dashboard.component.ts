import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { NgClass, CurrencyPipe } from '@angular/common';
import { TransactionModalComponent } from '../../shared/components/transaction-modal.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgClass, CurrencyPipe, TransactionModalComponent],
  template: `
    <header class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
      <div>
        <h2 class="font-headline-lg text-on-surface">
          Olá, <span class="text-primary font-bold">Alex</span>
        </h2>
        <p class="font-body-lg text-on-surface-variant mt-1">Aqui está o seu resumo financeiro de hoje.</p>
      </div>
      <div class="flex gap-2">
        <button (click)="openTransactionModal()" class="bg-primary hover:bg-primary-container text-on-primary rounded-lg py-3 px-4 flex items-center justify-center gap-1 shadow-[0_0_15px_rgba(78,222,163,0.3)] cursor-pointer">
          <span class="material-symbols-outlined text-sm">add</span>
          <span class="font-label-md text-sm font-bold">Nova Transação</span>
        </button>
      </div>
    </header>

    @if(loading) {
      <div class="flex justify-center items-center py-20 text-primary">
        <span class="material-symbols-outlined animate-spin text-4xl">progress_activity</span>
      </div>
    } @else {
      <!-- Bento Grid Top Row -->
      <section class="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
        <div class="md:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div class="glass-card rounded-xl p-6 flex flex-col relative overflow-hidden hover:bg-slate-800/80 transition-colors">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-label-md text-on-surface-variant uppercase tracking-wider text-xs">Saldo Atual</h3>
              <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <span class="material-symbols-outlined text-sm">account_balance_wallet</span>
              </div>
            </div>
            <div>
              <p class="font-headline-sm text-on-surface font-data-mono tracking-tight">{{ dashboardData()?.balance | currency:'EUR':'symbol' }}</p>
              <div class="flex items-center gap-1 mt-2 text-primary">
                <span class="material-symbols-outlined text-sm">trending_up</span>
                <span class="font-label-md text-[12px]">+12.5% este mês</span>
              </div>
            </div>
          </div>

          <div class="glass-card rounded-xl p-6 flex flex-col relative overflow-hidden hover:bg-slate-800/80 transition-colors">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-label-md text-on-surface-variant uppercase tracking-wider text-xs">Total de Receitas</h3>
              <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <span class="material-symbols-outlined text-sm">arrow_downward</span>
              </div>
            </div>
            <div>
              <p class="font-headline-sm text-on-surface font-data-mono tracking-tight">{{ dashboardData()?.income | currency:'EUR':'symbol' }}</p>
              <div class="mt-4 h-1 w-full bg-surface-container-high rounded-full overflow-hidden">
                <div class="h-full bg-primary w-[75%] rounded-full"></div>
              </div>
            </div>
          </div>

          <div class="glass-card rounded-xl p-6 flex flex-col relative overflow-hidden hover:bg-slate-800/80 transition-colors">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-label-md text-on-surface-variant uppercase tracking-wider text-xs">Total de Despesas</h3>
              <div class="w-8 h-8 rounded-full bg-danger-red/10 flex items-center justify-center text-danger-red">
                <span class="material-symbols-outlined text-sm">arrow_upward</span>
              </div>
            </div>
            <div>
              <p class="font-headline-sm text-on-surface font-data-mono tracking-tight">{{ dashboardData()?.expense | currency:'EUR':'symbol' }}</p>
              <div class="mt-4 h-1 w-full bg-surface-container-high rounded-full overflow-hidden">
                <div class="h-full bg-danger-red w-[35%] rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="md:col-span-4 glass-card rounded-xl p-6 flex flex-col justify-center">
            <h3 class="font-label-md text-on-surface-variant uppercase tracking-wider text-xs mb-4">Visão Global</h3>
            <div class="space-y-3">
              <div class="bg-surface-container-highest/50 rounded-lg p-3 flex justify-between items-center border border-outline-variant/10">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded-full bg-surface-bright flex items-center justify-center text-[10px] font-bold">USD</div>
                  <span class="font-label-md text-on-surface-variant text-sm">Dólar</span>
                </div>
                <span class="font-data-mono text-on-surface">$48,935.32</span>
              </div>
              <div class="bg-surface-container-highest/50 rounded-lg p-3 flex justify-between items-center border border-outline-variant/10">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded-full bg-surface-bright flex items-center justify-center text-[10px] font-bold">GBP</div>
                  <span class="font-label-md text-on-surface-variant text-sm">Libra Sterling</span>
                </div>
                <span class="font-data-mono text-on-surface">£38,715.12</span>
              </div>
            </div>
        </div>
      </section>

      <!-- Transações Recentes -->
      <section class="glass-card rounded-xl flex flex-col overflow-hidden mb-8">
        <div class="p-6 border-b border-outline-variant/10 flex justify-between items-center">
          <h3 class="font-headline-sm text-on-surface">Transações Recentes</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr class="bg-surface-container/50">
                <th class="font-label-md text-on-surface-variant py-4 px-6 font-normal w-1/3">Descrição</th>
                <th class="font-label-md text-on-surface-variant py-4 px-6 font-normal">Data</th>
                <th class="font-label-md text-on-surface-variant py-4 px-6 font-normal">Categoria</th>
                <th class="font-label-md text-on-surface-variant py-4 px-6 font-normal text-right">Valor</th>
              </tr>
            </thead>
            <tbody class="font-body-md text-on-surface divide-y divide-outline-variant/10">
              @for (tx of dashboardData()?.recentTransactions; track tx.id) {
                <tr class="hover:bg-surface-variant/20 transition-colors">
                  <td class="py-4 px-6">
                    <div class="font-medium">{{ tx.description }}</div>
                  </td>
                  <td class="py-4 px-6 text-on-surface-variant text-sm">{{ tx.date }}</td>
                  <td class="py-4 px-6">
                    <span class="px-2 py-1 rounded bg-secondary-container/20 text-secondary-fixed-dim text-[12px] font-label-md border border-secondary-container/30">
                      {{ tx.category }}
                    </span>
                  </td>
                  <td class="py-4 px-6 text-right font-data-mono" [ngClass]="tx.type === 'income' ? 'text-primary' : ''">
                    {{ tx.type === 'income' ? '+' : '-' }}{{ tx.amount | currency:'EUR':'symbol' }}
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4" class="py-8 text-center text-on-surface-variant">Nenhuma transação encontrada.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    }

    @if(isModalOpen()) {
      <app-transaction-modal (close)="closeTransactionModal()"/>
    }
  `
})
export class DashboardComponent {
  private http = inject(HttpClient);
  
  loading = true;
  dashboardData = signal<any>(null);
  isModalOpen = signal(false);

  ngOnInit() {
    this.http.get(`${environment.apiUrl}/dashboard`).subscribe({
      next: (data) => {
        this.dashboardData.set(data);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        // Mock fallback case in instance the server restarts
      }
    });
  }

  openTransactionModal() {
    this.isModalOpen.set(true);
  }

  closeTransactionModal() {
    this.isModalOpen.set(false);
  }
}
