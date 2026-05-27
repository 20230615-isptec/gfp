import { Component, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { NotificationService } from '../../core/notification.service';
import { PreferencesService } from '../../core/preferences.service';

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [NgClass],
  template: `
    <div class="fixed right-4 top-4 z-[80] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3 pointer-events-none">
      @for (item of notifications.items(); track item.id) {
        <div class="pointer-events-auto rounded-lg border bg-surface-container/95 p-4 shadow-2xl backdrop-blur-md app-enter"
             [ngClass]="{
               'border-primary/40': item.type === 'success',
               'border-danger-red/40': item.type === 'error',
               'border-yellow-500/40': item.type === 'warning',
               'border-indigo-soft/40': item.type === 'info'
             }">
          <div class="flex items-start gap-3">
            <span class="material-symbols-outlined text-[22px]"
                  [ngClass]="{
                    'text-primary': item.type === 'success',
                    'text-danger-red': item.type === 'error',
                    'text-yellow-500': item.type === 'warning',
                    'text-indigo-soft': item.type === 'info'
                  }">
              {{ icon(item.type) }}
            </span>
            <div class="min-w-0 flex-1">
              <p class="font-bold text-on-surface text-sm">{{ item.title }}</p>
              <p class="mt-1 text-sm text-on-surface-variant leading-5">{{ item.message }}</p>
            </div>
            <button class="text-on-surface-variant hover:text-on-surface rounded-md p-1" type="button" (click)="notifications.dismiss(item.id)" [attr.aria-label]="prefs.t('Fechar notificação', 'Close notification')">
              <span class="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>
      }
    </div>
  `
})
export class NotificationCenterComponent {
  notifications = inject(NotificationService);
  prefs = inject(PreferencesService);

  ngOnInit(): void {
    this.notifications.loadHistory();
  }

  icon(type: string): string {
    if (type === 'success') return 'check_circle';
    if (type === 'error') return 'error';
    if (type === 'warning') return 'warning';
    return 'notifications';
  }
}
