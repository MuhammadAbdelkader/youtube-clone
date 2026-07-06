/**
 * Derives a user-facing error message from a failed HTTP request.
 *
 * This used to be copy-pasted (near identically) inside login.ts, register.ts,
 * and profile.ts. One place to fix it now instead of three, and one place to
 * add another special case if a new one comes up later.
 *
 * @param err      the error object from an Observable's `error` callback
 * @param fallback shown when the server didn't return a more specific message
 *                 (e.g. a plain network-level failure) -- pass something
 *                 tailored to the action that failed ("Invalid email or
 *                 password.", "Registration failed.", etc.)
 */
export function getErrorMessage(err: any, fallback = 'Something went wrong. Please try again.'): string {
  let msg: string;

  if (err?.status === 0) {
    // No HTTP response reached the browser at all -- offline, DNS failure,
    // CORS rejection, or the server being down. (The original per-component
    // versions of this logic had a message for this case too, but it was
    // actually unreachable: every real HttpErrorResponse fell into one of the
    // branches below, which always overwrote it before it could be shown.)
    msg = 'Unable to connect to the service. Please check your connection.';
  } else if (err?.status === 403) {
    msg = 'Authentication service configuration error. Please try again later.';
  } else if (err?.error?.message) {
    msg = err.error.message;
  } else {
    msg = fallback;
  }

  // Don't leak internal token/JWT wording to the UI.
  if (msg.toLowerCase().includes('token')) {
    msg = 'Session issue detected. Please check your login status.';
  }

  return msg;
}
