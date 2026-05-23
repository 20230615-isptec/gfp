import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PreferencesService } from '../../core/preferences.service';
import { NgClass } from '@angular/common';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NgClass],
  template: `
    <div class="bg-deep-navy text-on-surface antialiased min-h-screen flex items-center justify-center relative overflow-hidden">
      <main class="w-full max-w-md px-4 md:px-0 z-10 relative">
        <div class="bg-slate-800/60 backdrop-blur-[16px] border border-t-white/10 border-x-white/5 border-b-black/20 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-8 md:p-10">
          <div class="flex justify-between items-start mb-8">
            <div class="flex items-center gap-2"><span class="material-symbols-outlined text-primary text-[28px]">account_balance</span><span class="font-headline-sm font-bold text-on-surface">FinanSmart</span></div>
            <button type="button" (click)="prefs.toggleTheme()" class="text-on-surface-variant hover:text-primary"><span class="material-symbols-outlined text-[20px]">{{ prefs.isDarkMode() ? 'light_mode' : 'dark_mode' }}</span></button>
          </div>

          <h1 class="font-headline-md text-on-surface mb-2">{{ prefs.t('Recuperar senha', 'Recover password') }}</h1>
          <p class="font-body-md text-on-surface-variant mb-6">Insira seu email para receber instrucoes de recuperacao.</p>

          <form [formGroup]="forgotForm" (ngSubmit)="onSubmit()" class="space-y-4">
            <input formControlName="email" type="email" placeholder="contato@exemplo.com" class="w-full bg-surface-container-highest border border-outline-variant rounded-lg py-3 px-4" [ngClass]="{'border-danger-red': isFieldInvalid('email')}"/>
            @if(errorMessage()) { <div class="p-3 bg-danger-red/10 border border-danger-red/30 rounded text-danger-red text-sm">{{ errorMessage() }}</div> }
            @if(successMessage()) { <div class="p-3 bg-emerald-glow/10 border border-emerald-glow/30 rounded text-emerald-glow text-sm">{{ prefs.t('Email enviado com sucesso.', 'Email sent successfully.') }}</div> }
            <button type="submit" [disabled]="loading()" class="w-full bg-primary text-on-primary-fixed-variant font-label-md py-3.5 rounded-lg">{{ loading() ? prefs.t('Enviando...', 'Sending...') : prefs.t('Recuperar senha', 'Recover password') }}</button>
          </form>

          <div class="mt-6 text-center"><a routerLink="/login" class="text-primary">{{ prefs.t('Voltar ao login', 'Back to login') }}</a></div>
        </div>
      </main>
    </div>
  `
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  prefs = inject(PreferencesService);

  forgotForm = this.fb.group({ email: ['', [Validators.required, Validators.email]] });
  loading = signal(false);
  successMessage = signal(false);
  errorMessage = signal('');

  isFieldInvalid(field: string): boolean {
    const control = this.forgotForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit() {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.forgotPassword(this.forgotForm.value.email || '').subscribe({
      next: () => {
        this.loading.set(false);
        this.successMessage.set(true);
        setTimeout(() => this.router.navigate(['/login']), 1800);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err?.error?.message || 'Erro ao solicitar recuperacao.');
      }
    });
  }
}



