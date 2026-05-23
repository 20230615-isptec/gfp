import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { PreferencesService } from '../../core/preferences.service';

interface Categoria { id: number; nome: string; tipo: 'receita' | 'despesa'; }

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [FormsModule, NgClass],
  template: `
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div><h2 class="text-2xl font-bold">{{ prefs.t('Categorias', 'Categories') }}</h2><p class="text-on-surface-variant">{{ prefs.t('Gerencie as classificacoes das suas transacoes.', 'Manage your transaction categories.') }}</p></div>
      <button (click)="openNew()" class="bg-primary text-on-primary px-6 py-3 rounded-lg inline-flex items-center gap-2 transition-all duration-200 hover:-translate-y-[1px]"><span class="material-symbols-outlined">add</span>{{ prefs.t('Nova Categoria', 'New Category') }}</button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="glass-card rounded-xl p-6"><p class="text-on-surface-variant text-xs uppercase">{{ prefs.t('Total', 'Total') }}</p><p class="text-3xl font-bold">{{ totalCount() }}</p></div>
      <div class="glass-card rounded-xl p-6"><p class="text-on-surface-variant text-xs uppercase">{{ prefs.t('Receitas', 'Income') }}</p><p class="text-3xl font-bold text-primary">{{ receitasCount() }}</p></div>
      <div class="glass-card rounded-xl p-6"><p class="text-on-surface-variant text-xs uppercase">{{ prefs.t('Despesas', 'Expenses') }}</p><p class="text-3xl font-bold text-danger-red">{{ despesasCount() }}</p></div>
    </div>

    <div class="glass-card rounded-xl overflow-hidden app-enter">
      <div class="p-4 border-b border-outline-variant/10"><input [(ngModel)]="q" class="input-base" [placeholder]="prefs.t('Procurar categorias...', 'Search categories...')"/></div>
      <table class="w-full"><thead><tr><th class="p-4 text-left">{{ prefs.t('Nome', 'Name') }}</th><th class="p-4 text-left">{{ prefs.t('Tipo', 'Type') }}</th><th class="p-4 text-right">{{ prefs.t('Acoes', 'Actions') }}</th></tr></thead>
        <tbody>
          @for (cat of filtered(); track cat.id) {
            <tr class="border-t border-outline-variant/10"><td class="p-4">{{cat.nome}}</td><td class="p-4"><span class="px-2 py-0.5 rounded-full text-xs" [ngClass]="cat.tipo==='receita'?'bg-primary/10 text-primary':'bg-danger-red/10 text-danger-red'">{{ cat.tipo === 'receita' ? prefs.t('receita', 'income') : prefs.t('despesa', 'expense') }}</span></td><td class="p-4 text-right"><button (click)="edit(cat)" class="soft-btn">{{ prefs.t('Editar', 'Edit') }}</button><button class="soft-btn soft-btn-danger text-danger-red ml-2" (click)="remove(cat.id)">{{ prefs.t('Excluir', 'Delete') }}</button></td></tr>
          } @empty { <tr><td colspan="3" class="p-6 text-center text-on-surface-variant">{{ prefs.t('Sem categorias.', 'No categories.') }}</td></tr> }
        </tbody>
      </table>
    </div>

    @if(showForm()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-deep-navy/80 backdrop-blur-sm" (click)="closeForm()">
        <form class="w-full max-w-md bg-surface-container border border-outline-variant/20 rounded-2xl shadow-2xl overflow-hidden text-left" (click)="$event.stopPropagation()" (ngSubmit)="save()">
          <div class="px-6 py-5 border-b border-outline-variant/10 flex items-center justify-between bg-surface/50">
            <h3 class="font-headline-sm text-[20px] text-on-surface flex items-center gap-2">
              <span class="material-symbols-outlined text-primary text-[24px]">category</span>
              {{ editingId() ? prefs.t('Editar', 'Edit') : prefs.t('Nova', 'New') }} {{ prefs.t('Categoria', 'Category') }}
            </h3>
            <button type="button" (click)="closeForm()" class="text-on-surface-variant hover:text-on-surface transition-colors p-1 rounded-md hover:bg-surface-variant/50">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <div class="p-6 space-y-5">
            <div>
              <label class="block font-label-md text-on-surface-variant mb-2">{{ prefs.t('Nome', 'Name') }}</label>
              <input class="w-full bg-surface-container-highest border border-outline-variant/30 text-on-surface rounded-lg px-4 py-3 font-body-md focus:outline-none focus:border-indigo-soft focus:ring-1 focus:ring-indigo-soft/50" [(ngModel)]="form.nome" name="nome" required minlength="3"/>
            </div>
            <div>
              <label class="block font-label-md text-on-surface-variant mb-2">{{ prefs.t('Tipo', 'Type') }}</label>
              <select class="w-full bg-surface-container-highest border border-outline-variant/30 text-on-surface rounded-lg px-4 py-3 font-body-md focus:outline-none focus:border-indigo-soft focus:ring-1 focus:ring-indigo-soft/50" [(ngModel)]="form.tipo" name="tipo" required><option value="receita">{{ prefs.t('receita', 'income') }}</option><option value="despesa">{{ prefs.t('despesa', 'expense') }}</option></select>
            </div>
          </div>

          <div class="px-6 py-5 border-t border-outline-variant/10 bg-surface/30 flex justify-end gap-3">
            <button type="button" (click)="closeForm()" class="px-5 py-2.5 rounded-lg text-sm font-label-md text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-colors">{{ prefs.t('Cancelar', 'Cancel') }}</button>
            <button type="submit" class="px-6 py-2.5 rounded-lg bg-primary hover:bg-emerald-glow text-on-primary-fixed-variant text-sm font-label-md transition-all shadow-lg shadow-primary/20">{{ prefs.t('Salvar', 'Save') }}</button>
          </div>
        </form>
      </div>
    }
  `
})
export class CategoriesComponent {
  private http = inject(HttpClient);
  prefs = inject(PreferencesService);
  categorias = signal<Categoria[]>([]);
  q = '';
  showForm = signal(false);
  editingId = signal<number | null>(null);
  form: any = { nome: '', tipo: 'receita' };

  ngOnInit() { this.load(); }
  load() { this.http.get<any>(`${environment.apiUrl}/categorias`).subscribe({ next: (r: any) => this.categorias.set(Array.isArray(r?.data) ? r.data : []) }); }
  filtered() { return this.categorias().filter((c) => !this.q || c.nome.toLowerCase().includes(this.q.toLowerCase())); }
  totalCount() { return this.categorias().length; }
  receitasCount() { return this.categorias().filter((c) => c.tipo === 'receita').length; }
  despesasCount() { return this.categorias().filter((c) => c.tipo === 'despesa').length; }
  openNew() { this.editingId.set(null); this.form = { nome: '', tipo: 'receita' }; this.showForm.set(true); }
  edit(c: Categoria) { this.editingId.set(c.id); this.form = { ...c }; this.showForm.set(true); }
  closeForm() { this.showForm.set(false); }
  save() { const req = this.editingId() ? this.http.put(`${environment.apiUrl}/categorias?id=${this.editingId()}`, this.form) : this.http.post(`${environment.apiUrl}/categorias`, this.form); req.subscribe({ next: () => { this.closeForm(); this.load(); } }); }
  remove(id: number) { this.http.delete(`${environment.apiUrl}/categorias?id=${id}`).subscribe({ next: () => this.load() }); }
}
