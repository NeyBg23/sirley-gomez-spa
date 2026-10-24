import { notFound } from "next/navigation";
import { database, readContent } from "@/lib/server";
import GiftCardView from "./view";
export const dynamic="force-dynamic";
export const metadata={title:"Un momento solo para ti | Sirley Gómez",robots:{index:false,follow:false}};
export default async function GiftPage({params}:{params:Promise<{token:string}>}) {
  const {token}=await params;if(!/^[a-f0-9]{64}$/.test(token))notFound();
  const row=await database().prepare("SELECT recipient,giver,message,package_name,code,status,locale FROM gift_orders WHERE token = ?").bind(token).first<{recipient:string;giver:string;message:string;package_name:string;code:string;status:string;locale:"es"|"en"}>();
  if(!row)notFound();
  const {content}=await readContent();
  return <GiftCardView card={row} whatsapp={content.settings.whatsapp}/>;
}
