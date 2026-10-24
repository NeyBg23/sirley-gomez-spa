import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { availableService, contentSchema, localDate, minutes, clock } from "../../../lib/content.ts";

// Privileged credentials remain inside the Supabase runtime. They are never
// sent to Next.js, browsers, logs or source control.
function backendKey(): string {
  const keys = Deno.env.get("SUPABASE_SECRET_KEYS");
  const key = keys ? JSON.parse(keys).default : Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!key) throw new Error("BACKEND_NOT_CONFIGURED");
  return key;
}
const db = createClient(Deno.env.get("SUPABASE_URL")!, backendKey(), {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
const BUCKET = "spa-media";
const MAX_IMAGE = 3 * 1024 * 1024;
let bucketReady: Promise<void> | undefined;
function ensureBucket() {
  return bucketReady ??= (async () => {
    const { data, error } = await db.storage.getBucket(BUCKET);
    if (data) return;
    if (error && error.status !== 404 && error.message !== "Bucket not found") throw error;
    const result = await db.storage.createBucket(BUCKET, {
      public: false, fileSizeLimit: MAX_IMAGE,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    });
    // Another isolate may have created it during this request.
    if (result.error && result.error.message !== "The resource already exists") {
      const check = await db.storage.getBucket(BUCKET);
      if (!check.data) throw result.error;
    }
  })().catch(error => { bucketReady = undefined; throw error; });
}

const locale = z.enum(["es", "en"]).default("es");
const phone = z.string().trim().min(7).max(30).regex(/^[+\d\s().-]+$/);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => {
  const parsed = new Date(v + "T12:00:00Z");
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === v;
});
const bookingSchema = z.object({
  serviceId: z.string().max(60), date,
  time: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
  customer: z.string().trim().min(2).max(100), phone,
  email: z.union([z.literal(""), z.string().email().max(150)]).default(""),
  locale, company: z.string().max(0).default(""),
});
const giftOrderSchema = z.object({
  packageId: z.string().max(60), recipient: z.string().trim().min(2).max(100),
  giver: z.string().trim().min(2).max(100), phone,
  message: z.string().trim().max(400).default(""), locale,
  company: z.string().max(0).default(""),
});
class HttpError extends Error {
  constructor(public code: string, public status = 400) { super(code); }
}
function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: {
    "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff",
  } });
}
async function body(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json")) throw new HttpError("INVALID_REQUEST");
  const raw = await request.text();
  if (raw.length > 400000) throw new HttpError("INVALID_REQUEST", 413);
  try { return JSON.parse(raw); } catch { throw new HttpError("INVALID_REQUEST"); }
}
async function readContent() {
  const { data, error } = await db.from("site_content").select("payload,revision").eq("key", "main").single();
  if (error) throw error;
  return { content: contentSchema.parse(data.payload), revision: data.revision as number };
}
async function admin(request: Request) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) throw new HttpError("UNAUTHORIZED", 403);
  const { data: { user }, error } = await db.auth.getUser(header.slice(7));
  if (error || !user) throw new HttpError("UNAUTHORIZED", 403);
  const result = await db.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (result.error) throw result.error;
  if (!result.data) throw new HttpError("UNAUTHORIZED", 403);
  return { id: user.id, name: "Sirley Gómez" };
}
async function requesterHash(value: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("sirley-gomez-spa|" + value.replace(/\D/g, "")));
  return Array.from(new Uint8Array(bytes), n => n.toString(16).padStart(2, "0")).join("");
}
async function limited(hash: string, table: "appointments" | "gift_orders") {
  const { count, error } = await db.from(table).select("id", { count: "exact", head: true })
    .eq("requester_hash", hash).gt("created_at", new Date(Date.now() - 3600000).toISOString());
  if (error) throw error;
  return (count ?? 0) >= 6;
}
function futureSlot(d: string, start: number) {
  if (d < localDate() || d > localDate(new Date(Date.now() + 90 * 86400000))) return false;
  if (d !== localDate()) return true;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York", hourCycle: "h23", hour: "2-digit", minute: "2-digit",
  }).formatToParts(new Date());
  return start >= Number(parts.find(p => p.type === "hour")?.value ?? 0) * 60 +
    Number(parts.find(p => p.type === "minute")?.value ?? 0) + 30;
}
function shortRef(prefix: string) {
  return prefix + "-" + crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase();
}

