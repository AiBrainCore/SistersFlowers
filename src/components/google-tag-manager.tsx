import { GTM_ID, isGtmEnabled } from "@/lib/gtm";

/**
 * Google’s install checker looks for this exact head snippet in raw HTML
 * (it does not wait for next/script afterInteractive).
 * Place `<GoogleTagManagerHead />` inside root `<head>` and
 * `<GoogleTagManagerBody />` at the start of `<body>`.
 */
export function GoogleTagManagerHead() {
  if (!isGtmEnabled()) return null;

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-sync-scripts -- required by Google tag install test */}
      <script
        async
        src={`https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
`,
        }}
      />
    </>
  );
}

export function GoogleTagManagerBody() {
  if (!isGtmEnabled()) return null;

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height={0}
        width={0}
        style={{ display: "none", visibility: "hidden" }}
        title="Google Tag Manager"
      />
    </noscript>
  );
}
