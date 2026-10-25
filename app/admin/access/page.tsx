import Link from "next/link";
import { Brand } from "@/app/spa-site";
import AccessForm from "./form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Activa tu acceso | Sirley Gómez", robots: { index: false, follow: false } };
export default async function AccessPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const query = await searchParams;
  return <main className="admin-login"><Brand /><div className="admin-login-card">
    <p className="eyebrow">TU ESPACIO DE GESTIÓN</p><h1>Tu acceso,<br /><em>en tus manos.</em></h1>
    <p>Recibe un enlace en el correo de tu cuenta para configurar o recuperar tu contraseña.</p>
    <AccessForm invalidLink={query.status === "invalid"} />
    <Link className="text-link" href="/admin">Volver al panel ↗</Link>
  </div></main>;
}
