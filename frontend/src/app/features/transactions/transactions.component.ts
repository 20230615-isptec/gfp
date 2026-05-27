import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PreferencesService } from '../../core/preferences.service';
import { NotificationService } from '../../core/notification.service';

interface Categoria { id: number; nome: string; tipo: 'receita' | 'despesa'; }
interface Transacao { id: number | string; categoria_id: number | null; valor: number; tipo: 'receita'|'despesa'|'poupanca'; data: string; descricao: string; bloqueado?: boolean; }

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

    <div class="glass-card rounded-xl p-4 mb-6">
      <div class="filter-shell">
        <div class="filter-field md:max-w-sm">
          <span class="material-symbols-outlined filter-icon">search</span>
          <input [(ngModel)]="q" type="text" [placeholder]="prefs.t('Buscar por descricao...', 'Search by description...')" class="input-base text-sm"/>
        </div>
        <div class="filter-field compact">
          <span class="material-symbols-outlined filter-icon">category</span>
          <select [(ngModel)]="catFilter" class="input-base filter-select text-sm">
            <option value="">{{ prefs.t('Todas categorias', 'All categories') }}</option>
            @for(c of categorias(); track c.id){<option [value]="c.id">{{c.nome}}</option>}
          </select>
        </div>
        <div class="filter-pill-group">
          <button type="button" (click)="tipoFilter=''" class="filter-pill" [ngClass]="{'active': tipoFilter===''}"><span class="material-symbols-outlined text-[16px]">receipt_long</span>{{ prefs.t('Todos', 'All') }}</button>
          <button type="button" (click)="tipoFilter='receita'" class="filter-pill" [ngClass]="{'active': tipoFilter==='receita'}"><span class="material-symbols-outlined text-[16px]">trending_up</span>{{ prefs.t('Receitas', 'Income') }}</button>
          <button type="button" (click)="tipoFilter='despesa'" class="filter-pill danger" [ngClass]="{'active': tipoFilter==='despesa'}"><span class="material-symbols-outlined text-[16px]">trending_down</span>{{ prefs.t('Despesas', 'Expenses') }}</button>
        </div>
        @if(hasFilters()) {
          <button type="button" class="soft-btn inline-flex items-center gap-1" (click)="clearFilters()"><span class="material-symbols-outlined text-[16px]">filter_alt_off</span>{{ prefs.t('Limpar', 'Clear') }}</button>
        }
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
                <td class="py-4 px-6">
                  <span class="inline-flex px-2 py-0.5 rounded-full text-xs"
                        [ngClass]="t.tipo==='receita'?'bg-primary/10 text-primary':(t.tipo==='poupanca'?'bg-indigo-soft/10 text-indigo-soft':'bg-danger-red/10 text-danger-red')">
                    {{ tipoLabel(t.tipo) }}
                  </span>
                </td>
                <td class="py-4 px-6 text-right font-data" [ngClass]="t.tipo==='receita'?'text-primary':(t.tipo==='poupanca'?'text-indigo-soft':'text-danger-red')">{{ t.valor | currency:'AOA':'symbol' }}</td>
                <td class="py-4 px-6 text-right">
                  @if(!t.bloqueado) {
                    <button (click)="edit(t)" class="soft-btn mr-2">{{ prefs.t('Editar', 'Edit') }}</button>
                    <button (click)="remove(t.id)" class="soft-btn soft-btn-danger text-danger-red">{{ prefs.t('Excluir', 'Delete') }}</button>
                  } @else {
                    <span class="text-xs text-on-surface-variant">{{ prefs.t('Movimento de meta', 'Goal movement') }}</span>
                  }
                </td>
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
  private notifications = inject(NotificationService);
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
      },
      error: (e) => this.notifications.error(e?.error?.message ?? this.prefs.t('Não foi possível carregar as transações. Tente atualizar a página.', 'Could not load transactions. Try refreshing the page.'))
    });
  }

  filtered() {
    return this.transacoes().filter((t) => (!this.q || t.descricao.toLowerCase().includes(this.q.toLowerCase())) && (!this.catFilter || String(t.categoria_id) === String(this.catFilter)) && (!this.tipoFilter || t.tipo === this.tipoFilter));
  }
  categoriaNome(id: number | null) { return id === null ? this.prefs.t('Cofre virtual', 'Virtual vault') : (this.categorias().find((c) => c.id === id)?.nome || '-'); }
  tipoLabel(tipo: Transacao['tipo']) { return tipo === 'receita' ? this.prefs.t('receita', 'income') : (tipo === 'poupanca' ? this.prefs.t('poupança', 'savings') : this.prefs.t('despesa', 'expense')); }
  openNew() { this.editingId.set(null); this.form = { descricao: '', valor: '', data: new Date().toISOString().split('T')[0], tipo: 'receita', categoria_id: '' }; this.showForm.set(true); }
  edit(t: Transacao) { this.editingId.set(Number(t.id)); this.form = { ...t }; this.showForm.set(true); }
  closeForm() { this.showForm.set(false); }

  save() {
    if (!this.validarFormulario()) {
      return;
    }

    const payload = { ...this.form, descricao: this.form.descricao ?? this.form.Descricao ?? '', valor: Number(this.form.valor), categoria_id: Number(this.form.categoria_id) };
    const req = this.editingId() ? this.http.put(`${environment.apiUrl}/transacoes?id=${this.editingId()}`, payload) : this.http.post(`${environment.apiUrl}/transacoes`, payload);
    req.subscribe({
      next: () => { this.notifications.success(this.prefs.t('Transação guardada com sucesso.', 'Transaction saved successfully.')); this.closeForm(); this.load(); },
      error: (e) => this.notifications.error(e?.error?.message ?? this.prefs.t('Revise os dados e tente guardar novamente.', 'Review the data and try saving again.'))
    });
  }
  remove(id: number | string) {
    this.http.delete(`${environment.apiUrl}/transacoes?id=${id}`).subscribe({
      next: () => {
        this.notifications.success(this.prefs.t('Transação removida da sua lista.', 'Transaction removed from your list.'));
        this.load();
      },
      error: (e) => this.notifications.error(e?.error?.message ?? this.prefs.t('Não foi possível excluir esta transação.', 'Could not delete this transaction.'))
    });
  }

  exportCsv() {
    this.http.get(`${environment.apiUrl}/exportar/csv`, { responseType: 'blob' }).subscribe({
      next: (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transacoes-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        this.notifications.success(this.prefs.t('CSV exportado. Verifique a pasta de downloads.', 'CSV exported. Check your downloads folder.'));
      },
      error: () => this.notifications.error(this.prefs.t('Não foi possível exportar o CSV neste momento.', 'Could not export the CSV right now.'))
    });
  }

  hasFilters(): boolean { return !!this.q || !!this.catFilter || !!this.tipoFilter; }
  clearFilters(): void { this.q = ''; this.catFilter = ''; this.tipoFilter = ''; }

  private validarFormulario(): boolean {
    const descricao = String(this.form.descricao ?? this.form.Descricao ?? '').trim();
    const valor = Number(this.form.valor);
    const categoriaId = Number(this.form.categoria_id);
    const data = String(this.form.data ?? '');

    if (descricao.length < 3) {
      this.notifications.warning(this.prefs.t('Informe uma descrição com pelo menos 3 caracteres.', 'Enter a description with at least 3 characters.'));
      return false;
    }

    if (!Number.isFinite(valor) || valor <= 0) {
      this.notifications.warning(this.prefs.t('O valor da transação deve ser maior que zero.', 'Transaction amount must be greater than zero.'));
      return false;
    }

    if (!categoriaId) {
      this.notifications.warning(this.prefs.t('Selecione uma categoria para a transação.', 'Select a transaction category.'));
      return false;
    }

    if (this.form.tipo !== 'receita' && this.form.tipo !== 'despesa') {
      this.notifications.warning(this.prefs.t('Selecione se a transação é receita ou despesa.', 'Select whether the transaction is income or expense.'));
      return false;
    }

    if (!this.isIsoDate(data)) {
      this.notifications.warning(this.prefs.t('Informe uma data válida.', 'Enter a valid date.'));
      return false;
    }

    return true;
  }

  private isIsoDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }
}
