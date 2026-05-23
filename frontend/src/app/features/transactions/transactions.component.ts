import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PreferencesService } from '../../core/preferences.service';

interface Categoria { id: number; nome: string; tipo: 'receita' | 'despesa'; }
interface Transacao { id: number; categoria_id: number; valor: number; tipo: 'receita'|'despesa'; data: string; descricao: string; }

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, FormsModule, NgClass],
  template: `
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div><h1 class="text-2xl font-bold">{{ prefs.t('Transacoes', 'Transactions') }}</h1><p class="text-on-surface-variant text-sm">{{ prefs.t('Gerencie suas receitas e despesas com precisao.', 'Manage your income and expenses accurately.') }}</p></div>
      <div class="flex items-center gap-3 w-full sm:w-auto">
        <button class="soft-btn inline-flex items-center" (click)="exportCsv()"><span class="material-symbols-outlined text-sm mr-1">download</span>{{ prefs.t('Exportar', 'Export') }}</button>
        <button (click)="openNew()" class="px-4 py-2 rounded-lg bg-primary text-on-primary-fixed-variant shadow-[0_0_15px_rgba(78,222,163,0.3)] transition-all duration-200 hover:-translate-y-[1px]"><span class="material-symbols-outlined text-sm mr-1">add</span>{{ prefs.t('Nova', 'New') }}</button>
      </div>
    </div>

    <div class="glass-card rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
      <div class="relative w-full md:w-96"><span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span><input [(ngModel)]="q" type="text" [placeholder]="prefs.t('Buscar por descricao...', 'Search by description...')" class="input-base py-2.5 pl-10 pr-4 text-sm"/></div>
      <div class="flex flex-wrap gap-3 w-full md:w-auto">
        <select [(ngModel)]="catFilter" class="bg-surface-container-highest border border-outline-variant/30 rounded-lg py-2.5 pl-3 pr-8 text-sm appearance-none"><option value="">{{ prefs.t('Todas as Categorias', 'All Categories') }}</option>@for(c of categorias(); track c.id){<option [value]="c.id">{{c.nome}}</option>}</select>
        <div class="flex bg-surface-container-highest rounded-lg p-1 border border-outline-variant/30">
          <button (click)="tipoFilter=''" class="px-3 py-1.5 rounded-md text-xs" [ngClass]="tipoFilter==='' ? 'bg-surface-container text-on-surface':'text-on-surface-variant'">{{ prefs.t('Todos', 'All') }}</button>
          <button (click)="tipoFilter='receita'" class="px-3 py-1.5 rounded-md text-xs" [ngClass]="tipoFilter==='receita' ? 'bg-primary/10 text-primary':'text-on-surface-variant'">{{ prefs.t('Receitas', 'Income') }}</button>
          <button (click)="tipoFilter='despesa'" class="px-3 py-1.5 rounded-md text-xs" [ngClass]="tipoFilter==='despesa' ? 'bg-danger-red/10 text-danger-red':'text-on-surface-variant'">{{ prefs.t('Despesas', 'Expenses') }}</button>
        </div>
      </div>
    </div>

    <div class="glass-card rounded-xl overflow-hidden app-enter">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse min-w-[800px]"><thead><tr class="border-b border-outline-variant/20 bg-surface-container/50"><th class="py-4 px-6">{{ prefs.t('Descricao', 'Description') }}</th><th class="py-4 px-6">{{ prefs.t('Data', 'Date') }}</th><th class="py-4 px-6">{{ prefs.t('Categoria', 'Category') }}</th><th class="py-4 px-6">{{ prefs.t('Tipo', 'Type') }}</th><th class="py-4 px-6 text-right">{{ prefs.t('Valor', 'Amount') }}</th><th class="py-4 px-6 text-right">{{ prefs.t('Acoes', 'Actions') }}</th></tr></thead>
          <tbody class="divide-y divide-outline-variant/10">
            @for (t of filtered(); track t.id) {
              <tr class="table-row-hover transition-colors">
                <td class="py-4 px-6">{{ t.descricao }}</td>
                <td class="py-4 px-6 text-on-surface-variant">{{ t.data | date:'dd/MM/yyyy' }}</td>
                <td class="py-4 px-6">{{ categoriaNome(t.categoria_id) }}</td>
                <td class="py-4 px-6"><span class="inline-flex px-2 py-0.5 rounded-full text-xs" [ngClass]="t.tipo==='receita'?'bg-primary/10 text-primary':'bg-danger-red/10 text-danger-red'">{{ t.tipo === 'receita' ? prefs.t('receita', 'income') : prefs.t('despesa', 'expense') }}</span></td>
                <td class="py-4 px-6 text-right font-data" [ngClass]="t.tipo==='receita'?'text-primary':'text-danger-red'">{{ t.valor | currency:'AOA':'symbol' }}</td>
                <td class="py-4 px-6 text-right"><button (click)="edit(t)" class="soft-btn mr-2">{{ prefs.t('Editar', 'Edit') }}</button><button (click)="remove(t.id)" class="soft-btn soft-btn-danger text-danger-red">{{ prefs.t('Excluir', 'Delete') }}</button></td>
              </tr>
            } @empty { <tr><td colspan="6" class="py-8 text-center text-on-surface-variant">{{ prefs.t('Nenhuma transacao encontrada.', 'No transactions found.') }}</td></tr> }
          </tbody>
        </table>
      </div>
    </div>

    @if(showForm()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-deep-navy/80 backdrop-blur-sm" (click)="closeForm()">
        <form class="w-full max-w-lg bg-surface-container border border-outline-variant/20 rounded-2xl shadow-2xl overflow-hidden text-left" (click)="$event.stopPropagation()" (ngSubmit)="save()">
          <div class="px-6 py-5 border-b border-outline-variant/10 flex items-center justify-between bg-surface/50">
            <h3 class="font-headline-sm text-[20px] text-on-surface flex items-center gap-2">
              <span class="material-symbols-outlined text-primary text-[24px]">receipt_long</span>
              {{ editingId() ? prefs.t('Editar', 'Edit') : prefs.t('Nova', 'New') }} {{ prefs.t('Transacao', 'Transaction') }}
            </h3>
            <button type="button" (click)="closeForm()" class="text-on-surface-variant hover:text-on-surface transition-colors p-1 rounded-md hover:bg-surface-variant/50">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <div class="p-6 space-y-5">
            <div>
              <label class="block font-label-md text-on-surface-variant mb-2">{{ prefs.t('Tipo', 'Type') }}</label>
              <div class="grid grid-cols-2 gap-4">
                <label class="cursor-pointer relative">
                  <input class="peer sr-only" type="radio" name="tipo_visual" [checked]="form.tipo === 'receita'" (change)="form.tipo = 'receita'"/>
                  <div class="rounded-lg border border-outline-variant/30 bg-surface-container-highest p-4 text-center hover:bg-surface-variant/50 transition-all peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:shadow-[0_0_15px_rgba(78,222,163,0.1)]">
                    <span class="material-symbols-outlined text-primary mb-2 text-[28px]">trending_up</span>
                    <div class="font-label-md text-sm text-on-surface">{{ prefs.t('Receita', 'Income') }}</div>
                  </div>
                </label>
                <label class="cursor-pointer relative">
                  <input class="peer sr-only" type="radio" name="tipo_visual" [checked]="form.tipo === 'despesa'" (change)="form.tipo = 'despesa'"/>
                  <div class="rounded-lg border border-outline-variant/30 bg-surface-container-highest p-4 text-center hover:bg-surface-variant/50 transition-all peer-checked:border-danger-red peer-checked:bg-danger-red/5 peer-checked:shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                    <span class="material-symbols-outlined text-danger-red mb-2 text-[28px]">trending_down</span>
                    <div class="font-label-md text-sm text-on-surface">{{ prefs.t('Despesa', 'Expense') }}</div>
                  </div>
                </label>
              </div>
            </div>
            <div>
              <label class="block font-label-md text-on-surface-variant mb-2">{{ prefs.t('Descricao', 'Description') }}</label>
              <input class="w-full bg-surface-container-highest border border-outline-variant/30 text-on-surface rounded-lg px-4 py-3 font-body-md focus:outline-none focus:border-indigo-soft focus:ring-1 focus:ring-indigo-soft/50" [(ngModel)]="form.descricao" name="descricao" [placeholder]="prefs.t('Descricao', 'Description')" required/>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block font-label-md text-on-surface-variant mb-2">{{ prefs.t('Valor', 'Amount') }}</label>
                <input class="w-full bg-surface-container-highest border border-outline-variant/30 text-on-surface rounded-lg px-4 py-3 font-data focus:outline-none focus:border-indigo-soft focus:ring-1 focus:ring-indigo-soft/50" [(ngModel)]="form.valor" name="valor" type="number" step="0.01" min="0.01" required/>
              </div>
              <div>
                <label class="block font-label-md text-on-surface-variant mb-2">{{ prefs.t('Data', 'Date') }}</label>
                <input class="w-full bg-surface-container-highest border border-outline-variant/30 text-on-surface rounded-lg px-4 py-3 font-body-md focus:outline-none focus:border-indigo-soft focus:ring-1 focus:ring-indigo-soft/50" [(ngModel)]="form.data" name="data" type="date" required/>
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input type="hidden" [(ngModel)]="form.tipo" name="tipo" />
              <div>
                <label class="block font-label-md text-on-surface-variant mb-2">{{ prefs.t('Categoria', 'Category') }}</label>
                <select class="w-full bg-surface-container-highest border border-outline-variant/30 text-on-surface rounded-lg px-4 py-3 font-body-md focus:outline-none focus:border-indigo-soft focus:ring-1 focus:ring-indigo-soft/50" [(ngModel)]="form.categoria_id" name="categoria_id" required>@for(c of categorias(); track c.id){<option [value]="c.id">{{ c.nome }}</option>}</select>
              </div>
            </div>
          </div>

          <div class="px-6 py-5 border-t border-outline-variant/10 bg-surface/30 flex justify-end gap-3">
            <button type="button" (click)="closeForm()" class="px-5 py-2.5 rounded-lg text-sm font-label-md text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-colors">{{ prefs.t('Cancelar', 'Cancel') }}</button>
            <button class="px-6 py-2.5 rounded-lg bg-primary hover:bg-emerald-glow text-on-primary-fixed-variant text-sm font-label-md transition-all shadow-lg shadow-primary/20" type="submit">{{ prefs.t('Salvar', 'Save') }}</button>
          </div>
        </form>
      </div>
    }
  `
})
export class TransactionsComponent {
  private http = inject(HttpClient);
  prefs = inject(PreferencesService);
  transacoes = signal<Transacao[]>([]);
  categorias = signal<Categoria[]>([]);
  showForm = signal(false);
  editingId = signal<number | null>(null);
  q = '';
  catFilter = '';
  tipoFilter = '';
  form: any = { descricao: '', valor: '', data: '', tipo: 'receita', categoria_id: '' };

