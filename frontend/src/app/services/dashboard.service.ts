import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DashboardResumo {
  receitas: number;
  despesas: number;
  saldo_atual: number;
  total_transacoes: number;
}

export interface Cotacao {
  cotacao: number;
  alta: number;
  baixa: number;
  timestamp?: string;
}

export interface CotacoesAtuais {
  USD_BRL?: Cotacao;
  EUR_BRL?: Cotacao;
  AOA_BRL?: Cotacao;
  AOA_USD?: Cotacao;
  AOA_EUR?: Cotacao;
}

export interface DashboardResponse {
  success: boolean;
  resumo: DashboardResumo;
  cotacoes_atuais: CotacoesAtuais | null;
  data_atualizacao: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = 'http://localhost/gfp/backend/api';

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

  obterResumo(): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/dashboard`,
      { headers: this.getHeaders() }
    );
  }

  getResumoFinanceiro(): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(
      `${this.apiUrl}/dashboard`,
      { headers: this.getHeaders() }
    );
  }
}
