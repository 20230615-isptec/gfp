import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PreferencesService {
  isDarkMode = signal<boolean>(true);
  lang = signal<'PT' | 'EN'>('PT');

  constructor() {
    if (typeof document !== 'undefined') {
      const savedTheme = localStorage.getItem('theme_mode');
      const savedLang = localStorage.getItem('theme_lang');

      const dark = savedTheme ? savedTheme === 'dark' : true;
      this.isDarkMode.set(dark);
      document.documentElement.classList.toggle('dark', dark);

      if (savedLang === 'PT' || savedLang === 'EN') {
        this.lang.set(savedLang);
        document.documentElement.lang = savedLang === 'PT' ? 'pt' : 'en';
      }
    }
  }

  toggleTheme() {
    if (typeof document !== 'undefined') {
      const next = !this.isDarkMode();
      this.isDarkMode.set(next);
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('theme_mode', next ? 'dark' : 'light');
    }
  }

  toggleLanguage() {
    this.lang.update((l) => {
      const next = l === 'PT' ? 'EN' : 'PT';
      localStorage.setItem('theme_lang', next);
      if (typeof document !== 'undefined') {
        document.documentElement.lang = next === 'PT' ? 'pt' : 'en';
      }
      return next;
    });
  }

  t(pt: string, en: string): string {
    return this.lang() === 'PT' ? pt : en;
  }
}

