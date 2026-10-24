import "server-only";
import { contentSchema, type SiteContent } from "./content";
import { createServerSupabase } from "./supabase/server";

export function supabaseConfiguration() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_NOT_CONFIGURED");
  return { url, key };
}

export async function edgeFetch(path: string, init: RequestInit = {}, token?: string) {
  const { url, key } = supabaseConfiguration();
  const headers = new Headers(init.headers);
  headers.set("apikey", key);
  // The Edge Function verifies this JWT and checks admins on each request.
  if (token) headers.set("Authorization", "Bearer " + token);
  return fetch(`${url}/functions/v1/spa-api/${path}`, {
    ...init, headers, cache: "no-store", signal: AbortSignal.timeout(25000),
  });
}

export async function sessionToken() {
  const supabase = await createServerSupabase();
  // getSession forwards the raw token only. Authorization always happens in
  // spa-api using auth.getUser and the protected admins table.
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
}

export async function readContent(): Promise<{ content: SiteContent; revision: number }> {
  const response = await edgeFetch("content");
  if (!response.ok) throw new Error("CONTENT_UNAVAILABLE");
  const data = await response.json();
  return { content: contentSchema.parse(data.content), revision: data.revision };
}

export async function authorizedAdmin() {
  const token = await sessionToken();
  if (!token) return null;
  const response = await edgeFetch("admin/me", {}, token);
  if (response.status === 403) return null;
  if (!response.ok) throw new Error("ADMIN_UNAVAILABLE");
  const data = await response.json();
  return data.user as { id: string; name: string };
}
