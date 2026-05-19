import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CategoriaService, Categoria } from '../../services/categoria.service';

// ========================================================================
// COMPONENTE
// ========================================================================

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './categorias.component.html',
  styleUrls: ['./categorias.component.scss']
})
export class CategoriasComponent implements OnInit {
  // ====================================================================
  // ESTADO
  // ====================================================================

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

  // ====================================================================
  // CONSTRUTOR
  // ====================================================================

  constructor(
    private categoriaService: CategoriaService,
    private fb: FormBuilder
  ) {
    this.categoriaForm = this.criarFormulario();
  }

  // ====================================================================
  // LIFECYCLE
  // ====================================================================

  ngOnInit(): void {
    this.carregarCategorias();
  }

  // ====================================================================
  // MÉTODOS PRIVADOS
  // ====================================================================

  /**
   * Cria um novo FormGroup para o formulário de categorias
   */
  private criarFormulario(): FormGroup {
    return this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      tipo: ['receita', [Validators.required]]
    });
  }

  /**
   * Reseta o formulário aos valores padrão
   */
  private resetarFormulario(): void {
    this.categoriaForm.reset({
      nome: '',
      tipo: 'receita'
    });
    this.editandoId = null;
  }

  /**
   * Segrega as categorias por tipo
   */
  private segregarCategorias(): void {
    this.categoriasReceita = this.categorias.filter(c => c.tipo === 'receita');
    this.categoriasDespesa = this.categorias.filter(c => c.tipo === 'despesa');
  }

  // ====================================================================
  // MÉTODOS PÚBLICOS - CARREGAMENTO
  // ====================================================================

  /**
   * Carrega a lista de categorias da API
   */
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
      error: (error) => {
        console.error('Erro ao carregar categorias:', error);
        this.hasError = true;
        this.errorMessage = 'Erro ao carregar as categorias. Tente novamente.';
        this.isLoading = false;
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
    }
  }

  /**
   * Abre o formulário para editar uma categoria
   */
  editar(categoria: Categoria): void {
    this.editandoId = categoria.id || null;
    this.categoriaForm.patchValue({
      nome: categoria.nome,
      tipo: categoria.tipo
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
   * Salva a categoria (cria ou atualiza)
   */
  salvar(): void {
    if (!this.categoriaForm.valid) {
      this.errorMessage = 'Por favor, preencha todos os campos corretamente.';
      return;
    }

    this.isSaving = true;
    const formValue = this.categoriaForm.value;

    if (this.editandoId) {
      // Atualizar categoria existente
      this.categoriaService.atualizar(this.editandoId, formValue).subscribe({
        next: () => {
          this.carregarCategorias();
          this.cancelar();
          this.isSaving = false;
        },
        error: (error) => {
          console.error('Erro ao atualizar categoria:', error);
          this.errorMessage = 'Erro ao atualizar a categoria. Tente novamente.';
          this.isSaving = false;
        }
      });
    } else {
      // Criar nova categoria
      this.categoriaService.criar(formValue).subscribe({
        next: () => {
          this.carregarCategorias();
          this.cancelar();
          this.isSaving = false;
        },
        error: (error) => {
          console.error('Erro ao criar categoria:', error);
          this.errorMessage = 'Erro ao criar a categoria. Tente novamente.';
          this.isSaving = false;
        }
      });
    }
  }

  /**
   * Remove uma categoria
   */
  deletar(categoria: Categoria): void {
    if (!categoria.id) return;

    if (confirm(`Tem a certeza que deseja eliminar a categoria "${categoria.nome}"?`)) {
      this.categoriaService.remover(categoria.id).subscribe({
        next: () => {
          this.carregarCategorias();
        },
        error: (error) => {
          console.error('Erro ao deletar categoria:', error);
          this.errorMessage = 'Erro ao eliminar a categoria. Tente novamente.';
        }
      });
    }
  }

  // ====================================================================
  // MÉTODOS PÚBLICOS - HELPERS
  // ====================================================================

  /**
   * Retorna o titulo do formulário
   */
  getTituloFormulario(): string {
    return this.editandoId ? 'Editar Categoria' : 'Nova Categoria';
  }

  /**
   * Retorna o texto do botão de salvar
   */
  getTextoBotaoSalvar(): string {
    return 'Guardar';
  }

  /**
   * Verifica se está em modo edição
   */
  isEditando(): boolean {
    return this.editandoId !== null;
  }

  /**
   * Retorna o rótulo do tipo de categoria
   */
  getLabelTipo(tipo: string): string {
    return tipo === 'receita' ? 'Receita' : 'Despesa';
  }
}
