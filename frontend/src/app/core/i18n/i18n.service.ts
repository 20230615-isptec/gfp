import { Injectable, computed, signal } from '@angular/core';
import { LanguageCode, TranslationTree, translations } from './translations';

@Injectable({
  providedIn: 'root'
})
export class I18nService {
  private readonly storageKey = 'app_language';
  private readonly fallbackLanguage: LanguageCode = 'pt';

  private readonly _language = signal<LanguageCode>(this.resolveInitialLanguage());
  readonly language = this._language.asReadonly();
  readonly isPortuguese = computed(() => this._language() === 'pt');

  setLanguage(language: LanguageCode): void {
    this._language.set(language);
    localStorage.setItem(this.storageKey, language);
  }

  toggleLanguage(): void {
    this.setLanguage(this._language() === 'pt' ? 'en' : 'pt');
  }

  translate(key: string): string {
    const currentLanguage = this._language();
    const value = this.getValueByPath(translations[currentLanguage], key);

    if (typeof value === 'string') {
      return value;
    }

    const fallback = this.getValueByPath(translations[this.fallbackLanguage], key);
    return typeof fallback === 'string' ? fallback : key;
  }

  private resolveInitialLanguage(): LanguageCode {
    const stored = localStorage.getItem(this.storageKey);
    if (stored === 'pt' || stored === 'en') {
      return stored;
    }
    return this.fallbackLanguage;
  }

  private getValueByPath(source: TranslationTree, key: string): string | TranslationTree | undefined {
    return key.split('.').reduce<string | TranslationTree | undefined>((acc, part) => {
      if (!acc || typeof acc === 'string') {
        return undefined;
      }
      return acc[part];
    }, source);
  }
}
