import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PreferencesService } from '../../core/preferences.service';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NgClass],
  template: `
    <div class="bg-deep-navy text-on-surface antialiased min-h-screen flex items-center justify-center relative overflow-hidden">
      <div class="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-glow/5 blur-[120px] pointer-events-none"></div>

      <main class="w-full max-w-md px-4 md:px-0 z-10 relative">
        <div class="bg-slate-800/60 backdrop-blur-[16px] border border-t-white/10 border-x-white/5 border-b-black/20 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-8 md:p-10">
          
          <!-- Header -->
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

          <div class="mb-8">
            <h1 class="font-headline-md text-on-surface mb-2 tracking-tight">Recuperar Senha</h1>
            <p class="font-body-md text-on-surface-variant">Insira o e-mail associado à sua conta para receber instruções de recuperação.</p>
          </div>

          <form [formGroup]="forgotForm" (ngSubmit)="onSubmit()" class="space-y-6 flex flex-col" novalidate>
            <div class="flex flex-col gap-2 relative">
              <label class="font-label-md text-on-surface-variant">E-mail</label>
              <div class="relative">
                <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">mail</span>
                <input formControlName="email" type="email" placeholder="contato@exemplo.com" class="w-full bg-surface-container-highest border border-outline-variant rounded-lg py-3.5 pl-12 pr-4 font-body-md text-on-surface focus:outline-none focus:border-indigo-soft transition-all placeholder:text-on-surface-variant/40" [ngClass]="{'border-danger-red': isFieldInvalid('email')}"/>
              </div>
            </div>

            @if(successMessage()) {
              <div class="p-3 bg-emerald-glow/10 border border-emerald-glow/30 rounded text-emerald-glow text-sm flex items-center gap-2">
                <span class="material-symbols-outlined text-[18px]">check_circle</span>
                <span>Instruções enviadas para o seu e-mail! Redirecionando...</span>
              </div>
            }

            <button type="submit" [disabled]="loading() || successMessage()" class="w-full bg-primary text-on-primary-fixed-variant font-label-md py-3.5 rounded-lg hover:bg-emerald-glow transition-all duration-300 shadow-[0_0_15px_rgba(78,222,163,0.2)] flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
              @if(loading()) {
                <span class="material-symbols-outlined animate-spin">progress_activity</span>
                <span>Enviando...</span>
              } @else {
                <span>Recuperar</span>
                <span class="material-symbols-outlined text-[18px]">send</span>
              }
            </button>
          </form>

          <div class="mt-8 text-center">
            <a routerLink="/login" class="text-primary hover:text-emerald-glow font-label-md transition-colors inline-flex items-center gap-1">
              <span class="material-symbols-outlined text-[16px]">arrow_back</span>
              Voltar ao Login
            </a>
          </div>
        </div>
      </main>
    </div>
  `
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  prefs = inject(PreferencesService);

  forgotForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  loading = signal(false);
  successMessage = signal(false);

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
    
    // Simulate API call
    setTimeout(() => {
      this.loading.set(false);
      this.successMessage.set(true);
      setTimeout(() => this.router.navigate(['/login']), 3000);
    }, 1500);
  }
}
