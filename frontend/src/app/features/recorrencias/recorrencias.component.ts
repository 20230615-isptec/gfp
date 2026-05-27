import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PreferencesService } from '../../core/preferences.service';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal.component';
import { NotificationService } from '../../core/notification.service';

@Component({
  selector: 'app-recorrencias',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmModalComponent],
  template: `
    <section class="app-enter space-y-6">
      <div>
        <h2 class="text-3xl font-bold text-on-surface mb-2">{{ prefs.t('Recorrências', 'Recurrences') }}</h2>
        <p class="text-on-surface-variant">{{ prefs.t('Automatize seus fluxos financeiros regulares.', 'Automate your regular financial flows.') }}</p>
        <p class="text-xs text-on-surface-variant mt-1">{{ prefs.t('As regras são processadas quando o utilizador acede ao dashboard (gatilho por acesso).', 'Rules are processed when user opens dashboard (trigger on access).') }}</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-1">
          <div class="glass-card rounded-xl p-6 h-full border-white/5">
            <h3 class="text-xl font-bold mb-4">{{ prefs.t('Nova Regra', 'New Rule') }}</h3>
            <form class="space-y-4" (ngSubmit)="criar()">
              <input [(ngModel)]="form.descricao" name="descricao" class="input-base w-full" [placeholder]="prefs.t('Descrição', 'Description')" required>
              <select [(ngModel)]="form.categoria_id" name="categoria_id" class="input-base w-full" required>
                <option value="">{{ prefs.t('Categoria', 'Category') }}</option>
                @for (c of categorias(); track c.id) { <option [value]="c.id">{{ c.nome }}</option> }
              </select>
              <div class="grid grid-cols-2 gap-3">
                <select [(ngModel)]="form.tipo" name="tipo" class="input-base"><option value="despesa">{{ prefs.t('Despesa', 'Expense') }}</option><option value="receita">{{ prefs.t('Receita', 'Income') }}</option></select>
              <input [(ngModel)]="form.valor" name="valor" type="number" min="1" class="input-base" [placeholder]="prefs.t('Valor', 'Amount')" required>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <select [(ngModel)]="form.frequencia" name="frequencia" class="input-base"><option value="mensal">{{ prefs.t('Mensal', 'Monthly') }}</option><option value="semanal">{{ prefs.t('Semanal', 'Weekly') }}</option></select>
                <input [(ngModel)]="form.dia_vencimento" name="dia_vencimento" type="number" min="1" [max]="form.frequencia === 'semanal' ? 7 : 31" class="input-base" [placeholder]="prefs.t('Dia', 'Day')" required>
              </div>
              <button class="w-full bg-primary text-on-primary rounded-lg px-4 py-3 font-bold">{{ prefs.t('Criar Regra', 'Create Rule') }}</button>
            </form>
          </div>
        </div>

        <div class="lg:col-span-2">
          <div class="glass-card rounded-xl p-6 h-full border-white/5">
            <h3 class="text-xl font-bold mb-4">{{ prefs.t('Regras Ativas', 'Active Rules') }}</h3>
            <div class="space-y-2">
              @for (r of regras(); track r.id) {
                <div class="p-3 rounded-lg bg-surface-container border border-outline-variant/20 flex justify-between items-center gap-3">
                  <div>
                    <div class="font-semibold">{{ r.descricao }}</div>
                    <div class="text-xs text-on-surface-variant">{{ r.frequencia }} · {{ prefs.t('dia', 'day') }} {{ r.dia_vencimento }} · {{ r.tipo }} · {{ r.ativo === false ? prefs.t('Inativa', 'Inactive') : prefs.t('Ativa', 'Active') }}</div>
                    @if(r.ultima_geracao) {
                      <div class="text-[11px] text-on-surface-variant">{{ prefs.t('Última geração', 'Last generation') }}: {{ r.ultima_geracao }}</div>
                    }
                  </div>
                  <button (click)="askDelete(r.id)" class="soft-btn soft-btn-danger">{{ prefs.t('Desativar', 'Disable') }}</button>
                </div>
              } @empty {
                <div class="text-on-surface-variant">{{ prefs.t('Sem regras.', 'No rules.') }}</div>
              }
            </div>
          </div>
        </div>
      </div>

      <app-confirm-modal [open]="confirmOpen()" [title]="prefs.t('Desativar Regra', 'Disable Rule')" [message]="prefs.t('Deseja realmente desativar esta regra recorrente?', 'Do you really want to disable this recurring rule?')" [confirmLabel]="prefs.t('Desativar', 'Disable')" [cancelLabel]="prefs.t('Cancelar', 'Cancel')" (confirm)="confirmDelete()" (cancel)="confirmOpen.set(false)"></app-confirm-modal>
    </section>
  `
})
export class RecorrenciasComponent {
  private http = inject(HttpClient);
  prefs = inject(PreferencesService);
  private notifications = inject(NotificationService);
  regras = signal<any[]>([]);
  categorias = signal<any[]>([]);
  confirmOpen = signal(false);
  deletingId = signal<number | null>(null);
  form: any = { categoria_id: '', valor: '', tipo: 'despesa', frequencia: 'mensal', dia_vencimento: 1, descricao: '' };

