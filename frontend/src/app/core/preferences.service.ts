import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PreferencesService {
  isDarkMode = signal<boolean>(true);
  lang = signal<'PT' | 'EN'>('PT');

  constructor() {
    if (typeof document !== 'undefined') {
      const savedTheme = localStorage.getItem('theme_mode');
      const savedLang = localStorage.getItem('theme_lang');

      this.applyTheme(savedTheme === 'light' || savedTheme === 'system' ? savedTheme : 'dark');

      if (savedLang === 'PT' || savedLang === 'EN') {
        this.lang.set(savedLang);
        document.documentElement.lang = savedLang === 'PT' ? 'pt' : 'en';
      }
    }
  }

  toggleTheme() {
    this.setTheme(this.isDarkMode() ? 'light' : 'dark');
  }

  toggleLanguage() {
    this.setLanguage(this.lang() === 'PT' ? 'EN' : 'PT');
  }

  setLanguage(mode: 'PT' | 'EN') {
    this.lang.set(mode);
    localStorage.setItem('theme_lang', mode);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = mode === 'PT' ? 'pt' : 'en';
    }
  }

  setTheme(mode: 'dark' | 'light' | 'system') {
    this.applyTheme(mode);
  }

  private applyTheme(mode: 'dark' | 'light' | 'system') {
    const prefersDark = typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : true;
    const dark = mode === 'system' ? prefersDark : mode === 'dark';
    this.isDarkMode.set(dark);
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', dark);
    }
    localStorage.setItem('theme_mode', mode);
  }

  t(pt: string, en: string): string {
    return this.lang() === 'PT' ? pt : en;
  }
}

