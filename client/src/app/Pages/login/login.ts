import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Auth } from '../../services/auth';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { getErrorMessage } from '../../utils/http-error.util';

declare const google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit, OnDestroy {
  loginForm: FormGroup;
  loading = false;
  googleLoading = false;
  errorMessage = '';
  passwordVisible = false;
  private gsiPollInterval?: ReturnType<typeof setInterval>;

  togglePassword(): void {
    this.passwordVisible = !this.passwordVisible;
  }

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

  ngOnDestroy(): void {
    // Without this, navigating away from /login before the GSI script has
    // loaded (e.g. it's blocked by an ad-blocker, or just slow) leaves this
    // interval running forever in the background against a component that no
    // longer exists.
    if (this.gsiPollInterval) clearInterval(this.gsiPollInterval);
  }

  // ─── Google GSI ──────────────────────────────────────────────────────────

  private initGoogleSignIn(): void {
    // Wait for the GSI script to load, but don't wait forever -- if it's
    // blocked (ad-blockers and privacy extensions commonly block Google's
    // sign-in script) this used to poll silently forever with no fallback.
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
          document.getElementById('google-signin-btn'),
          {
            theme: 'filled_black',
            size: 'large',
            width: '100%',
            shape: 'pill',
            text: 'continue_with',
          }
        );
      } else if (Date.now() - startedAt > GSI_LOAD_TIMEOUT_MS) {
        clearInterval(this.gsiPollInterval);
        console.warn('[Login] Google Sign-In script did not load (blocked by an extension, or a network issue). Email/password sign-in is still available.');
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
          this.errorMessage = getErrorMessage(err, 'Google sign-in failed. Please try again.');
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

        let msg = 'Invalid email or password.';
        if (err.error?.code === 'EMAIL_NOT_VERIFIED') {
          this.router.navigate(['/signup'], {
            queryParams: { verify: err.error.email },
          });
          return;
        }

        this.errorMessage = getErrorMessage(err, msg);
      },
    });
  }
}