  ngOnInit(): void { this.load(); this.loadCategorias(); }
  loadCategorias(): void {
    this.http.get<any>(`${environment.apiUrl}/categorias`).subscribe({
      next: (r) => this.categorias.set(Array.isArray(r?.data) ? r.data : []),
      error: (e) => this.notifications.error(e?.error?.message ?? this.prefs.t('Não foi possível carregar as categorias.', 'Could not load categories.'))
    });
  }
  load(): void {
    this.http.get<any>(`${environment.apiUrl}/transacoes-recorrentes`).subscribe({
      next: (r) => this.regras.set(Array.isArray(r?.data) ? r.data : []),
      error: (e) => this.notifications.error(e?.error?.message ?? this.prefs.t('Não foi possível carregar as recorrências.', 'Could not load recurrences.'))
    });
  }
  criar(): void {
    if (!this.validarFormulario()) {
      return;
    }

    this.http.post(`${environment.apiUrl}/transacoes-recorrentes`, this.form).subscribe({
      next: () => {
        this.notifications.success(this.prefs.t('Regra recorrente criada. Ela será processada automaticamente.', 'Recurring rule created. It will be processed automatically.'));
        this.form = { categoria_id: '', valor: '', tipo: 'despesa', frequencia: 'mensal', dia_vencimento: 1, descricao: '' };
        this.load();
      },
      error: (e) => this.notifications.error(e?.error?.message ?? this.prefs.t('Revise os dados da regra recorrente.', 'Review the recurring rule data.'))
    });
  }

  private validarFormulario(): boolean {
    const descricao = String(this.form.descricao ?? '').trim();
    const valor = Number(this.form.valor);
    const categoriaId = Number(this.form.categoria_id);
    const dia = Number(this.form.dia_vencimento);
    const frequencia = String(this.form.frequencia ?? '');

    if (descricao.length < 3) {
      this.notifications.warning(this.prefs.t('Informe uma descrição com pelo menos 3 caracteres.', 'Enter a description with at least 3 characters.'));
      return false;
    }

    if (!categoriaId) {
      this.notifications.warning(this.prefs.t('Selecione uma categoria para a recorrência.', 'Select a recurrence category.'));
      return false;
    }

    if (this.form.tipo !== 'receita' && this.form.tipo !== 'despesa') {
      this.notifications.warning(this.prefs.t('Selecione receita ou despesa.', 'Select income or expense.'));
      return false;
    }

    if (!Number.isFinite(valor) || valor <= 0) {
      this.notifications.warning(this.prefs.t('O valor da recorrência deve ser maior que zero.', 'Recurrence amount must be greater than zero.'));
      return false;
    }

    if (frequencia !== 'mensal' && frequencia !== 'semanal') {
      this.notifications.warning(this.prefs.t('Selecione uma frequência válida.', 'Select a valid frequency.'));
      return false;
    }

    const limite = frequencia === 'semanal' ? 7 : 31;
    if (!Number.isInteger(dia) || dia < 1 || dia > limite) {
      this.notifications.warning(frequencia === 'semanal' ? this.prefs.t('Para recorrência semanal, use um dia entre 1 e 7.', 'For weekly recurrence, use a day from 1 to 7.') : this.prefs.t('Para recorrência mensal, use um dia entre 1 e 31.', 'For monthly recurrence, use a day from 1 to 31.'));
      return false;
    }

    this.form.descricao = descricao;
    return true;
  }
  askDelete(id: number): void {
    this.deletingId.set(id);
    this.confirmOpen.set(true);
  }
  confirmDelete(): void {
    const id = this.deletingId();
    if (!id) return;
    this.http.delete(`${environment.apiUrl}/transacoes-recorrentes?id=${id}`).subscribe({
      next: () => {
        this.notifications.success(this.prefs.t('Regra recorrente desativada.', 'Recurring rule disabled.'));
        this.confirmOpen.set(false);
        this.load();
      },
      error: (e) => this.notifications.error(e?.error?.message ?? this.prefs.t('Não foi possível desativar esta regra.', 'Could not disable this rule.'))
    });
  }
}
