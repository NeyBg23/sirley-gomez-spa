import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { edgeFetch } from "@/lib/server";
import { sameOrigin } from "@/lib/http";

export async function POST(request: Request) {
  const reply = (error: string, status: number) => Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
  if (!sameOrigin(request)) return reply("FORBIDDEN", 403);
  try {
    if (!request.headers.get("content-type")?.includes("application/json")) return reply("INVALID_REQUEST", 400);
    const raw = await request.text();
    if (raw.length > 4000) return reply("INVALID_REQUEST", 413);
    const parsed = z.object({ email: z.string().email().max(254), password: z.string().min(1).max(1024) }).safeParse(JSON.parse(raw));
    if (!parsed.success) return reply("INVALID_CREDENTIALS", 400);
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error || !data.session) return reply("INVALID_CREDENTIALS", 401);
    const response = await edgeFetch("admin/me", {}, data.session.access_token);
    if (!response.ok) {
      await supabase.auth.signOut({ scope: "local" });
      return reply(response.status === 403 ? "UNAUTHORIZED" : "SERVER_ERROR", response.status === 403 ? 403 : 503);
    }
    return Response.json({ success: true }, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return reply("SERVER_ERROR", 503); }
}
