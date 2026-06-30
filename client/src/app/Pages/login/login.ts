import { Component, OnInit, NgZone } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Auth } from '../../services/auth';
import { Router, RouterLink } from '@angular/router';

declare const google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  loginForm: FormGroup;
  loading = false;
  googleLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private auth: Auth,
    private router: Router,
    private ngZone: NgZone
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  ngOnInit(): void {
    this.initGoogleSignIn();
  }

  // ─── Google GSI ──────────────────────────────────────────────────────────

  private initGoogleSignIn(): void {
    // Wait for the GSI script to load
    const interval = setInterval(() => {
      if (typeof google !== 'undefined' && google.accounts) {
        clearInterval(interval);
        google.accounts.id.initialize({
          client_id:
            '90530321960-qggu0jva1os8kodm9hgk0lp3fe0a3dni.apps.googleusercontent.com',
          callback: (response: any) => this.handleGoogleCredential(response),
          auto_select: false,
        });
        google.accounts.id.renderButton(
          document.getElementById('google-signin-btn'),
          {
            theme: 'filled_black',
            size: 'large',
            width: '100%',
            shape: 'pill',
            text: 'continue_with',
          }
        );
      }
    }, 200);
  }

  handleGoogleCredential(response: any): void {
    this.ngZone.run(() => {
      this.googleLoading = true;
      this.errorMessage = '';

      this.auth.googleAuth(response.credential).subscribe({
        next: () => {
          this.googleLoading = false;
          this.router.navigate(['/main']);
        },
        error: (err) => {
          this.errorMessage =
            err.error?.message || 'Google sign-in failed. Please try again.';
          this.googleLoading = false;
        },
      });
    });
  }

  // ─── Standard Login ──────────────────────────────────────────────────────

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.auth.login(this.loginForm.value).subscribe({
      next: (res: any) => {
        this.loading = false;

        // Handle unverified email redirect
        if (res.code === 'EMAIL_NOT_VERIFIED') {
          this.router.navigate(['/signup'], {
            queryParams: { verify: res.email },
          });
          return;
        }

        this.router.navigate(['/main']);
      },
      error: (err) => {
        this.loading = false;

        if (err.error?.code === 'EMAIL_NOT_VERIFIED') {
          this.router.navigate(['/signup'], {
            queryParams: { verify: err.error.email },
          });
          return;
        }

        this.errorMessage =
          err.error?.message || 'Invalid email or password.';
      },
    });
  }
}
