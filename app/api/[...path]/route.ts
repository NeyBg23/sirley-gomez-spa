import { edgeFetch, sessionToken } from "@/lib/server";
import { sameOrigin } from "@/lib/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
type Context = { params: Promise<{ path: string[] }> };

async function forward(request: Request, context: Context) {
  if (request.method !== "GET" && !sameOrigin(request)) return Response.json({ error: "FORBIDDEN" }, { status: 403 });
  const { path } = await context.params;
  const route = path.join("/");
  const allowed = route === "content" || route === "availability" || route === "appointments" || route === "gifts" ||
    /^media\/uploads\/[a-f0-9-]+\.(jpg|png|webp)$/.test(route) ||
    /^admin\/(dashboard|content|appointments|gifts|upload)$/.test(route);
  if (!allowed) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
  try {
    const headers = new Headers();
    const contentType = request.headers.get("content-type");
    if (contentType) headers.set("Content-Type", contentType);
    const adminRoute = route.startsWith("admin/");
    const token = adminRoute ? await sessionToken() : undefined;
    if (adminRoute && !token) return Response.json({ error: "UNAUTHORIZED" }, { status: 403 });
    let bytes: ArrayBuffer | undefined;
    if (request.method !== "GET") {
      const limit = route === "admin/upload" ? 3 * 1024 * 1024 + 10000 : 400000;
      if (Number(request.headers.get("content-length") ?? 0) > limit) return Response.json({ error: "FILE_TOO_LARGE" }, { status: 413 });
      bytes = await request.arrayBuffer();
      if (bytes.byteLength > limit) return Response.json({ error: "FILE_TOO_LARGE" }, { status: 413 });
    }
    const response = await edgeFetch(route + new URL(request.url).search, { method: request.method, headers, body: bytes }, token);
    return new Response(response.body, { status: response.status, headers: {
      "Content-Type": response.headers.get("content-type") ?? "application/json",
      "Cache-Control": route.startsWith("media/") && response.ok ? "public, max-age=31536000, immutable" : "private, no-store",
      "X-Content-Type-Options": "nosniff",
    } });
  } catch {
    return Response.json({ error: "SERVER_ERROR" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
export { forward as GET, forward as POST, forward as PUT, forward as PATCH };
