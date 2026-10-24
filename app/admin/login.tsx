"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const router = useRouter();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const values = new FormData(event.currentTarget);
    try {
      const response = await fetch("/auth/signin", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.get("email"), password: values.get("password") }),
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.error === "UNAUTHORIZED" ? "Esta cuenta no tiene permiso para administrar el spa." :
          data.error === "INVALID_CREDENTIALS" ? "Revisa el correo y la contraseña." : "No se pudo iniciar sesión. Inténtalo de nuevo.");
        return;
      }
      router.refresh();
    } catch { setError("No se pudo conectar. Revisa tu conexión e inténtalo de nuevo."); }
    finally { setBusy(false); }
  }
  return <form className="admin-login-form" onSubmit={submit}>
    <label>Correo electrónico<input name="email" type="email" autoComplete="username" required maxLength={254} /></label>
    <label>Contraseña<input name="password" type="password" autoComplete="current-password" required maxLength={1024} /></label>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="button" disabled={busy}>{busy ? "Entrando…" : "Entrar a mi panel"}<span>↗</span></button>
  </form>;
}
