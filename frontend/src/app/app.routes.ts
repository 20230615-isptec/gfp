import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login.component';
import { RegisterComponent } from './features/auth/register.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password.component';
import { ResetPasswordComponent } from './features/auth/reset-password.component';
import { LayoutComponent } from './layout/layout.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { TransactionsComponent } from './features/transactions/transactions.component';
import { CategoriesComponent } from './features/categories/categories.component';
import { AdminComponent } from './features/admin/admin.component';
import { PerfilComponent } from './features/perfil/perfil.component';
import { OrcamentosComponent } from './features/orcamentos/orcamentos.component';
import { RecorrenciasComponent } from './features/recorrencias/recorrencias.component';
import { NotificacoesComponent } from './features/notificacoes/notificacoes.component';
import { RelatoriosComponent } from './features/relatorios/relatorios.component';
import { MetasComponent } from './features/metas/metas.component';
import { authGuard, adminGuard, guestGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [guestGuard] },
  { path: 'forgot-password', component: ForgotPasswordComponent, canActivate: [guestGuard] },
  { path: 'reset-password', component: ResetPasswordComponent, canActivate: [guestGuard] },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'transacoes', component: TransactionsComponent },
      { path: 'categorias', component: CategoriesComponent },
      { path: 'perfil', component: PerfilComponent },
      { path: 'orcamentos', component: OrcamentosComponent },
      { path: 'recorrencias', component: RecorrenciasComponent },
      { path: 'notificacoes', component: NotificacoesComponent },
      { path: 'relatorios', component: RelatoriosComponent },
      { path: 'metas', component: MetasComponent },
      { path: 'admin', component: AdminComponent, canActivate: [adminGuard] }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
