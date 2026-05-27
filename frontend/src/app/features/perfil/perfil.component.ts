import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PreferencesService } from '../../core/preferences.service';
import { NotificationService } from '../../core/notification.service';

type PerfilLocal = {
  name: string;
  email: string;
  phone: string;
  avatar_url?: string | null;
  currency: 'AOA' | 'EUR' | 'USD' | 'GBP';
  language: 'pt-BR' | 'en-US';
  theme: 'dark' | 'light' | 'system';
};

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="app-enter">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-on-surface mb-2">{{ prefs.t('Perfil e Configurações', 'Profile & Settings') }}</h1>
        <p class="text-on-surface-variant">{{ prefs.t('Gerencie suas informações pessoais e preferências.', 'Manage your personal information and preferences.') }}</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-1">
          <div class="glass-card rounded-xl p-8 text-center border-white/5 flex flex-col items-center">
            <div class="w-32 h-32 rounded-full overflow-hidden border-4 border-surface-container-high mb-4 ring-2 ring-primary/20 bg-surface-container flex items-center justify-center">
              @if(avatarPreview()) {
                <img [src]="avatarPreview()!" alt="Avatar" class="w-full h-full object-cover">
              } @else if(profile()?.avatar_url) {
                <img [src]="avatarSrc(profile()?.avatar_url)" alt="Avatar" class="w-full h-full object-cover" referrerpolicy="no-referrer">
              } @else {
                <span class="material-symbols-outlined text-5xl text-on-surface-variant">person</span>
              }
            </div>
            <h3 class="text-xl font-bold text-on-surface">{{ profile()?.name || form.name || prefs.t('Utilizador', 'User') }}</h3>
            <p class="text-on-surface-variant">{{ profile()?.email || form.email || 'email@dominio.com' }}</p>
          </div>
        </div>

        <div class="lg:col-span-2">
          <div class="glass-card rounded-xl p-8 border-white/5">
            <h3 class="text-xl font-bold text-on-surface mb-6 border-b border-white/5 pb-4">{{ prefs.t('Informações Pessoais', 'Personal Information') }}</h3>
            <form (ngSubmit)="save()" class="space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-2">
                  <label class="text-on-surface-variant text-sm">{{ prefs.t('Nome Completo', 'Full Name') }}</label>
                  <input [(ngModel)]="form.name" name="name" type="text" class="input-base w-full">
                </div>
                <div class="space-y-2">
                  <label class="text-on-surface-variant text-sm">{{ prefs.t('E-mail', 'Email') }}</label>
                  <input [(ngModel)]="form.email" name="email" type="email" class="input-base w-full">
                </div>
                <div class="space-y-2">
                  <label class="text-on-surface-variant text-sm">{{ prefs.t('Telefone', 'Phone') }}</label>
                  <input [(ngModel)]="form.phone" name="phone" type="text" class="input-base w-full">
                </div>
                <div class="space-y-2">
                  <label class="text-on-surface-variant text-sm">{{ prefs.t('Avatar', 'Avatar') }}</label>
                  <input type="file" accept="image/png,image/jpeg,image/webp" (change)="onFile($event)" class="input-base w-full">
                  <p class="text-[11px] text-on-surface-variant">{{ prefs.t('JPG, PNG ou WEBP até 2MB.', 'JPG, PNG or WEBP up to 2MB.') }}</p>
                </div>
              </div>

              <h3 class="text-xl font-bold text-on-surface mb-4 border-b border-white/5 pb-4 pt-4">{{ prefs.t('Preferências', 'Preferences') }}</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-2">
                  <label class="text-on-surface-variant text-sm">{{ prefs.t('Moeda Principal', 'Main Currency') }}</label>
                  <select [(ngModel)]="form.currency" name="currency" class="input-base w-full">
                    <option value="AOA">{{ prefs.t('Kwanza (AOA)', 'Kwanza (AOA)') }}</option>
                    <option value="EUR">{{ prefs.t('Euro (EUR)', 'Euro (EUR)') }}</option>
                    <option value="USD">{{ prefs.t('Dólar (USD)', 'Dollar (USD)') }}</option>
                    <option value="GBP">{{ prefs.t('Libra (GBP)', 'Pound (GBP)') }}</option>
                  </select>
                  <p class="text-[11px] text-primary">{{ prefs.t('Sincroniza com backend.', 'Synced with backend.') }}</p>
                </div>

                <div class="space-y-2">
                  <label class="text-on-surface-variant text-sm">{{ prefs.t('Idioma', 'Language') }}</label>
                  <select [(ngModel)]="form.language" name="language" class="input-base w-full">
                    <option value="pt-BR">Português (BR)</option>
                    <option value="en-US">English (US)</option>
                  </select>
                  <p class="text-[11px] text-on-surface-variant">{{ prefs.t('Aplicação local (frontend).', 'Local application (frontend).') }}</p>
                </div>

                <div class="space-y-2">
                  <label class="text-on-surface-variant text-sm">{{ prefs.t('Tema', 'Theme') }}</label>
                  <select [(ngModel)]="form.theme" name="theme" class="input-base w-full">
                    <option value="dark">{{ prefs.t('Escuro', 'Dark') }}</option>
                    <option value="light">{{ prefs.t('Claro', 'Light') }}</option>
                    <option value="system">{{ prefs.t('Sistema', 'System') }}</option>
                  </select>
                  <p class="text-[11px] text-on-surface-variant">{{ prefs.t('Aplicação local (frontend).', 'Local application (frontend).') }}</p>
                </div>
              </div>

              <div class="flex justify-end gap-3 pt-6 border-t border-white/5">
                <button type="submit" [disabled]="saving()" class="bg-primary text-on-primary px-8 py-3 rounded-lg font-bold disabled:opacity-60">
                  {{ saving() ? prefs.t('Salvando...', 'Saving...') : prefs.t('Salvar Alterações', 'Save Changes') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  `
})
export class PerfilComponent {
  private http = inject(HttpClient);
  prefs = inject(PreferencesService);
  private notifications = inject(NotificationService);
  avatarFile: File | null = null;
  avatarPreview = signal<string | null>(null);
  profile = signal<any | null>(null);
  saving = signal(false);

  form: PerfilLocal = {
    name: '',
    email: '',
    phone: '',
    currency: 'AOA',
    language: 'pt-BR',
    theme: 'dark'
  };

  ngOnInit(): void {
    this.loadPerfil();
  }

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.avatarFile = input.files && input.files[0] ? input.files[0] : null;
    if (this.avatarFile) {
      this.avatarPreview.set(URL.createObjectURL(this.avatarFile));
    }
  }

  save(): void {
    this.saving.set(true);

    const formData = new FormData();
    formData.append('moeda_preferida', this.form.currency);
    formData.append('telefone', this.form.phone || '');
    formData.append('language', this.form.language);
    formData.append('theme', this.form.theme);
    if (this.avatarFile) {
      formData.append('avatar', this.avatarFile);
    }

    this.http.post<any>(`${environment.apiUrl}/perfil`, formData).subscribe({
      next: (res) => {
        this.saving.set(false);
        if (!res?.success) {
          this.notifications.error(res?.message ?? this.prefs.t('Não foi possível atualizar o perfil.', 'Could not update profile.'));
          return;
        }

        const data = res?.data ?? this.profile();
        this.profile.set(data);
        this.syncPreferences(data);
        this.avatarPreview.set(null);
        this.loadPerfil(false);

        this.notifications.success(this.prefs.t(
          'Perfil atualizado com sucesso. Os dados do perfil ficaram sincronizados com o backend.',
          'Profile updated successfully. Profile data is now synced with the backend.'
        ));
      },
      error: (e) => {
        this.saving.set(false);
        this.notifications.error(e?.error?.message ?? this.prefs.t('Não foi possível atualizar o perfil.', 'Could not update profile.'));
      }
    });
  }

  private loadPerfil(showErrors = true): void {
    this.http.get<any>(`${environment.apiUrl}/perfil`).subscribe({
      next: (res) => {
        const data = res?.data ?? null;
        this.profile.set(data);
        if (data) {
          this.form.name = data.name ?? '';
          this.form.email = data.email ?? '';
          this.form.phone = data.phone ?? '';
          this.form.currency = data.moeda_preferida ?? 'AOA';
          this.form.language = data.language ?? 'pt-BR';
          this.form.theme = data.theme ?? 'dark';
          this.avatarPreview.set(null);
          this.syncPreferences(data);
        }
      },
      error: (e) => {
        if (showErrors) {
          this.notifications.error(e?.error?.message ?? this.prefs.t('Não foi possível carregar o perfil.', 'Could not load profile.'));
        }
      }
    });
  }

  private syncPreferences(data: any): void {
    if (!data) return;
    if (data.language === 'pt-BR') {
      this.prefs.setLanguage('PT');
    } else if (data.language === 'en-US') {
      this.prefs.setLanguage('EN');
    }

    if (data.theme === 'dark' || data.theme === 'light' || data.theme === 'system') {
      this.prefs.setTheme(data.theme);
    }
  }

  avatarSrc(url: string | null | undefined): string | null {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const parsed = new URL(environment.apiUrl);
    const basePath = parsed.pathname.replace(/\/backend\/index\.php\/api\/?$/, '');
    return `${parsed.origin}${basePath}${url}`;
  }
}



