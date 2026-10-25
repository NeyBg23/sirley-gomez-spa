export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  if (!origin) return true;
  try {
    const source = new URL(origin), target = new URL(request.url);
    // Next.js may construct request.url using its internal hostname. Host is
    // the address the browser actually requested, including preview aliases.
    const host = request.headers.get("host")?.toLowerCase() ?? target.host;
    return source.host === host && source.protocol === target.protocol;
  } catch { return false; }
}

export function siteOrigin(request: Request) {
  if (process.env.NEXT_PUBLIC_SITE_URL) return new URL(process.env.NEXT_PUBLIC_SITE_URL).origin;
  const url = new URL(request.url);
  return `${url.protocol}//${request.headers.get("host") ?? url.host}`;
}
