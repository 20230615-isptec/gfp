import { Component, inject, input, output } from '@angular/core';
import { PreferencesService } from '../../core/preferences.service';

@Component({
  selector: 'app-form-modal',
  standalone: true,
  template: `
    @if (open()) {
      <div class="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" (click)="close.emit()">
        <div class="glass-card modal-shell rounded-xl p-0 w-full max-w-xl overflow-hidden" (click)="$event.stopPropagation()">
          <div class="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between gap-4">
            <h3 class="modal-title">{{ title() }}</h3>
            <button class="soft-btn" (click)="close.emit()" [attr.aria-label]="prefs.t('Fechar', 'Close')">×</button>
          </div>
          <ng-content></ng-content>
        </div>
      </div>
    }
  `
})
export class FormModalComponent {
  prefs = inject(PreferencesService);
  open = input<boolean>(false);
  title = input<string>(this.prefs.t('Formulário', 'Form'));
  close = output<void>();
}
