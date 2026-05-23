import { Component, signal } from '@angular/core';
import { TransactionModalComponent } from '../../shared/components/transaction-modal.component';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [TransactionModalComponent],
  template: `
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <h1 class="font-headline-sm text-on-surface text-2xl mb-1">Transações</h1>
        <p class="text-on-surface-variant text-sm">Gerencie suas receitas e despesas com precisão.</p>
      </div>
      <div class="flex items-center gap-3 w-full sm:w-auto">
        <button class="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-indigo-soft text-indigo-soft hover:bg-indigo-soft/10 transition-colors font-label-md cursor-pointer">
          <span class="material-symbols-outlined text-sm">download</span>
          Exportar Relatório
        </button>
        <button (click)="openTransactionModal()" class="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary-fixed-variant hover:bg-primary-fixed transition-colors font-label-md shadow-[0_0_15px_rgba(78,222,163,0.3)] cursor-pointer">
          <span class="material-symbols-outlined text-sm">add</span>
          Nova Transação
        </button>
      </div>
    </div>

    <div class="glass-card rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
      <div class="relative w-full md:w-96">
        <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
        <input type="text" placeholder="Buscar por descrição..." class="w-full bg-surface-container-highest border border-outline-variant/30 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-soft focus:ring-1 focus:ring-indigo-soft/50 text-on-surface placeholder-on-surface-variant/50 transition-all"/>
      </div>
      <div class="flex flex-wrap gap-3 w-full md:w-auto">
        <select class="bg-surface-container-highest border border-outline-variant/30 rounded-lg py-2.5 pl-3 pr-8 text-sm focus:outline-none focus:border-indigo-soft text-on-surface appearance-none cursor-pointer">
          <option value="">Todas as Categorias</option>
        </select>
        <div class="flex bg-surface-container-highest rounded-lg p-1 border border-outline-variant/30">
          <button class="px-3 py-1.5 rounded-md bg-surface-variant text-on-surface text-xs font-medium cursor-pointer">Todos</button>
          <button class="px-3 py-1.5 rounded-md text-on-surface-variant hover:text-on-surface text-xs font-medium transition-colors cursor-pointer">Receitas</button>
          <button class="px-3 py-1.5 rounded-md text-on-surface-variant hover:text-on-surface text-xs font-medium transition-colors cursor-pointer">Despesas</button>
        </div>
      </div>
    </div>

    <div class="glass-card rounded-xl overflow-hidden interactive-glow transition-all duration-300">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr class="border-b border-outline-variant/20 bg-surface-container/50">
              <th class="py-4 px-6 font-label-md text-on-surface-variant font-medium">Descrição</th>
              <th class="py-4 px-6 font-label-md text-on-surface-variant font-medium">Data</th>
              <th class="py-4 px-6 font-label-md text-on-surface-variant font-medium">Categoria</th>
              <th class="py-4 px-6 font-label-md text-on-surface-variant font-medium">Tipo</th>
              <th class="py-4 px-6 font-label-md text-on-surface-variant font-medium text-right">Valor</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-outline-variant/10">
            <!-- Mock items for visual -->
            <tr class="hover:bg-surface-variant/30 transition-colors">
              <td class="py-4 px-6">
                <div class="font-medium text-on-surface text-sm">Salário Mensal</div>
              </td>
              <td class="py-4 px-6 text-sm text-on-surface-variant">05 Out 2023</td>
              <td class="py-4 px-6">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-700/50 text-xs text-on-surface border border-outline-variant/20">
                  <span class="material-symbols-outlined text-[14px]">work</span> Salário
                </span>
              </td>
              <td class="py-4 px-6">
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                  Receita
                </span>
              </td>
              <td class="py-4 px-6 text-right font-data-mono text-primary font-bold">
                + € 8.500,00
              </td>
            </tr>
            <tr class="hover:bg-surface-variant/30 transition-colors">
              <td class="py-4 px-6">
                <div class="font-medium text-on-surface text-sm">Supermercado</div>
              </td>
              <td class="py-4 px-6 text-sm text-on-surface-variant">12 Out 2023</td>
              <td class="py-4 px-6">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-700/50 text-xs text-on-surface border border-outline-variant/20">
                  <span class="material-symbols-outlined text-[14px]">shopping_cart</span> Alimentação
                </span>
              </td>
              <td class="py-4 px-6">
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-danger-red/10 text-danger-red text-xs font-medium border border-danger-red/20">
                  Despesa
                </span>
              </td>
              <td class="py-4 px-6 text-right font-data-mono text-on-surface">
                - € 450,25
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    @if(isModalOpen()) {
      <app-transaction-modal (close)="closeTransactionModal()"/>
    }
  `
})
export class TransactionsComponent {
  isModalOpen = signal(false);

  openTransactionModal() {
    this.isModalOpen.set(true);
  }

  closeTransactionModal() {
    this.isModalOpen.set(false);
  }
}
