import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PreferencesService {
  isDarkMode = signal<boolean>(true);
  lang = signal<'PT'|'EN'>('PT');

  constructor() {
    // Only access document in browser environment
    if (typeof document !== 'undefined') {
      const isDark = document.documentElement.classList.contains('dark');
      this.isDarkMode.set(isDark);
    }
  }

  toggleTheme() {
    if (typeof document !== 'undefined') {
      const html = document.documentElement;
      html.classList.toggle('dark');
      this.isDarkMode.set(html.classList.contains('dark'));
    }
  }

  toggleLanguage() {
    this.lang.update(l => l === 'PT' ? 'EN' : 'PT');
  }
}
