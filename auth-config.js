'use strict';

(function initializeAuthConfiguration(global) {
  // This is a browser-safe Cloudflare Turnstile site key, not a secret key.
  // Set it after creating the production widget in Cloudflare. The secret key
  // belongs only in Supabase Dashboard -> Auth -> Bot and Abuse Protection.
  const TURNSTILE_SITE_KEY = '';
  const PASSWORD_MIN_LENGTH = 8;

  function getPasswordResetRedirectUrl() {
    return `${global.location.origin}${global.location.pathname}`;
  }

  global.LumaAuthConfig = Object.freeze({
    TURNSTILE_SITE_KEY,
    PASSWORD_MIN_LENGTH,
    isCaptchaConfigured: () => Boolean(TURNSTILE_SITE_KEY.trim()),
    getPasswordResetRedirectUrl,
  });
})(window);
