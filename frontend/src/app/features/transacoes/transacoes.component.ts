import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TransacaoService, Transacao } from '../../services/transacao.service';
import { CategoriaService, Categoria } from '../../services/categoria.service';
import { ExportService } from '../../services/export.service';
import { TranslationPipe } from '../../core/i18n/translation.pipe';
import { I18nService } from '../../core/i18n/i18n.service';

@Component({
  selector: 'app-transacoes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslationPipe],
  templateUrl: './transacoes.component.html',
  styleUrls: ['./transacoes.component.scss']
})
export class TransacoesComponent implements OnInit {
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

  constructor(
    private transacaoService: TransacaoService,
    private categoriaService: CategoriaService,
    private exportService: ExportService,
    private fb: FormBuilder,
    private i18nService: I18nService
  ) {
    this.transacaoForm = this.criarFormulario();
  }

  ngOnInit(): void {
    this.carregarTransacoes();
    this.carregarCategorias();
  }

  private criarFormulario(): FormGroup {
    return this.fb.group({
      categoria_id: ['', [Validators.required]],
      valor: ['', [Validators.required, Validators.min(0.01)]],
      tipo: ['receita', [Validators.required]],
      data: ['', [Validators.required]],
      descricao: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

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

  private obterDataAtual(): string {
    const hoje = new Date();
    return hoje.toISOString().split('T')[0];
  }

  private formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      currencyDisplay: 'narrowSymbol'
    }).format(valor);
  }

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
        console.error('Erro ao carregar transacoes:', error);
        this.hasError = true;
        this.errorMessage = this.i18nService.translate('transactions.loadError');
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
      error: () => {
        this.categorias = [];
      }
    });
  }

  toggleFormulario(): void {
    this.mostrarForm = !this.mostrarForm;
    if (!this.mostrarForm) {
      this.resetarFormulario();
    } else {
      this.transacaoForm.patchValue({ data: this.obterDataAtual() });
    }
  }

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

  cancelar(): void {
    this.mostrarForm = false;
    this.resetarFormulario();
  }

  salvar(): void {
    if (!this.transacaoForm.valid) {
      this.errorMessage = this.i18nService.translate('transactions.invalidForm');
      return;
    }

    this.isSaving = true;
    const formValue = this.transacaoForm.value;

    if (this.editandoId) {
      this.transacaoService.atualizar(this.editandoId, formValue).subscribe({
        next: () => {
          this.carregarTransacoes();
          this.cancelar();
          this.isSaving = false;
        },
        error: () => {
          this.errorMessage = this.i18nService.translate('transactions.updateError');
          this.isSaving = false;
        }
      });
    } else {
      this.transacaoService.criar(formValue).subscribe({
        next: () => {
          this.carregarTransacoes();
          this.cancelar();
          this.isSaving = false;
        },
        error: () => {
          this.errorMessage = this.i18nService.translate('transactions.createError');
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
        this.errorMessage = error.message || this.i18nService.translate('transactions.exportError');
        this.hasError = true;
        this.isExporting = false;
      });
  }

  deletar(transacao: Transacao): void {
    if (!transacao.id) return;

    if (confirm(`Tem a certeza que deseja eliminar esta transacao (${this.formatarMoeda(transacao.valor)})?`)) {
      this.transacaoService.remover(transacao.id).subscribe({
        next: () => {
          this.carregarTransacoes();
        },
        error: () => {
          this.errorMessage = this.i18nService.translate('transactions.deleteError');
        }
      });
    }
  }

  obterNomeCategoria(categoriaId: number): string {
    return this.categorias.find((c) => c.id === categoriaId)?.nome || this.i18nService.translate('transactions.unknownCategory');
  }

  formatarValor(valor: number): string {
    return this.formatarMoeda(valor);
  }

  formatarData(data: string): string {
    const date = new Date(data + 'T00:00:00');
    return new Intl.DateTimeFormat('pt-PT').format(date);
  }

  getTituloFormulario(): string {
    return this.editandoId
      ? this.i18nService.translate('transactions.editTitle')
      : this.i18nService.translate('transactions.createTitle');
  }

  getTextoBotaoSalvar(): string {
    return this.i18nService.translate('transactions.save');
  }
}
