import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { tap } from 'rxjs/operators';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'User';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'finansmart_token';
  private readonly USER_KEY = 'finansmart_user';

  currentUser = signal<User | null>(this.getStoredUser());

  constructor(private http: HttpClient) {}

  login(credentials: any) {
    return this.http.post<{token: string, user: User}>(`${environment.apiUrl}/auth/login`, credentials).pipe(
      tap(res => {
        this.setToken(res.token);
        this.setUser(res.user);
      })
    );
  }

  register(userData: any) {
    return this.http.post<{token: string, user: User}>(`${environment.apiUrl}/auth/register`, userData).pipe(
      tap(res => {
        this.setToken(res.token);
        this.setUser(res.user);
      })
    );
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
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
    return userStr ? JSON.parse(userStr) : null;
  }
}
