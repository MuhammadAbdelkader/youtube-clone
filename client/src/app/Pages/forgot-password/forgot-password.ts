import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.css'],
})
export class ForgotPassword {
  forgotForm: FormGroup;
  loading = false;
  successMessage = '';
  errorMessage = '';

  private fb = inject(FormBuilder);
  private authService = inject(Auth);

  constructor() {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onSubmit() {
    if (this.forgotForm.invalid) return;

    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';

    const email = this.forgotForm.value.email;
    this.authService.forgotPassword(email).subscribe({
      next: () => {
        this.successMessage = 'If an account exists with this email, a recovery token has been generated.';
        this.loading = false;
        this.forgotForm.reset();
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
}
