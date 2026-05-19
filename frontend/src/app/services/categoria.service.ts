import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// ========================================================================
// INTERFACES
// ========================================================================

export interface Categoria {
  id?: number;
  nome: string;
  tipo: 'receita' | 'despesa';
  utilizador_id?: number;
}

export interface CategoriaResponse {
  success: boolean;
  message?: string;
  data?: Categoria | Categoria[];
  categoria?: Categoria;
}

// ========================================================================
// SERVIÇO
// ========================================================================

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {
  private readonly API_URL = 'http://localhost/gfp/backend/api/categorias';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    
    if (token) {
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
    }
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  /**
   * Obtém a lista de todas as categorias do utilizador
   * @returns Observable com array de categorias
   */
  listar(): Observable<CategoriaResponse> {
    return this.http.get<CategoriaResponse>(
      this.API_URL,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Cria uma nova categoria
   * @param categoria Dados da categoria a criar
   * @returns Observable com a resposta da API
   */
  criar(categoria: Categoria): Observable<CategoriaResponse> {
    return this.http.post<CategoriaResponse>(
      this.API_URL,
      categoria,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Atualiza uma categoria existente
   * @param id ID da categoria a atualizar
   * @param categoria Dados atualizados
   * @returns Observable com a resposta da API
   */
  atualizar(id: number, categoria: Categoria): Observable<CategoriaResponse> {
    return this.http.put<CategoriaResponse>(
      `${this.API_URL}?id=${id}`,
      categoria,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Remove uma categoria
   * @param id ID da categoria a remover
   * @returns Observable com a resposta da API
   */
  remover(id: number): Observable<CategoriaResponse> {
    return this.http.delete<CategoriaResponse>(
      `${this.API_URL}?id=${id}`,
      { headers: this.getHeaders() }
    );
  }
}
