import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.css'],
})
export class ForgotPassword {
  // Step 1: Request Email
  forgotForm: FormGroup;
  // Step 2: Reset Password
  resetForm: FormGroup;

  step: 1 | 2 = 1;
  pendingEmail = '';
  
  loading = false;
  successMessage = '';
  errorMessage = '';

  passwordVisible = false;
  confirmPasswordVisible = false;

  private fb = inject(FormBuilder);
  private authService = inject(Auth);
  private router = inject(Router);

  constructor() {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });

    this.resetForm = this.fb.group({
      otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    }, { validators: this.passwordMatchValidator });
  }

  togglePassword(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  toggleConfirmPassword(): void {
    this.confirmPasswordVisible = !this.confirmPasswordVisible;
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    if (password && confirmPassword && password !== confirmPassword) {
      return { passwordsMismatch: true };
    }
    return null;
  }

  onRequestReset() {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';

    const email = this.forgotForm.value.email;
    this.authService.forgotPassword(email).subscribe({
      next: () => {
        this.successMessage = 'If an account exists with this email, a recovery token has been sent.';
        this.pendingEmail = email;
        this.step = 2;
        this.loading = false;
      },
      error: (err) => {
        let msg = 'Unable to connect to service. Please check your connection.';
        if (err?.status === 403) {
          msg = 'Action restricted. Please contact support.';
        } else if (err?.error?.message) {
          msg = err.error.message;
        } else {
          msg = 'Password recovery failed. Please try again.';
        }
        this.errorMessage = msg;
        this.loading = false;
      },
    });
  }

  onResetPassword() {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';

    const { otp, password } = this.resetForm.value;
    
    this.authService.resetPassword(this.pendingEmail, otp, password).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = 'Password successfully reset! Redirecting to login...';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to reset password. Please try again.';
        this.loading = false;
      }
    });
  }
}
