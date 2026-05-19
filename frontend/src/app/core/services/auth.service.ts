import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface RegisterRequest {
  nome: string;
  email: string;
  senha: string;
}

export interface AuthResponse {
  success?: boolean;
  message?: string;
  token: string;
  expires_in?: number;
  user?: {
    id: number;
    nome: string;
    email: string;
  };
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  expires_in?: number;
  dev_token?: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

export interface UserData {
  id: number;
  nome: string;
  email: string;
  role?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost/gfp/backend/api';
  private isLoggedInSubject = new BehaviorSubject<boolean>(this.checkToken());
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();

  private isAdminSubject = new BehaviorSubject<boolean>(this.checkAdmin());
  public isAdmin$ = this.isAdminSubject.asObservable();

  constructor(private http: HttpClient) {}

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/login`, credentials)
      .pipe(
        tap((response: AuthResponse) => {
          localStorage.setItem('token', response.token);

          const userFromToken = this.getUserDataFromToken(response.token);
          const userToStore = response.user || userFromToken;
          if (userToStore) {
            localStorage.setItem('user', JSON.stringify(userToStore));
          }

          this.isLoggedInSubject.next(true);
          this.isAdminSubject.next(this.checkAdmin());
        }),
        catchError((error: any) => {
          console.error('Login error:', error);
          throw error;
        })
      );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/register`, data)
      .pipe(
        tap((response: AuthResponse) => {
          if (response.token) {
            localStorage.setItem('token', response.token);

            const userFromToken = this.getUserDataFromToken(response.token);
            const userToStore = response.user || userFromToken;
            if (userToStore) {
              localStorage.setItem('user', JSON.stringify(userToStore));
            }

            this.isLoggedInSubject.next(true);
            this.isAdminSubject.next(this.checkAdmin());
          }
        }),
        catchError((error: any) => {
          console.error('Register error:', error);
          throw error;
        })
      );
  }

  forgotPassword(email: string): Observable<ForgotPasswordResponse> {
    return this.http.post<ForgotPasswordResponse>(`${this.API_URL}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<ResetPasswordResponse> {
    return this.http.post<ResetPasswordResponse>(`${this.API_URL}/auth/reset-password`, {
      token,
      new_password: newPassword
    });
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.isLoggedInSubject.next(false);
    this.isAdminSubject.next(false);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return this.checkToken();
  }

  getUserData(): UserData | null {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        return JSON.parse(userData) as UserData;
      } catch {
        // fallback below
      }
    }
    
    const token = this.getToken();
    if (!token) return null;

    const userFromToken = this.getUserDataFromToken(token);
    if (userFromToken) {
      localStorage.setItem('user', JSON.stringify(userFromToken));
    }

    return userFromToken;
  }

  private getUserDataFromToken(token: string): UserData | null {
    const payload = this.decodeJwtPayload(token);
    if (!payload) return null;

    const id = typeof payload.id === 'number' ? payload.id : Number(payload.id);
    const nome = typeof payload.nome === 'string' ? payload.nome : '';
    const email = typeof payload.email === 'string' ? payload.email : '';
    const role = typeof payload.role === 'number' ? payload.role : undefined;

    if (!id || !nome || !email) {
      return null;
    }

    return { id, nome, email, role };
  }

  private decodeJwtPayload(token: string): any | null {
    try {
      const payloadBase64 = token.split('.')[1];
      if (!payloadBase64) return null;

      const normalized = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
      const payloadJson = atob(padded);
      return JSON.parse(payloadJson);
    } catch {
      return null;
    }
  }

  private checkToken(): boolean {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      const payload = this.decodeJwtPayload(token);
      if (!payload) return false;

      if (payload.exp && typeof payload.exp === 'number') {
        const now = Math.floor(Date.now() / 1000);
        return payload.exp > now;
      }

      // Se nao houver exp, considera valido apenas pela existencia.
      return true;
    } catch {
      return false;
    }
  }

  private checkAdmin(): boolean {
    const user = localStorage.getItem('user');
    if (!user) return false;
    
    try {
      const parsed = JSON.parse(user);
      return parsed.admin === true
        || parsed.isAdmin === true
        || parsed.role === 1
        || parsed.tipo_usuario_id === 1;
    } catch {
      return false;
    }
  }

  /**
   * Retorna o ID do utilizador atualmente logado
   */
  getLoggedUserId(): number {
    const user = this.getUserData();
    return user?.id || 0;
  }
}
