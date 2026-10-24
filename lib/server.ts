import { env } from "cloudflare:workers";
import { DEFAULT_CONTENT, contentSchema, type SiteContent } from "./content";
import { getChatGPTUser } from "@/app/chatgpt-auth";

export function database(): D1Database { if(!env.DB) throw new Error("DATABASE_UNAVAILABLE");return env.DB; }
export async function readContent():Promise<{content:SiteContent;revision:number}> {
  const row=await database().prepare("SELECT payload, revision FROM site_content WHERE key = ?").bind("main").first<{payload:string;revision:number}>();
  if(!row)return {content:DEFAULT_CONTENT,revision:0};
  return {content:contentSchema.parse(JSON.parse(row.payload)),revision:row.revision};
}
export async function authorizedAdmin() {
  const user=await getChatGPTUser(); if(!user)return null;
  const db=database();
  const existing=await db.prepare("SELECT user_id FROM admins WHERE user_id = ?").bind(user.userId).first();
  if(existing)return user;
  // Bootstrap only the owner email verified from the native Sites access policy.
  // Once bound, all subsequent authorization uses the stable Site-scoped user ID.
  const count=await db.prepare("SELECT COUNT(*) AS n FROM admins").first<{n:number}>();
  const email=(env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  if(count?.n===0 && email && user.email.toLowerCase()===email) {
    await db.prepare("INSERT OR IGNORE INTO admins (user_id,email,created_at) SELECT ?,?,? WHERE NOT EXISTS (SELECT 1 FROM admins)").bind(user.userId,user.email,new Date().toISOString()).run();
    const bound=await db.prepare("SELECT user_id FROM admins WHERE user_id = ?").bind(user.userId).first();
    if(bound)return user;
  }
  return null;
}
