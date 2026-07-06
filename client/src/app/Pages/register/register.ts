import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Auth } from '../../services/auth';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { getErrorMessage } from '../../utils/http-error.util';

declare const google: any;

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register implements OnInit, OnDestroy {
  registerForm: FormGroup;
  otpForm: FormGroup;
  loading = false;
  googleLoading = false;
  successMessage = '';
  errorMessage = '';
  passwordVisible = false;

  togglePassword(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  /** Step 1 = form, Step 2 = OTP verification */
  step: 1 | 2 = 1;
  pendingEmail = '';
  resendCooldown = 0;
  private cooldownInterval: any;
  private gsiPollInterval?: ReturnType<typeof setInterval>;

  constructor(
    private fb: FormBuilder,
    private auth: Auth,
    private router: Router,
    private route: ActivatedRoute,
    private ngZone: NgZone
  ) {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });

    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
    });
  }

  ngOnInit(): void {
    // If redirected from login with verify param, jump to step 2
    this.route.queryParams.subscribe((params) => {
      if (params['verify']) {
        this.pendingEmail = params['verify'];
        this.step = 2;
      }
    });

    this.initGoogleSignIn();
  }

  ngOnDestroy(): void {
    if (this.gsiPollInterval) clearInterval(this.gsiPollInterval);
    if (this.cooldownInterval) clearInterval(this.cooldownInterval);
  }

  // ─── Google GSI ──────────────────────────────────────────────────────────

  private initGoogleSignIn(): void {
    const startedAt = Date.now();
    const GSI_LOAD_TIMEOUT_MS = 10000;

    this.gsiPollInterval = setInterval(() => {
      if (typeof google !== 'undefined' && google.accounts) {
        clearInterval(this.gsiPollInterval);
        google.accounts.id.initialize({
          client_id: environment.googleClientId,
          callback: (response: any) => this.handleGoogleCredential(response),
          auto_select: false,
        });
        google.accounts.id.renderButton(
          document.getElementById('google-signup-btn'),
          {
            theme: 'filled_black',
            size: 'large',
            width: '100%',
            shape: 'pill',
            text: 'signup_with',
          }
        );
      } else if (Date.now() - startedAt > GSI_LOAD_TIMEOUT_MS) {
        clearInterval(this.gsiPollInterval);
        console.warn('[Register] Google Sign-In script did not load (blocked by an extension, or a network issue). Email/password sign-up is still available.');
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
          this.errorMessage = getErrorMessage(err, 'Google sign-up failed.');
          this.googleLoading = false;
        },
      });
    });
  }

  // ─── Step 1: Register ────────────────────────────────────────────────────

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.auth.register(this.registerForm.value).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.pendingEmail = res.email || this.registerForm.get('email')?.value;
        this.successMessage = res.message;
        this.step = 2;
        this.startResendCooldown();
      },
      error: (err) => {
        this.errorMessage = getErrorMessage(err, 'Registration failed.');
        this.loading = false;
      },
    });
  }

  // ─── Step 2: Verify OTP ──────────────────────────────────────────────────

  onVerify(): void {
    if (this.otpForm.invalid) {
      this.otpForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.auth.verifyEmail(this.pendingEmail, this.otpForm.get('otp')?.value).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/main']);
      },
      error: (err) => {
        this.errorMessage = getErrorMessage(err, 'Invalid verification code.');
        this.loading = false;
      },
    });
  }

  // ─── Resend OTP ──────────────────────────────────────────────────────────

  resendOtp(): void {
    if (this.resendCooldown > 0) return;

    this.auth.resendVerification(this.pendingEmail).subscribe({
      next: (res: any) => {
        this.successMessage = res.message || 'Code resent!';
        this.startResendCooldown();
      },
      error: (err) => {
        this.errorMessage = getErrorMessage(err, 'Could not resend code.');
      },
    });
  }

  private startResendCooldown(): void {
    this.resendCooldown = 60;
    if (this.cooldownInterval) clearInterval(this.cooldownInterval);
    this.cooldownInterval = setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0) clearInterval(this.cooldownInterval);
    }, 1000);
  }
}
