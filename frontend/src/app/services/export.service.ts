import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// ========================================================================
// SERVIÇO DE EXPORTAÇÃO
// ========================================================================

@Injectable({
  providedIn: 'root'
})
export class ExportService {
  private readonly API_URL = 'http://localhost/gfp/backend/api/exportar/csv';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    
    if (token) {
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });
    }
    return new HttpHeaders();
  }

  /**
   * Baixa o relatório em formato CSV
   * Cria um link temporário e inicia o download automaticamente
   * @returns Observable com o blob do arquivo ou erro
   */
  baixarCsv(url: string = this.API_URL): Observable<Blob> {
    return this.http.get(url, {
      responseType: 'blob',
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Erro ao exportar CSV:', error);
        
        // Trata erros comuns
        if (error.status === 401) {
          return throwError(() => new Error('Sessão expirada. Por favor, faça login novamente.'));
        } else if (error.status === 403) {
          return throwError(() => new Error('Acesso negado. Você não tem permissão para exportar relatórios.'));
        } else if (error.status === 404) {
          return throwError(() => new Error('Recurso não encontrado. A API de exportação pode não estar disponível.'));
        } else if (error.status === 500) {
          return throwError(() => new Error('Erro no servidor. Tente novamente mais tarde.'));
        } else if (error.status === 0) {
          return throwError(() => new Error('Erro de conexão. Verifique sua conexão com a internet.'));
        }
        
        return throwError(() => new Error('Erro ao exportar relatório. Tente novamente.'));
      })
    );
  }

  /**
   * Inicia o download do arquivo CSV
   * Cria um link temporário no DOM, define o nome do arquivo e dispara o clique
   * @param blob Conteúdo do arquivo
   * @param nomeArquivo Nome do arquivo a baixar (padrão: relatorio.csv)
   */
  dispararDownload(blob: Blob, nomeArquivo: string = 'relatorio.csv'): void {
    try {
      // Cria um URL temporário para o blob
      const url = window.URL.createObjectURL(blob);
      
      // Cria um link temporário
      const link = document.createElement('a');
      link.href = url;
      link.download = nomeArquivo;
      
      // Adiciona o link ao DOM (necessário para alguns navegadores)
      document.body.appendChild(link);
      
      // Dispara o clique para iniciar o download
      link.click();
      
      // Remove o link do DOM
      document.body.removeChild(link);
      
      // Libera o URL temporário
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao disparar download:', error);
      throw new Error('Erro ao iniciar o download do arquivo.');
    }
  }

  /**
   * Método conveniente que combina baixarCsv() e dispararDownload()
   * Chame este método para fazer o download completo em um único passo
   */
  exportarCsv(nomeArquivo: string = 'relatorio.csv', url: string = this.API_URL): Promise<void> {
    return new Promise((resolve, reject) => {
      this.baixarCsv(url).subscribe({
        next: (blob: Blob) => {
          try {
            this.dispararDownload(blob, nomeArquivo);
            resolve();
          } catch (error) {
            reject(error);
          }
        },
        error: (error: Error) => {
          reject(error);
        }
      });
    });
  }
}
