import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
  form: FormGroup;
  isLoading = false;
  hasError = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  get email() {
    return this.form.get('email');
  }

  submit(): void {
    if (this.form.invalid || this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.forgotPassword(this.form.value.email as string).subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.isLoading = false;
      },
      error: (error) => {
        this.hasError = true;
        this.errorMessage = error?.error?.message || 'Falha ao solicitar recuperacao de senha.';
        this.isLoading = false;
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
