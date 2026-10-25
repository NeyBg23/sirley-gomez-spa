"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AccessForm({ mode = "request", invalidLink = false }: { mode?: "request" | "password"; invalidLink?: boolean }) {
  const [busy, setBusy] = useState(false), [sent, setSent] = useState(false);
  const [error, setError] = useState(invalidLink ? "El enlace venció o no es válido. Solicita uno nuevo." : "");
  const router = useRouter();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const values = new FormData(event.currentTarget);
    if (mode === "password" && values.get("password") !== values.get("confirm")) {
      setError("Las contraseñas deben coincidir."); setBusy(false); return;
    }
    try {
      const response = await fetch(mode === "request" ? "/auth/recover" : "/auth/password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "request" ? { email: values.get("email") } : { password: values.get("password") }),
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.error === "INVALID_PASSWORD" ? "Usa al menos 12 caracteres y un máximo de 72 bytes." :
          data.error === "UNAUTHORIZED" ? "Solicita un enlace nuevo para continuar." : "No se pudo completar. Inténtalo de nuevo más tarde.");
        return;
      }
      if (mode === "password") { router.replace("/admin"); router.refresh(); }
      else setSent(true);
    } catch { setError("No se pudo conectar. Revisa tu conexión."); }
    finally { setBusy(false); }
  }
  if (sent) return <div role="status"><p>Si ese correo tiene una cuenta, recibirás un enlace para continuar. Ábrelo en este mismo navegador y revisa también spam.</p><Link className="text-link" href="/admin">Volver al acceso ↗</Link></div>;
  return <form className="admin-login-form" onSubmit={submit}>
    {mode === "request" ? <label>Correo de tu cuenta<input name="email" type="email" autoComplete="username" required maxLength={254} /></label> : <>
      <label>Nueva contraseña<input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={72} required /></label>
      <label>Repite la contraseña<input name="confirm" type="password" autoComplete="new-password" minLength={12} maxLength={72} required /></label>
      <p>Elige una contraseña de al menos 12 caracteres. Después entrarás con ella desde el panel.</p>
    </>}
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="button" disabled={busy}>{busy ? "Un momento…" : mode === "request" ? "Recibir enlace de acceso" : "Guardar mi contraseña"}<span>↗</span></button>
  </form>;
}
