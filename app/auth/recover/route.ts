import { z } from "zod";
import { sameOrigin, siteOrigin } from "@/lib/http";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const reply = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
  if (!sameOrigin(request)) return reply({ error: "FORBIDDEN" }, 403);
  try {
    if (!request.headers.get("content-type")?.includes("application/json")) return reply({ error: "INVALID_REQUEST" }, 400);
    const raw = await request.text();
    if (raw.length > 2000) return reply({ error: "INVALID_REQUEST" }, 413);
    const parsed = z.object({ email: z.string().trim().email().max(254) }).safeParse(JSON.parse(raw));
    if (!parsed.success) return reply({ error: "INVALID_REQUEST" }, 400);
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: new URL("/auth/callback", siteOrigin(request)).href,
    });
    if (error) return reply({ error: "DELIVERY_UNAVAILABLE" }, 503);
    return reply({ success: true });
  } catch { return reply({ error: "SERVER_ERROR" }, 503); }
}
