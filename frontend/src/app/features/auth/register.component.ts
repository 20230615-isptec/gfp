import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { PreferencesService } from '../../core/preferences.service';
import { NgClass } from '@angular/common';
import { NotificationService } from '../../core/notification.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NgClass],
  template: `
    <div class="bg-deep-navy text-on-surface antialiased min-h-screen flex items-center justify-center relative overflow-hidden">
      <div class="absolute top-[20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-glow/5 blur-[120px] pointer-events-none"></div>
      <div class="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-soft/5 blur-[120px] pointer-events-none"></div>

      <main class="w-full max-w-lg px-4 md:px-0 z-10 relative">
        <div class="bg-slate-800/60 backdrop-blur-[16px] border border-t-white/10 border-x-white/5 border-b-black/20 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-8 md:p-10 relative overflow-hidden">
          <div class="flex justify-between items-start mb-8 relative z-10 w-full">
            <div class="flex items-center gap-2">
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

          <div class="mb-8 relative z-10">
            <h1 class="font-headline-md text-on-surface mb-2 tracking-tight">{{ prefs.t('Criar conta nova', 'Create new account') }}</h1>
            <p class="font-body-md text-on-surface-variant">{{ prefs.t('Comece a gerenciar suas finanças inteligentemente.', 'Start managing your finances smartly.') }}</p>
          </div>

          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="space-y-5 relative z-10 flex flex-col" novalidate>
            <div class="flex flex-col gap-2 relative">
              <label class="font-label-md text-on-surface-variant">{{ prefs.t('Nome Completo', 'Full Name') }}</label>
              <div class="relative">
                <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">person</span>
                <input formControlName="fullName" type="text" placeholder="Seu nome" class="w-full bg-surface-container-highest border border-outline-variant rounded-lg py-3.5 pl-12 pr-4 font-body-md text-on-surface focus:outline-none focus:border-indigo-soft transition-all placeholder:text-on-surface-variant/40" [ngClass]="{'border-danger-red': isFieldInvalid('fullName')}"/>
              </div>
            </div>

            <div class="flex flex-col gap-2 relative">
              <label class="font-label-md text-on-surface-variant">{{ prefs.t('E-mail', 'Email') }}</label>
              <div class="relative">
                <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">mail</span>
                <input formControlName="email" type="email" placeholder="contato@exemplo.com" class="w-full bg-surface-container-highest border border-outline-variant rounded-lg py-3.5 pl-12 pr-4 font-body-md text-on-surface focus:outline-none focus:border-indigo-soft transition-all placeholder:text-on-surface-variant/40" [ngClass]="{'border-danger-red': isFieldInvalid('email')}"/>
              </div>
            </div>

            <div class="flex flex-col gap-2 relative">
              <label class="font-label-md text-on-surface-variant">{{ prefs.t('Senha', 'Password') }}</label>
              <div class="relative">
                <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">lock</span>
                <input formControlName="password" type="password" minlength="8" placeholder="••••••••" class="w-full bg-surface-container-highest border border-outline-variant rounded-lg py-3.5 pl-12 pr-4 font-body-md text-on-surface focus:outline-none focus:border-indigo-soft transition-all placeholder:text-on-surface-variant/40" [ngClass]="{'border-danger-red': isFieldInvalid('password')}"/>
              </div>
            </div>

            @if(errorMessage()) {
              <div class="p-3 bg-danger-red/10 border border-danger-red/30 rounded text-danger-red text-sm flex items-center gap-2">
                <span class="material-symbols-outlined text-[18px]">error</span>
                <span>{{errorMessage()}}</span>
              </div>
            }

            <button type="submit" [disabled]="loading()" class="w-full bg-primary text-on-primary-fixed-variant font-label-md py-3.5 rounded-lg hover:bg-emerald-glow transition-all duration-300 shadow-[0_0_15px_rgba(78,222,163,0.2)] flex justify-center items-center gap-2 mt-4 cursor-pointer">
              @if(loading()) {
                <span class="material-symbols-outlined animate-spin">progress_activity</span>
                <span>{{ prefs.t('Processando...', 'Processing...') }}</span>
              } @else {
                <span>{{ prefs.t('Criar Conta', 'Create Account') }}</span>
                <span class="material-symbols-outlined text-[18px]">person_add</span>
              }
            </button>
          </form>

          <div class="mt-8 text-center relative z-10">
            <p class="font-body-md text-on-surface-variant">
              {{ prefs.t('Já tem uma conta?', "Already have an account?") }}
              <a routerLink="/login" class="text-primary hover:text-emerald-glow font-label-md transition-colors ml-1">{{ prefs.t('Fazer Login', 'Sign in') }}</a>
            </p>
          </div>
        </div>
      </main>
    </div>
  `
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  prefs = inject(PreferencesService);
  private notifications = inject(NotificationService);

  registerForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  loading = signal(false);
  errorMessage = signal('');

  isFieldInvalid(field: string): boolean {
    const control = this.registerForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.notifications.warning(this.prefs.t('Preencha nome, e-mail válido e senha com pelo menos 8 caracteres.', 'Fill name, valid email and password with at least 8 characters.'));
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.register({ fullName: this.registerForm.value.fullName || '', email: this.registerForm.value.email || '', password: this.registerForm.value.password || '' }).subscribe({
      next: () => {
        this.notifications.success(this.prefs.t('Conta criada com sucesso. Já pode começar a gerir as finanças.', 'Account created successfully. You can start managing finances.'));
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        const message = err.error?.message || this.prefs.t('Erro ao criar conta.', 'Error creating account.');
        this.errorMessage.set(message);
        this.notifications.error(message);
      }
    });
  }
}
