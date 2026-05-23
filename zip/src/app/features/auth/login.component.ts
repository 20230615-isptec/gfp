import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { PreferencesService } from '../../core/preferences.service';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NgClass],
  template: `
    <div class="bg-deep-navy text-on-surface antialiased min-h-screen flex items-center justify-center relative overflow-hidden">
      <!-- Atmospheric Background Effects -->
      <div class="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-glow/5 blur-[120px] pointer-events-none"></div>
      <div class="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-soft/5 blur-[120px] pointer-events-none"></div>

      <main class="w-full max-w-md px-4 md:px-0 z-10 relative">
        <div class="bg-slate-800/60 backdrop-blur-[16px] border border-t-white/10 border-x-white/5 border-b-black/20 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-8 md:p-10 relative overflow-hidden group" [ngClass]="{'animate-[shake_0.5s_ease-in-out]': loginFailed()}">
          
          <!-- Header -->
          <div class="flex justify-between items-start mb-8 relative z-10 w-full">
            <div class="flex items-center gap-2 mb-1">
              <span class="material-symbols-outlined text-primary text-[28px]" style="font-variation-settings: 'FILL' 1;">account_balance</span>
              <span class="font-headline-sm font-bold text-on-surface">FinanSmart</span>
            </div>

            <div class="flex gap-4 items-center">
              <button type="button" (click)="prefs.toggleLanguage()" class="font-label-md text-on-surface-variant hover:text-primary transition-colors cursor-pointer flex gap-1 items-center px-1">
                <span [class.text-primary]="prefs.lang() === 'PT'" [class.font-bold]="prefs.lang() === 'PT'">PT</span>
                <span class="text-outline-variant/50">|</span>
                <span [class.text-primary]="prefs.lang() === 'EN'" [class.font-bold]="prefs.lang() === 'EN'">EN</span>
              </button>
              <button type="button" (click)="prefs.toggleTheme()" class="text-on-surface-variant hover:text-primary transition-colors rounded-full p-1 flex items-center justify-center cursor-pointer">
                <span class="material-symbols-outlined text-[20px]">{{ prefs.isDarkMode() ? 'light_mode' : 'dark_mode' }}</span>
              </button>
            </div>
          </div>

          <!-- Titles -->
          <div class="mb-8 relative z-10">
            <h1 class="font-headline-md text-on-surface mb-2 tracking-tight">Bem-vindo ao FinanSmart</h1>
            <p class="font-body-md text-on-surface-variant">Insira suas credenciais para acessar seu painel.</p>
          </div>

          <!-- Login Form -->
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-6 relative z-10 flex flex-col" novalidate>
            <!-- Email -->
            <div class="flex flex-col gap-2 relative">
              <label class="font-label-md text-on-surface-variant">E-mail</label>
              <div class="relative">
                <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">mail</span>
                <input formControlName="email" type="email" placeholder="contato@exemplo.com" class="w-full bg-surface-container-highest border border-outline-variant rounded-lg py-3.5 pl-12 pr-4 font-body-md text-on-surface focus:outline-none focus:border-indigo-soft focus:ring-1 focus:ring-indigo-soft transition-all placeholder:text-on-surface-variant/40" [ngClass]="{'border-danger-red bg-danger-red/5': isFieldInvalid('email')}"/>
              </div>
              @if(isFieldInvalid('email')) {
                <div class="flex items-center mt-1">
                  <span class="material-symbols-outlined text-danger-red text-[14px] mr-1">error</span>
                  <span class="font-label-md text-danger-red text-[12px]">Formato de e-mail inválido</span>
                </div>
              }
            </div>

            <!-- Password -->
            <div class="flex flex-col gap-2 relative">
              <div class="flex justify-between items-center">
                <label class="font-label-md text-on-surface-variant">Senha</label>
                <a routerLink="/forgot-password" class="font-label-md text-primary hover:text-emerald-glow transition-colors">Esqueceu a senha?</a>
              </div>
              <div class="relative">
                <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">lock</span>
                <input formControlName="password" [type]="showPassword() ? 'text' : 'password'" placeholder="••••••••" class="w-full bg-surface-container-highest border border-outline-variant rounded-lg py-3.5 pl-12 pr-12 font-body-md text-on-surface focus:outline-none focus:border-indigo-soft focus:ring-1 focus:ring-indigo-soft transition-all placeholder:text-on-surface-variant/40" [ngClass]="{'border-danger-red bg-danger-red/5': isFieldInvalid('password')}"/>
                <button type="button" (click)="togglePassword()" class="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors focus:outline-none p-1 rounded-full flex items-center justify-center">
                  <span class="material-symbols-outlined text-[20px]">{{showPassword() ? 'visibility_off' : 'visibility'}}</span>
                </button>
              </div>
              @if(isFieldInvalid('password')) {
                <div class="flex items-center mt-1">
                  <span class="material-symbols-outlined text-danger-red text-[14px] mr-1">error</span>
                  <span class="font-label-md text-danger-red text-[12px]">A senha é obrigatória</span>
                </div>
              }
            </div>
            
            @if(errorMessage()) {
              <div class="p-3 bg-danger-red/10 border border-danger-red/30 rounded text-danger-red text-sm flex items-center gap-2">
                <span class="material-symbols-outlined">error</span>
                <span>{{errorMessage()}}</span>
              </div>
            }

            <button type="submit" [disabled]="loading()" class="w-full bg-primary text-on-primary-fixed-variant font-label-md py-3.5 rounded-lg hover:bg-emerald-glow transition-all duration-300 shadow-[0_0_15px_rgba(78,222,163,0.2)] flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer">
              @if(loading()) {
                <span class="material-symbols-outlined animate-spin">progress_activity</span>
                <span>Conectando...</span>
              } @else {
                <span>Entrar</span>
                <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
              }
            </button>
          </form>

          <!-- Footer -->
          <div class="mt-8 text-center relative z-10">
            <p class="font-body-md text-on-surface-variant">
              Não tem uma conta? 
              <a routerLink="/register" class="text-primary hover:text-emerald-glow font-label-md transition-colors ml-1">Cadastre-se</a>
            </p>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-5px); }
      50% { transform: translateX(5px); }
      75% { transform: translateX(-5px); }
    }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  prefs = inject(PreferencesService);

  loginForm = this.fb.group({
    email: ['admin@finansmart.pt', [Validators.required, Validators.email]],
    password: ['admin123', Validators.required]
  });

  showPassword = signal(false);
  loading = signal(false);
  loginFailed = signal(false);
  errorMessage = signal('');

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  isFieldInvalid(field: string): boolean {
    const control = this.loginForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.triggerShake();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'Erro ao efetuar login. Verifique as credenciais.');
        this.triggerShake();
      }
    });
  }

  triggerShake() {
    this.loginFailed.set(true);
    setTimeout(() => this.loginFailed.set(false), 500);
  }
}
