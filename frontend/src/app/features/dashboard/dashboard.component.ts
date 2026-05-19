import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../services/dashboard.service';
import { ExportService } from '../../services/export.service';
import { AuthService } from '../../core/services/auth.service';
import { TransacaoService, Transacao } from '../../services/transacao.service';
import { CategoriaService, Categoria } from '../../services/categoria.service';
import { forkJoin } from 'rxjs';

interface DashboardResumo {
  saldo_atual: number;
  receitas: number;
  despesas: number;
  total_transacoes?: number;
}

interface Cotacoes {
  USD_BRL?: { cotacao: number; baixa?: number; alta?: number };
  EUR_BRL?: { cotacao: number; baixa?: number; alta?: number };
  AOA_BRL?: { cotacao: number; baixa?: number; alta?: number };
  AOA_USD?: { cotacao: number; baixa?: number; alta?: number };
  AOA_EUR?: { cotacao: number; baixa?: number; alta?: number };
}

interface DashboardData {
  resumo: DashboardResumo;
  cotacoes_atuais: Cotacoes;
  data_atualizacao: string;
}

interface DashboardResponse {
  success: boolean;
  resumo: DashboardResumo;
  cotacoes_atuais: Cotacoes | null;
  data_atualizacao: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  isLoading = true;
  hasError = false;
  errorMessage = '';
  isExporting = false;

  resumo: DashboardResumo | null = null;
  cotacoes: Cotacoes | null = null;
  dataAtualizacao: string | null = null;
  nomeUtilizador = '';
  transacoesRecentes: Transacao[] = [];
  categoriasMap: Record<number, string> = {};

  // Valores convertidos
  saldoEmUSD = 0;
  saldoEmEUR = 0;
  receitasEmUSD = 0;
  despesasEmUSD = 0;

  constructor(
    private dashboardService: DashboardService,
    private exportService: ExportService,
    private authService: AuthService,
    private transacaoService: TransacaoService,
    private categoriaService: CategoriaService
  ) { }

  ngOnInit(): void {
    this.nomeUtilizador = this.authService.getUserData()?.nome || 'utilizador';
    this.carregarDados();
  }

  private carregarDados(): void {
    this.isLoading = true;
    this.hasError = false;

    forkJoin({
      dashboard: this.dashboardService.getResumoFinanceiro(),
      transacoes: this.transacaoService.listar(),
      categorias: this.categoriaService.listar()
    }).subscribe({
      next: ({ dashboard, transacoes, categorias }) => {
        const dashboardData = dashboard as DashboardResponse;

        this.resumo = dashboardData?.resumo ?? {
          saldo_atual: 0,
          receitas: 0,
          despesas: 0,
          total_transacoes: 0
        };

        this.cotacoes = dashboardData?.cotacoes_atuais ?? {};
        this.dataAtualizacao = dashboardData?.data_atualizacao
          ? new Date(dashboardData.data_atualizacao).toLocaleString('pt-BR')
          : new Date().toLocaleString('pt-BR');

        const categoriasData = Array.isArray(categorias.data)
          ? (categorias.data as Categoria[])
          : [];

        this.categoriasMap = categoriasData.reduce<Record<number, string>>((acc, categoria) => {
          if (categoria.id) {
            acc[categoria.id] = categoria.nome;
          }
          return acc;
        }, {});

        const transacoesData = Array.isArray(transacoes.data)
          ? (transacoes.data as Transacao[])
          : [];

        this.transacoesRecentes = transacoesData.slice(0, 5);

        this.calcularConversoes();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Erro ao carregar dashboard:', error);
        this.hasError = true;
        this.errorMessage = 'Erro ao carregar dados do dashboard. Tente novamente.';
        this.resumo = {
          saldo_atual: 0,
          receitas: 0,
          despesas: 0,
          total_transacoes: 0
        };
        this.transacoesRecentes = [];
        this.calcularConversoes();
        this.isLoading = false;
      }
    });
  }

  private calcularConversoes(): void {
    if (!this.resumo || !this.cotacoes) return;

    const cotacaoAoaUsd = this.cotacoes.AOA_USD?.cotacao || 0;
    const cotacaoAoaEur = this.cotacoes.AOA_EUR?.cotacao || 0;
    const cotacaoAoaBrl = this.cotacoes.AOA_BRL?.cotacao || 0;
    const cotacaoUsdBrl = this.cotacoes.USD_BRL?.cotacao || 0;
    const cotacaoEurBrl = this.cotacoes.EUR_BRL?.cotacao || 0;

    if (cotacaoAoaUsd > 0) {
      this.saldoEmUSD = this.resumo.saldo_atual * cotacaoAoaUsd;
      this.receitasEmUSD = this.resumo.receitas * cotacaoAoaUsd;
      this.despesasEmUSD = this.resumo.despesas * cotacaoAoaUsd;
    } else if (cotacaoAoaBrl > 0 && cotacaoUsdBrl > 0) {
      const taxaAoaUsd = cotacaoAoaBrl / cotacaoUsdBrl;
      this.saldoEmUSD = this.resumo.saldo_atual * taxaAoaUsd;
      this.receitasEmUSD = this.resumo.receitas * taxaAoaUsd;
      this.despesasEmUSD = this.resumo.despesas * taxaAoaUsd;
    }

    if (cotacaoAoaEur > 0) {
      this.saldoEmEUR = this.resumo.saldo_atual * cotacaoAoaEur;
    } else if (cotacaoAoaBrl > 0 && cotacaoEurBrl > 0) {
      const taxaAoaEur = cotacaoAoaBrl / cotacaoEurBrl;
      this.saldoEmEUR = this.resumo.saldo_atual * taxaAoaEur;
    }
  }

  recarregar(): void {
    this.carregarDados();
  }

  /**
   * Inicia o download do relatório CSV
   */
  exportarCsv(): void {
    this.isExporting = true;
    this.hasError = false;

    try {
      this.exportService.exportarCsv('relatorio_financeiro.csv');
      this.isExporting = false;
    } catch (error: any) {
      console.error('Erro ao exportar:', error);
      this.hasError = true;
      this.errorMessage = error.message || 'Erro ao exportar o relatório. Tente novamente.';
      this.isExporting = false;
    }
  }

  formatarMoeda(valor: number, moeda: string = 'AOA'): string {
    const locale = moeda === 'AOA' ? 'pt-AO' : 'pt-BR';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: moeda,
      currencyDisplay: moeda === 'AOA' ? 'narrowSymbol' : 'symbol'
    }).format(valor);
  }

  formatarData(data: string): string {
    const date = new Date(`${data}T00:00:00`);
    return new Intl.DateTimeFormat('pt-BR').format(date);
  }

  obterNomeCategoria(categoriaId: number): string {
    return this.categoriasMap[categoriaId] || 'Sem categoria';
  }
}
