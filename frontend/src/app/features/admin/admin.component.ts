import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../core/auth.service';
import { PreferencesService } from '../../core/preferences.service';

interface AdminUser { id: number; nome: string; email: string; tipo_usuario_id: number; criado_em: string; }

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
      <div><h1 class="text-3xl font-bold">{{ prefs.t('Administracao', 'Administration') }}</h1><p class="text-on-surface-variant mt-2">{{ prefs.t('Gestao centralizada de utilizadores e permissoes.', 'Centralized user and permission management.') }}</p></div>
      <button (click)="loadUsers()" class="bg-primary text-on-primary px-6 py-3 rounded-lg inline-flex items-center gap-2 transition-all duration-200 hover:-translate-y-[1px]"><span class="material-symbols-outlined">refresh</span>{{ prefs.t('Atualizar Dados', 'Refresh Data') }}</button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8"><div class="glass-card rounded-xl p-6"><p class="text-on-surface-variant text-xs uppercase">{{ prefs.t('Total de Utilizadores', 'Total Users') }}</p><p class="text-4xl font-bold mt-2">{{ users().length }}</p></div></div>

    <div class="glass-card rounded-xl overflow-hidden mt-8 app-enter">
      <div class="p-6 border-b border-outline-variant/10 flex justify-between items-center"><h3 class="text-xl">{{ prefs.t('Gestao de Acessos', 'Access Management') }}</h3></div>
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse min-w-[900px]"><thead><tr class="border-b border-outline-variant/10 bg-surface-container/50"><th class="py-4 px-6">ID</th><th class="py-4 px-6">{{ prefs.t('Nome', 'Name') }}</th><th class="py-4 px-6">Email</th><th class="py-4 px-6">{{ prefs.t('Tipo', 'Type') }}</th><th class="py-4 px-6">{{ prefs.t('Data de Criacao', 'Created At') }}</th><th class="py-4 px-6 text-right">{{ prefs.t('Acoes', 'Actions') }}</th></tr></thead>
          <tbody class="divide-y divide-outline-variant/10">
            @for (u of users(); track u.id) {
              <tr class="table-row-hover transition-colors">
                <td class="py-4 px-6">{{u.id}}</td><td class="py-4 px-6">{{u.nome}}</td><td class="py-4 px-6">{{u.email}}</td><td class="py-4 px-6"><span class="px-2 py-0.5 rounded-full text-xs" [class]="u.tipo_usuario_id===1?'bg-primary/10 text-primary':'bg-slate-700 text-on-surface'">{{u.tipo_usuario_id===1?'Admin':'User'}}</span></td><td class="py-4 px-6">{{u.criado_em | date:'dd/MM/yyyy HH:mm'}}</td>
                <td class="py-4 px-6 text-right"><button class="soft-btn" [disabled]="u.id===me()" (click)="toggleRole(u)">{{u.tipo_usuario_id===1? prefs.t('Remover admin', 'Remove admin') : prefs.t('Tornar admin', 'Make admin')}}</button><button class="soft-btn soft-btn-danger text-danger-red ml-3" [disabled]="u.id===me()" (click)="remove(u.id)">{{ prefs.t('Excluir', 'Delete') }}</button></td>
              </tr>
            } @empty { <tr><td colspan="6" class="py-8 text-center text-on-surface-variant">{{ prefs.t('Nenhum utilizador encontrado.', 'No users found.') }}</td></tr> }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class AdminComponent {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  prefs = inject(PreferencesService);
  users = signal<AdminUser[]>([]);
  me = signal(this.auth.currentUser()?.id || 0);

  ngOnInit() { this.loadUsers(); }
  loadUsers() { this.http.get<any>(`${environment.apiUrl}/admin/utilizadores`).subscribe({ next: (r: any) => this.users.set(Array.isArray(r?.data) ? r.data : []) }); }
  toggleRole(user: AdminUser) { const nextType = user.tipo_usuario_id === 1 ? 2 : 1; this.http.put(`${environment.apiUrl}/admin/utilizadores?id=${user.id}`, { tipo_usuario_id: nextType }).subscribe({ next: () => this.loadUsers() }); }
  remove(id: number) { this.http.delete(`${environment.apiUrl}/admin/utilizadores?id=${id}`).subscribe({ next: () => this.loadUsers() }); }
}
