import { notFound } from "next/navigation";
import { edgeFetch } from "@/lib/server";
import GiftCardView from "./view";

export const dynamic = "force-dynamic";
export const metadata = { title: "Un momento solo para ti | Sirley Gómez", robots: { index: false, follow: false } };
export default async function GiftPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[a-f0-9]{64}$/.test(token)) notFound();
  const response = await edgeFetch("gift-card/" + token);
  if (response.status === 404) notFound();
  if (!response.ok) throw new Error("GIFT_UNAVAILABLE");
  const { card, whatsapp } = await response.json();
  return <GiftCardView card={card} whatsapp={whatsapp} />;
}
