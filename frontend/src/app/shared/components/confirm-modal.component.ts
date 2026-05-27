import { Component, inject, input, output } from '@angular/core';
import { PreferencesService } from '../../core/preferences.service';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  template: `
    @if(open()) {
      <div class="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" (click)="cancel.emit()">
        <div class="glass-card rounded-xl p-6 w-full max-w-md" (click)="$event.stopPropagation()">
          <h3 class="text-lg font-bold mb-2">{{ title() }}</h3>
          <p class="text-on-surface-variant mb-5">{{ message() }}</p>
          <div class="flex justify-end gap-2">
            <button class="soft-btn" (click)="cancel.emit()">{{ cancelLabel() }}</button>
            <button class="bg-danger-red text-white rounded-lg px-4 py-2 font-bold" (click)="confirm.emit()">{{ confirmLabel() }}</button>
          </div>
        </div>
      </div>
    }
  `
})
export class ConfirmModalComponent {
  prefs = inject(PreferencesService);
  open = input<boolean>(false);
  title = input<string>(this.prefs.t('Confirmar ação', 'Confirm action'));
  message = input<string>(this.prefs.t('Tem certeza?', 'Are you sure?'));
  confirmLabel = input<string>(this.prefs.t('Confirmar', 'Confirm'));
  cancelLabel = input<string>(this.prefs.t('Cancelar', 'Cancel'));
  confirm = output<void>();
  cancel = output<void>();
}
