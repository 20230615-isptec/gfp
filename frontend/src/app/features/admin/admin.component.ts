import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { AdminService } from '../../services/admin.service';
import { TranslationPipe } from '../../core/i18n/translation.pipe';
import { I18nService } from '../../core/i18n/i18n.service';

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
  imports: [CommonModule, TranslationPipe],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  isAdmin$ = this.authService.isAdmin$;
  isLoading = true;
  hasError = false;
  errorMessage = '';
  usuarios: AdminUser[] = [];
  adminLogado = 0;
  acaoEmProgresso: { [key: string]: boolean } = {};

  constructor(
    private authService: AuthService,
    private adminService: AdminService,
    private router: Router,
    private http: HttpClient,
    private i18nService: I18nService
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
        this.hasError = true;
        this.errorMessage = error?.error?.message || this.i18nService.translate('admin.loadError');
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
    return tipoUsuarioId === 1
      ? this.i18nService.translate('admin.administrator')
      : this.i18nService.translate('admin.user');
  }

  alternarTipo(usuario: AdminUser): void {
    if (usuario.id === this.adminLogado) {
      return;
    }

    const chaveAcao = `alterar-tipo-${usuario.id}`;
    this.acaoEmProgresso[chaveAcao] = true;
    const novoTipo = usuario.tipo_usuario_id === 1 ? 2 : 1;

    this.adminService.atualizarTipoUsuario(usuario.id, novoTipo).subscribe({
      next: (response) => {
        if (response.success) {
          usuario.tipo_usuario_id = novoTipo;
        }
        this.acaoEmProgresso[chaveAcao] = false;
      },
      error: () => {
        this.acaoEmProgresso[chaveAcao] = false;
      }
    });
  }

  eliminarUtilizador(usuario: AdminUser): void {
    if (usuario.id === this.adminLogado) {
      return;
    }

    const confirmacao = confirm(`Tem a certeza que deseja eliminar o utilizador "${usuario.nome}"?`);
    if (!confirmacao) return;

    const chaveAcao = `eliminar-${usuario.id}`;
    this.acaoEmProgresso[chaveAcao] = true;

    this.adminService.eliminarUtilizador(usuario.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.usuarios = this.usuarios.filter((u) => u.id !== usuario.id);
        }
        this.acaoEmProgresso[chaveAcao] = false;
      },
      error: () => {
        this.acaoEmProgresso[chaveAcao] = false;
      }
    });
  }
}
