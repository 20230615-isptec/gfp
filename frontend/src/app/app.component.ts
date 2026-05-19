import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'FinanSmart - Gestão Financeira Pessoal';

  constructor(private themeService: ThemeService) {
    // Inicializar tema na abertura da aplicação
    this.themeService.isDarkMode$.subscribe(() => {
      // O ThemeService já aplica o tema ao DOM
    });
  }
}
