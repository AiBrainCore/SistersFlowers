/**
 * Google Tag Manager container for Sisters Flowers.
 * Set NEXT_PUBLIC_GTM_ID="" to disable (e.g. local). Unset → default container.
 */
const raw = process.env.NEXT_PUBLIC_GTM_ID;

export const GTM_ID =
  raw === undefined ? "GTM-W8CLFD5Z" : raw.trim();

export function isGtmEnabled() {
  return Boolean(GTM_ID);
}
