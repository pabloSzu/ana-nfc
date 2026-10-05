import "server-only";

const LOCAL_HOST = /^(localhost|127\.|0\.0\.0\.0$|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/;

function asOrigin(value: string | undefined) {
  if (!value?.trim()) return null;
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    return new URL(candidate).origin;
  } catch {
    return null;
  }
}

/** Public origin used by printed QR codes, NFC tags and absolute metadata URLs. */
export function getSiteOrigin() {
  return asOrigin(process.env.SITE_URL)
    || asOrigin(process.env.NEXT_PUBLIC_SITE_URL)
    || asOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL)
    || asOrigin(process.env.VERCEL_URL)
    || "http://localhost:3000";
}

export function isLocalSite(origin: string) {
  try {
    return LOCAL_HOST.test(new URL(origin).hostname);
  } catch {
    return true;
  }
}
