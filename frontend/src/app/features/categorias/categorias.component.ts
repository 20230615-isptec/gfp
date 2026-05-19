import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CategoriaService, Categoria } from '../../services/categoria.service';
import { TranslationPipe } from '../../core/i18n/translation.pipe';
import { I18nService } from '../../core/i18n/i18n.service';

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslationPipe],
  templateUrl: './categorias.component.html',
  styleUrls: ['./categorias.component.scss']
})
export class CategoriasComponent implements OnInit {
  categorias: Categoria[] = [];
  categoriasReceita: Categoria[] = [];
  categoriasDespesa: Categoria[] = [];

  mostrarForm = false;
  isLoading = false;
  isSaving = false;
  hasError = false;
  errorMessage = '';
  editandoId: number | null = null;

  categoriaForm: FormGroup;

  constructor(
    private categoriaService: CategoriaService,
    private fb: FormBuilder,
    private i18nService: I18nService
  ) {
    this.categoriaForm = this.criarFormulario();
  }

  ngOnInit(): void {
    this.carregarCategorias();
  }

  private criarFormulario(): FormGroup {
    return this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      tipo: ['receita', [Validators.required]]
    });
  }

  private resetarFormulario(): void {
    this.categoriaForm.reset({
      nome: '',
      tipo: 'receita'
    });
    this.editandoId = null;
  }

  private segregarCategorias(): void {
    this.categoriasReceita = this.categorias.filter((c) => c.tipo === 'receita');
    this.categoriasDespesa = this.categorias.filter((c) => c.tipo === 'despesa');
  }

  carregarCategorias(): void {
    this.isLoading = true;
    this.hasError = false;

    this.categoriaService.listar().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const data = response.data as Categoria[];
          this.categorias = Array.isArray(data) ? data : [data];
          this.segregarCategorias();
        } else {
          this.categorias = [];
          this.categoriasReceita = [];
          this.categoriasDespesa = [];
        }
        this.isLoading = false;
      },
      error: () => {
        this.hasError = true;
        this.errorMessage = this.i18nService.translate('categories.loadError');
        this.isLoading = false;
      }
    });
  }

  toggleFormulario(): void {
    this.mostrarForm = !this.mostrarForm;
    if (!this.mostrarForm) {
      this.resetarFormulario();
    }
  }

  editar(categoria: Categoria): void {
    this.editandoId = categoria.id || null;
    this.categoriaForm.patchValue({
      nome: categoria.nome,
      tipo: categoria.tipo
    });
    this.mostrarForm = true;
  }

  cancelar(): void {
    this.mostrarForm = false;
    this.resetarFormulario();
  }

  salvar(): void {
    if (!this.categoriaForm.valid) {
      this.errorMessage = this.i18nService.translate('categories.invalidForm');
      return;
    }

    this.isSaving = true;
    const formValue = this.categoriaForm.value;

    if (this.editandoId) {
      this.categoriaService.atualizar(this.editandoId, formValue).subscribe({
        next: () => {
          this.carregarCategorias();
          this.cancelar();
          this.isSaving = false;
        },
        error: () => {
          this.errorMessage = this.i18nService.translate('categories.updateError');
          this.isSaving = false;
        }
      });
    } else {
      this.categoriaService.criar(formValue).subscribe({
        next: () => {
          this.carregarCategorias();
          this.cancelar();
          this.isSaving = false;
        },
        error: () => {
          this.errorMessage = this.i18nService.translate('categories.createError');
          this.isSaving = false;
        }
      });
    }
  }

  deletar(categoria: Categoria): void {
    if (!categoria.id) return;

    if (confirm(`Tem a certeza que deseja eliminar a categoria "${categoria.nome}"?`)) {
      this.categoriaService.remover(categoria.id).subscribe({
        next: () => {
          this.carregarCategorias();
        },
        error: () => {
          this.errorMessage = this.i18nService.translate('categories.deleteError');
        }
      });
    }
  }

  getTituloFormulario(): string {
    return this.editandoId
      ? this.i18nService.translate('categories.editTitle')
      : this.i18nService.translate('categories.createTitle');
  }

  getTextoBotaoSalvar(): string {
    return this.i18nService.translate('categories.save');
  }

  getLabelTipo(tipo: string): string {
    return tipo === 'receita'
      ? this.i18nService.translate('categories.income')
      : this.i18nService.translate('categories.expense');
  }
}
