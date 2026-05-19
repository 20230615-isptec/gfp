import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, HttpInterceptorFn } from '@angular/common/http';
import { routes } from './app.routes';

/**
 * Configuração Principal da Aplicação Angular
 * 
 * Define providers globais, roteamento, HTTP Client e outras configurações
 * necessárias para a aplicação standalone.
 */

// Interceptor funcional para adicionar Authorization header
const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  
  return next(req);
};

export const appConfig: ApplicationConfig = {
  providers: [
    // Roteamento
    provideRouter(routes),
    
    // HTTP Client com Interceptor de Autenticação
    provideHttpClient(
      withInterceptors([authInterceptor])
    )
  ]
};
