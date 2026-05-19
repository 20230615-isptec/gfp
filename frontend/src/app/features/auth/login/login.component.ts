import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService, LoginRequest } from '../../../core/services/auth.service';
import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslationPipe } from '../../../core/i18n/translation.pipe';
import { LangSwitchComponent } from '../../../core/i18n/lang-switch.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslationPipe, LangSwitchComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  form: FormGroup;
  isLoading = false;
  hasError = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private i18nService: I18nService
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  get email() {
    return this.form.get('email');
  }

  get password() {
    return this.form.get('password');
  }

  login(): void {
    if (this.form.invalid) {
      return;
    }

    this.isLoading = true;
    this.hasError = false;

    const credentials: LoginRequest = {
      email: this.form.value.email,
      senha: this.form.value.password as string
    };

    this.authService.login(credentials).subscribe({
      next: () => {
        this.isLoading = false;
        const userData = this.authService.getUserData();
        const redirectTo = userData?.role === 1 ? '/admin' : '/dashboard';
        this.router.navigate([redirectTo]);
      },
      error: (error: any) => {
        this.isLoading = false;
        this.hasError = true;
        this.errorMessage = error?.error?.message || this.i18nService.translate('login.invalidCredentials');
      }
    });
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }
}
