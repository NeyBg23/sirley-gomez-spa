import { z } from "zod";
import { sameOrigin } from "@/lib/http";
import { edgeFetch } from "@/lib/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const reply = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "private, no-store" } });
  if (!sameOrigin(request)) return reply({ error: "FORBIDDEN" }, 403);
  try {
    const supabase = await createServerSupabase();
    const { data: { user }, error: identityError } = await supabase.auth.getUser();
    if (identityError || !user?.email_confirmed_at) return reply({ error: "UNAUTHORIZED" }, 403);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !(await edgeFetch("admin/me", {}, session.access_token)).ok) return reply({ error: "UNAUTHORIZED" }, 403);
    if (!request.headers.get("content-type")?.includes("application/json")) return reply({ error: "INVALID_REQUEST" }, 400);
    const raw = await request.text();
    if (raw.length > 2000) return reply({ error: "INVALID_REQUEST" }, 413);
    const parsed = z.object({ password: z.string().min(12).refine(v => new TextEncoder().encode(v).length <= 72) }).safeParse(JSON.parse(raw));
    if (!parsed.success) return reply({ error: "INVALID_PASSWORD" }, 400);
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    if (error) return reply({ error: "UPDATE_UNAVAILABLE" }, 503);
    await supabase.auth.signOut({ scope: "local" });
    return reply({ success: true });
  } catch { return reply({ error: "SERVER_ERROR" }, 503); }
}
