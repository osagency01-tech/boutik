/* Construction d'URL Storage — pure, sans état ni API navigateur.
   Extrait de lib/supabase.ts (qui est "use client") pour pouvoir être
   importé depuis du code serveur (lib/server/shop-data.ts) : un module
   "use client" ne peut pas être importé tel quel par un Server Component. */

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

export function storageUrl(bucket: string, path: string | null | undefined) {
  if (!path) return undefined;
  if (path.startsWith("data:") || path.startsWith("http")) return path;
  return `${URL}/storage/v1/object/public/${bucket}/${path}`;
}
