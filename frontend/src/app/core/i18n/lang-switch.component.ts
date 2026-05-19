import { Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService } from './i18n.service';
import { LanguageCode } from './translations';
import { TranslationPipe } from './translation.pipe';

@Component({
  selector: 'app-lang-switch',
  standalone: true,
  imports: [CommonModule, TranslationPipe],
  template: `
    <div class="lang-switch" [class.compact]="compact()">
      <label class="lang-switch-label" for="lang-select" *ngIf="!compact()">{{ 'lang.label' | t }}</label>
      <div class="lang-switch-control">
        <select
          id="lang-select"
          class="lang-switch-select"
          [class.compact]="compact()"
          [value]="currentLanguage()"
          (change)="onLanguageChange($event)"
          [attr.aria-label]="'lang.switchAria' | t"
        >
          <option value="pt">{{ 'lang.pt' | t }}</option>
          <option value="en">{{ 'lang.en' | t }}</option>
        </select>
        <span class="lang-switch-arrow" aria-hidden="true">▾</span>
      </div>
    </div>
  `,
  styleUrls: ['./lang-switch.component.scss']
})
export class LangSwitchComponent {
  readonly compact = input<boolean>(false);
  private readonly i18n = inject(I18nService);
  readonly currentLanguage = computed(() => this.i18n.language());

  onLanguageChange(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    const value = target?.value;
    if (value === 'pt' || value === 'en') {
      this.i18n.setLanguage(value as LanguageCode);
    }
  }
}
