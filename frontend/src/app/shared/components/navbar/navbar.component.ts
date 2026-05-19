import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { ExportService } from '../../../services/export.service';
import { TranslationPipe } from '../../../core/i18n/translation.pipe';
import { LangSwitchComponent } from '../../../core/i18n/lang-switch.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslationPipe, LangSwitchComponent],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  isLoggedIn = false;
  isAdmin = false;
  isMobileMenuOpen = false;
  isDarkMode = false;
  userName: string | null = null;
  pageTitleKey = 'navbar.overview';

  constructor(
    private authService: AuthService,
    private themeService: ThemeService,
    private exportService: ExportService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkAuthStatus();
    this.checkThemeMode();
    this.updatePageTitle(this.router.url);

    this.authService.isLoggedIn$.subscribe((loggedIn: boolean) => {
      this.isLoggedIn = loggedIn;
      if (loggedIn) {
        const userData = this.authService.getUserData();
        if (userData) {
          this.userName = userData.nome;
          this.isAdmin = userData.role === 1;
        }
      }
    });

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updatePageTitle(event.urlAfterRedirects);
      });

    this.themeService.isDarkMode$.subscribe((isDark: boolean) => {
      this.isDarkMode = isDark;
    });
  }

  private checkAuthStatus(): void {
    this.isLoggedIn = this.authService.isAuthenticated();
    if (this.isLoggedIn) {
      const userData = this.authService.getUserData();
      if (userData) {
        this.userName = userData.nome;
        this.isAdmin = userData.role === 1;
      }
    }
  }

  private checkThemeMode(): void {
    this.isDarkMode = this.themeService.isDark();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  logout(): void {
    this.authService.logout();
    this.closeMobileMenu();
    this.router.navigate(['/login']);
  }

  exportCSV(): void {
    const url = this.isAdmin
      ? 'http://localhost/gfp/backend/api/admin/exportar/usuarios'
      : 'http://localhost/gfp/backend/api/exportar/csv';
    const fileName = this.isAdmin ? 'usuarios_sistema.csv' : 'extrato_financeiro.csv';

    this.exportService.exportarCsv(fileName, url).catch((error: Error) => {
      console.error('Erro ao exportar:', error);
    });
  }

  private updatePageTitle(url: string): void {
    if (url.startsWith('/admin')) {
      this.pageTitleKey = 'navbar.administration';
    } else if (url.startsWith('/transacoes')) {
      this.pageTitleKey = 'navbar.transactions';
    } else if (url.startsWith('/categorias')) {
      this.pageTitleKey = 'navbar.categories';
    } else {
      this.pageTitleKey = 'navbar.overview';
    }
  }
}
