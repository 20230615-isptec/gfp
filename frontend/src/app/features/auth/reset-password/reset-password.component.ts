import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent {
  form: FormGroup;
  token = '';
  isLoading = false;
  hasError = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {
    this.form = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
  }

  get newPassword() { return this.form.get('newPassword'); }
  get confirmPassword() { return this.form.get('confirmPassword'); }

  private passwordMatchValidator(form: FormGroup): { [key: string]: boolean } | null {
    const p1 = form.get('newPassword')?.value;
    const p2 = form.get('confirmPassword')?.value;
    return p1 === p2 ? null : { passwordMismatch: true };
  }

  submit(): void {
    if (!this.token) {
      this.hasError = true;
      this.errorMessage = 'Token ausente na URL.';
      return;
    }

    if (this.form.invalid || this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';

    this.authService.resetPassword(this.token, this.form.value.newPassword as string).subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.isLoading = false;
      },
      error: (error) => {
        this.hasError = true;
        this.errorMessage = error?.error?.message || 'Falha ao redefinir senha.';
        this.isLoading = false;
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
