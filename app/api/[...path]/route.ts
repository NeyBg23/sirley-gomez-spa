import { env } from "cloudflare:workers";
import { z } from "zod";
import { database, readContent, authorizedAdmin } from "@/lib/server";
import { availableService, contentSchema, localDate, minutes, clock } from "@/lib/content";

export const dynamic="force-dynamic";
type Context={params:Promise<{path:string[]}>};
const locale=z.enum(["es","en"]).default("es");
const phone=z.string().trim().min(7).max(30).regex(/^[+\d\s().-]+$/);
const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>!Number.isNaN(Date.parse(v+"T12:00:00Z")) && new Date(v+"T12:00:00Z").toISOString().slice(0,10)===v);
const bookingSchema=z.object({serviceId:z.string().max(60),date,time:z.string().regex(/^\d\d:\d\d$/),customer:z.string().trim().min(2).max(100),phone,email:z.union([z.literal(""),z.string().email().max(150)]).default(""),locale,company:z.string().max(0).default("")});
const giftOrderSchema=z.object({packageId:z.string().max(60),recipient:z.string().trim().min(2).max(100),giver:z.string().trim().min(2).max(100),phone,message:z.string().trim().max(400).default(""),locale,company:z.string().max(0).default("")});
function json(data:unknown,status=200) { return Response.json(data,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}}); }
function fail(code:string,status=400) { return json({error:code},status); }
function sameOrigin(request:Request) { const origin=request.headers.get("origin");return (!origin||origin===new URL(request.url).origin)&&request.headers.get("sec-fetch-site")!=="cross-site"; }
async function body(request:Request) { if(!request.headers.get("content-type")?.includes("application/json"))throw new Error("INVALID_REQUEST");const raw=await request.text();if(raw.length>400000)throw new Error("INVALID_REQUEST");return JSON.parse(raw); }
async function requesterHash(request:Request) { const hash=await crypto.subtle.digest("SHA-256",new TextEncoder().encode("sirley-gomez-spa|"+(request.headers.get("cf-connecting-ip")??"local")));return Array.from(new Uint8Array(hash)).map(v=>v.toString(16).padStart(2,"0")).join(""); }
async function limited(hash:string,table:"appointments"|"gift_orders") { const row=await database().prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE requester_hash = ? AND created_at > ?`).bind(hash,new Date(Date.now()-3600000).toISOString()).first<{n:number}>();return (row?.n??0)>=6; }
function futureSlot(d:string,start:number) {
  if(d<localDate()||d>localDate(new Date(Date.now()+90*86400000)))return false;
  if(d!==localDate())return true;
  const parts=new Intl.DateTimeFormat("en-US",{timeZone:"America/New_York",hourCycle:"h23",hour:"2-digit",minute:"2-digit"}).formatToParts(new Date());
  const h=Number(parts.find(p=>p.type==="hour")?.value??0),m=Number(parts.find(p=>p.type==="minute")?.value??0);
  return start>=h*60+m+30;
}
function shortRef(prefix:string) { return prefix+"-"+crypto.randomUUID().replaceAll("-","").slice(0,10).toUpperCase(); }
export async function GET(request:Request,context:Context) {
  const {path}=await context.params;const route=path.join("/");
  try {
    if(route.startsWith("media/")) {
      const key=path.slice(1).join("/");
      if(!/^uploads\/[a-f0-9-]+\.(?:jpg|png|webp)$/.test(key)||!env.BUCKET)return fail("NOT_FOUND",404);
      const obj=await env.BUCKET.get(key);if(!obj)return fail("NOT_FOUND",404);
      return new Response(obj.body,{headers:{"Content-Type":obj.httpMetadata?.contentType??"application/octet-stream","Cache-Control":"public, max-age=31536000, immutable","X-Content-Type-Options":"nosniff"}});
    }
    if(route==="content")return json(await readContent());
    if(route==="availability") {
      const query=new URL(request.url).searchParams;const d=date.safeParse(query.get("date"));if(!d.success)return fail("INVALID_DATE");
      const {content}=await readContent();const service=content.services.find(s=>s.id===query.get("serviceId") && availableService(s));if(!service)return fail("SERVICE_UNAVAILABLE");
      const settings=content.settings;
      if(!settings.days.includes(new Date(d.data+"T12:00:00Z").getUTCDay())||settings.blockedDates.includes(d.data))return json({slots:[],timezone:settings.timezone});
      const busy=await database().prepare("SELECT start, end FROM appointments WHERE date = ? AND status != 'cancelled'").bind(d.data).all<{start:number;end:number}>();
      const slots:string[]=[];
      for(let start=minutes(settings.open);start+service.duration<=minutes(settings.close);start+=15)if(futureSlot(d.data,start)&&!busy.results.some(b=>b.start<start+service.duration && b.end>start))slots.push(clock(start));
      return json({slots,timezone:settings.timezone});
    }
    if(route.startsWith("admin/")) {
      const admin=await authorizedAdmin();if(!admin)return fail("UNAUTHORIZED",403);
      if(route==="admin/dashboard") {
        const db=database();const [appointments,gifts,content]=await Promise.all([db.prepare("SELECT * FROM appointments ORDER BY date DESC, start ASC LIMIT 500").all(),db.prepare("SELECT * FROM gift_orders ORDER BY created_at DESC LIMIT 500").all(),readContent()]);
        return json({...content,appointments:appointments.results,giftOrders:gifts.results,user:{name:admin.displayName}});
      }
    }
    return fail("NOT_FOUND",404);
  }catch(error){console.error("Site GET failed",error instanceof Error?error.message:"unknown");return fail("SERVER_ERROR",503);}
}
export async function POST(request:Request,context:Context) {
  const {path}=await context.params;const route=path.join("/");if(!sameOrigin(request))return fail("FORBIDDEN",403);
  try {
    if(route==="appointments") {
      const parsed=bookingSchema.safeParse(await body(request));if(!parsed.success)return fail("INVALID_REQUEST");
      const data=parsed.data;const {content}=await readContent();const service=content.services.find(s=>s.id===data.serviceId && availableService(s));if(!service)return fail("SERVICE_UNAVAILABLE");
      const start=minutes(data.time),end=start+service.duration,settings=content.settings;
      if(!Number.isInteger(start)||start%15!==minutes(settings.open)%15||start<minutes(settings.open)||end>minutes(settings.close)||!futureSlot(data.date,start)||settings.blockedDates.includes(data.date)||!settings.days.includes(new Date(data.date+"T12:00:00Z").getUTCDay()))return fail("SLOT_UNAVAILABLE",409);
      const hash=await requesterHash(request);if(await limited(hash,"appointments"))return fail("RATE_LIMIT",429);
      const id=crypto.randomUUID(),reference=shortRef("SG");
      // One atomic conditional INSERT prevents overlapping concurrent requests.
      const result=await database().prepare("INSERT INTO appointments (id,reference,customer,phone,email,service_id,service_name,price,date,start,end,status,locale,created_at,requester_hash) SELECT ?,?,?,?,?,?,?,?,?,?,?,'pending',?,?,? WHERE NOT EXISTS (SELECT 1 FROM appointments WHERE date = ? AND status != 'cancelled' AND start < ? AND end > ?)").bind(id,reference,data.customer,data.phone,data.email,service.id,JSON.stringify(service.title),service.price,data.date,start,end,data.locale,new Date().toISOString(),hash,data.date,end,start).run();
      if(!result.meta.changes)return fail("SLOT_UNAVAILABLE",409);
      return json({reference,date:data.date,time:data.time,status:"pending",service:service.title},201);
    }
    if(route==="gifts") {
      const parsed=giftOrderSchema.safeParse(await body(request));if(!parsed.success)return fail("INVALID_REQUEST");
      const data=parsed.data;const {content}=await readContent();const gift=content.gifts.find(g=>g.id===data.packageId && g.active);if(!gift)return fail("SERVICE_UNAVAILABLE");
      const hash=await requesterHash(request);if(await limited(hash,"gift_orders"))return fail("RATE_LIMIT",429);
      const reference=shortRef("GIFT");
      await database().prepare("INSERT INTO gift_orders (id,reference,package_id,package_name,price,recipient,giver,phone,message,occasion,locale,status,created_at,requester_hash) VALUES (?,?,?,?,?,?,?,?,?,?,?,'requested',?,?)").bind(crypto.randomUUID(),reference,gift.id,JSON.stringify(gift.title),gift.price,data.recipient,data.giver,data.phone,data.message,gift.occasion,data.locale,new Date().toISOString(),hash).run();
      return json({reference,status:"requested",price:gift.price,title:gift.title},201);
    }
    if(route==="admin/upload") {
      if(!await authorizedAdmin())return fail("UNAUTHORIZED",403);if(!env.BUCKET)return fail("SERVER_ERROR",503);
      if(Number(request.headers.get("content-length")??0)>6000000)return fail("FILE_TOO_LARGE",413);
      const form=await request.formData(),file=form.get("file");if(!(file instanceof File)||file.size>5*1024*1024||file.size<12)return fail("INVALID_IMAGE");
      const bytes=new Uint8Array(await file.arrayBuffer());let ext="",type="";
      if(bytes[0]===0xff && bytes[1]===0xd8 && bytes[2]===0xff){ext="jpg";type="image/jpeg";}
      else if(bytes.slice(0,8).join(",")==="137,80,78,71,13,10,26,10"){ext="png";type="image/png";}
      else if(new TextDecoder().decode(bytes.slice(0,4))==="RIFF" && new TextDecoder().decode(bytes.slice(8,12))==="WEBP"){ext="webp";type="image/webp";}
      else return fail("INVALID_IMAGE");
      const key=`uploads/${crypto.randomUUID()}.${ext}`;await env.BUCKET.put(key,bytes,{httpMetadata:{contentType:type}});return json({src:"/api/media/"+key},201);
    }
    return fail("NOT_FOUND",404);
  }catch(error){console.error("Site POST failed",error instanceof Error?error.message:"unknown");return fail(error instanceof SyntaxError?"INVALID_REQUEST":"SERVER_ERROR",error instanceof SyntaxError?400:503);}
}
export async function PUT(request:Request,context:Context) {
  const {path}=await context.params;if(!sameOrigin(request))return fail("FORBIDDEN",403);
  try {
    if(path.join("/")!=="admin/content")return fail("NOT_FOUND",404);if(!await authorizedAdmin())return fail("UNAUTHORIZED",403);
    const parsed=z.object({content:contentSchema,revision:z.number().int().min(0)}).safeParse(await body(request));
    if(!parsed.success)return json({error:"INVALID_CONTENT",details:parsed.error.issues.map(i=>i.path.join(".")+": "+i.message)},400);
    const data=parsed.data,db=database();
    const result=data.revision===0?await db.prepare("INSERT OR IGNORE INTO site_content (key,payload,revision,updated_at) VALUES ('main',?,1,?)").bind(JSON.stringify(data.content),new Date().toISOString()).run():await db.prepare("UPDATE site_content SET payload = ?, revision = revision + 1, updated_at = ? WHERE key = 'main' AND revision = ?").bind(JSON.stringify(data.content),new Date().toISOString(),data.revision).run();
    if(!result.meta.changes)return fail("EDIT_CONFLICT",409);return json({success:true,revision:data.revision+1});
  }catch(error){console.error("Content save failed",error instanceof Error?error.message:"unknown");return fail("SERVER_ERROR",503);}
}
export async function PATCH(request:Request,context:Context) {
  const {path}=await context.params;const route=path.join("/");if(!sameOrigin(request))return fail("FORBIDDEN",403);
  try {
    if(!await authorizedAdmin())return fail("UNAUTHORIZED",403);const db=database();
    if(route==="admin/appointments") {
      const parsed=z.object({id:z.string().uuid(),status:z.enum(["pending","confirmed","completed","cancelled"])}).safeParse(await body(request));if(!parsed.success)return fail("INVALID_REQUEST");
      const row=await db.prepare("SELECT * FROM appointments WHERE id = ?").bind(parsed.data.id).first<{id:string;date:string;start:number;end:number}>();if(!row)return fail("NOT_FOUND",404);
      const result=await db.prepare("UPDATE appointments SET status = ? WHERE id = ? AND (? = 'cancelled' OR NOT EXISTS (SELECT 1 FROM appointments a WHERE a.id != ? AND a.date = ? AND a.status != 'cancelled' AND a.start < ? AND a.end > ?))").bind(parsed.data.status,row.id,parsed.data.status,row.id,row.date,row.end,row.start).run();
      if(!result.meta.changes)return fail("SLOT_UNAVAILABLE",409);return json({success:true});
    }
    if(route==="admin/gifts") {
      const parsed=z.object({id:z.string().uuid(),status:z.enum(["issued","redeemed","cancelled"]),paymentConfirmed:z.boolean().optional()}).safeParse(await body(request));if(!parsed.success)return fail("INVALID_REQUEST");
      const data=parsed.data;const row=await db.prepare("SELECT status FROM gift_orders WHERE id = ?").bind(data.id).first<{status:string}>();if(!row)return fail("NOT_FOUND",404);
      if(data.status==="issued") {
        if(row.status!=="requested"||!data.paymentConfirmed)return fail("PAYMENT_CONFIRMATION_REQUIRED");
        const token=crypto.randomUUID().replaceAll("-","")+crypto.randomUUID().replaceAll("-","");
        const result=await db.prepare("UPDATE gift_orders SET status='issued',code=?,token=?,issued_at=? WHERE id=? AND status='requested'").bind(shortRef("SG-GIFT"),token,new Date().toISOString(),data.id).run();if(!result.meta.changes)return fail("EDIT_CONFLICT",409);
      }else if(data.status==="redeemed"){
        const result=await db.prepare("UPDATE gift_orders SET status='redeemed',redeemed_at=? WHERE id=? AND status='issued'").bind(new Date().toISOString(),data.id).run();if(!result.meta.changes)return fail("INVALID_STATUS",409);
      }else{
        const result=await db.prepare("UPDATE gift_orders SET status='cancelled' WHERE id=? AND status IN ('requested','issued')").bind(data.id).run();if(!result.meta.changes)return fail("INVALID_STATUS",409);
      }
      return json({success:true});
    }
    return fail("NOT_FOUND",404);
  }catch(error){console.error("Admin update failed",error instanceof Error?error.message:"unknown");return fail("SERVER_ERROR",503);}
}
