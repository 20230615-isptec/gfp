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
    saldo_disponivel?: number;
    divida?: number;
    em_divida?: boolean;
    total_em_metas?: number;
    patrimonio_total?: number;
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
          <h2 class="text-on-surface text-3xl font-bold">{{ prefs.t('Olá', 'Hello') }}, <span class="text-primary">{{ userName() }}</span></h2>
          <p class="text-on-surface-variant mt-1">{{ prefs.t('Aqui está o seu resumo financeiro de hoje.', 'Here is your financial summary for today.') }}</p>
        </div>
        <a routerLink="/transacoes" class="bg-primary hover:opacity-90 text-on-primary rounded-lg py-3 px-4 inline-flex items-center gap-2 shadow-[0_0_15px_rgba(78,222,163,0.3)]">
          <span class="text-sm font-bold">+ {{ prefs.t('Nova Transação', 'New Transaction') }}</span>
        </a>
      </header>

      @if(loading()) {
        <div class="flex justify-center items-center py-20 text-primary">{{ prefs.t('Carregando...', 'Loading...') }}</div>
      } @else {
        <section class="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
          @if(resumo().em_divida) {
            <div class="md:col-span-12 glass-card rounded-xl p-5 border border-danger-red/40 bg-danger-red/10">
              <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div class="flex items-start gap-3">
                  <span class="material-symbols-outlined text-danger-red text-[28px]">priority_high</span>
                  <div>
                    <h3 class="font-bold text-danger-red">{{ prefs.t('Dívida ativa', 'Active debt') }}</h3>
                    <p class="text-sm text-on-surface-variant mt-1">{{ prefs.t('As próximas receitas abatem automaticamente este valor antes de voltar a existir saldo disponível.', 'Upcoming income automatically pays this down before available balance returns.') }}</p>
                  </div>
                </div>
                <p class="text-2xl font-bold text-danger-red">{{ resumo().divida | currency:'AOA':'symbol' }}</p>
              </div>
            </div>
          }
          <div class="md:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div class="glass-card rounded-xl p-6 transition-all duration-200 hover:-translate-y-[1px]">
              <h3 class="text-on-surface-variant uppercase tracking-wider text-xs mb-4">{{ prefs.t('Saldo Disponível', 'Available Balance') }}</h3>
              <p class="text-2xl font-bold text-primary">{{ resumo().saldo_disponivel | currency:'AOA':'symbol' }}</p>
              <p class="text-xs text-on-surface-variant mt-2">{{ resumo().em_divida ? prefs.t('Bloqueado até liquidar dívida', 'Blocked until debt is paid') : prefs.t('Livre para gastar', 'Free to spend') }}</p>
            </div>
            <div class="glass-card rounded-xl p-6 transition-all duration-200 hover:-translate-y-[1px]">
              <h3 class="text-on-surface-variant uppercase tracking-wider text-xs mb-4">{{ prefs.t('Total em Metas', 'Total in Goals') }}</h3>
              <p class="text-2xl font-bold">{{ resumo().total_em_metas | currency:'AOA':'symbol' }}</p>
              <p class="text-xs text-on-surface-variant mt-2">{{ prefs.t('Cofre virtual', 'Virtual vault') }}</p>
            </div>
            <div class="glass-card rounded-xl p-6 transition-all duration-200 hover:-translate-y-[1px]">
              <h3 class="text-on-surface-variant uppercase tracking-wider text-xs mb-4">{{ prefs.t('Patrimônio Total', 'Net Worth') }}</h3>
              <p class="text-2xl font-bold" [ngClass]="resumo().em_divida ? 'text-danger-red' : ''">{{ resumo().patrimonio_total | currency:'AOA':'symbol' }}</p>
              <p class="text-xs text-on-surface-variant mt-2">{{ prefs.t('Disponível + metas', 'Available + goals') }}</p>
            </div>
          </div>
          <div class="md:col-span-4 glass-card rounded-xl p-6">
            <h3 class="text-on-surface-variant uppercase tracking-wider text-xs mb-4">{{ prefs.t('Conversão de Saldo', 'Balance Conversion') }}</h3>
            <p class="text-sm text-on-surface-variant">{{ prefs.t('Total de transações', 'Total transactions') }}: {{ resumo().total_transacoes }}</p>
            <p class="mt-3 text-sm">USD: <strong>{{ saldoUsd() | currency:'USD':'symbol' }}</strong></p>
            <p class="text-sm">EUR: <strong>{{ saldoEur() | currency:'EUR':'symbol' }}</strong></p>
          </div>
        </section>

        <section class="glass-card rounded-xl overflow-hidden app-enter">
          <div class="p-6 border-b border-outline-variant/10 flex justify-between items-center">
            <h3 class="text-on-surface text-xl">{{ prefs.t('Transações Recentes', 'Recent Transactions') }}</h3>
            <a routerLink="/transacoes" class="text-primary text-sm">{{ prefs.t('Ver todas', 'View all') }}</a>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr class="bg-surface-container/50">
                  <th class="py-4 px-6 font-normal">{{ prefs.t('Descrição', 'Description') }}</th>
                  <th class="py-4 px-6 font-normal">{{ prefs.t('Data', 'Date') }}</th>
                  <th class="py-4 px-6 font-normal">{{ prefs.t('Categoria', 'Category') }}</th>
                  <th class="py-4 px-6 font-normal text-right">{{ prefs.t('Valor', 'Amount') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-outline-variant/10">
                @for (tx of recentes(); track tx.id) {
                  <tr class="table-row-hover transition-colors">
                    <td class="py-4 px-6">{{ tx.descricao }}</td>
                    <td class="py-4 px-6 text-on-surface-variant">{{ tx.data | date:'dd/MM/yyyy' }}</td>
                    <td class="py-4 px-6">{{ categoriaNome(tx.categoria_id) }}</td>
                    <td class="py-4 px-6 text-right font-data" [ngClass]="tx.tipo === 'receita' ? 'text-primary' : 'text-danger-red'">{{ tx.tipo === 'receita' ? '+' : '-' }}{{ tx.valor | currency:'AOA':'symbol' }}</td>
                  </tr>
                } @empty {
                  <tr><td colspan="4" class="py-8 text-center text-on-surface-variant">{{ prefs.t('Nenhuma transação encontrada.', 'No transactions found.') }}</td></tr>
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
  resumo = signal({
    saldo_atual: 0,
    saldo_disponivel: 0,
    divida: 0,
    em_divida: false,
    total_em_metas: 0,
    patrimonio_total: 0,
    receitas: 0,
    despesas: 0,
    total_transacoes: 0
  });
  recentes = signal<Tx[]>([]);
  categorias = signal<Categoria[]>([]);
  userName = signal(this.auth.currentUser()?.name || this.prefs.t('Utilizador', 'User'));
  saldoUsd = signal(0);
  saldoEur = signal(0);

  ngOnInit() {
    this.http.get<DashboardApi>(`${environment.apiUrl}/dashboard`).subscribe({
      next: (res: DashboardApi) => {
        this.resumo.set({
          saldo_atual: res?.resumo?.saldo_atual || 0,
          saldo_disponivel: res?.resumo?.saldo_disponivel || 0,
          divida: res?.resumo?.divida || 0,
          em_divida: !!res?.resumo?.em_divida,
          total_em_metas: res?.resumo?.total_em_metas || 0,
          patrimonio_total: res?.resumo?.patrimonio_total || res?.resumo?.saldo_atual || 0,
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
    const saldo = Math.max(0, res?.resumo?.saldo_disponivel || 0);
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
