import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PreferencesService } from '../../core/preferences.service';
import { AuthService } from '../../core/auth.service';
import { NotificationService } from '../../core/notification.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="bg-deep-navy text-on-surface antialiased min-h-screen flex items-center justify-center relative overflow-hidden">
      <main class="w-full max-w-md px-4 md:px-0 z-10 relative">
        <div class="bg-slate-800/60 backdrop-blur-[16px] border border-t-white/10 border-x-white/5 border-b-black/20 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-8 md:p-10">
          <div class="flex justify-between items-start mb-8">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-primary text-[28px]">account_balance</span>
              <span class="font-headline-sm font-bold text-on-surface">FinanSmart</span>
            </div>
            <button type="button" (click)="prefs.toggleTheme()" class="text-on-surface-variant hover:text-primary">
              <span class="material-symbols-outlined text-[20px]">{{ prefs.isDarkMode() ? 'light_mode' : 'dark_mode' }}</span>
            </button>
          </div>

          <h1 class="font-headline-md text-on-surface mb-2">{{ prefs.t('Redefinir senha', 'Reset password') }}</h1>
          <p class="font-body-md text-on-surface-variant mb-8">{{ prefs.t('Digite a nova senha da sua conta.', 'Enter your account new password.') }}</p>

          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
            <input formControlName="newPassword" type="password" minlength="8" [placeholder]="prefs.t('Nova senha', 'New password')" class="w-full bg-surface-container-highest border border-outline-variant rounded-lg py-3 px-4"/>
            <input formControlName="confirmPassword" type="password" minlength="8" [placeholder]="prefs.t('Confirmar senha', 'Confirm password')" class="w-full bg-surface-container-highest border border-outline-variant rounded-lg py-3 px-4"/>

            @if(successMessage()) {
              <div class="p-3 bg-emerald-glow/10 border border-emerald-glow/30 rounded text-emerald-glow text-sm">{{ successMessage() }}</div>
            }
            @if(errorMessage()) {
              <div class="p-3 bg-danger-red/10 border border-danger-red/30 rounded text-danger-red text-sm">{{ errorMessage() }}</div>
            }

            <button type="submit" [disabled]="loading()" class="w-full bg-primary text-on-primary-fixed-variant font-label-md py-3.5 rounded-lg">
              {{ loading() ? prefs.t('Atualizando...', 'Updating...') : prefs.t('Atualizar senha', 'Update password') }}
            </button>
          </form>

          <div class="mt-6 text-center"><a routerLink="/login" class="text-primary">{{ prefs.t('Voltar ao login', 'Back to login') }}</a></div>
        </div>
      </main>
    </div>
  `
})
export class ResetPasswordComponent {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  prefs = inject(PreferencesService);
  private notifications = inject(NotificationService);

  form = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required, Validators.minLength(8)]]
  });

  loading = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  submit() {
    const token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!token) {
      const message = this.prefs.t('Token invalido ou ausente.', 'Invalid or missing token.');
      this.errorMessage.set(message);
      this.notifications.error(message);
      return;
    }

    if (this.form.invalid || this.form.value.newPassword !== this.form.value.confirmPassword) {
      const message = this.prefs.t('Verifique os dados informados.', 'Please check the entered data.');
      this.errorMessage.set(message);
      this.notifications.warning(message);
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.resetPassword(token, this.form.value.newPassword || '').subscribe({
      next: (res) => {
        this.loading.set(false);
        const message = res.message || this.prefs.t('Senha atualizada com sucesso.', 'Password updated successfully.');
        this.successMessage.set(message);
        this.notifications.success(message);
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (err) => {
        this.loading.set(false);
        const message = err?.error?.message || this.prefs.t('Falha ao redefinir senha.', 'Failed to reset password.');
        this.errorMessage.set(message);
        this.notifications.error(message);
      }
    });
  }
}



