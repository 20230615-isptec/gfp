import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  tipo_usuario_id: number;
  criado_em: string;
}

export interface AdminResponse {
  success: boolean;
  data?: Usuario[];
  total?: number;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = 'http://localhost/gfp/backend/api/admin';

  constructor(private http: HttpClient) {}

  /**
   * Listar todos os utilizadores
   */
  listarUtilizadores(): Observable<AdminResponse> {
    return this.http.get<AdminResponse>(`${this.apiUrl}/utilizadores`);
  }

  /**
   * Atualizar tipo de utilizador (Administrador ↔ Utilizador)
   */
  atualizarTipoUsuario(usuarioId: number, tipoUsuarioId: number): Observable<AdminResponse> {
    return this.http.put<AdminResponse>(
      `${this.apiUrl}/utilizadores?id=${usuarioId}`,
      { tipo_usuario_id: tipoUsuarioId }
    );
  }

  /**
   * Eliminar utilizador
   */
  eliminarUtilizador(usuarioId: number): Observable<AdminResponse> {
    return this.http.delete<AdminResponse>(
      `${this.apiUrl}/utilizadores?id=${usuarioId}`
    );
  }

  /**
   * Bloquear ou desbloquear utilizador
   */
  bloquearUtilizador(usuarioId: number, ativo: boolean): Observable<AdminResponse> {
    return this.http.put<AdminResponse>(
      `${this.apiUrl}/utilizadores/bloquear?id=${usuarioId}&ativo=${ativo ? 1 : 0}`,
      {}
    );
  }
}
