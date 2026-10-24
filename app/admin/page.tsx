import { getChatGPTUser, chatGPTSignInPath } from "../chatgpt-auth";
import { authorizedAdmin } from "@/lib/server";
import AdminPanel from "./panel";
import { Brand } from "../spa-site";
export const dynamic="force-dynamic";
export const metadata={title:"Administración | Sirley Gómez",robots:{index:false,follow:false}};
export default async function AdminPage() {
  const user=await getChatGPTUser();
  if(user && await authorizedAdmin())return <AdminPanel/>;
  return <main className="admin-login"><Brand/><div className="admin-login-card"><p className="eyebrow">TU ESPACIO DE GESTIÓN</p><h1>Todo en<br/><em>armonía.</em></h1><p>{user?"Esta cuenta no tiene acceso al panel. Usa la cuenta propietaria del sitio.":"Inicia sesión con la cuenta propietaria para gestionar tratamientos, solicitudes y tarjetas de regalo."}</p>{!user&&<a className="button" href={chatGPTSignInPath("/admin")} target="_top">Entrar con ChatGPT <span>↗</span></a>}<a href="/" className="text-link">Volver al sitio <span>↗</span></a></div><span className="admin-login-note">SIRLEY GÓMEZ · SILHOUETTE & HARMONY</span></main>;
}
