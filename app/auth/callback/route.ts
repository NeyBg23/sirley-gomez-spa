import { createServerSupabase } from "@/lib/supabase/server";
import { edgeFetch } from "@/lib/server";
import { siteOrigin } from "@/lib/http";

export async function GET(request: Request) {
  const url = new URL(request.url), origin = siteOrigin(request);
  const finish = (path: string) => new Response(null, { status: 303, headers: {
    Location: new URL(path, origin).href, "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer",
  } });
  try {
    const supabase = await createServerSupabase();
    const code = url.searchParams.get("code"), hash = url.searchParams.get("token_hash"), type = url.searchParams.get("type");
    let token: string | undefined;
    if (code && code.length <= 2048) {
      const result = await supabase.auth.exchangeCodeForSession(code);
      if (!result.error) token = result.data.session?.access_token;
    } else if (hash && hash.length <= 512 && (type === "invite" || type === "recovery")) {
      const result = await supabase.auth.verifyOtp({ token_hash: hash, type });
      if (!result.error) token = result.data.session?.access_token;
    }
    if (token) {
      const allowed = await edgeFetch("admin/me", {}, token);
      if (allowed.ok) return finish("/admin/password");
      await supabase.auth.signOut({ scope: "local" });
    }
  } catch { /* Invalid and expired links use the same recovery page. */ }
  return finish("/admin/access?status=invalid");
}
