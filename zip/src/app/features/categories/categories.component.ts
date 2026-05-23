import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-categories',
  standalone: true,
  template: `
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h2 class="font-headline-sm text-on-surface mb-1 text-2xl font-bold">Categorias</h2>
        <p class="font-body-md text-on-surface-variant">Gerencie as classificações das suas transações.</p>
      </div>
      <button (click)="openModal()" class="bg-primary text-on-primary font-label-md px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-primary-fixed-dim hover:shadow-[0_0_15px_rgba(78,222,163,0.4)] transition-all duration-300 active:scale-95 shadow-lg cursor-pointer">
        <span class="material-symbols-outlined">add</span>
        Nova Categoria
      </button>
    </div>

    <!-- Analytics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-left">
      <div class="glass-card rounded-xl p-6 hover:bg-slate-800/80 transition-all duration-300 flex items-center gap-4">
        <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <span class="material-symbols-outlined">category</span>
        </div>
        <div>
          <p class="font-label-md text-on-surface-variant uppercase tracking-wider text-[10px]">Total de Categorias</p>
          <p class="font-headline-md text-on-surface mt-1">24</p>
        </div>
      </div>
      <div class="glass-card rounded-xl p-6 hover:bg-slate-800/80 transition-all duration-300 flex items-center gap-4">
        <div class="w-12 h-12 rounded-full bg-emerald-glow/10 flex items-center justify-center text-emerald-glow">
          <span class="material-symbols-outlined">trending_up</span>
        </div>
        <div>
          <p class="font-label-md text-on-surface-variant uppercase tracking-wider text-[10px]">Tipos de Receita</p>
          <p class="font-headline-md text-on-surface mt-1">8</p>
        </div>
      </div>
      <div class="glass-card rounded-xl p-6 hover:bg-slate-800/80 transition-all duration-300 flex items-center gap-4">
        <div class="w-12 h-12 rounded-full bg-indigo-soft/10 flex items-center justify-center text-indigo-soft">
          <span class="material-symbols-outlined">trending_down</span>
        </div>
        <div>
          <p class="font-label-md text-on-surface-variant uppercase tracking-wider text-[10px]">Tipos de Despesa</p>
          <p class="font-headline-md text-on-surface mt-1">16</p>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="glass-card rounded-xl overflow-hidden shadow-2xl">
      <div class="p-6 border-b border-outline-variant/10 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-800/30">
        <div class="relative w-full sm:w-96">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
          <input type="text" placeholder="Procurar categorias..." class="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg py-2 pl-10 pr-4 text-on-surface focus:outline-none focus:border-indigo-soft focus:ring-1 focus:ring-indigo-soft transition-colors font-body-md placeholder-on-surface-variant/50"/>
        </div>
      </div>
      <div class="overflow-x-auto text-left">
        <table class="w-full border-collapse">
          <thead>
            <tr class="bg-surface-container-lowest/50 border-b border-outline-variant/20">
              <th class="py-4 px-6 font-label-md text-on-surface-variant uppercase tracking-wider w-1/2">Nome</th>
              <th class="py-4 px-6 font-label-md text-on-surface-variant uppercase tracking-wider w-1/4">Tipo</th>
              <th class="py-4 px-6 font-label-md text-on-surface-variant uppercase tracking-wider w-1/4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-outline-variant/10">
            @for (cat of categories(); track cat.id) {
              <tr class="hover:bg-surface-bright/20 transition-colors group">
                <td class="py-4 px-6">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded flex items-center justify-center" [class]="cat.type === 'revenue' ? 'bg-primary/10 text-primary' : 'bg-indigo-soft/10 text-indigo-soft'">
                      <span class="material-symbols-outlined text-[18px]">{{ cat.icon }}</span>
                    </div>
                    <span class="font-body-md text-on-surface font-medium">{{ cat.name }}</span>
                  </div>
                </td>
                <td class="py-4 px-6">
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-label-md text-xs" [class]="cat.type === 'revenue' ? 'bg-emerald-glow/10 text-emerald-glow' : 'bg-indigo-soft/10 text-indigo-soft'">
                    <span class="w-1.5 h-1.5 rounded-full" [class]="cat.type === 'revenue' ? 'bg-emerald-glow' : 'bg-indigo-soft'"></span>
                    {{ cat.type === 'revenue' ? 'Receita' : 'Despesa' }}
                  </span>
                </td>
                <td class="py-4 px-6 text-right">
                  <div class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="p-2 rounded-md text-on-surface-variant hover:text-indigo-soft hover:bg-indigo-soft/10 transition-colors" title="Editar">
                      <span class="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                    <button class="p-2 rounded-md text-on-surface-variant hover:text-danger-red hover:bg-danger-red/10 transition-colors" title="Eliminar">
                      <span class="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    @if(isModalOpen()) {
      <!-- Overlay / Modal -->
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-deep-navy/80 backdrop-blur-sm">
        <!-- Modal Container -->
        <div class="w-full max-w-md bg-surface-container-lowest border border-outline-variant/20 rounded-2xl shadow-2xl relative overflow-hidden transform transition-all text-left">
          <!-- Modal Header -->
          <div class="px-6 py-5 border-b border-outline-variant/10 flex items-center justify-between bg-surface/50">
            <h3 class="font-headline-sm text-[20px] text-on-surface flex items-center gap-2">
              <span class="material-symbols-outlined text-primary text-[24px]">category</span>
              Nova Categoria
            </h3>
            <button (click)="closeModal()" class="text-on-surface-variant hover:text-on-surface transition-colors p-1 rounded-md hover:bg-surface-variant/50 cursor-pointer">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <!-- Modal Body (Form) -->
          <form class="p-6 space-y-6">
            <!-- Nome Field -->
            <div>
              <label class="block font-label-md justify-start flex text-on-surface-variant mb-2" for="categoria-nome">Nome <span class="text-danger-red ml-1">*</span></label>
              <div class="relative">
                <input class="w-full bg-surface-container-highest border border-outline-variant/30 text-on-surface rounded-lg px-4 py-3 text-sm font-body-md focus:outline-none focus:border-indigo-soft focus:ring-1 focus:ring-indigo-soft/50 shadow-[0_0_0_2px_rgba(129,140,248,0.2)]" id="categoria-nome" name="categoria-nome" placeholder="Ex: Alimentação, Salário..." type="text" value="Freelance"/>
                <!-- Validation Hint (Success) -->
                <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-primary text-[18px]">check_circle</span>
              </div>
              <p class="mt-1.5 text-[12px] text-primary font-medium text-left">Nome disponível.</p>
            </div>

            <!-- Tipo Field (Select) -->
            <div>
              <label class="block font-label-md flex justify-start text-on-surface-variant mb-2">Tipo <span class="text-danger-red ml-1">*</span></label>
              <!-- Custom styled segmented control -->
              <div class="grid grid-cols-2 gap-4">
                <label class="cursor-pointer relative">
                  <input checked class="peer sr-only" name="categoria-tipo" type="radio" value="receita"/>
                  <div class="rounded-lg border border-outline-variant/30 bg-surface-container-highest p-4 text-center hover:bg-surface-variant/50 transition-all peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:shadow-[0_0_15px_rgba(78,222,163,0.1)]">
                    <span class="material-symbols-outlined text-primary mb-2 text-[28px]">trending_up</span>
                    <div class="font-label-md text-sm text-on-surface peer-checked:text-primary">Receita</div>
                  </div>
                  <div class="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                </label>
                <label class="cursor-pointer relative">
                  <input class="peer sr-only" name="categoria-tipo" type="radio" value="despesa"/>
                  <div class="rounded-lg border border-outline-variant/30 bg-surface-container-highest p-4 text-center hover:bg-surface-variant/50 transition-all peer-checked:border-danger-red peer-checked:bg-danger-red/5 peer-checked:shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                    <span class="material-symbols-outlined text-danger-red mb-2 text-[28px]">trending_down</span>
                    <div class="font-label-md text-sm text-on-surface peer-checked:text-danger-red">Despesa</div>
                  </div>
                  <div class="absolute top-2 right-2 w-2 h-2 rounded-full bg-danger-red opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                </label>
              </div>
            </div>

            <!-- Color/Icon Selection -->
            <div>
              <label class="block font-label-md text-left text-on-surface-variant mb-3">Ícone Decorativo</label>
              <div class="flex gap-3">
                <button class="w-10 h-10 rounded-lg bg-primary/10 border border-primary text-primary flex items-center justify-center ring-2 ring-primary/20 cursor-pointer" type="button">
                  <span class="material-symbols-outlined text-[20px]">work</span>
                </button>
                <button class="w-10 h-10 rounded-lg bg-surface-container-highest border border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant flex items-center justify-center transition-colors cursor-pointer" type="button">
                  <span class="material-symbols-outlined text-[20px]">payments</span>
                </button>
                <button class="w-10 h-10 rounded-lg bg-surface-container-highest border border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant flex items-center justify-center transition-colors cursor-pointer" type="button">
                  <span class="material-symbols-outlined text-[20px]">account_balance</span>
                </button>
                <button class="w-10 h-10 rounded-lg bg-surface-container-highest border border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant flex items-center justify-center transition-colors cursor-pointer" type="button">
                  <span class="material-symbols-outlined text-[20px]">more_horiz</span>
                </button>
              </div>
            </div>
          </form>

          <!-- Modal Footer (Actions) -->
          <div class="px-6 py-5 border-t border-outline-variant/10 bg-surface/30 flex justify-end gap-4">
            <button (click)="closeModal()" class="px-5 py-2.5 rounded-lg text-sm font-label-md text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-colors cursor-pointer" type="button">
              Cancelar
            </button>
            <button (click)="saveCategory()" class="px-6 py-2.5 rounded-lg bg-primary hover:bg-emerald-glow text-on-primary-fixed-variant text-sm font-label-md transition-all shadow-lg shadow-primary/20 flex items-center gap-2 cursor-pointer" type="button">
              Criar Categoria
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class CategoriesComponent {
  isModalOpen = signal(false);

  categories = signal([
    { id: 1, name: 'Salário', type: 'revenue', icon: 'work' },
    { id: 2, name: 'Alimentação', type: 'expense', icon: 'restaurant' },
    { id: 3, name: 'Moradia', type: 'expense', icon: 'home' },
    { id: 4, name: 'Investimentos', type: 'revenue', icon: 'trending_up' }
  ]);

  openModal() {
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  saveCategory() {
    this.closeModal();
    // Normally would add category to the signal
  }
}
