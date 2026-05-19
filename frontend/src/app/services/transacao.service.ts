import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// ========================================================================
// INTERFACES
// ========================================================================

export interface Transacao {
  id?: number;
  categoria_id: number;
  valor: number;
  tipo: 'receita' | 'despesa';
  data: string;
  descricao: string;
  utilizador_id?: number;
}

export interface TransacaoResponse {
  success: boolean;
  message?: string;
  data?: Transacao | Transacao[];
  transacao?: Transacao;
}

// ========================================================================
// SERVIÇO
// ========================================================================

@Injectable({
  providedIn: 'root'
})
export class TransacaoService {
  private readonly API_URL = 'http://localhost/gfp/backend/api/transacoes';

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
   * Obtém a lista de todas as transações do utilizador
   * @returns Observable com array de transações
   */
  listar(): Observable<TransacaoResponse> {
    return this.http.get<TransacaoResponse>(
      this.API_URL,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Cria uma nova transação
   * @param transacao Dados da transação a criar
   * @returns Observable com a resposta da API
   */
  criar(transacao: Transacao): Observable<TransacaoResponse> {
    return this.http.post<TransacaoResponse>(
      this.API_URL,
      transacao,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Atualiza uma transação existente
   * @param id ID da transação a atualizar
   * @param transacao Dados atualizados
   * @returns Observable com a resposta da API
   */
  atualizar(id: number, transacao: Transacao): Observable<TransacaoResponse> {
    return this.http.put<TransacaoResponse>(
      `${this.API_URL}?id=${id}`,
      transacao,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Remove uma transação
   * @param id ID da transação a remover
   * @returns Observable com a resposta da API
   */
  remover(id: number): Observable<TransacaoResponse> {
    return this.http.delete<TransacaoResponse>(
      `${this.API_URL}?id=${id}`,
      { headers: this.getHeaders() }
    );
  }
}
