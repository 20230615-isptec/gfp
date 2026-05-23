import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth.service';
import { PreferencesService } from '../../core/preferences.service';

interface DashboardApi {
  success?: boolean;
  resumo?: {
    saldo_atual?: number;
    receitas?: number;
    despesas?: number;
    total_transacoes?: number;
  };
  cotacoes_atuais?: Record<string, { cotacao?: number }>;
}

interface Categoria {
  id: number;
  nome: string;
}

interface Tx {
  id: number;
  descricao: string;
  data: string;
  tipo: 'receita' | 'despesa';
  valor: number;
  categoria_id: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterLink, NgClass],
  template: `
    <section class="app-enter">
      <header class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h2 class="text-on-surface text-3xl font-bold">{{ prefs.t('Ola', 'Hello') }}, <span class="text-primary">{{ userName() }}</span></h2>
          <p class="text-on-surface-variant mt-1">{{ prefs.t('Aqui esta o seu resumo financeiro de hoje.', 'Here is your financial summary for today.') }}</p>
        </div>
        <a routerLink="/transacoes" class="bg-primary hover:opacity-90 text-on-primary rounded-lg py-3 px-4 inline-flex items-center gap-2 shadow-[0_0_15px_rgba(78,222,163,0.3)]">
          <span class="text-sm font-bold">+ {{ prefs.t('Nova Transacao', 'New Transaction') }}</span>
        </a>
      </header>

      @if(loading()) {
        <div class="flex justify-center items-center py-20 text-primary">Carregando...</div>
      } @else {
        <section class="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
          <div class="md:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div class="glass-card rounded-xl p-6 transition-all duration-200 hover:-translate-y-[1px]"><h3 class="text-on-surface-variant uppercase tracking-wider text-xs mb-4">{{ prefs.t('Saldo Atual', 'Current Balance') }}</h3><p class="text-2xl font-bold">{{ resumo().saldo_atual | currency:'AOA':'symbol' }}</p></div>
            <div class="glass-card rounded-xl p-6 transition-all duration-200 hover:-translate-y-[1px]"><h3 class="text-on-surface-variant uppercase tracking-wider text-xs mb-4">{{ prefs.t('Total de Receitas', 'Total Income') }}</h3><p class="text-2xl font-bold text-primary">{{ resumo().receitas | currency:'AOA':'symbol' }}</p></div>
            <div class="glass-card rounded-xl p-6 transition-all duration-200 hover:-translate-y-[1px]"><h3 class="text-on-surface-variant uppercase tracking-wider text-xs mb-4">{{ prefs.t('Total de Despesas', 'Total Expenses') }}</h3><p class="text-2xl font-bold text-danger-red">{{ resumo().despesas | currency:'AOA':'symbol' }}</p></div>
          </div>
          <div class="md:col-span-4 glass-card rounded-xl p-6">
            <h3 class="text-on-surface-variant uppercase tracking-wider text-xs mb-4">{{ prefs.t('Conversao de Saldo', 'Balance Conversion') }}</h3>
            <p class="text-sm text-on-surface-variant">{{ prefs.t('Total de transacoes', 'Total transactions') }}: {{ resumo().total_transacoes }}</p>
            <p class="mt-3 text-sm">USD: <strong>{{ saldoUsd() | currency:'USD':'symbol' }}</strong></p>
            <p class="text-sm">EUR: <strong>{{ saldoEur() | currency:'EUR':'symbol' }}</strong></p>
          </div>
        </section>

        <section class="glass-card rounded-xl overflow-hidden app-enter">
          <div class="p-6 border-b border-outline-variant/10 flex justify-between items-center">
            <h3 class="text-on-surface text-xl">{{ prefs.t('Transacoes Recentes', 'Recent Transactions') }}</h3>
            <a routerLink="/transacoes" class="text-primary text-sm">{{ prefs.t('Ver todas', 'View all') }}</a>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse min-w-[700px]"><thead><tr class="bg-surface-container/50"><th class="py-4 px-6 font-normal">{{ prefs.t('Descricao', 'Description') }}</th><th class="py-4 px-6 font-normal">{{ prefs.t('Data', 'Date') }}</th><th class="py-4 px-6 font-normal">{{ prefs.t('Categoria', 'Category') }}</th><th class="py-4 px-6 font-normal text-right">{{ prefs.t('Valor', 'Amount') }}</th></tr></thead>
              <tbody class="divide-y divide-outline-variant/10">
                @for (tx of recentes(); track tx.id) {
                  <tr class="table-row-hover transition-colors"><td class="py-4 px-6">{{ tx.descricao }}</td><td class="py-4 px-6 text-on-surface-variant">{{ tx.data | date:'dd/MM/yyyy' }}</td><td class="py-4 px-6">{{ categoriaNome(tx.categoria_id) }}</td><td class="py-4 px-6 text-right font-data" [ngClass]="tx.tipo === 'receita' ? 'text-primary' : 'text-danger-red'">{{ tx.tipo === 'receita' ? '+' : '-' }}{{ tx.valor | currency:'AOA':'symbol' }}</td></tr>
                } @empty {
                  <tr><td colspan="4" class="py-8 text-center text-on-surface-variant">{{ prefs.t('Nenhuma transacao encontrada.', 'No transactions found.') }}</td></tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      }
    </section>
  `
})
export class DashboardComponent {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  prefs = inject(PreferencesService);

  loading = signal(true);
  resumo = signal({ saldo_atual: 0, receitas: 0, despesas: 0, total_transacoes: 0 });
  recentes = signal<Tx[]>([]);
  categorias = signal<Categoria[]>([]);
  userName = signal(this.auth.currentUser()?.name || 'Utilizador');
  saldoUsd = signal(0);
  saldoEur = signal(0);

  ngOnInit() {
    this.http.get<DashboardApi>(`${environment.apiUrl}/dashboard`).subscribe({
      next: (res: DashboardApi) => {
        this.resumo.set({
          saldo_atual: res?.resumo?.saldo_atual || 0,
          receitas: res?.resumo?.receitas || 0,
          despesas: res?.resumo?.despesas || 0,
          total_transacoes: res?.resumo?.total_transacoes || 0
        });
        this.computeFx(res);
      }
    });

    this.http.get<any>(`${environment.apiUrl}/categorias`).subscribe({
      next: (r: any) => this.categorias.set(Array.isArray(r?.data) ? r.data : [])
    });

    this.http.get<any>(`${environment.apiUrl}/transacoes`).subscribe({
      next: (r: any) => {
        this.recentes.set(Array.isArray(r?.data) ? r.data.slice(0, 6) : []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  computeFx(res: DashboardApi): void {
    const saldo = res?.resumo?.saldo_atual || 0;
    const fx = res?.cotacoes_atuais || {};

    const aoaUsd = fx['AOA_USD']?.cotacao || ((fx['AOA_BRL']?.cotacao && fx['USD_BRL']?.cotacao) ? (fx['AOA_BRL']!.cotacao! / fx['USD_BRL']!.cotacao!) : 0);
    const aoaEur = fx['AOA_EUR']?.cotacao || ((fx['AOA_BRL']?.cotacao && fx['EUR_BRL']?.cotacao) ? (fx['AOA_BRL']!.cotacao! / fx['EUR_BRL']!.cotacao!) : 0);

    this.saldoUsd.set(aoaUsd > 0 ? saldo * aoaUsd : 0);
    this.saldoEur.set(aoaEur > 0 ? saldo * aoaEur : 0);
  }

  categoriaNome(id: number): string {
    return this.categorias().find((c) => c.id === id)?.nome || this.prefs.t('Sem categoria', 'No category');
  }
}
