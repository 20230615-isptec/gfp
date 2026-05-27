import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PreferencesService } from '../../core/preferences.service';
import { FormModalComponent } from '../../shared/components/form-modal.component';
import { NotificationService } from '../../core/notification.service';

@Component({
  selector: 'app-metas',
  standalone: true,
  imports: [CommonModule, FormsModule, FormModalComponent],
  template: `
    <section class="app-enter space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-3xl font-bold text-on-surface">{{ prefs.t('Metas Financeiras', 'Financial Goals') }}</h2>
          <p class="text-on-surface-variant">{{ prefs.t('Acompanhe o progresso dos seus objetivos.', 'Track your goal progress.') }}</p>
        </div>
        <div class="flex gap-2">
          <button class="soft-btn" (click)="openForm.set(true)">{{ prefs.t('Nova Meta', 'New Goal') }}</button>
        </div>
      </div>

      <div class="glass-card rounded-xl p-4">
        <div class="filter-shell">
          <div class="filter-pill-group">
            <button type="button" class="filter-pill" [ngClass]="{'active': !onlyAtivas()}" (click)="setAtivas(false)"><span class="material-symbols-outlined text-[16px]">flag</span>{{ prefs.t('Todas', 'All') }}</button>
            <button type="button" class="filter-pill" [ngClass]="{'active': onlyAtivas()}" (click)="setAtivas(true)"><span class="material-symbols-outlined text-[16px]">task_alt</span>{{ prefs.t('Ativas', 'Active') }}</button>
          </div>
        </div>
      </div>

      <app-form-modal [open]="openForm()" [title]="prefs.t('Nova Meta', 'New Goal')" (close)="openForm.set(false)">
        <form class="grid md:grid-cols-2 gap-4" (ngSubmit)="add()">
          <div>
            <input [(ngModel)]="form.titulo" name="titulo" class="input-base" [placeholder]="prefs.t('Nome da meta (ex: Fundo de Emergência)', 'Goal name (e.g., Emergency Fund)')" required>
            <span class="field-help">{{ prefs.t('Exemplo: Viagem, Carro, Fundo de Emergência.', 'Example: Trip, Car, Emergency Fund.') }}</span>
          </div>
          <div>
            <input [(ngModel)]="form.valor_objetivo" name="valor_objetivo" class="input-base" type="number" min="1" [placeholder]="prefs.t('Valor alvo total', 'Total target amount')" required>
            <span class="field-help">{{ prefs.t('Quanto quer atingir no final da meta.', 'How much you want to reach by goal completion.') }}</span>
          </div>
          <div>
            <input [(ngModel)]="form.valor_atual" name="valor_atual" class="input-base" type="number" min="0" [placeholder]="prefs.t('Quanto já poupou', 'How much already saved')" required>
            <span class="field-help">{{ prefs.t('Valor que já tem reservado hoje.', 'Amount you already have reserved today.') }}</span>
          </div>
          <div>
            <input [(ngModel)]="form.data_limite" name="data_limite" class="input-base" type="date" required title="Data limite da meta">
            <span class="field-help">{{ prefs.t('Prazo final para concluir a meta.', 'Final deadline to complete the goal.') }}</span>
          </div>
          <button class="bg-primary text-on-primary rounded-lg px-4 py-2 font-bold md:col-span-2">{{ prefs.t('Adicionar Meta', 'Add Goal') }}</button>
        </form>
      </app-form-modal>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        @for (m of metas(); track m.id) {
          <div class="glass-card rounded-xl p-5 border border-outline-variant/20">
            <div class="flex items-center justify-between mb-2">
              <h3 class="font-bold text-lg">{{ m.titulo }}</h3>
              <span class="text-primary font-bold">{{ percent(m) }}%</span>
            </div>
            <p class="text-sm text-on-surface-variant mb-3">{{ prefs.t('Prazo', 'Deadline') }}: {{ m.data_limite }}</p>
            <div class="w-full bg-surface-container-high rounded-full h-2 mb-2">
              <div class="bg-primary h-2 rounded-full" [style.width.%]="percent(m)"></div>
            </div>
            <p class="text-xs text-on-surface-variant">{{ m.valor_atual }} / {{ m.valor_objetivo }}</p>
            <p class="text-xs mt-2 text-on-surface-variant">
              {{ prefs.t('Meses restantes', 'Months remaining') }}: {{ monthsRemaining(m) }} ·
              {{ prefs.t('Necessário/mês', 'Needed/month') }}: Kz {{ monthlyNeeded(m) }}
            </p>
            <div class="flex gap-2 mt-3">
              <button class="soft-btn" (click)="toggleStatus(m)">{{ m.ativa ? prefs.t('Desativar', 'Disable') : prefs.t('Ativar', 'Enable') }}</button>
              <input class="input-base w-28" type="number" min="1" [(ngModel)]="aporteValores[m.id]" [ngModelOptions]="{standalone: true}" placeholder="Aporte">
              <button class="soft-btn" (click)="incrementarAtual(m)">{{ prefs.t('Adicionar poupança', 'Add savings') }}</button>
            </div>
            @if(isNearDeadline(m) && percent(m) < 80) {
              <p class="text-xs mt-2 text-yellow-500">{{ prefs.t('Meta próxima do prazo. Reforce os aportes.', 'Goal near deadline. Increase contributions.') }}</p>
            }
          </div>
        } @empty {
          <div class="glass-card rounded-xl p-6 text-on-surface-variant">{{ prefs.t('Sem metas.', 'No goals.') }}</div>
        }
      </div>
    </section>
  `
})
export class MetasComponent {
  private http = inject(HttpClient);
  prefs = inject(PreferencesService);
  private notifications = inject(NotificationService);
  metas = signal<any[]>([]);
  openForm = signal(false);
  onlyAtivas = signal(false);
  form: any = { titulo: '', valor_objetivo: '', valor_atual: '', data_limite: '' };
  aporteValores: Record<number, number> = {};

