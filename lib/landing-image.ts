const PUBLIC_SUPABASE_IMAGE = /^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\//i;

/**
 * Existing landing assets include legacy multi-megabyte PNGs. Route only immutable public
 * Supabase files through Next's image optimizer so they are resized, converted and cached.
 * Local samples, object URLs used by the editor and third-party images remain untouched.
 */
export function landingImageUrl(source: string | null | undefined, width: 384 | 1080): string {
  if (!source || !PUBLIC_SUPABASE_IMAGE.test(source)) return source || "";
  return `/_next/image?url=${encodeURIComponent(source)}&w=${width}&q=75`;
}
