/**
 * analytics.js — GA4 initialisation for Expo web
 *
 * Metro substitutes process.env.EXPO_PUBLIC_* at bundle time, so this works
 * in the JS bundle even when web/index.html tokens are not substituted.
 *
 * On native platforms this is a no-op.
 */

const GA_ID = process.env.EXPO_PUBLIC_GA_ID || 'G-X09N3J8X17';

export function initGA() {
  if (typeof document === 'undefined') return;

  if (document.querySelector('script[src*="googletagmanager.com/gtag"]')) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA_ID);
}
