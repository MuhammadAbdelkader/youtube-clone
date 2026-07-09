import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * ConfigService
 *
 * Fetches runtime configuration from the backend at app bootstrap.
 * This is the secure alternative to embedding sensitive identifiers
 * (e.g. Google Client ID) inside the compiled Angular bundle.
 *
 * Flow:
 *   1. APP_INITIALIZER calls load() before the first component renders
 *   2. load() hits GET /api/config and stores the result
 *   3. Any component/service that needs googleClientId calls get()
 *
 * If the backend is unreachable (dev proxy down, network issue) the
 * service degrades gracefully — login still works for email/password,
 * and Google Sign-In will be silently skipped.
 */
@Injectable({ providedIn: 'root' })
export class ConfigService {
  private readonly http = inject(HttpClient);
  private config: { googleClientId: string } = { googleClientId: '' };

  /**
   * Called once by APP_INITIALIZER before the app renders.
   * Returns a Promise so Angular's DI system awaits it.
   */
  async load(): Promise<void> {
    try {
      const result = await firstValueFrom(
        this.http.get<{ googleClientId: string }>(
          `${environment.apiUrl}/config`
        )
      );
      this.config = result;
    } catch {
      // Degraded mode — Google Sign-In button will not appear but the
      // rest of the app works normally. No console error spam needed
      // since the interceptor already handles HTTP errors.
      this.config = { googleClientId: '' };
    }
  }

  /** Returns the Google OAuth Client ID retrieved from the server. */
  get googleClientId(): string {
    return this.config.googleClientId;
  }
}