  ngOnInit() { this.load(); }
  load() {
    this.http.get<any>(`${environment.apiUrl}/categorias`).subscribe({ next: (r: any) => this.categorias.set(Array.isArray(r?.data) ? r.data : []) });
    this.http.get<any>(`${environment.apiUrl}/transacoes`).subscribe({
      next: (r: any) => {
        const list = Array.isArray(r?.data) ? r.data : [];
        this.transacoes.set(list.map((item: any) => ({ ...item, descricao: item?.descricao ?? item?.Descricao ?? '' })));
      }
    });
  }

  filtered() {
    return this.transacoes().filter((t) => (!this.q || t.descricao.toLowerCase().includes(this.q.toLowerCase())) && (!this.catFilter || String(t.categoria_id) === String(this.catFilter)) && (!this.tipoFilter || t.tipo === this.tipoFilter));
  }
  categoriaNome(id: number) { return this.categorias().find((c) => c.id === id)?.nome || '-'; }
  openNew() { this.editingId.set(null); this.form = { descricao: '', valor: '', data: new Date().toISOString().split('T')[0], tipo: 'receita', categoria_id: '' }; this.showForm.set(true); }
  edit(t: Transacao) { this.editingId.set(t.id); this.form = { ...t }; this.showForm.set(true); }
  closeForm() { this.showForm.set(false); }

  save() {
    const payload = { ...this.form, descricao: this.form.descricao ?? this.form.Descricao ?? '', valor: Number(this.form.valor), categoria_id: Number(this.form.categoria_id) };
    const req = this.editingId() ? this.http.put(`${environment.apiUrl}/transacoes?id=${this.editingId()}`, payload) : this.http.post(`${environment.apiUrl}/transacoes`, payload);
    req.subscribe({ next: () => { this.closeForm(); this.load(); } });
  }
  remove(id: number) { this.http.delete(`${environment.apiUrl}/transacoes?id=${id}`).subscribe({ next: () => this.load() }); }

  exportCsv() {
    this.http.get(`${environment.apiUrl}/exportar/csv`, { responseType: 'blob' }).subscribe({
      next: (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transacoes-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  }
}