  ngOnInit(): void { this.load(); }

  load(): void {
    const q = this.onlyAtivas() ? '?ativas=1' : '';
    this.http.get<any>(`${environment.apiUrl}/metas${q}`).subscribe({
      next: (r) => {
        this.metas.set(Array.isArray(r?.data) ? r.data : []);
      },
      error: (e) => this.notifications.error(e?.error?.message ?? this.prefs.t('Não foi possível carregar as metas.', 'Could not load goals.'))
    });
  }

  add(): void {
    if (!this.validarFormulario()) {
      return;
    }

    this.http.post<any>(`${environment.apiUrl}/metas`, this.form).subscribe({
      next: () => {
        this.openForm.set(false);
        this.form = { titulo: '', valor_objetivo: '', valor_atual: '', data_limite: '' };
        this.notifications.success(this.prefs.t('Meta criada. Agora é só acompanhar os aportes.', 'Goal created. Now track the contributions.'));
        this.load();
      },
      error: (e) => this.notifications.error(e?.error?.message ?? this.prefs.t('Revise o nome, valores e prazo da meta.', 'Review the goal name, amounts and deadline.'))
    });
  }

  toggleAtivas(): void {
    this.onlyAtivas.set(!this.onlyAtivas());
    this.load();
  }

  setAtivas(value: boolean): void {
    this.onlyAtivas.set(value);
    this.load();
  }

  toggleStatus(meta: any): void {
    const body = { ativa: meta.ativa ? 0 : 1 };
    this.http.put<any>(`${environment.apiUrl}/metas?id=${meta.id}`, body).subscribe({
      next: () => {
        this.notifications.success(meta.ativa ? this.prefs.t('Meta desativada. Ela saiu do filtro de ativas.', 'Goal disabled. It left the active filter.') : this.prefs.t('Meta ativada novamente.', 'Goal enabled again.'));
        this.load();
      },
      error: (e) => this.notifications.error(e?.error?.message ?? this.prefs.t('Não foi possível atualizar o estado da meta.', 'Could not update goal status.'))
    });
  }

  incrementarAtual(meta: any): void {
    const aporte = Number(this.aporteValores[meta.id] ?? 0);
    if (aporte <= 0) {
      this.notifications.warning(this.prefs.t('Informe um valor de aporte maior que zero.', 'Enter a contribution greater than zero.'));
      return;
    }
    this.http.post<any>(`${environment.apiUrl}/metas/aporte`, { meta_id: meta.id, valor: aporte }).subscribe({
      next: () => {
        this.aporteValores[meta.id] = 0;
        this.notifications.success(this.prefs.t('Aporte registado. O progresso da meta foi atualizado.', 'Contribution registered. Goal progress was updated.'));
        this.load();
      },
      error: (e) => this.notifications.error(e?.error?.message ?? this.prefs.t('Não foi possível adicionar este aporte.', 'Could not add this contribution.'))
    });
  }

  percent(m: any): number {
    const t = Number(m?.valor_objetivo || 0);
    const c = Number(m?.valor_atual || 0);
    return t > 0 ? Math.min(100, Math.round((c / t) * 100)) : 0;
  }

  monthsRemaining(m: any): number {
    if (!m?.data_limite) return 0;
    const now = new Date();
    const end = new Date(m.data_limite);
    const months = (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth());
    return Math.max(0, months);
  }

  monthlyNeeded(m: any): string {
    const target = Number(m?.valor_objetivo || 0);
    const current = Number(m?.valor_atual || 0);
    const remaining = Math.max(0, target - current);
    const months = this.monthsRemaining(m);
    if (months <= 0) return remaining.toFixed(2);
    return (remaining / months).toFixed(2);
  }

  isNearDeadline(m: any): boolean {
    const months = this.monthsRemaining(m);
    return months <= 2;
  }

  private validarFormulario(): boolean {
    const titulo = String(this.form.titulo ?? '').trim();
    const objetivo = Number(this.form.valor_objetivo);
    const atual = Number(this.form.valor_atual);
    const dataLimite = String(this.form.data_limite ?? '');

    if (titulo.length < 3) {
      this.notifications.warning(this.prefs.t('Informe um nome de meta com pelo menos 3 caracteres.', 'Enter a goal name with at least 3 characters.'));
      return false;
    }

    if (!Number.isFinite(objetivo) || objetivo <= 0) {
      this.notifications.warning(this.prefs.t('O valor alvo deve ser maior que zero.', 'Target amount must be greater than zero.'));
      return false;
    }

    if (!Number.isFinite(atual) || atual < 0) {
      this.notifications.warning(this.prefs.t('O valor já poupado não pode ser negativo.', 'Already saved amount cannot be negative.'));
      return false;
    }

    if (atual > objetivo) {
      this.notifications.warning(this.prefs.t('O valor já poupado não pode ultrapassar o valor alvo.', 'Already saved amount cannot exceed the target.'));
      return false;
    }

    if (!this.isIsoDate(dataLimite)) {
      this.notifications.warning(this.prefs.t('Informe uma data limite válida.', 'Enter a valid deadline.'));
      return false;
    }

    if (new Date(`${dataLimite}T00:00:00`) < new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00')) {
      this.notifications.warning(this.prefs.t('A data limite não pode estar no passado.', 'Deadline cannot be in the past.'));
      return false;
    }

    this.form.titulo = titulo;
    return true;
  }

  private isIsoDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }
}
