import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { ExportService } from '../../../services/export.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  isLoggedIn = false;
  isAdmin = false;
  isMobileMenuOpen = false;
  isDarkMode = false;
  userName: string | null = null;
  pageTitle = 'Visão Geral';

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

    // Subscrever a mudanças no estado de autenticação
    this.authService.isLoggedIn$.subscribe((loggedIn: boolean) => {
      this.isLoggedIn = loggedIn;
      if (loggedIn) {
        const userData = this.authService.getUserData();
        if (userData) {
          this.userName = userData.nome;
          this.isAdmin = userData.role === 1; // role 1 = admin
        }
      }
    });

    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.updatePageTitle(event.urlAfterRedirects);
    });

    // Subscrever a mudanças no tema
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
      this.pageTitle = 'Administração';
    } else if (url.startsWith('/transacoes')) {
      this.pageTitle = 'Transações';
    } else if (url.startsWith('/categorias')) {
      this.pageTitle = 'Categorias';
    } else {
      this.pageTitle = 'Visão Geral';
    }
  }
}
