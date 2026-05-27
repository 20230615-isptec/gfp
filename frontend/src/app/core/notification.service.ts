import { Injectable, signal } from '@angular/core';

export type AppNotificationType = 'success' | 'error' | 'info' | 'warning';

export interface AppNotification {
  id: string;
  type: AppNotificationType;
  title: string;
  message: string;
  criado_em: string;
  lida: boolean;
  origem: 'ui' | 'backend';
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly items = signal<AppNotification[]>([]);
  readonly history = signal<AppNotification[]>([]);
  private readonly storageKey = 'finansmart.notifications.history';

  success(message: string, title = 'Tudo certo'): void {
    this.push('success', title, message);
  }

  error(message: string, title = 'Atenção necessária'): void {
    this.push('error', title, message);
  }

  info(message: string, title = 'Informação'): void {
    this.push('info', title, message);
  }

  warning(message: string, title = 'Revise antes de continuar'): void {
    this.push('warning', title, message);
  }

  dismiss(id: string): void {
    this.items.update((items) => items.filter((item) => item.id !== id));
  }

  private push(type: AppNotificationType, title: string, message: string): void {
    const item: AppNotification = {
      id: this.generateId(),
      type,
      title,
      message,
      criado_em: new Date().toISOString(),
      lida: false,
      origem: 'ui'
    };

    this.items.update((items) => [item, ...items].slice(0, 4));
    this.history.update((items) => [item, ...items].slice(0, 50));
    this.persistHistory();

    if (typeof window !== 'undefined') {
      window.setTimeout(() => this.dismiss(item.id), type === 'error' ? 7000 : 4500);
    }
  }

  replaceHistory(items: AppNotification[]): void {
    this.history.set(items.slice(0, 50));
    this.persistHistory();
  }

  markHistoryRead(id: string): void {
    this.history.update((items) => items.map((item) => item.id === id ? { ...item, lida: true } : item));
    this.persistHistory();
  }

  markAllHistoryRead(): void {
    this.history.update((items) => items.map((item) => ({ ...item, lida: true })));
    this.persistHistory();
  }

  getUnreadCount(): number {
    return this.history().filter((item) => !item.lida).length;
  }

  loadHistory(): void {
    if (typeof window === 'undefined') return;

    try {
      const raw = window.localStorage.getItem(this.storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as AppNotification[];
      if (Array.isArray(parsed)) {
        this.history.set(parsed.slice(0, 50));
      }
    } catch {
      this.history.set([]);
    }
  }

  addFromBackend(item: Omit<AppNotification, 'origem'> & { origem?: 'backend' | 'ui' }): void {
    const normalized: AppNotification = { ...item, origem: item.origem ?? 'backend' };
    this.history.update((items) => [normalized, ...items.filter((existing) => existing.id !== normalized.id)].slice(0, 50));
    this.persistHistory();
  }

  private generateId(): string {
    return `ui-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  private persistHistory(): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(this.storageKey, JSON.stringify(this.history()));
    } catch {
      // ignore persistence failures
    }
  }
}
