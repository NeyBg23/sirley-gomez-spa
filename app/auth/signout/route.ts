import { createServerSupabase } from "@/lib/supabase/server";
import { sameOrigin } from "@/lib/http";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "FORBIDDEN" }, { status: 403 });
  const supabase = await createServerSupabase();
  await supabase.auth.signOut({ scope: "local" });
  return new Response(null, { status: 303, headers: { Location: new URL("/", request.url).href, "Cache-Control": "no-store" } });
}
