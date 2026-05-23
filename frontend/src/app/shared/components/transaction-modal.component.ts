import { Component, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-transaction-modal',
  standalone: true,
  template: `
    <!-- MODAL OVERLAY & CONTENT -->
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-deep-navy/80 backdrop-blur-sm">
      <!-- Modal Container -->
      <div class="w-full max-w-lg bg-surface-container-lowest border border-outline-variant/20 rounded-2xl shadow-2xl relative overflow-hidden transform transition-all text-left">
        <!-- Modal Header -->
        <div class="px-6 py-5 border-b border-outline-variant/10 flex items-center justify-between bg-surface/50">
          <h3 class="font-headline-sm text-[20px] text-on-surface flex items-center gap-2">
            Nova Transação
          </h3>
          <button (click)="closeModal()" class="text-on-surface-variant hover:text-on-surface transition-colors p-1 rounded-md hover:bg-surface-variant/50 cursor-pointer">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <!-- Modal Body (Form) -->
        <div class="p-6">
          <form class="space-y-6">
            <!-- Tipo (Toggle Income/Expense) -->
            <div class="flex justify-center mb-2">
              <div class="bg-surface-container-high p-1 rounded-lg inline-flex relative grid grid-cols-2 gap-1">
                <label class="cursor-pointer">
                  <input class="peer hidden" name="transaction_type" type="radio" value="expense" checked/>
                  <div class="px-6 py-2 rounded-md font-label-md text-on-surface-variant text-center transition-all peer-checked:bg-slate-800 peer-checked:text-danger-red peer-checked:shadow-sm">
                    Despesa
                  </div>
                </label>
                <label class="cursor-pointer">
                  <input class="peer hidden" name="transaction_type" type="radio" value="income"/>
                  <div class="px-6 py-2 rounded-md font-label-md text-on-surface-variant text-center transition-all peer-checked:bg-slate-800 peer-checked:text-primary peer-checked:shadow-sm">
                    Receita
                  </div>
                </label>
              </div>
            </div>

            <!-- Valor -->
            <div>
              <label class="block font-label-md text-on-surface-variant mb-2" for="amount">Valor</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span class="font-data-mono text-on-surface-variant">R$</span>
                </div>
                <input class="w-full bg-surface-container-highest border border-outline-variant/30 text-on-surface rounded-lg pl-10 pr-3 py-3 font-data-mono text-lg focus:outline-none focus:border-indigo-soft focus:ring-1 focus:ring-indigo-soft/50" id="amount" name="amount" placeholder="0.00" required type="number"/>
              </div>
            </div>

            <!-- Descrição -->
            <div>
              <label class="block font-label-md text-on-surface-variant mb-2" for="description">Descrição</label>
              <input class="w-full bg-surface-container-highest border border-outline-variant/30 text-on-surface rounded-lg px-4 py-3 font-body-md focus:outline-none focus:border-indigo-soft focus:ring-1 focus:ring-indigo-soft/50" id="description" name="description" placeholder="Ex: Conta de Luz" required type="text"/>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Data -->
              <div>
                <label class="block font-label-md text-on-surface-variant mb-2" for="date">Data</label>
                <div class="relative">
                  <input class="w-full bg-surface-container-highest border border-outline-variant/30 text-on-surface rounded-lg px-4 py-3 font-body-md focus:outline-none focus:border-indigo-soft focus:ring-1 focus:ring-indigo-soft/50 [color-scheme:dark]" id="date" name="date" required type="date"/>
                </div>
              </div>

              <!-- Categoria -->
              <div>
                <label class="block font-label-md text-on-surface-variant mb-2" for="category">Categoria</label>
                <div class="relative">
                  <select class="w-full bg-surface-container-highest border border-outline-variant/30 text-on-surface rounded-lg px-4 py-3 font-body-md appearance-none focus:outline-none focus:border-indigo-soft focus:ring-1 focus:ring-indigo-soft/50" id="category" name="category">
                    <option disabled selected value="">Selecione</option>
                    <option value="alimentacao">Alimentação</option>
                    <option value="moradia">Moradia</option>
                    <option value="transporte">Transporte</option>
                    <option value="lazer">Lazer</option>
                    <option value="saude">Saúde</option>
                    <option value="salario">Salário</option>
                  </select>
                  <span class="material-symbols-outlined absolute right-3 top-1/2 transform -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                </div>
              </div>
            </div>
          </form>
        </div>

        <!-- Modal Footer (Actions) -->
        <div class="px-6 py-5 border-t border-outline-variant/10 bg-surface/30 flex justify-end gap-4">
          <button (click)="closeModal()" class="px-5 py-2.5 rounded-lg text-sm font-label-md text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-colors cursor-pointer" type="button">
            Cancelar
          </button>
          <button (click)="saveTransaction()" class="px-6 py-2.5 rounded-lg bg-primary hover:bg-emerald-glow text-on-primary-fixed-variant text-sm font-label-md transition-all shadow-lg shadow-primary/20 cursor-pointer" type="button">
            Salvar Transação
          </button>
        </div>
      </div>
    </div>
  `
})
export class TransactionModalComponent {
  isOpen = input<boolean>(false);
  close = output<void>();

  closeModal() {
    this.close.emit();
  }

  saveTransaction() {
    this.close.emit();
  }
}
