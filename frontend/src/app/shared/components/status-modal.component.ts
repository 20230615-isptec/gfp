import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PreferencesService } from '../../core/preferences.service';

@Component({
  selector: 'app-status-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if(open()) {
      <div class="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" (click)="close.emit()">
        <div class="glass-card modal-shell rounded-xl p-0 w-full max-w-xl overflow-hidden" (click)="$event.stopPropagation()">
          <div class="px-6 py-4 border-b border-outline-variant/20">
            <h3 class="modal-title">{{ title() }}</h3>
          </div>
          <div class="px-6 py-5">
            @if(data()) {
              <div class="space-y-3 text-sm">
                <div class="flex justify-between border-b border-outline-variant/20 pb-2">
                  <span class="text-on-surface-variant">{{ prefs.t('Categoria', 'Category') }}</span>
                  <span class="font-semibold">{{ data().categoria || '-' }}</span>
                </div>
                <div class="flex justify-between border-b border-outline-variant/20 pb-2">
                  <span class="text-on-surface-variant">{{ prefs.t('Limite', 'Limit') }}</span>
                  <span class="font-semibold">Kz {{ data().limite ?? 0 }}</span>
                </div>
                <div class="flex justify-between border-b border-outline-variant/20 pb-2">
                  <span class="text-on-surface-variant">{{ prefs.t('Gasto atual', 'Current spend') }}</span>
                  <span class="font-semibold">Kz {{ data().gasto_atual ?? 0 }}</span>
                </div>
                <div class="flex justify-between border-b border-outline-variant/20 pb-2">
                  <span class="text-on-surface-variant">{{ prefs.t('Percentual consumido', 'Consumed percent') }}</span>
                  <span class="font-semibold">{{ data().percentual_consumido ?? 0 }}%</span>
                </div>
                <div class="flex justify-between border-b border-outline-variant/20 pb-2">
                  <span class="text-on-surface-variant">{{ prefs.t('Restante', 'Remaining') }}</span>
                  <span class="font-semibold">Kz {{ data().restante ?? 0 }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-on-surface-variant">{{ prefs.t('Status', 'Status') }}</span>
                  <span class="font-semibold"
                        [class.text-primary]="data().status === 'ok'"
                        [class.text-yellow-500]="data().status === 'aviso'"
                        [class.text-danger-red]="data().status === 'excedido'">
                    {{ data().status || '-' }}
                  </span>
                </div>
              </div>
            } @else {
              <p class="text-on-surface-variant">{{ prefs.t('Sem dados.', 'No data.') }}</p>
            }

            <div class="flex justify-end mt-5 pt-4 border-t border-outline-variant/20">
              <button class="soft-btn" (click)="close.emit()">{{ prefs.t('Fechar', 'Close') }}</button>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class StatusModalComponent {
  prefs = inject(PreferencesService);
  open = input<boolean>(false);
  title = input<string>(this.prefs.t('Detalhes', 'Details'));
  data = input<any>(null);
  close = output<void>();
}
