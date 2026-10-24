"use client";
import { Brand } from "./spa-site";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="admin-login"><Brand /><div className="admin-login-card">
    <p className="eyebrow">SILHOUETTE & HARMONY</p>
    <h1>Un momento,<br /><em>por favor.</em></h1>
    <p>No pudimos cargar la información. Inténtalo de nuevo o contáctanos para reservar.</p>
    <p>We couldn&apos;t load this page. Please try again or contact us to book.</p>
    <button className="button" onClick={reset}>Reintentar / Try again</button>
    <p><a className="text-link" href="https://wa.me/15715238223" target="_blank" rel="noopener noreferrer">WhatsApp ↗</a></p>
  </div></main>;
}
