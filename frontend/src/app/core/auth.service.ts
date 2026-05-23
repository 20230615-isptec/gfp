import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { tap } from 'rxjs/operators';

export interface User {
  id: number;
  name: string;
  email: string;
  role: number;
}

interface AuthApiResponse {
  token: string;
  user?: {
    id: number;
    nome: string;
    email: string;
    role?: number;
    tipo_usuario_id?: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'token';
  private readonly USER_KEY = 'user';

  currentUser = signal<User | null>(this.getStoredUser());

  constructor(private http: HttpClient) {}

  login(credentials: { email: string; password: string }) {
    return this.http.post<AuthApiResponse>(`${environment.apiUrl}/auth/login`, {
      email: credentials.email,
      senha: credentials.password
    }).pipe(
      tap(res => this.persistAuth(res))
    );
  }

  register(userData: { fullName: string; email: string; password: string }) {
    return this.http.post<AuthApiResponse>(`${environment.apiUrl}/auth/register`, {
      nome: userData.fullName,
      email: userData.email,
      senha: userData.password
    }).pipe(
      tap(res => this.persistAuth(res))
    );
  }

  forgotPassword(email: string) {
    return this.http.post<{ success: boolean; message: string }>(`${environment.apiUrl}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string) {
    return this.http.post<{ success: boolean; message: string }>(`${environment.apiUrl}/auth/reset-password`, {
      token,
      new_password: newPassword
    });
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isAdmin(): boolean {
    return this.currentUser()?.role === 1;
  }

  private persistAuth(response: AuthApiResponse): void {
    this.setToken(response.token);

    const payloadUser = this.decodeTokenUser(response.token);
    const apiUser = response.user
      ? {
          id: Number(response.user.id),
          name: response.user.nome,
          email: response.user.email,
          role: Number(response.user.role ?? response.user.tipo_usuario_id ?? 2)
        }
      : null;

    const user = apiUser ?? payloadUser;
    if (user) {
      this.setUser(user);
    }
  }

  private decodeTokenUser(token: string): User | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return {
        id: Number(payload.id),
        name: String(payload.nome ?? ''),
        email: String(payload.email ?? ''),
        role: Number(payload.role ?? 2)
      };
    } catch {
      return null;
    }
  }

  private setToken(token: string) {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  private setUser(user: User) {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);
  }

  private getStoredUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) return null;

    try {
      const parsed = JSON.parse(userStr) as User;
      return {
        id: Number(parsed.id),
        name: parsed.name,
        email: parsed.email,
        role: Number(parsed.role)
      };
    } catch {
      return null;
    }
  }
}
