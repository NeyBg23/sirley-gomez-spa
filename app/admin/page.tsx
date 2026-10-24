import Link from "next/link";
import { edgeFetch, sessionToken } from "@/lib/server";
import AdminPanel from "./panel";
import AdminLogin from "./login";
import { Brand } from "../spa-site";

export const dynamic = "force-dynamic";
export const metadata = { title: "Administración | Sirley Gómez", robots: { index: false, follow: false } };
export default async function AdminPage() {
  const token=await sessionToken();
  if(token){
    const response=await edgeFetch("admin/dashboard",{},token);
    if(response.ok)return <AdminPanel initialData={await response.json()} />;
    if(response.status!==403)throw new Error("ADMIN_UNAVAILABLE");
  }
  return <main className="admin-login"><Brand /><div className="admin-login-card">
    <p className="eyebrow">TU ESPACIO DE GESTIÓN</p>
    <h1>Todo en<br /><em>armonía.</em></h1>
    <p>Entra con tu cuenta autorizada para gestionar tratamientos, solicitudes y tarjetas de regalo.</p>
    <AdminLogin />
    <Link href="/" className="text-link">Volver al sitio <span>↗</span></Link>
  </div><span className="admin-login-note">SIRLEY GÓMEZ · SILHOUETTE & HARMONY</span></main>;
}
