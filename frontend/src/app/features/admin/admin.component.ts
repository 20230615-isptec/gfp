import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { AdminService } from '../../services/admin.service';

interface AdminUser {
  id: number;
  nome: string;
  email: string;
  tipo_usuario_id: number;
  criado_em: string;
}

interface AdminUsersResponse {
  success: boolean;
  data: AdminUser[];
  total: number;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  isAdmin$ = this.authService.isAdmin$;
  isLoading = true;
  hasError = false;
  errorMessage = '';
  usuarios: AdminUser[] = [];
  adminLogado: number = 0;
  acaoEmProgresso: { [key: string]: boolean } = {};

  constructor(
    private authService: AuthService,
    private adminService: AdminService,
    private router: Router,
    private http: HttpClient
  ) {
    this.adminLogado = this.authService.getLoggedUserId();
  }

  ngOnInit(): void {
    this.isAdmin$.subscribe((isAdmin: boolean) => {
      if (!isAdmin) {
        this.router.navigate(['/dashboard']);
        return;
      }

      this.carregarUtilizadores();
    });
  }

  carregarUtilizadores(): void {
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';

    this.http.get<AdminUsersResponse>('http://localhost/gfp/backend/api/admin/utilizadores').subscribe({
      next: (response) => {
        this.usuarios = Array.isArray(response.data) ? response.data : [];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar utilizadores:', error);
        this.hasError = true;
        this.errorMessage = error?.error?.message || 'Erro ao carregar utilizadores. Tente novamente.';
        this.isLoading = false;
      }
    });
  }

  formatarData(data: string): string {
    const date = new Date(data);
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  }

  getTipoUsuario(tipoUsuarioId: number): string {
    return tipoUsuarioId === 1 ? 'Administrador' : 'Utilizador';
  }

  /**
   * Alterna o tipo de utilizador entre Admin e Utilizador
   */
  alternarTipo(usuario: AdminUser): void {
    if (usuario.id === this.adminLogado) {
      alert('Não pode remover suas próprias permissões de administrador');
      return;
    }

    const chaveAcao = `alterar-tipo-${usuario.id}`;
    this.acaoEmProgresso[chaveAcao] = true;

    const novoTipo = usuario.tipo_usuario_id === 1 ? 2 : 1;

    this.adminService.atualizarTipoUsuario(usuario.id, novoTipo).subscribe({
      next: (response) => {
        if (response.success) {
          usuario.tipo_usuario_id = novoTipo;
          alert(`Tipo de utilizador alterado para: ${this.getTipoUsuario(novoTipo)}`);
        } else {
          alert(response.message || 'Erro ao atualizar tipo de utilizador');
        }
        this.acaoEmProgresso[chaveAcao] = false;
      },
      error: (error) => {
        console.error('Erro ao alterar tipo:', error);
        alert(error?.error?.message || 'Erro ao atualizar tipo de utilizador');
        this.acaoEmProgresso[chaveAcao] = false;
      }
    });
  }

  /**
   * Bloqueia ou desbloqueia um utilizador
   */
  bloquearDesbloquear(usuario: AdminUser): void {
    if (usuario.id === this.adminLogado) {
      alert('Não pode bloquear sua própria conta');
      return;
    }

    const chaveAcao = `bloquear-${usuario.id}`;
    this.acaoEmProgresso[chaveAcao] = true;

    // Assumindo que bloquear significa desativar (ativo = false)
    // e desbloquear significa ativar (ativo = true)
    // Para isso, precisa de um campo 'ativo' no modelo
    alert('Funcionalidade de bloquear/desbloquear em implementação');
    this.acaoEmProgresso[chaveAcao] = false;
  }

  /**
   * Elimina um utilizador
   */
  eliminarUtilizador(usuario: AdminUser): void {
    if (usuario.id === this.adminLogado) {
      alert('Não pode eliminar sua própria conta');
      return;
    }

    const confirmacao = confirm(`Tem a certeza que deseja eliminar o utilizador "${usuario.nome}"? Esta ação não pode ser desfeita.`);
    if (!confirmacao) return;

    const chaveAcao = `eliminar-${usuario.id}`;
    this.acaoEmProgresso[chaveAcao] = true;

    this.adminService.eliminarUtilizador(usuario.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.usuarios = this.usuarios.filter(u => u.id !== usuario.id);
          alert('Utilizador eliminado com sucesso');
        } else {
          alert(response.message || 'Erro ao eliminar utilizador');
        }
        this.acaoEmProgresso[chaveAcao] = false;
      },
      error: (error) => {
        console.error('Erro ao eliminar:', error);
        alert(error?.error?.message || 'Erro ao eliminar utilizador');
        this.acaoEmProgresso[chaveAcao] = false;
      }
    });
  }
}
