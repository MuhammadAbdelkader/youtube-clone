export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  // Google Client ID is fetched at runtime from GET /api/config
  // so it is never embedded in the compiled JS bundle.
};
