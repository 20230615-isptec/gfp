import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { PreferencesService } from '../core/preferences.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="bg-deep-navy text-on-surface min-h-screen flex flex-col md:flex-row antialiased relative overflow-x-hidden">
      <!-- Ambient Background Glow -->
      <div class="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div class="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full bg-emerald-glow/5 blur-[120px]"></div>
        <div class="absolute bottom-[-10%] left-[-5%] w-[30vw] h-[30vw] rounded-full bg-indigo-soft/5 blur-[120px]"></div>
      </div>

      <!-- SideNavBar (Desktop) -->
      <nav class="fixed left-0 top-0 h-full w-[280px] hidden md:flex flex-col bg-slate-800/60 backdrop-blur-md border-r border-outline-variant/10 shadow-xl py-8 px-4 z-40">
        <div class="flex items-center gap-3 mb-8 px-4">
          <div class="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
            <span class="material-symbols-outlined text-primary" style="font-variation-settings: 'FILL' 1;">account_balance</span>
          </div>
          <div>
            <h1 class="font-headline-md text-[24px] font-bold text-emerald-glow">FinanSmart</h1>
            <p class="font-label-md text-on-surface-variant text-[10px]">Precision Prosperity</p>
          </div>
        </div>

        <div class="flex-1 space-y-2 mt-4 flex flex-col">
          <a routerLink="/dashboard" routerLinkActive="text-primary-fixed-dim font-bold border-l-4 border-primary bg-primary/5 bg-opacity-10 pl-4" [routerLinkActiveOptions]="{exact: true}" class="flex items-center gap-3 py-3 rounded-lg text-on-surface-variant pl-5 hover:bg-primary/10 hover:text-primary transition-colors duration-200 group">
            <span class="material-symbols-outlined group-hover:scale-110 transition-transform">dashboard</span>
            <span class="font-label-md">Dashboard</span>
          </a>
          <a routerLink="/transacoes" routerLinkActive="text-primary-fixed-dim font-bold border-l-4 border-primary bg-primary/5 pl-4" class="flex items-center gap-3 py-3 rounded-lg text-on-surface-variant pl-5 hover:bg-primary/10 hover:text-primary transition-colors duration-200 group">
            <span class="material-symbols-outlined group-hover:scale-110 transition-transform">receipt_long</span>
            <span class="font-label-md">Transactions</span>
          </a>
          <a routerLink="/categorias" routerLinkActive="text-primary-fixed-dim font-bold border-l-4 border-primary bg-primary/5 pl-4" class="flex items-center gap-3 py-3 rounded-lg text-on-surface-variant pl-5 hover:bg-primary/10 hover:text-primary transition-colors duration-200 group">
            <span class="material-symbols-outlined group-hover:scale-110 transition-transform">category</span>
            <span class="font-label-md">Categories</span>
          </a>
          @if(user()?.role === 'Admin') {
            <a routerLink="/admin" routerLinkActive="text-primary-fixed-dim font-bold border-l-4 border-primary bg-primary/5 pl-4" class="flex items-center gap-3 py-3 rounded-lg text-on-surface-variant pl-5 hover:bg-primary/10 hover:text-primary transition-colors duration-200 group">
              <span class="material-symbols-outlined group-hover:scale-110 transition-transform">admin_panel_settings</span>
              <span class="font-label-md">Admin</span>
            </a>
          }
        </div>

        <!-- Footer Nav -->
        <div class="mt-auto space-y-2 border-t border-outline-variant/10 pt-4">
          <a routerLink="/config" class="flex items-center gap-3 py-3 rounded-lg text-on-surface-variant pl-5 hover:bg-primary/10 hover:text-primary transition-colors duration-200 group">
            <span class="material-symbols-outlined group-hover:scale-110 transition-transform">settings</span>
            <span class="font-label-md">Settings</span>
          </a>
          
          <div class="mt-6 flex items-center justify-between p-3 rounded-xl bg-surface-container border border-outline-variant/20">
            <div class="flex items-center gap-3 overflow-hidden">
              <div class="w-8 h-8 rounded-full bg-primary/20 border border-primary/50 text-primary flex items-center justify-center font-bold text-xs uppercase">{{ userInitials() }}</div>
              <div class="flex flex-col truncate pr-2">
                <span class="font-label-md text-on-surface truncate">{{ user()?.name }}</span>
                <span class="font-label-md text-[10px] text-on-surface-variant truncate">{{ user()?.role }} Plan</span>
              </div>
            </div>
            <button (click)="logout()" class="text-on-surface-variant hover:text-danger-red transition-colors flex-shrink-0" title="Logout">
              <span class="material-symbols-outlined text-sm">logout</span>
            </button>
          </div>
        </div>
      </nav>

      <!-- Main Content Area -->
      <main class="flex-1 md:ml-[280px] w-full relative z-10 flex flex-col min-h-screen">
        <!-- TopAppBar (Desktop & Mobile) -->
        <header class="flex justify-between items-center px-4 md:px-8 w-full bg-surface/80 backdrop-blur-xl border-b border-outline-variant/10 shadow-sm sticky top-0 h-16 z-40">
          <div class="font-headline-md text-xl font-bold text-primary md:hidden">FinanSmart</div>
          <div class="hidden md:flex flex-1"></div> <!-- Spacer on desktop -->

          <div class="flex items-center gap-4 ml-auto">
            <!-- Language Toggle -->
            <button (click)="prefs.toggleLanguage()" class="font-label-md text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 cursor-pointer">
              <span [class.font-bold]="prefs.lang() === 'PT'" [class.text-primary]="prefs.lang() === 'PT'">PT</span>
              <span class="opacity-50 text-outline-variant">|</span>
              <span [class.font-bold]="prefs.lang() === 'EN'" [class.text-primary]="prefs.lang() === 'EN'">EN</span>
            </button>

            <!-- Theme Toggle -->
            <button (click)="prefs.toggleTheme()" class="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-emerald-glow hover:bg-primary/10 transition-all duration-300 cursor-pointer">
              <span class="material-symbols-outlined">{{ prefs.isDarkMode() ? 'light_mode' : 'dark_mode' }}</span>
            </button>

            <!-- Notifications -->
            <button class="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-emerald-glow hover:bg-primary/10 transition-all duration-300 relative cursor-pointer">
              <span class="material-symbols-outlined">notifications</span>
              <span class="absolute top-2 right-2 w-2 h-2 bg-danger-red rounded-full"></span>
            </button>

            <!-- Mobile Logout -->
            <button (click)="logout()" class="md:hidden text-on-surface-variant hover:text-danger-red transition-all cursor-pointer ml-2">
              <span class="material-symbols-outlined">logout</span>
            </button>
          </div>
        </header>

        <!-- Content -->
        <div class="flex-1 w-full max-w-[1440px] mx-auto p-4 md:p-10 pt-8 md:pt-10 pb-24 md:pb-12">
           <router-outlet></router-outlet>
        </div>
      </main>

      <!-- Bottom Navigation (Mobile) -->
      <nav class="fixed bottom-0 w-full h-16 md:hidden z-50 rounded-t-xl bg-slate-800/95 backdrop-blur-lg border-t border-outline-variant/10 flex justify-around items-center px-4">
        <a routerLink="/dashboard" routerLinkActive="text-primary bg-primary/10 rounded-xl px-4 py-1" [routerLinkActiveOptions]="{exact: true}" class="flex flex-col items-center justify-center text-on-surface-variant transition-all">
          <span class="material-symbols-outlined">home</span>
        </a>
        <a routerLink="/transacoes" routerLinkActive="text-primary bg-primary/10 rounded-xl px-4 py-1" class="flex flex-col items-center justify-center text-on-surface-variant transition-all">
          <span class="material-symbols-outlined">receipt_long</span>
        </a>
        <a routerLink="/categorias" routerLinkActive="text-primary bg-primary/10 rounded-xl px-4 py-1" class="flex flex-col items-center justify-center text-on-surface-variant transition-all">
          <span class="material-symbols-outlined">category</span>
        </a>
        @if(user()?.role === 'Admin') {
          <a routerLink="/admin" routerLinkActive="text-primary bg-primary/10 rounded-xl px-4 py-1" class="flex flex-col items-center justify-center text-on-surface-variant transition-all">
            <span class="material-symbols-outlined">admin_panel_settings</span>
          </a>
        }
      </nav>
    </div>
  `
})
export class LayoutComponent {
  authService = inject(AuthService);
  prefs = inject(PreferencesService);
  user = this.authService.currentUser;

  userInitials() {
    const name = this.user()?.name || '?';
    return name.substring(0, 2);
  }

  logout() {
    this.authService.logout();
    window.location.href = '/login';
  }
}
