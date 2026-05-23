import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-admin',
  standalone: true,
  template: `
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
      <div>
        <h1 class="font-headline-lg-mobile md:font-headline-lg text-on-surface">Administração</h1>
        <p class="font-body-md text-on-surface-variant mt-2">Gestão centralizada de utilizadores e permissões do sistema.</p>
      </div>
      <button (click)="loadUsers()" class="bg-primary hover:bg-primary-container text-on-primary font-label-md px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors duration-200 shadow-[0_0_15px_rgba(78,222,163,0.2)]">
        <span class="material-symbols-outlined">refresh</span>
        <span>Atualizar Dados</span>
      </button>
    </div>

    <!-- Metrics -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
      <div class="glass-card rounded-xl p-6 relative overflow-hidden hover:bg-slate-800/80 transition-colors duration-300 group text-left">
        <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <span class="material-symbols-outlined text-6xl text-primary">group</span>
        </div>
        <p class="font-label-md text-on-surface-variant uppercase tracking-wider text-xs">Total de Utilizadores</p>
        <p class="font-headline-lg text-on-surface mt-2 font-data-mono">{{ users().length || '0' }}</p>
        <div class="mt-4 flex items-center text-primary text-sm">
          <span class="material-symbols-outlined text-sm mr-1">trending_up</span>
          <span>+12% este mês</span>
        </div>
      </div>
    </div>

    <!-- Users Table Section -->
    <div class="glass-card rounded-xl overflow-hidden mt-8">
      <div class="p-6 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-highest/30">
        <h3 class="font-headline-sm text-on-surface">Gestão de Acessos</h3>
        <div class="relative">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
          <input type="text" placeholder="Procurar utilizador..." class="bg-deep-navy border border-outline-variant/30 rounded-lg pl-10 pr-4 py-2 text-on-surface focus:border-indigo-soft focus:ring-1 focus:ring-indigo-soft font-body-md placeholder-on-surface-variant/50 w-full sm:w-64 transition-all"/>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-outline-variant/10 bg-surface-container/50">
              <th class="py-4 px-6 font-label-md text-on-surface-variant">ID</th>
              <th class="py-4 px-6 font-label-md text-on-surface-variant">Nome</th>
              <th class="py-4 px-6 font-label-md text-on-surface-variant">Email</th>
              <th class="py-4 px-6 font-label-md text-on-surface-variant">Tipo</th>
              <th class="py-4 px-6 font-label-md text-on-surface-variant">Data de Criação</th>
              <th class="py-4 px-6 font-label-md text-on-surface-variant text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-outline-variant/5">
            @for (user of users(); track user.id) {
            <tr class="hover:bg-surface-container-highest/20 transition-colors group">
              <td class="py-4 px-6 font-data-mono text-on-surface-variant">{{ user.id }}</td>
              <td class="py-4 px-6 font-body-md text-on-surface flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  {{ user.name.substring(0,2).toUpperCase() }}
                </div>
                {{ user.name }}
              </td>
              <td class="py-4 px-6 font-body-md text-on-surface-variant">{{ user.email }}</td>
              <td class="py-4 px-6">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold" 
                  [class.bg-primary]="user.role === 'Admin'" 
                  [class.bg-opacity-10]="user.role === 'Admin'"
                  [class.text-primary]="user.role === 'Admin'"
                  [class.border]="true"
                  [class.border-primary]="user.role === 'Admin'"
                  [class.border-opacity-20]="user.role === 'Admin'"
                  [class.bg-slate-700]="user.role !== 'Admin'"
                  [class.text-on-surface]="user.role !== 'Admin'"
                  >
                  {{ user.role }}
                </span>
              </td>
              <td class="py-4 px-6 font-data-mono text-on-surface-variant">{{ user.date || '2023-01-01' }}</td>
              <td class="py-4 px-6 text-right space-x-2">
                @if(user.role === 'Admin') {
                  <span class="text-xs text-on-surface-variant italic opacity-0 group-hover:opacity-100 transition-opacity">Restrito</span>
                } @else {
                  <div class="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end space-x-2">
                    <button class="text-on-surface-variant hover:text-indigo-soft transition-colors p-1 rounded hover:bg-indigo-soft/10" title="Promover a Admin">
                      <span class="material-symbols-outlined text-sm">security</span>
                    </button>
                    <button class="text-on-surface-variant hover:text-danger-red transition-colors p-1 rounded hover:bg-danger-red/10" title="Eliminar">
                      <span class="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                }
              </td>
            </tr>
            } @empty {
              <tr><td colspan="6" class="text-center py-6 text-on-surface-variant">Nenhum utilizador encontrado.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class AdminComponent {
  private http = inject(HttpClient);
  users = signal<any[]>([]);

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.http.get<any[]>(`${environment.apiUrl}/admin/utilizadores`).subscribe(data => {
      this.users.set(data);
    });
  }
}
