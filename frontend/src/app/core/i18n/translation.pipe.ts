import { ChangeDetectorRef, Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from './i18n.service';

@Pipe({
  name: 't',
  standalone: true,
  pure: false
})
export class TranslationPipe implements PipeTransform {
  private readonly i18n = inject(I18nService);
  private readonly cdr = inject(ChangeDetectorRef);
  private lastLanguage = this.i18n.language();

  transform(key: string): string {
    const currentLanguage = this.i18n.language();
    if (currentLanguage !== this.lastLanguage) {
      this.lastLanguage = currentLanguage;
      this.cdr.markForCheck();
    }
    return this.i18n.translate(key);
  }
}