export async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.split("/").filter(Boolean);
  const route = path.slice(path.indexOf("spa-api") + 1).join("/");
  try {
    if (request.method === "GET") {
      if (route === "health") {
        await readContent();
        await ensureBucket();
        return json({ status: "ok" });
      }
      if (route === "content") return json(await readContent());
      if (route.startsWith("media/")) {
        const key = route.slice("media/".length);
        if (!/^uploads\/[a-f0-9-]+\.(jpg|png|webp)$/.test(key)) throw new HttpError("NOT_FOUND", 404);
        const { data, error } = await db.storage.from(BUCKET).download(key);
        if (error || !data) throw new HttpError("NOT_FOUND", 404);
        return new Response(data, { headers: {
          "Content-Type": data.type, "Cache-Control": "public, max-age=31536000, immutable",
          "X-Content-Type-Options": "nosniff",
        } });
      }
      if (route.startsWith("gift-card/")) {
        const token = route.slice("gift-card/".length);
        if (!/^[a-f0-9]{64}$/.test(token)) throw new HttpError("NOT_FOUND", 404);
        const { data, error } = await db.from("gift_orders")
          .select("recipient,giver,message,package_name,code,status,locale")
          .eq("token", token).in("status", ["issued", "redeemed", "cancelled"]).maybeSingle();
        if (error) throw error;
        if (!data) throw new HttpError("NOT_FOUND", 404);
        const { content } = await readContent();
        return json({ card: { ...data, package_name: JSON.stringify(data.package_name) }, whatsapp: content.settings.whatsapp });
      }
      if (route === "availability") {
        const d = date.safeParse(url.searchParams.get("date"));
        if (!d.success) throw new HttpError("INVALID_DATE");
        const { content } = await readContent();
        const service = content.services.find(s => s.id === url.searchParams.get("serviceId") && availableService(s));
        if (!service) throw new HttpError("SERVICE_UNAVAILABLE");
        const settings = content.settings;
        if (!settings.days.includes(new Date(d.data + "T12:00:00Z").getUTCDay()) || settings.blockedDates.includes(d.data)) {
          return json({ slots: [], timezone: settings.timezone });
        }
        const { data: busy, error } = await db.from("appointments").select("start,end").eq("date", d.data).neq("status", "cancelled");
        if (error) throw error;
        const slots: string[] = [];
        for (let start = minutes(settings.open); start + service.duration <= minutes(settings.close); start += 15) {
          if (futureSlot(d.data, start) && !busy.some(b => b.start < start + service.duration && b.end > start)) slots.push(clock(start));
        }
        return json({ slots, timezone: settings.timezone });
      }
      if (route.startsWith("admin/")) {
        const user = await admin(request);
        if (route === "admin/me") return json({ user });
        if (route === "admin/dashboard") {
          const [appointments, gifts, content] = await Promise.all([
            db.from("appointments").select("*").order("date", { ascending: false }).order("start").limit(500),
            db.from("gift_orders").select("*").order("created_at", { ascending: false }).limit(500), readContent(),
          ]);
          if (appointments.error) throw appointments.error;
          if (gifts.error) throw gifts.error;
          return json({ ...content, user,
            appointments: appointments.data.map(a => ({ ...a, service_name: JSON.stringify(a.service_name) })),
            giftOrders: gifts.data.map(g => ({ ...g, package_name: JSON.stringify(g.package_name) })),
          });
        }
      }
    }
    if (request.method === "POST") {
      if (route === "appointments") {
        const parsed = bookingSchema.safeParse(await body(request));
        if (!parsed.success) throw new HttpError("INVALID_REQUEST");
        const data = parsed.data, { content } = await readContent();
        const service = content.services.find(s => s.id === data.serviceId && availableService(s));
        if (!service) throw new HttpError("SERVICE_UNAVAILABLE");
        const start = minutes(data.time), end = start + service.duration, settings = content.settings;
        if (start % 15 !== minutes(settings.open) % 15 || start < minutes(settings.open) || end > minutes(settings.close) ||
          !futureSlot(data.date, start) || settings.blockedDates.includes(data.date) ||
          !settings.days.includes(new Date(data.date + "T12:00:00Z").getUTCDay())) throw new HttpError("SLOT_UNAVAILABLE", 409);
        const hash = await requesterHash(data.phone);
        if (await limited(hash, "appointments")) throw new HttpError("RATE_LIMIT", 429);
        const reference = shortRef("SG");
        const { error } = await db.from("appointments").insert({
          reference, customer: data.customer, phone: data.phone, email: data.email,
          service_id: service.id, service_name: service.title, price: service.price,
          date: data.date, start, end, locale: data.locale, requester_hash: hash,
        });
        if (error?.code === "23P01") throw new HttpError("SLOT_UNAVAILABLE", 409);
        if (error) throw error;
        return json({ reference, date: data.date, time: data.time, status: "pending", service: service.title }, 201);
      }
      if (route === "gifts") {
        const parsed = giftOrderSchema.safeParse(await body(request));
        if (!parsed.success) throw new HttpError("INVALID_REQUEST");
        const data = parsed.data, { content } = await readContent();
        const gift = content.gifts.find(g => g.id === data.packageId && g.active);
        if (!gift) throw new HttpError("SERVICE_UNAVAILABLE");
        const hash = await requesterHash(data.phone);
        if (await limited(hash, "gift_orders")) throw new HttpError("RATE_LIMIT", 429);
        const reference = shortRef("GIFT");
        const { error } = await db.from("gift_orders").insert({
          reference, package_id: gift.id, package_name: gift.title, price: gift.price,
          recipient: data.recipient, giver: data.giver, phone: data.phone, message: data.message,
          occasion: gift.occasion, locale: data.locale, requester_hash: hash,
        });
        if (error) throw error;
        return json({ reference, status: "requested", price: gift.price, title: gift.title }, 201);
      }
      if (route === "admin/upload") {
        await admin(request);
        if (Number(request.headers.get("content-length") ?? 0) > MAX_IMAGE + 10000) throw new HttpError("FILE_TOO_LARGE", 413);
        const file = (await request.formData()).get("file");
        if (!(file instanceof File) || file.size > MAX_IMAGE || file.size < 12) throw new HttpError("INVALID_IMAGE");
        const bytes = new Uint8Array(await file.arrayBuffer());
        let ext = "", type = "";
        if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) { ext = "jpg"; type = "image/jpeg"; }
        else if (bytes.slice(0, 8).join(",") === "137,80,78,71,13,10,26,10") { ext = "png"; type = "image/png"; }
        else if (new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP") { ext = "webp"; type = "image/webp"; }
        else throw new HttpError("INVALID_IMAGE");
        await ensureBucket();
        const key = `uploads/${crypto.randomUUID()}.${ext}`;
        const { error } = await db.storage.from(BUCKET).upload(key, bytes, { contentType: type, upsert: false });
        if (error) throw error;
        return json({ src: "/api/media/" + key }, 201);
      }
    }
    if (request.method === "PUT" && route === "admin/content") {
      await admin(request);
      const parsed = z.object({ content: contentSchema, revision: z.number().int().min(0) }).safeParse(await body(request));
      if (!parsed.success) return json({ error: "INVALID_CONTENT", details: parsed.error.issues.map(i => i.path.join(".") + ": " + i.message) }, 400);
      const { data, error } = await db.rpc("sg_save_content", { new_payload: parsed.data.content, expected_revision: parsed.data.revision });
      if (error?.code === "40001") throw new HttpError("EDIT_CONFLICT", 409);
      if (error) throw error;
      return json({ success: true, revision: data });
    }
    if (request.method === "PATCH" && route.startsWith("admin/")) {
      await admin(request);
      if (route === "admin/appointments") {
        const parsed = z.object({ id: z.string().uuid(), status: z.enum(["pending", "confirmed", "completed", "cancelled"]) }).safeParse(await body(request));
        if (!parsed.success) throw new HttpError("INVALID_REQUEST");
        const { data, error } = await db.from("appointments").update({ status: parsed.data.status }).eq("id", parsed.data.id).select("id").maybeSingle();
        if (error?.code === "23P01") throw new HttpError("SLOT_UNAVAILABLE", 409);
        if (error) throw error;
        if (!data) throw new HttpError("NOT_FOUND", 404);
        return json({ success: true });
      }
      if (route === "admin/gifts") {
        const parsed = z.object({ id: z.string().uuid(), status: z.enum(["issued", "redeemed", "cancelled"]), paymentConfirmed: z.boolean().optional() }).safeParse(await body(request));
        if (!parsed.success) throw new HttpError("INVALID_REQUEST");
        const data = parsed.data;
        let update: Record<string, string>, allowed: string[];
        if (data.status === "issued") {
          if (!data.paymentConfirmed) throw new HttpError("PAYMENT_CONFIRMATION_REQUIRED");
          update = { status: "issued", code: shortRef("SG-GIFT"), token: crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", ""), issued_at: new Date().toISOString() };
          allowed = ["requested"];
        } else if (data.status === "redeemed") {
          update = { status: "redeemed", redeemed_at: new Date().toISOString() }; allowed = ["issued"];
        } else { update = { status: "cancelled" }; allowed = ["requested", "issued"]; }
        const { data: saved, error } = await db.from("gift_orders").update(update).eq("id", data.id).in("status", allowed).select("id").maybeSingle();
        if (error) throw error;
        if (!saved) throw new HttpError("INVALID_STATUS", 409);
        return json({ success: true });
      }
    }
    throw new HttpError("NOT_FOUND", 404);
  } catch (error) {
    if (error instanceof HttpError) return json({ error: error.code }, error.status);
    // Avoid logging customer details, tokens, payloads or database messages.
    console.error("Spa API request failed", request.method, route.replace(/gift-card\/.*/, "gift-card/[redacted]"));
    return json({ error: "SERVER_ERROR" }, 503);
  }
}

if (import.meta.main) Deno.serve(handleRequest);
