import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TransacaoService, Transacao } from '../../services/transacao.service';
import { CategoriaService, Categoria } from '../../services/categoria.service';
import { ExportService } from '../../services/export.service';

// ========================================================================
// COMPONENTE
// ========================================================================

@Component({
  selector: 'app-transacoes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './transacoes.component.html',
  styleUrls: ['./transacoes.component.scss']
})
export class TransacoesComponent implements OnInit {
  // ====================================================================
  // ESTADO
  // ====================================================================

  transacoes: Transacao[] = [];
  mostrarForm = false;
  isLoading = false;
  isSaving = false;
  isExporting = false;
  hasError = false;
  errorMessage = '';
  editandoId: number | null = null;

  transacaoForm: FormGroup;

  categorias: Categoria[] = [];

  // ====================================================================
  // CONSTRUTOR
  // ====================================================================

  constructor(
    private transacaoService: TransacaoService,
    private categoriaService: CategoriaService,
    private exportService: ExportService,
    private fb: FormBuilder
  ) {
    this.transacaoForm = this.criarFormulario();
  }

  // ====================================================================
  // LIFECYCLE
  // ====================================================================

  ngOnInit(): void {
    this.carregarTransacoes();
    this.carregarCategorias();
  }

  // ====================================================================
  // MÉTODOS PRIVADOS
  // ====================================================================

  /**
   * Cria um novo FormGroup para o formulário de transações
   */
  private criarFormulario(): FormGroup {
    return this.fb.group({
      categoria_id: ['', [Validators.required]],
      valor: ['', [Validators.required, Validators.min(0.01)]],
      tipo: ['receita', [Validators.required]],
      data: ['', [Validators.required]],
      descricao: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  /**
   * Reseta o formulário aos valores padrão
   */
  private resetarFormulario(): void {
    this.transacaoForm.reset({
      categoria_id: '',
      valor: '',
      tipo: 'receita',
      data: this.obterDataAtual(),
      descricao: ''
    });
    this.editandoId = null;
  }

  /**
   * Obtém a data atual no formato YYYY-MM-DD
   */
  private obterDataAtual(): string {
    const hoje = new Date();
    return hoje.toISOString().split('T')[0];
  }

  /**
   * Formata o valor para moeda
   */
  private formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      currencyDisplay: 'narrowSymbol'
    }).format(valor);
  }

  // ====================================================================
  // MÉTODOS PÚBLICOS - CARREGAMENTO
  // ====================================================================

  /**
   * Carrega a lista de transações da API
   */
  carregarTransacoes(): void {
    this.isLoading = true;
    this.hasError = false;

    this.transacaoService.listar().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const data = response.data as Transacao[];
          this.transacoes = Array.isArray(data) ? data : [data];
        } else {
          this.transacoes = [];
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar transações:', error);
        this.hasError = true;
        this.errorMessage = 'Erro ao carregar as transações. Tente novamente.';
        this.isLoading = false;
      }
    });
  }

  carregarCategorias(): void {
    this.categoriaService.listar().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const data = response.data as Categoria[];
          this.categorias = Array.isArray(data) ? data : [data];
        } else {
          this.categorias = [];
        }
      },
      error: (error) => {
        console.error('Erro ao carregar categorias para transações:', error);
        this.categorias = [];
      }
    });
  }

  // ====================================================================
  // MÉTODOS PÚBLICOS - FORMULÁRIO
  // ====================================================================

  /**
   * Alterna a visibilidade do formulário
   */
  toggleFormulario(): void {
    this.mostrarForm = !this.mostrarForm;
    if (!this.mostrarForm) {
      this.resetarFormulario();
    } else {
      // Define a data atual quando abre o formulário
      this.transacaoForm.patchValue({
        data: this.obterDataAtual()
      });
    }
  }

  /**
   * Abre o formulário para editar uma transação
   */
  editar(transacao: Transacao): void {
    this.editandoId = transacao.id || null;
    this.transacaoForm.patchValue({
      categoria_id: transacao.categoria_id,
      valor: transacao.valor,
      tipo: transacao.tipo,
      data: transacao.data,
      descricao: transacao.descricao
    });
    this.mostrarForm = true;
  }

  /**
   * Cancela a edição/criação e fecha o formulário
   */
  cancelar(): void {
    this.mostrarForm = false;
    this.resetarFormulario();
  }

  /**
   * Salva a transação (cria ou atualiza)
   */
  salvar(): void {
    if (!this.transacaoForm.valid) {
      this.errorMessage = 'Por favor, preencha todos os campos corretamente.';
      return;
    }

    this.isSaving = true;
    const formValue = this.transacaoForm.value;

    if (this.editandoId) {
      // Atualizar transação existente
      this.transacaoService.atualizar(this.editandoId, formValue).subscribe({
        next: () => {
          this.carregarTransacoes();
          this.cancelar();
          this.isSaving = false;
        },
        error: (error) => {
          console.error('Erro ao atualizar transação:', error);
          this.errorMessage = 'Erro ao atualizar a transação. Tente novamente.';
          this.isSaving = false;
        }
      });
    } else {
      // Criar nova transação
      this.transacaoService.criar(formValue).subscribe({
        next: () => {
          this.carregarTransacoes();
          this.cancelar();
          this.isSaving = false;
        },
        error: (error) => {
          console.error('Erro ao criar transação:', error);
          this.errorMessage = 'Erro ao criar a transação. Tente novamente.';
          this.isSaving = false;
        }
      });
    }
  }

  exportarRelatorio(): void {
    this.isExporting = true;
    this.hasError = false;

    this.exportService.exportarCsv('relatorio_transacoes.csv')
      .then(() => {
        this.isExporting = false;
      })
      .catch((error) => {
        console.error('Erro ao exportar relatório:', error);
        this.errorMessage = error.message || 'Erro ao exportar o relatório. Tente novamente.';
        this.hasError = true;
        this.isExporting = false;
      });
  }

  /**
   * Remove uma transação
   */
  deletar(transacao: Transacao): void {
    if (!transacao.id) return;

    if (confirm(`Tem a certeza que deseja eliminar esta transação (${this.formatarMoeda(transacao.valor)})?`)) {
      this.transacaoService.remover(transacao.id).subscribe({
        next: () => {
          this.carregarTransacoes();
        },
        error: (error) => {
          console.error('Erro ao deletar transação:', error);
          this.errorMessage = 'Erro ao eliminar a transação. Tente novamente.';
        }
      });
    }
  }

  /**
   * Retorna o nome da categoria pelo ID
   */
  obterNomeCategoria(categoriaId: number): string {
    return this.categorias.find(c => c.id === categoriaId)?.nome || 'Desconhecido';
  }

  /**
   * Formata valor para exibição
   */
  formatarValor(valor: number): string {
    return this.formatarMoeda(valor);
  }

  /**
   * Formata data para exibição (DD/MM/YYYY)
   */
  formatarData(data: string): string {
    const date = new Date(data + 'T00:00:00');
    return new Intl.DateTimeFormat('pt-PT').format(date);
  }

  /**
   * Verifica se está em modo edição
   */
  isEditando(): boolean {
    return this.editandoId !== null;
  }

  /**
   * Retorna o título do formulário
   */
  getTituloFormulario(): string {
    return this.editandoId ? 'Editar Transação' : 'Nova Transação';
  }

  /**
   * Retorna o texto do botão de salvar
   */
  getTextoBotaoSalvar(): string {
    return 'Guardar';
  }
}
