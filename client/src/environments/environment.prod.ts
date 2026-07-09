export const environment = {
  production: true,
  apiUrl: 'https://REPLACE_WITH_YOUR_PRODUCTION_API_DOMAIN/api',
  // Google Client ID is fetched at runtime from GET /api/config
  // so it is never embedded in the compiled JS bundle.
};
