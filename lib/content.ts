import { z } from "zod";

export type Locale = "es" | "en";
export const copySchema = z.object({ es: z.string().trim().min(1).max(3000), en: z.string().trim().min(1).max(3000) });
export type Copy = z.infer<typeof copySchema>;
const imagePath = z.string().max(400).regex(/^\/(?:images|api\/media)\/[a-zA-Z0-9_./-]+$/);
export const serviceSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{1,60}$/),
  category: z.enum(["body", "men", "facial", "relax"]),
  title: copySchema, description: copySchema, details: z.array(copySchema).max(12),
  price: z.number().min(0).max(10000), duration: z.number().int().min(15).max(150),
  sessions: z.number().int().min(1).max(50), active: z.boolean(), featured: z.boolean(),
  image: imagePath, installments: copySchema.optional(), expires: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
export const giftSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{1,60}$/), occasion: z.enum(["birthday", "christmas"]),
  title: copySchema, description: copySchema, includes: z.array(copySchema).max(12),
  price: z.number().min(1).max(10000), duration: z.number().int().min(15).max(150), active: z.boolean(),
});
const timeSchema = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);
export const contentSchema = z.object({
  settings: z.object({
    whatsapp: z.string().regex(/^\d{10,15}$/), instagram: z.string().url().refine(v => new URL(v).hostname === "www.instagram.com" || new URL(v).hostname === "instagram.com"),
    location: copySchema, heroTitle: copySchema, heroText: copySchema, about: copySchema,
    open: timeSchema, close: timeSchema, days: z.array(z.number().int().min(0).max(6)).min(1).max(7),
    blockedDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).max(366),
    timezone: z.literal("America/New_York"),
  }),
  services: z.array(serviceSchema).min(1).max(50),
  gifts: z.array(giftSchema).max(30),
  gallery: z.array(z.object({ id: z.string().min(1).max(80), src: imagePath, alt: copySchema })).max(30),
}).superRefine((v,ctx) => {
  if (v.settings.open >= v.settings.close) ctx.addIssue({code:"custom", message:"La hora de cierre debe ser posterior a la apertura."});
  if (new Set(v.services.map(s=>s.id)).size !== v.services.length || new Set(v.gifts.map(s=>s.id)).size !== v.gifts.length) ctx.addIssue({code:"custom",message:"Los identificadores deben ser únicos."});
});
export type SiteContent = z.infer<typeof contentSchema>;
export type Service = SiteContent["services"][number];
export type GiftPackage = SiteContent["gifts"][number];
const c = (es:string,en:string):Copy => ({es,en});
const commonBody = [c("Masaje reductor manual y maderoterapia", "Body-contouring massage and wood therapy"), c("Drenaje linfático manual", "Manual lymphatic drainage"), c("Trabajo personalizado por zonas", "Personalized care by body area")];
const giftIncludes = [
  [c("Masaje relajante de cuerpo completo", "Full-body relaxation massage"),c("Aromaterapia y toallas tibias", "Aromatherapy and warm towels"),c("Té de cortesía y detalle especial", "Complimentary tea and a special touch")],
  [c("Masaje relajante corporal · 60 min", "Relaxation body massage · 60 min"),c("Limpieza facial suave e hidratante · 30 min", "Gentle cleansing and hydrating facial · 30 min"),c("Masaje facial y detalle personalizado", "Facial massage and a personalized touch")],
  [c("Exfoliación corporal suave · 15 min", "Gentle body exfoliation · 15 min"),c("Masaje relajante corporal · 65 min", "Relaxation body massage · 65 min"),c("Ritual facial hidratante · 30 min", "Hydrating facial ritual · 30 min"),c("Masaje de manos y cuero cabelludo · 10 min", "Hand and scalp massage · 10 min")],
];
export const DEFAULT_CONTENT: SiteContent = {
  settings: {
    whatsapp:"15715238223", instagram:"https://www.instagram.com/sirl.eygomez/",
    location:c("Sterling, Virginia", "Sterling, Virginia"),
    heroTitle:c("Tu silueta.\nTu equilibrio.\nTu momento.", "Your silhouette.\nYour balance.\nYour moment."),
    heroText:c("Maderoterapia, cuidado corporal y rituales faciales. Un espacio para reconectar contigo, con atención personalizada y sin prisas.", "Wood therapy, body care and facial rituals. A space to reconnect with yourself through personal, unhurried attention."),
    about:c("Soy Sirley Gómez. Creo en el cuidado que empieza por escucharte. Mi enfoque combina masajes reductores y maderoterapia con una atención cercana, adaptada a tus objetivos. Aquí, cada cita es un momento reservado para ti.", "I'm Sirley Gómez. I believe good care begins with listening. My approach brings together body-contouring massage and wood therapy, with personal attention shaped around your goals. Here, every appointment is time set aside for you."),
    open:"16:30", close:"19:00", days:[1,2,3,4,5,6], blockedDates:[], timezone:"America/New_York",
  },
  services:[
    { id:"body-sculpt-8",category:"body",title:c("Moldeo Sculpt · 8 sesiones", "Sculpt & Harmony · 8 sessions"),description:c("Un plan de cuidado corporal con masaje manual y maderoterapia, pensado para trabajar tu silueta de forma personalizada.", "A body-care plan combining manual massage and wood therapy, tailored to your silhouette and personal goals."), details:commonBody,price:640,duration:60,sessions:8,active:true,featured:true,image:"/images/wood-ritual.webp",installments:c("Contado: US$640 · 2 pagos de US$360 (total US$720)", "Upfront: US$640 · 2 payments of US$360 (US$720 total)")},
    { id:"body-sculpt-12",category:"body",title:c("Moldeo Sculpt · 12 sesiones", "Sculpt & Harmony · 12 sessions"),description:c("Nuestro plan de apertura más completo. Incluye una sesión de body wrap y una de maderoterapia facial como obsequio.", "Our most complete opening plan. Includes one body-wrap session and one facial wood-therapy session as a gift."),details:[...commonBody,c("1 body wrap + 1 maderoterapia facial de regalo", "1 body wrap + 1 facial wood-therapy session included")],price:960,duration:60,sessions:12,active:true,featured:false,image:"/images/wood-ritual.webp",installments:c("Contado: US$960 · 2 pagos de US$520 (total US$1,040)", "Upfront: US$960 · 2 payments of US$520 (US$1,040 total)"),expires:"2026-10-31"},
    { id:"body-single",category:"body",title:c("Masaje reductor + maderoterapia", "Body-contouring massage + wood therapy"),description:c("Una sesión individual de cuidado corporal, con trabajo manual y herramientas de madera según tus objetivos.", "An individual body-care session with manual techniques and wood tools, tailored to your goals."),details:commonBody,price:110,duration:60,sessions:1,active:true,featured:false,image:"/images/wood-ritual.webp"},
    { id:"men-sculpt-8",category:"men",title:c("Men’s Body Sculpt Elite", "Men’s Body Sculpt Elite"),description:c("Ocho sesiones de masaje reductor, maderoterapia y drenaje, con atención personalizada para el cuidado corporal masculino.", "Eight sessions combining body-contouring massage, wood therapy and drainage, with personalized men's body care."),details:[...commonBody,c("8 sesiones · US$100 por sesión", "8 sessions · US$100 per session")],price:800,duration:75,sessions:8,active:true,featured:false,image:"/images/wood-ritual.webp"},
    { id:"men-drainage-6",category:"men",title:c("Men’s Lymphatic Reset", "Men’s Lymphatic Reset"),description:c("Un plan de seis sesiones de drenaje linfático manual y masaje relajante, con trabajo por zonas según valoración.", "Six sessions of manual lymphatic drainage and relaxation massage, with areas selected during your consultation."),details:[c("Drenaje linfático manual", "Manual lymphatic drainage"),c("Masaje relajante y seguimiento personalizado", "Relaxation massage and personal follow-up"),c("6 sesiones · US$100 por sesión", "6 sessions · US$100 per session")],price:600,duration:60,sessions:6,active:true,featured:false,image:"/images/wood-ritual.webp"},
    { id:"men-sculpt-single",category:"men",title:c("Men’s Body Sculpt · individual", "Men’s Body Sculpt · single session"),description:c("Una sesión individual de masaje reductor y maderoterapia para hombres.", "An individual body-contouring massage and wood-therapy session for men."),details:[c("Atención personalizada", "Personalized attention"),c("Masaje manual y maderoterapia", "Manual massage and wood therapy")],price:100,duration:75,sessions:1,active:true,featured:false,image:"/images/wood-ritual.webp"},
    { id:"men-drainage-single",category:"men",title:c("Men’s Lymphatic · individual", "Men’s Lymphatic · single session"),description:c("Una sesión individual de drenaje linfático manual y bienestar corporal para hombres.", "An individual manual lymphatic drainage and body-wellness session for men."),details:[c("Drenaje linfático y masaje relajante", "Lymphatic drainage and relaxation massage")],price:100,duration:60,sessions:1,active:true,featured:false,image:"/images/wood-ritual.webp"},
  ],
  gifts:[...(["birthday","christmas"] as const).flatMap(occasion => [0,1,2].map(i => ({
    id:`${occasion}-${i+1}`, occasion,
    title: occasion === "birthday" ? [c("Birthday Relax","Birthday Relax"),c("Birthday Spa Experience","Birthday Spa Experience"),c("Birthday Luxury Ritual","Birthday Luxury Ritual")][i] : [c("Christmas Relax","Christmas Relax"),c("Christmas Glow","Christmas Glow"),c("Holiday Harmony Ritual","Holiday Harmony Ritual")][i],
    description: occasion === "birthday" ? [c("Un cumpleaños para bajar el ritmo y disfrutar.","A birthday made for slowing down and unwinding."),c("Cuidado de pies a cabeza para celebrar su día.","Head-to-toe care to celebrate their day."),c("Nuestra experiencia de cumpleaños más especial.","Our most special birthday experience.")][i] : [c("Regala una pausa entre las celebraciones.","Give a peaceful pause amid the celebrations."),c("Un regalo de calma para el cuerpo y el rostro.","A gift of calm for body and face."),c("Una experiencia completa para cerrar el año con bienestar.","A complete experience to end the year feeling cared for.")][i],
    includes:giftIncludes[i],price:[95,130,160][i],duration:[60,90,120][i],active:true,
  })))],
  gallery:[
    {id:"ritual",src:"/images/wood-ritual.webp",alt:c("Herramientas de maderoterapia, toallas y velas", "Wood-therapy tools, towels and candles")},
    {id:"sirley",src:"/images/sirley-wood.webp",alt:c("Sirley realizando una sesión de maderoterapia", "Sirley during a wood-therapy session")},
    {id:"studio",src:"/images/sirley-room.webp",alt:c("El espacio de cuidado de Sirley Gómez", "Sirley Gómez's care space")},
  ],
};

export function money(v:number,locale:Locale="es") { return new Intl.NumberFormat(locale === "es"?"es-US":"en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(v); }
export function localDate(now = new Date()) { return new Intl.DateTimeFormat("en-CA",{timeZone:"America/New_York",year:"numeric",month:"2-digit",day:"2-digit"}).format(now); }
export function minutes(time:string) { const [h,m]=time.split(":").map(Number); return h*60+m; }
export function clock(m:number) { return `${String(Math.floor(m/60)).padStart(2,"0")}:${String(m%60).padStart(2,"0")}`; }
export function displayTime(m:number,locale:Locale="es") { const h=Math.floor(m/60);return `${h>12?h-12:h===0?12:h}:${String(m%60).padStart(2,"0")} ${locale==="en"?(h>=12?"PM":"AM"):(h>=12?"p. m.":"a. m.")}`; }
export function availableService(s:Service) { return s.active && (!s.expires || s.expires>=localDate()); }
export function whatsappUrl(phone:string,message:string) { return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`; }
