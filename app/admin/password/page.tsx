import { redirect } from "next/navigation";
import { authorizedAdmin } from "@/lib/server";
import { Brand } from "@/app/spa-site";
import AccessForm from "../access/form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tu contraseña | Sirley Gómez", robots: { index: false, follow: false } };
export default async function PasswordPage() {
  if (!await authorizedAdmin()) redirect("/admin/access");
  return <main className="admin-login"><Brand /><div className="admin-login-card">
    <p className="eyebrow">TU ESPACIO DE GESTIÓN</p><h1>Un acceso<br /><em>solo tuyo.</em></h1>
    <AccessForm mode="password" />
  </div></main>;
}
